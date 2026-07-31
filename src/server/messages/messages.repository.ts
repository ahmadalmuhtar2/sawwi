// Data access for visitor messages — the ONLY layer that touches Prisma.

import { getPrisma } from "@/lib/db";
import type { SiteMessageStatus } from "@/generated/prisma/enums";
import type { MessageFilter } from "./messages.schema";

export interface CreateMessageData {
  siteId: string;
  name: string;
  contact: string | null;
  body: string;
  ipHash: string | null;
}

export const messagesRepository = {
  create(data: CreateMessageData) {
    return getPrisma().siteMessage.create({ data });
  },

  /** The gate fields needed to decide if a slug is publicly served (accepts
   *  messages): published, not paused, paid-through. Mirrors the public page. */
  siteGateBySlug(slug: string) {
    return getPrisma().site.findUnique({
      where: { slug },
      select: {
        id: true,
        status: true,
        maintenanceMode: true,
        subscription: { select: { expiry: true } },
      },
    });
  },

  listBySite(siteId: string, filter: MessageFilter, limit = 300) {
    return getPrisma().siteMessage.findMany({
      where: { siteId, ...(filter === "all" ? {} : { status: filter }) },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  findById(id: string) {
    return getPrisma().siteMessage.findUnique({ where: { id } });
  },

  updateStatus(id: string, status: SiteMessageStatus) {
    return getPrisma().siteMessage.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
  },

  delete(id: string) {
    return getPrisma().siteMessage.delete({ where: { id } });
  },

  countUnread(siteId: string): Promise<number> {
    return getPrisma().siteMessage.count({ where: { siteId, status: "unread" } });
  },

  countRecentByIp(siteId: string, ipHash: string, since: Date): Promise<number> {
    return getPrisma().siteMessage.count({
      where: { siteId, ipHash, createdAt: { gte: since } },
    });
  },

  countRecentBySite(siteId: string, since: Date): Promise<number> {
    return getPrisma().siteMessage.count({
      where: { siteId, createdAt: { gte: since } },
    });
  },

  /** Unread counts for many sites in one query — drives the dashboard badges. */
  async unreadCountsBySites(siteIds: string[]): Promise<Record<string, number>> {
    if (!siteIds.length) return {};
    const rows = await getPrisma().siteMessage.groupBy({
      by: ["siteId"],
      where: { siteId: { in: siteIds }, status: "unread" },
      _count: { _all: true },
    });
    const map: Record<string, number> = {};
    for (const r of rows) map[r.siteId] = r._count._all;
    return map;
  },
};
