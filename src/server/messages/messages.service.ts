// Visitor-messages business logic. Two audiences:
//   · PUBLIC — an unauthenticated visitor submits a lead (submitMessage). No
//     claims; abuse is contained by honeypot + per-IP/per-site rate limits and
//     the site must actually be served.
//   · DASHBOARD — the owner/collaborator reads and triages (list/status/delete),
//     always authorized via resolveSiteAccess over trusted session claims.

import type { SessionClaims } from "@/server/access/access.rules";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { sitesRepository } from "@/server/sites/sites.repository";
import { isServable } from "@/server/billing/billing.rules";
import { errors } from "@/shared/errors";
import type { SiteMessageStatus } from "@/generated/prisma/enums";
import type { MessageFilter, SubmitMessageInput } from "./messages.schema";
import { messagesRepository } from "./messages.repository";
import {
  MAX_PER_IP,
  MAX_PER_SITE,
  RATE_WINDOW_MS,
  hashIp,
  isHoneypotTripped,
} from "./messages.rules";

/* ─────────────────────────────── public ─────────────────────────────── */

/**
 * Accept a lead from a published site's public contact form. Returns `{ ok }`
 * even for honeypot hits (so bots learn nothing). Throws NOT_FOUND when the slug
 * isn't a served site, or RATE_LIMITED when the window caps are exceeded.
 */
export async function submitMessage(input: SubmitMessageInput, ip: string | null) {
  // Silently swallow obvious bots — same success shape, nothing stored.
  if (isHoneypotTripped(input.company)) return { ok: true as const };

  const site = await messagesRepository.siteGateBySlug(input.slug);
  const now = new Date();
  const served =
    !!site &&
    site.status === "published" &&
    !site.maintenanceMode &&
    (!site.subscription || isServable(site.subscription.expiry, now));
  // Don't leak whether the slug exists — an unserved/unknown slug both 404.
  if (!site || !served) throw errors.notFound("النموذج غير متاح لهذا الموقع");

  const ipHash = hashIp(ip);
  const since = new Date(now.getTime() - RATE_WINDOW_MS);
  if (
    ipHash &&
    (await messagesRepository.countRecentByIp(site.id, ipHash, since)) >= MAX_PER_IP
  ) {
    throw errors.rateLimited("لقد أرسلت عدة رسائل، انتظر قليلًا قبل إرسال المزيد");
  }
  if ((await messagesRepository.countRecentBySite(site.id, since)) >= MAX_PER_SITE) {
    throw errors.rateLimited("تم استقبال عدد كبير من الرسائل الآن، حاول لاحقًا");
  }

  await messagesRepository.create({
    siteId: site.id,
    name: input.name,
    contact: input.contact?.trim() || null,
    body: input.body,
    ipHash,
  });
  return { ok: true as const };
}

/* ───────────────────────────── dashboard ────────────────────────────── */

/** Load a site the caller may VIEW (reading the inbox), or throw NOT_FOUND. */
async function loadForRead(claims: SessionClaims, siteId: string) {
  const site = await sitesRepository.findById(siteId);
  if (!site) throw errors.notFound("الموقع غير موجود");
  const perms = resolveSiteAccess(claims, site);
  if (!perms.canView) throw errors.notFound("الموقع غير موجود"); // don't leak existence
  return { site, perms };
}

export async function listSiteMessages(
  claims: SessionClaims,
  siteId: string,
  filter: MessageFilter = "all",
) {
  await loadForRead(claims, siteId);
  const [messages, unread] = await Promise.all([
    messagesRepository.listBySite(siteId, filter),
    messagesRepository.countUnread(siteId),
  ]);
  return { messages, unread };
}

export async function unreadCount(claims: SessionClaims, siteId: string) {
  await loadForRead(claims, siteId);
  return messagesRepository.countUnread(siteId);
}

/**
 * Unread counts for a set of sites (dashboard list badges). `siteIds` MUST come
 * from the caller's already-authorized site list — this only reads counts and
 * never widens visibility.
 */
export async function unreadCountsForSites(siteIds: string[]) {
  return messagesRepository.unreadCountsBySites(siteIds);
}

/** Triage a message. Editing (mark read/archived) needs settings-edit rights. */
export async function setMessageStatus(
  claims: SessionClaims,
  siteId: string,
  messageId: string,
  status: SiteMessageStatus,
) {
  const { perms } = await loadForRead(claims, siteId);
  if (!perms.canEditSettings) throw errors.forbidden("لا تملك صلاحية إدارة الرسائل");
  const msg = await messagesRepository.findById(messageId);
  if (!msg || msg.siteId !== siteId) throw errors.notFound("الرسالة غير موجودة");
  return messagesRepository.updateStatus(messageId, status);
}

export async function deleteMessage(
  claims: SessionClaims,
  siteId: string,
  messageId: string,
) {
  const { perms } = await loadForRead(claims, siteId);
  if (!perms.canEditSettings) throw errors.forbidden("لا تملك صلاحية إدارة الرسائل");
  const msg = await messagesRepository.findById(messageId);
  if (!msg || msg.siteId !== siteId) throw errors.notFound("الرسالة غير موجودة");
  await messagesRepository.delete(messageId);
  return { id: messageId, deleted: true };
}
