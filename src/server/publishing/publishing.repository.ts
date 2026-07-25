// Data access for publishing: build the immutable snapshot payload from the
// site's current draft, and read/write snapshots.

import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const publishingRepository = {
  /** The full current draft of a site, serialized into a snapshot payload. */
  buildPayload(siteId: string) {
    return getPrisma().site.findUnique({
      where: { id: siteId },
      include: {
        settings: true,
        theme: true,
        services: { orderBy: { order: "asc" } },
        team: { orderBy: { order: "asc" } },
        testimonials: { orderBy: { order: "asc" } },
        faq: { orderBy: { order: "asc" } },
        pages: {
          orderBy: { order: "asc" },
          include: { sections: { orderBy: { order: "asc" } } },
        },
      },
    });
  },

  async latestVersion(siteId: string): Promise<number | null> {
    const last = await getPrisma().publishSnapshot.findFirst({
      where: { siteId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    return last?.version ?? null;
  },

  createSnapshot(siteId: string, version: number, payload: unknown, authorId: string) {
    return getPrisma().publishSnapshot.create({
      data: { siteId, version, payload: payload as Prisma.InputJsonValue, authorId },
    });
  },

  listSnapshots(siteId: string) {
    return getPrisma().publishSnapshot.findMany({
      where: { siteId },
      orderBy: { version: "desc" },
      select: { id: true, version: true, authorId: true, createdAt: true },
    });
  },

  getSnapshot(siteId: string, snapshotId: string) {
    return getPrisma().publishSnapshot.findFirst({
      where: { id: snapshotId, siteId },
    });
  },

  getSubscription(siteId: string) {
    return getPrisma().subscription.findUnique({ where: { siteId } });
  },

  markPublished(siteId: string) {
    return getPrisma().site.update({
      where: { id: siteId },
      data: { status: "published" },
    });
  },
};
