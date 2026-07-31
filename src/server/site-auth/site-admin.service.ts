// ON-SITE manager admin — the operations behind the marketplace `/admin` area.
// Authorized ENTIRELY by the site session (a signed-in site-user with role
// `manager`), never by platform/dashboard claims. Every entrypoint resolves the
// served site from the Host and the caller from the session token via
// `adminContext`, then applies the manager guardrails and delegates to the same
// repositories/cores the dashboard uses.
//
// Guardrails (a manager may manage members & contributors only):
//   · never another manager   · never themselves   · role limited to member|contributor
// Promoting/creating managers stays owner-only (dashboard).

import type { SiteUserRole } from "@/generated/prisma/enums";
import { errors } from "@/shared/errors";
import type { CreateListingInput, UpdateListingInput } from "@/server/listings/listings.schema";
import {
  createListingForSite,
  updateListingForSite,
  deleteListingForSite,
} from "@/server/listings/listings.service";
import { listingsRepository } from "@/server/listings/listings.repository";
import { adminContext, issueTempPassword } from "./site-auth.service";
import { siteAuthRepository } from "./site-auth.repository";

/** A site-user the manager is allowed to act on, or throw. `manager`/self are off-limits. */
async function manageableTarget(callerId: string, siteId: string, userId: string) {
  const target = await siteAuthRepository.findUserById(userId);
  if (!target || target.siteId !== siteId) throw errors.notFound("المستخدم غير موجود");
  if (target.id === callerId) throw errors.forbidden("لا يمكنك تعديل حسابك من هنا");
  if (target.role === "manager") throw errors.forbidden("لا يمكن لمديرٍ التعديل على مديرٍ آخر");
  return target;
}

/* ───────────────────────────────── users ────────────────────────────────── */

export async function adminListUsers(host: string | null, token: string | null) {
  const { site } = await adminContext(host, token);
  const users = await siteAuthRepository.listUsers(site.id);
  return users.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt }));
}

export async function adminSetRole(
  host: string | null,
  token: string | null,
  userId: string,
  role: SiteUserRole,
) {
  const { site, caller } = await adminContext(host, token);
  if (role === "manager") throw errors.forbidden("ترقية مديرٍ من صلاحية مالك الموقع فقط");
  await manageableTarget(caller.id, site.id, userId);
  return siteAuthRepository.updateRole(userId, role);
}

export async function adminResetPassword(host: string | null, token: string | null, userId: string) {
  const { site, caller } = await adminContext(host, token);
  await manageableTarget(caller.id, site.id, userId);
  return { id: userId, tempPassword: await issueTempPassword(userId) };
}

export async function adminDeleteUser(host: string | null, token: string | null, userId: string) {
  const { site, caller } = await adminContext(host, token);
  await manageableTarget(caller.id, site.id, userId);
  await siteAuthRepository.deleteUser(userId);
  return { id: userId, deleted: true };
}

/* ─────────────────────────────── listings ───────────────────────────────── */

export async function adminListListings(host: string | null, token: string | null) {
  const { site } = await adminContext(host, token);
  return listingsRepository.listBySite(site.id);
}

export async function adminCreateListing(
  host: string | null,
  token: string | null,
  input: CreateListingInput,
) {
  const { site } = await adminContext(host, token);
  return createListingForSite(site.id, input);
}

export async function adminUpdateListing(
  host: string | null,
  token: string | null,
  listingId: string,
  input: UpdateListingInput,
) {
  const { site } = await adminContext(host, token);
  return updateListingForSite(site.id, listingId, input);
}

export async function adminDeleteListing(host: string | null, token: string | null, listingId: string) {
  const { site } = await adminContext(host, token);
  return deleteListingForSite(site.id, listingId);
}
