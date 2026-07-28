// Data access for publishing: build the immutable snapshot payload from the
// site's current draft, and read/write snapshots.

import { getPrisma } from "@/lib/db";
import { defaultCurrencyOf } from "@/templates/registry";
import type { Prisma } from "@/generated/prisma/client";

export const publishingRepository = {
  /** The current draft of a site, serialized into the snapshot payload the
   *  public renderer reads (see server/sites/template-data.ts TemplateSnapshot):
   *  the chosen template + its editable content + the themeable tokens. */
  async buildPayload(siteId: string) {
    const site = await getPrisma().site.findUnique({
      where: { id: siteId },
      include: { settings: true, theme: true },
    });
    if (!site) return null;
    return {
      businessName: site.businessName,
      language: site.language,
      seo: site.seo,
      templateKey: site.templateKey,
      content: site.content,
      currency: site.settings?.currency ?? defaultCurrencyOf(site.templateKey),
      theme: {
        accent: site.theme?.primaryColor ?? null,
        ground: site.theme?.bgColor ?? null,
        ink: site.theme?.secondaryColor ?? null,
        fontKey: site.theme?.fontKey ?? null,
      },
    };
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
