// Data access for Web Push subscriptions — the ONLY layer that touches Prisma.

import { getPrisma } from "@/lib/db";

export const pushRepository = {
  /** Store (or refresh) a browser subscription, keyed by its unique endpoint. */
  upsert(userId: string, endpoint: string, p256dh: string, auth: string) {
    return getPrisma().pushSubscription.upsert({
      where: { endpoint },
      create: { userId, endpoint, p256dh, auth },
      update: { userId, p256dh, auth },
    });
  },

  /** Remove a subscription the caller owns (unsubscribe). */
  deleteForUser(userId: string, endpoint: string) {
    return getPrisma().pushSubscription.deleteMany({ where: { userId, endpoint } });
  },

  /** Remove a dead subscription (a send returned 404/410) regardless of owner. */
  deleteByEndpoint(endpoint: string) {
    return getPrisma().pushSubscription.deleteMany({ where: { endpoint } });
  },

  listForUsers(userIds: string[]) {
    return getPrisma().pushSubscription.findMany({ where: { userId: { in: userIds } } });
  },
};
