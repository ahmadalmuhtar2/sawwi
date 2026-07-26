// Data access for sites — the ONLY layer that touches Prisma.

import { getPrisma } from "@/lib/db";
import type { SiteLanguage } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import type { UpdateSettingsInput, UpdateThemeInput } from "./sites.schema";

export interface CreateSiteData {
  workspaceId: string;
  slug: string;
  businessName: string;
  verticalKey: string;
  templateKey: string | null;
  language: SiteLanguage;
  content: Prisma.InputJsonValue;
}

export const sitesRepository = {
  async slugExists(slug: string): Promise<boolean> {
    return (await getPrisma().site.count({ where: { slug } })) > 0;
  },

  async slugTakenByOther(slug: string, exceptId: string): Promise<boolean> {
    return (
      (await getPrisma().site.count({ where: { slug, NOT: { id: exceptId } } })) > 0
    );
  },

  updateBasics(
    siteId: string,
    data: { businessName?: string; slug?: string; language?: SiteLanguage },
  ) {
    return getPrisma().site.update({ where: { id: siteId }, data });
  },

  create(data: CreateSiteData) {
    return getPrisma().site.create({ data });
  },

  updateContent(siteId: string, content: Prisma.InputJsonValue) {
    return getPrisma().site.update({ where: { id: siteId }, data: { content } });
  },

  delete(id: string) {
    // All site-scoped rows cascade (see schema onDelete: Cascade).
    return getPrisma().site.delete({ where: { id } });
  },

  findById(id: string) {
    return getPrisma().site.findUnique({ where: { id } });
  },

  listByWorkspace(workspaceId: string) {
    return getPrisma().site.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
  },

  listByIds(ids: string[]) {
    return getPrisma().site.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: "desc" },
    });
  },

  upsertSettings(siteId: string, data: UpdateSettingsInput) {
    const fields = {
      whatsappNumber: data.whatsappNumber ?? null,
      phone: data.phone ?? null,
      socials: data.socials as Prisma.InputJsonValue,
      googleMapsUrl: data.googleMapsUrl ?? null,
      address: data.address ?? null,
      openingHours: data.openingHours as Prisma.InputJsonValue,
      logoMediaId: data.logoMediaId ?? null,
      loadingIconId: data.loadingIconId ?? null,
    };
    // currency is non-nullable with a default; only touch it when the caller
    // actually sends one, so a PUT that omits it never resets the site's choice.
    const currency = data.currency || undefined;
    return getPrisma().siteSettings.upsert({
      where: { siteId },
      create: { siteId, ...fields, currency: currency ?? "SYP" },
      update: { ...fields, ...(currency ? { currency } : {}) },
    });
  },

  upsertTheme(siteId: string, data: UpdateThemeInput) {
    const fields = {
      paletteKey: data.paletteKey ?? null,
      primaryColor: data.primaryColor ?? null,
      secondaryColor: data.secondaryColor ?? null,
      bgColor: data.bgColor ?? null,
      fontKey: data.fontKey,
      headerVariant: data.headerVariant ?? null,
      headerScheme: data.headerScheme ?? null,
      footerVariant: data.footerVariant ?? null,
      footerScheme: data.footerScheme ?? null,
    };
    return getPrisma().siteTheme.upsert({
      where: { siteId },
      create: { siteId, ...fields },
      update: fields,
    });
  },

  updateSeo(siteId: string, seo: unknown) {
    return getPrisma().site.update({
      where: { id: siteId },
      data: { seo: seo as Prisma.InputJsonValue },
      select: { id: true, seo: true },
    });
  },
};
