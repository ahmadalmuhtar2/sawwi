// Data access for marketplace submissions — the ONLY layer that touches Prisma.

import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { SubmissionKind, SubmissionStatus } from "@/generated/prisma/enums";
import type { ListQuery } from "./submissions.schema";

export const PAGE_SIZE = 50;

export interface WriteData {
  kind: SubmissionKind;
  name: string;
  phone: string;
  phoneRaw: string;
  category: string;
  area: string;
  details: string | null;
  images: string[];
  source: string; // "web" | "manual"
  utmSource: string | null;
}

/** Build the WHERE clause shared by the paginated list, the export, and counts. */
function whereFor(siteId: string, q: ListQuery): Prisma.SubmissionWhereInput {
  const where: Prisma.SubmissionWhereInput = { siteId };
  if (q.kind !== "all") where.kind = q.kind as SubmissionKind;
  if (q.status !== "all") where.status = q.status as SubmissionStatus;
  if (q.category) where.category = q.category;
  const term = q.q?.trim();
  if (term) {
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { phone: { contains: term } },
      { phoneRaw: { contains: term } },
    ];
  }
  return where;
}

export const submissionsRepository = {
  siteExists(siteId: string) {
    return getPrisma()
      .site.findUnique({ where: { id: siteId }, select: { id: true } })
      .then((s) => !!s);
  },

  /** The site's template key — so the public upload endpoint can reject uploads to
   *  sites whose template doesn't collect submissions. */
  siteTemplateKey(siteId: string) {
    return getPrisma()
      .site.findUnique({ where: { id: siteId }, select: { templateKey: true } })
      .then((s) => s?.templateKey ?? null);
  },

  /** Dedup lookup — same site + kind + normalized phone. */
  findDuplicate(siteId: string, kind: SubmissionKind, phone: string) {
    return getPrisma().submission.findFirst({ where: { siteId, kind, phone } });
  },

  create(siteId: string, data: WriteData) {
    return getPrisma().submission.create({ data: { siteId, ...data } });
  },

  /** Re-submission: refresh the content but KEEP the original createdAt, source,
   *  and the admin's status/note. `updatedAt` moves automatically. */
  refresh(id: string, data: WriteData) {
    return getPrisma().submission.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        phoneRaw: data.phoneRaw,
        category: data.category,
        area: data.area,
        details: data.details,
        images: data.images,
      },
    });
  },

  async listBySite(siteId: string, q: ListQuery) {
    const where = whereFor(siteId, q);
    const [rows, total] = await Promise.all([
      getPrisma().submission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      getPrisma().submission.count({ where }),
    ]);
    return { rows, total };
  },

  listForExport(siteId: string, q: ListQuery) {
    return getPrisma().submission.findMany({
      where: whereFor(siteId, q),
      orderBy: { createdAt: "desc" },
    });
  },

  countNew(siteId: string) {
    return getPrisma().submission.count({ where: { siteId, status: "NEW" } });
  },

  /** NEW counts for many sites at once (dashboard nav badges). */
  async countNewBySites(siteIds: string[]): Promise<Record<string, number>> {
    if (siteIds.length === 0) return {};
    const rows = await getPrisma().submission.groupBy({
      by: ["siteId"],
      where: { siteId: { in: siteIds }, status: "NEW" },
      _count: { _all: true },
    });
    const map: Record<string, number> = {};
    for (const r of rows) map[r.siteId] = r._count._all;
    return map;
  },

  /** Distinct categories seen on this site — powers the filter without a hardcoded
   *  list (categories are site config, not schema). */
  async distinctCategories(siteId: string) {
    const rows = await getPrisma().submission.findMany({
      where: { siteId },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });
    return rows.map((r) => r.category);
  },

  getById(siteId: string, id: string) {
    return getPrisma().submission.findFirst({ where: { id, siteId } });
  },

  updateAdmin(
    id: string,
    data: { status?: SubmissionStatus; adminNote?: string | null; statusById?: string | null; statusAt?: Date },
  ) {
    return getPrisma().submission.update({ where: { id }, data });
  },

  remove(id: string) {
    return getPrisma().submission.delete({ where: { id } });
  },
};
