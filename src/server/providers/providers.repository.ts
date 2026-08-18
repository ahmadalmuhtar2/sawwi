// Data access for providers + their photos — the only layer touching Prisma for
// this domain. Every query is siteId-scoped (the service authorizes the site).

import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { ProviderStatus } from "@/generated/prisma/enums";
import type { ProviderListQuery } from "./providers.schema";

export const PAGE_SIZE = 50;

export interface ProviderWrite {
  siteId: string;
  submissionId: string | null;
  slug: string;
  name: string;
  displayName: string | null;
  phone: string;
  phoneRaw: string;
  categories: string[];
  areas: string[];
}

function whereFor(siteId: string, q: ProviderListQuery): Prisma.ProviderWhereInput {
  const where: Prisma.ProviderWhereInput = { siteId };
  if (q.status !== "all") where.status = q.status as ProviderStatus;
  if (q.category) where.categories = { has: q.category };
  const term = q.q?.trim();
  if (term) {
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { displayName: { contains: term, mode: "insensitive" } },
      { phone: { contains: term } },
      { phoneRaw: { contains: term } },
    ];
  }
  return where;
}

export const providersRepository = {
  create(data: ProviderWrite) {
    return getPrisma().provider.create({ data });
  },

  /** Guard against double-converting the same submission. */
  findBySubmissionId(submissionId: string) {
    return getPrisma().provider.findUnique({ where: { submissionId } });
  },

  slugTaken(siteId: string, slug: string) {
    return getPrisma()
      .provider.findUnique({ where: { siteId_slug: { siteId, slug } }, select: { id: true } })
      .then((r) => !!r);
  },

  async listBySite(siteId: string, q: ProviderListQuery) {
    const where = whereFor(siteId, q);
    const [rows, total] = await Promise.all([
      getPrisma().provider.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { _count: { select: { jobs: true } } },
      }),
      getPrisma().provider.count({ where }),
    ]);
    return { rows, total };
  },

  /** Distinct categories across a site's providers (for the filter). */
  async distinctCategories(siteId: string) {
    const rows = await getPrisma().provider.findMany({ where: { siteId }, select: { categories: true } });
    return [...new Set(rows.flatMap((r) => r.categories))].sort();
  },

  getById(siteId: string, id: string) {
    return getPrisma().provider.findFirst({
      where: { id, siteId },
      include: { photos: { orderBy: { sortOrder: "asc" } } },
    });
  },

  /** Non-removed providers for the "record a match" picker (id + names + prefill). */
  pickerList(siteId: string) {
    return getPrisma().provider.findMany({
      where: { siteId, status: { not: "REMOVED" } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, displayName: true, categories: true, areas: true },
    });
  },

  /** Belongs-to check used when creating a Job for a provider. */
  existsInSite(siteId: string, id: string) {
    return getPrisma()
      .provider.findFirst({ where: { id, siteId }, select: { id: true } })
      .then((r) => !!r);
  },

  update(id: string, data: Prisma.ProviderUpdateInput) {
    return getPrisma().provider.update({ where: { id }, data });
  },

  /** Public read: the provider by (site, slug) + photos + APPROVED public comments.
   *  Phone columns are selected out entirely — they can't leak from here. */
  getPublicBySlug(siteId: string, slug: string) {
    return getPrisma().provider.findUnique({
      where: { siteId_slug: { siteId, slug } },
      select: {
        id: true,
        displayName: true,
        name: true,
        categories: true,
        areas: true,
        bio: true,
        status: true,
        verifiedAt: true,
        profilePublic: true,
        jobsCompleted: true,
        ratingCount: true,
        ratingAvg: true,
        photos: { orderBy: { sortOrder: "asc" }, select: { key: true, caption: true } },
      },
    });
  },

  approvedComments(providerId: string) {
    return getPrisma().rating.findMany({
      where: { providerId, commentApproved: true, publicComment: { not: null } },
      orderBy: { recordedAt: "desc" },
      select: { publicComment: true, score: true, recordedAt: true },
      take: 20,
    });
  },

  /* ── photos ── */
  addPhoto(providerId: string, key: string, sortOrder: number) {
    return getPrisma().providerPhoto.create({ data: { providerId, key, sortOrder } });
  },
  getPhoto(providerId: string, photoId: string) {
    return getPrisma().providerPhoto.findFirst({ where: { id: photoId, providerId } });
  },
  photoCount(providerId: string) {
    return getPrisma().providerPhoto.count({ where: { providerId } });
  },
  updatePhoto(photoId: string, data: { caption?: string | null; sortOrder?: number }) {
    return getPrisma().providerPhoto.update({ where: { id: photoId }, data });
  },
  removePhoto(photoId: string) {
    return getPrisma().providerPhoto.delete({ where: { id: photoId } });
  },
};
