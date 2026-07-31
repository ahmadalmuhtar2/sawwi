// In-app notifications. Two sides:
//   · EMITTERS — server events fan a notification out to every user who should
//     know (e.g. notifySiteMessage → all viewers of a site). Best-effort: the
//     caller invokes these as a non-blocking side effect (void + catch), so a
//     notification failure never breaks the triggering action.
//   · READERS — the signed-in user lists and clears their own bell. Everything
//     is scoped to claims.userId; a user can only ever touch their own rows.

import type { SessionClaims } from "@/server/access/access.rules";
import { sendPushToUsers } from "@/server/push/push.service";
import { notificationsRepository } from "./notifications.repository";

/** Truncate a message body for the notification preview. */
function preview(text: string, max = 90): string {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/**
 * Fan out "new visitor message" to everyone who can see the site. Returns the
 * number of notifications created (0 if the site has no recipients). Intended to
 * be called best-effort from the message-submit path.
 */
export async function notifySiteMessage(
  siteId: string,
  message: { name: string; body: string },
): Promise<number> {
  const recipients = await notificationsRepository.recipientsForSite(siteId);
  if (!recipients.length) return 0;
  const link = `/dashboard/sites/${siteId}/messages`;
  const title = `رسالة جديدة من ${message.name}`;
  const body = preview(message.body);
  await notificationsRepository.createMany(
    recipients.map((userId) => ({ userId, type: "site_message", title, body, siteId, link })),
  );
  // Best-effort Web Push to the SAME recipients (so the collaborator-vs-reseller
  // recipient rule governs push too). No-op when push isn't configured.
  void sendPushToUsers(recipients, { title, body, url: link, tag: `site-${siteId}` }).catch(() => {});
  return recipients.length;
}

export async function listMyNotifications(claims: SessionClaims) {
  const [items, unread] = await Promise.all([
    notificationsRepository.listForUser(claims.userId),
    notificationsRepository.countUnread(claims.userId),
  ]);
  return { items, unread };
}

/** Mark one (by id) or all of the caller's notifications as read. */
export async function markNotificationsRead(claims: SessionClaims, id?: string) {
  await notificationsRepository.markRead(claims.userId, id, new Date());
  const unread = await notificationsRepository.countUnread(claims.userId);
  return { unread };
}
