// Data access for in-app notifications — the ONLY layer that touches Prisma.

import { getPrisma } from "@/lib/db";

export interface NewNotification {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  siteId?: string | null;
  link?: string | null;
}

export const notificationsRepository = {
  /**
   * Who gets NOTIFIED about a site event (e.g. a new visitor message) — the
   * people who actually operate the site day-to-day, NOT everyone who can see it:
   *   · always: the site's accepted (non-revoked) site-scoped collaborators.
   *   · a DIRECT (single-business) workspace's members — the owner runs their own
   *     one site, so they should be notified.
   *   · a RESELLER workspace's members are DELIBERATELY excluded: a reseller with
   *     many client sites shouldn't get a bell notification from each. They can
   *     still read the messages (access is unchanged) — this only trims the fan-out.
   * Deduped.
   */
  async recipientsForSite(siteId: string): Promise<string[]> {
    const prisma = getPrisma();
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { workspaceId: true, workspace: { select: { kind: true } } },
    });
    if (!site) return [];
    const notifyMembers = site.workspace.kind === "direct";
    const [members, grants] = await Promise.all([
      notifyMembers
        ? prisma.workspaceMember.findMany({
            where: { workspaceId: site.workspaceId },
            select: { userId: true },
          })
        : Promise.resolve([]),
      prisma.siteAccess.findMany({
        where: { siteId, revokedAt: null, userId: { not: null } },
        select: { userId: true },
      }),
    ]);
    const ids = new Set<string>();
    for (const m of members) ids.add(m.userId);
    for (const g of grants) if (g.userId) ids.add(g.userId);
    return [...ids];
  },

  createMany(rows: NewNotification[]) {
    if (!rows.length) return Promise.resolve({ count: 0 });
    return getPrisma().notification.createMany({ data: rows });
  },

  listForUser(userId: string, limit = 30) {
    return getPrisma().notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  countUnread(userId: string): Promise<number> {
    return getPrisma().notification.count({ where: { userId, readAt: null } });
  },

  /** Mark one (scoped to the owner) or all of a user's unread notifications read. */
  markRead(userId: string, id: string | undefined, now: Date) {
    return getPrisma().notification.updateMany({
      where: { userId, readAt: null, ...(id ? { id } : {}) },
      data: { readAt: now },
    });
  },
};
