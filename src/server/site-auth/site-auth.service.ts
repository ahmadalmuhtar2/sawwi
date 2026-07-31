// Per-site end-user auth business logic. Two audiences:
//   · PUBLIC (a visitor of a published site) — register/login/logout/currentUser.
//     The site is resolved from the Host header (never client input); it must be
//     SERVED and have authEnabled. Sessions are opaque tokens bound to siteId.
//   · OWNER (dashboard) — list/setRole/delete site-users, gated on canEditSettings.
//
// This is completely separate from the platform Better Auth instance: passwords
// are hashed with better-auth/crypto (scrypt) into SiteUser.passwordHash, and the
// session cookie is host-only to the tenant subdomain (see src/lib/site-host.ts).

import { hashPassword, verifyPassword, generateRandomString } from "better-auth/crypto";
import type { SessionClaims } from "@/server/access/access.rules";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { sitesRepository } from "@/server/sites/sites.repository";
import { isServable } from "@/server/billing/billing.rules";
import { siteSlugFromHost } from "@/lib/site-host";
import { authOnByDefault } from "@/templates/auth-defaults";
import { errors } from "@/shared/errors";
import type { SiteUser } from "@/generated/prisma/client";
import type { SiteUserRole } from "@/generated/prisma/enums";
import type { LoginInput, RegisterInput, UpdateProfileInput } from "./site-auth.schema";
import { siteAuthRepository } from "./site-auth.repository";
import {
  AUTH_WINDOW_MS,
  MAX_ATTEMPTS_PER_IP,
  MAX_SIGNUPS_PER_SITE_WINDOW,
  hashIp,
  roleLabelsOf,
} from "./site-auth.rules";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** The safe, client-facing shape of a site-user (never the password hash). */
export interface PublicSiteUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: SiteUserRole;
}
function toPublic(u: SiteUser): PublicSiteUser {
  return { id: u.id, email: u.email, name: u.name ?? null, phone: u.phone ?? null, role: u.role };
}

// In-memory fixed-window limiter — abuse mitigation for the public endpoints.
// Single-instance (v1); passwords are hashed so this is throttling, not the
// security boundary. Resets on restart, which is fine for that purpose.
const attempts = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ipHash: string | null): boolean {
  if (!ipHash) return false;
  const now = Date.now();
  const e = attempts.get(ipHash);
  if (!e || e.resetAt < now) {
    attempts.set(ipHash, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    return false;
  }
  e.count += 1;
  return e.count > MAX_ATTEMPTS_PER_IP;
}

/** Resolve a SERVED, auth-enabled site from the request Host, or 404 uniformly. */
async function servedAuthSite(host: string | null) {
  const slug = siteSlugFromHost(host);
  if (!slug) throw errors.notFound("الموقع غير متاح");
  const site = await siteAuthRepository.siteGateBySlug(slug);
  const served =
    !!site &&
    site.status === "published" &&
    !site.maintenanceMode &&
    (!site.subscription || isServable(site.subscription.expiry, new Date()));
  // Auth is on when the owner enabled it OR the template requires it by default
  // (auth-first templates like the marketplace).
  const authOn = !!site?.settings?.authEnabled || authOnByDefault(site?.templateKey);
  // Don't leak which of {unknown slug, unserved, auth-off} it is.
  if (!site || !served || !authOn) {
    throw errors.notFound("التسجيل غير متاح لهذا الموقع");
  }
  return site;
}

async function mintSession(siteId: string, siteUserId: string): Promise<string> {
  const token = generateRandomString(48);
  await siteAuthRepository.createSession({
    siteId,
    siteUserId,
    token,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

/* ─────────────────────────────── public ─────────────────────────────── */

export interface AuthResult {
  user: PublicSiteUser | null;
  token: string | null;
}

export async function register(
  host: string | null,
  input: RegisterInput,
  ip: string | null,
): Promise<AuthResult> {
  const ipHash = hashIp(ip);
  if (rateLimited(ipHash)) throw errors.rateLimited();
  // Honeypot → pretend success, store nothing (route sets no cookie).
  if (input.company?.trim()) return { user: null, token: null };

  const site = await servedAuthSite(host);
  const since = new Date(Date.now() - AUTH_WINDOW_MS);
  if ((await siteAuthRepository.countRecentBySite(site.id, since)) >= MAX_SIGNUPS_PER_SITE_WINDOW) {
    throw errors.rateLimited("عدد كبير من التسجيلات الآن، حاول لاحقًا");
  }
  if (await siteAuthRepository.findUser(site.id, input.email)) {
    throw errors.conflict("هذا البريد مسجّل بالفعل");
  }

  const passwordHash = await hashPassword(input.password);
  // Self-selected type → role. seller can author listings (contributor); buyer is a
  // registered browser (member). Manager is never self-assignable (owner only).
  const role: SiteUserRole = input.accountType === "seller" ? "contributor" : "member";
  const user = await siteAuthRepository.createUser({
    siteId: site.id,
    email: input.email,
    name: input.name?.trim() || null,
    phone: input.phone?.trim() || null,
    passwordHash,
    role,
  });
  const token = await mintSession(site.id, user.id);
  return { user: toPublic(user), token };
}

export async function login(
  host: string | null,
  input: LoginInput,
  ip: string | null,
): Promise<AuthResult> {
  const ipHash = hashIp(ip);
  if (rateLimited(ipHash)) throw errors.rateLimited();

  const site = await servedAuthSite(host);
  const user = await siteAuthRepository.findUser(site.id, input.email);
  const ok = user ? await verifyPassword({ hash: user.passwordHash, password: input.password }) : false;
  // Uniform error whether the email is unknown or the password is wrong.
  if (!user || !ok) throw errors.unauthorized("البريد الإلكتروني أو كلمة المرور غير صحيحة");

  const token = await mintSession(site.id, user.id);
  return { user: toPublic(user), token };
}

export async function logout(token: string | null): Promise<{ ok: true }> {
  if (token) await siteAuthRepository.deleteSession(token);
  return { ok: true };
}

/** The current site-user for a session token, validated against the host's site. */
export async function currentUser(
  host: string | null,
  token: string | null,
): Promise<{ user: PublicSiteUser | null; labels: Record<SiteUserRole, string> }> {
  const slug = siteSlugFromHost(host);
  const site = slug ? await siteAuthRepository.siteGateBySlug(slug) : null;
  const labels = roleLabelsOf(site?.settings?.roleLabels);
  if (!token || !site) return { user: null, labels };

  const session = await siteAuthRepository.findSession(token);
  // Bind the session to THIS site + honour expiry (defense-in-depth beyond the
  // host-only cookie): a token minted for another site is never accepted.
  if (!session || session.siteId !== site.id || session.expiresAt < new Date()) {
    return { user: null, labels };
  }
  return { user: toPublic(session.siteUser), labels };
}

/** A signed-in site-user edits THEIR OWN profile (name/phone/password). Email is
 *  never editable here (it's the account identity). Authorized by the session
 *  against the host's site; returns the fresh public user. */
export async function updateOwnProfile(
  host: string | null,
  token: string | null,
  input: UpdateProfileInput,
): Promise<PublicSiteUser> {
  const { caller } = await sessionUserForHost(host, token);
  const data: { name?: string | null; phone?: string | null; passwordHash?: string } = {};
  if (input.name !== undefined) data.name = input.name.trim() || null;
  if (input.phone !== undefined) data.phone = input.phone?.trim() || null;
  if (input.password !== undefined) data.passwordHash = await hashPassword(input.password);
  const updated = await siteAuthRepository.updateProfile(caller.id, data);
  return toPublic(updated);
}

/* ───────────────────────────── owner (dashboard) ────────────────────── */

async function loadForManage(claims: SessionClaims, siteId: string) {
  const site = await sitesRepository.findById(siteId);
  if (!site) throw errors.notFound("الموقع غير موجود");
  const perms = resolveSiteAccess(claims, site);
  if (!perms.canView) throw errors.notFound("الموقع غير موجود");
  if (!perms.canEditSettings) throw errors.forbidden("لا تملك صلاحية إدارة المستخدمين");
  return site;
}

export async function listSiteUsers(claims: SessionClaims, siteId: string) {
  await loadForManage(claims, siteId);
  const users = await siteAuthRepository.listUsers(siteId);
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
  }));
}

export async function setSiteUserRole(
  claims: SessionClaims,
  siteId: string,
  userId: string,
  role: SiteUserRole,
) {
  await loadForManage(claims, siteId);
  const u = await siteAuthRepository.findUserById(userId);
  if (!u || u.siteId !== siteId) throw errors.notFound("المستخدم غير موجود");
  return siteAuthRepository.updateRole(userId, role);
}

export async function deleteSiteUser(claims: SessionClaims, siteId: string, userId: string) {
  await loadForManage(claims, siteId);
  const u = await siteAuthRepository.findUserById(userId);
  if (!u || u.siteId !== siteId) throw errors.notFound("المستخدم غير موجود");
  await siteAuthRepository.deleteUser(userId);
  return { id: userId, deleted: true };
}

/** Generate a fresh temp password for a user, hash+store it, revoke the user's
 *  sessions, and return the plaintext ONCE (never stored). Shared by the owner and
 *  the on-site manager reset paths. 10 mixed alphanumerics ≈ 59 bits. */
export async function issueTempPassword(userId: string): Promise<string> {
  const tempPassword = generateRandomString(10, "A-Z", "a-z", "0-9");
  await siteAuthRepository.updatePassword(userId, await hashPassword(tempPassword));
  await siteAuthRepository.deleteSessionsForUser(userId);
  return tempPassword;
}

/** Owner resets a site-user's password to a freshly generated one, returned ONCE
 *  (never stored in plaintext). No email — the owner hands it to the user directly. */
export async function resetSiteUserPassword(
  claims: SessionClaims,
  siteId: string,
  userId: string,
): Promise<{ id: string; tempPassword: string }> {
  await loadForManage(claims, siteId);
  const u = await siteAuthRepository.findUserById(userId);
  if (!u || u.siteId !== siteId) throw errors.notFound("المستخدم غير موجود");
  return { id: userId, tempPassword: await issueTempPassword(userId) };
}

/* ─────────────────────── on-site manager admin (site session) ────────────
   Authorizes by the SITE SESSION (not platform claims): the caller must be a
   signed-in site-user with role `manager` on the served, auth-enabled site.
   Used by src/server/site-auth/site-admin.service.ts. */

export interface AdminContext {
  site: { id: string };
  caller: PublicSiteUser;
}

/** Resolve the served site + the current site-user of a valid session (any role). */
async function sessionUserForHost(host: string | null, token: string | null): Promise<AdminContext> {
  const site = await servedAuthSite(host); // 404s on unknown/unserved/auth-off host
  if (!token) throw errors.unauthorized("يجب تسجيل الدخول");
  const session = await siteAuthRepository.findSession(token);
  if (!session || session.siteId !== site.id || session.expiresAt < new Date()) {
    throw errors.unauthorized("انتهت الجلسة، سجّل الدخول من جديد");
  }
  return { site: { id: site.id }, caller: toPublic(session.siteUser) };
}

/** Resolve the served site + assert the session belongs to a `manager` of it. */
export async function adminContext(host: string | null, token: string | null): Promise<AdminContext> {
  const ctx = await sessionUserForHost(host, token);
  if (ctx.caller.role !== "manager") throw errors.forbidden("هذه الصفحة للمديرين فقط");
  return ctx;
}

/** Resolve the served site + assert the session can AUTHOR listings (seller =
 *  contributor, or manager). Used by the on-site seller flow + photo uploads. */
export async function authorContext(host: string | null, token: string | null): Promise<AdminContext> {
  const ctx = await sessionUserForHost(host, token);
  if (ctx.caller.role !== "contributor" && ctx.caller.role !== "manager") {
    throw errors.forbidden("هذا الإجراء متاح للبائعين فقط");
  }
  return ctx;
}
