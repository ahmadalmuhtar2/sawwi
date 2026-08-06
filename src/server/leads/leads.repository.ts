// Data access for landing-page leads — the ONLY layer that touches Prisma.

import { getPrisma } from "@/lib/db";
import type { LeadStatus } from "@/generated/prisma/enums";
import type { LeadDir, LeadFilter, LeadSort } from "./leads.schema";

export interface CreateLeadData {
  businessName: string;
  whatsapp: string;
  email: string | null;
  ipHash: string | null;
}

export interface LeadListQuery {
  filter: LeadFilter;
  q?: string;
  sort: LeadSort;
  dir: LeadDir;
}

/** Free-text search across business name, email (both case-insensitive) and the
 *  digits of the WhatsApp number. Empty query → no filter. */
function searchFilter(q?: string) {
  const t = q?.trim();
  if (!t) return {};
  const digits = t.replace(/\D/g, "");
  return {
    OR: [
      { businessName: { contains: t, mode: "insensitive" as const } },
      { email: { contains: t, mode: "insensitive" as const } },
      ...(digits ? [{ whatsapp: { contains: digits } }] : []),
    ],
  };
}

export const leadsRepository = {
  create(data: CreateLeadData) {
    return getPrisma().lead.create({ data });
  },

  list(query: LeadListQuery, limit = 500) {
    const where = {
      ...(query.filter !== "all" ? { status: query.filter } : {}),
      ...searchFilter(query.q),
    };
    const orderBy =
      query.sort === "business"
        ? { businessName: query.dir }
        : query.sort === "status"
          ? { status: query.dir }
          : { createdAt: query.dir };
    return getPrisma().lead.findMany({ where, orderBy, take: limit });
  },

  findById(id: string) {
    return getPrisma().lead.findUnique({ where: { id } });
  },

  update(
    id: string,
    data: {
      businessName?: string;
      whatsapp?: string;
      email?: string | null;
      status?: LeadStatus;
      note?: string | null;
    },
  ) {
    return getPrisma().lead.update({ where: { id }, data });
  },

  delete(id: string) {
    return getPrisma().lead.delete({ where: { id } });
  },

  countRecentByIp(ipHash: string, since: Date): Promise<number> {
    return getPrisma().lead.count({ where: { ipHash, createdAt: { gte: since } } });
  },

  countRecentGlobal(since: Date): Promise<number> {
    return getPrisma().lead.count({ where: { createdAt: { gte: since } } });
  },

  /** Lead counts per status, honoring the active search so the filter badges
   *  match the visible rows. */
  async countsByStatus(q?: string): Promise<Record<LeadStatus, number>> {
    const rows = await getPrisma().lead.groupBy({
      by: ["status"],
      where: searchFilter(q),
      _count: { _all: true },
    });
    const map = { new: 0, contacted: 0, converted: 0, archived: 0 } as Record<LeadStatus, number>;
    for (const r of rows) map[r.status] = r._count._all;
    return map;
  },
};
