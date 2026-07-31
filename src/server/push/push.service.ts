// Web Push subscriptions + fan-out. A user enables notifications in the PWA →
// their browser subscription is stored here; site events then push to every
// device of the right recipients (see notifications.service).

import type { SessionClaims } from "@/server/access/access.rules";
import { sendPush, type PushPayload } from "@/lib/push";
import { pushRepository } from "./push.repository";
import type { PushSubscriptionInput } from "./push.schema";

export async function savePushSubscription(claims: SessionClaims, input: PushSubscriptionInput) {
  await pushRepository.upsert(claims.userId, input.endpoint, input.keys.p256dh, input.keys.auth);
  return { ok: true };
}

export async function removePushSubscription(claims: SessionClaims, endpoint: string) {
  await pushRepository.deleteForUser(claims.userId, endpoint);
  return { ok: true };
}

/**
 * Fan a push message out to every device of the given users. Best-effort: dead
 * subscriptions (404/410) are pruned; failures never throw. Returns how many were
 * delivered. A no-op when push isn't configured (sendPush returns "skipped").
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<number> {
  if (!userIds.length) return 0;
  const subs = await pushRepository.listForUsers(userIds);
  if (!subs.length) return 0;
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      const result = await sendPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, payload);
      if (result === "sent") sent += 1;
      else if (result === "expired") await pushRepository.deleteByEndpoint(s.endpoint).catch(() => {});
    }),
  );
  return sent;
}
