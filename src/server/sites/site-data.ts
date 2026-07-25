// Assemble a site's structured data into the SiteRenderData shape the section
// components consume. Used by the configurator preview (live draft) and the
// public renderer (frozen published snapshot).

import { cache } from "react";
import { getPrisma } from "@/lib/db";
import type { SiteRenderData } from "@/sections/types";
import type { ColorScheme } from "@/shared/domain";
import { asSiteSeo, asPageSeo, type SiteSeo, type PageSeo } from "@/shared/seo";

// A section as it appears in a rendered page (live row or snapshot JSON).
export interface RenderSectionData {
  id: string;
  sectionType: string;
  variant: string;
  colorScheme: ColorScheme;
  content: Record<string, unknown>;
}

export interface RenderPage {
  id: string;
  order: number;
  path: string;
  title: string;
  seo: PageSeo;
  sections: RenderSectionData[];
}

/** Site-level metadata carried alongside the rendered pages. */
export interface RenderSiteMeta {
  businessName: string;
  language: "ar" | "en";
  seo: SiteSeo;
}

/** Curated appearance selection applied at the site root (see sections/palette). */
export interface RenderTheme {
  paletteKey: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  fontKey: string | null;
  headerVariant: string | null;
  headerScheme: string | null;
  footerVariant: string | null;
  footerScheme: string | null;
}

export interface PublishedRenderData {
  meta: RenderSiteMeta;
  theme: RenderTheme;
  siteData: SiteRenderData;
  pages: RenderPage[];
}

// The minimal, source-agnostic shape both a live `include` result and a parsed
// snapshot payload satisfy. Dates/extra fields are ignored — only these matter
// to rendering, so the same mapper works for both.
interface SiteLike {
  businessName: string;
  logoUrl?: string | null;
  settings?: {
    whatsappNumber?: string | null;
    phone?: string | null;
    address?: string | null;
    googleMapsUrl?: string | null;
    openingHours?: unknown;
    socials?: unknown;
    currency?: string | null;
  } | null;
  services?: { id: string; name: string; price?: string | null; duration?: string | null; description?: string | null; visible?: boolean }[];
  team?: { id: string; name: string; roleTitle?: string | null }[];
  testimonials?: { id: string; author: string; text: string }[];
  faq?: { id: string; question: string; answer: string }[];
}

/** Pure mapper: a site-like object → the SiteRenderData sections consume. */
export function toRenderData(site: SiteLike): SiteRenderData {
  return {
    businessName: site.businessName,
    logoUrl: site.logoUrl ?? null,
    settings: {
      whatsappNumber: site.settings?.whatsappNumber ?? null,
      phone: site.settings?.phone ?? null,
      address: site.settings?.address ?? null,
      googleMapsUrl: site.settings?.googleMapsUrl ?? null,
      openingHours:
        (site.settings?.openingHours as SiteRenderData["settings"]["openingHours"]) ?? {},
      socials: (site.settings?.socials as Record<string, string>) ?? {},
      currency: site.settings?.currency ?? "SYP",
    },
    services: (site.services ?? [])
      .filter((s) => s.visible !== false)
      .map((s) => ({
        id: s.id, name: s.name, price: s.price, duration: s.duration, description: s.description,
      })),
    team: (site.team ?? []).map((t) => ({ id: t.id, name: t.name, roleTitle: t.roleTitle })),
    testimonials: (site.testimonials ?? []).map((t) => ({ id: t.id, author: t.author, text: t.text })),
    faq: (site.faq ?? []).map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
  };
}

/** Live draft render data — used by the dashboard configurator preview. */
export async function getSiteRenderData(
  siteId: string,
): Promise<SiteRenderData | null> {
  const site = await getPrisma().site.findUnique({
    where: { id: siteId },
    include: {
      settings: true,
      services: { where: { visible: true }, orderBy: { order: "asc" } },
      team: { orderBy: { order: "asc" } },
      testimonials: { orderBy: { order: "asc" } },
      faq: { orderBy: { order: "asc" } },
    },
  });
  if (!site) return null;
  return toRenderData(site);
}

/**
 * Live draft render data WITH pages/sections — the faithful, unpublished view
 * used by the dashboard preview. Mirrors getPublishedRenderData's shape but reads
 * current DB rows instead of a snapshot, so the owner sees exactly what "publish"
 * would freeze. Cached per request (page + any metadata share one read).
 */
export const getDraftRenderData = cache(
  async (siteId: string): Promise<PublishedRenderData | null> => {
    const site = await getPrisma().site.findUnique({
      where: { id: siteId },
      include: {
        settings: true,
        theme: true,
        services: { where: { visible: true }, orderBy: { order: "asc" } },
        team: { orderBy: { order: "asc" } },
        testimonials: { orderBy: { order: "asc" } },
        faq: { orderBy: { order: "asc" } },
        pages: {
          orderBy: { order: "asc" },
          include: { sections: { orderBy: { order: "asc" } } },
        },
      },
    });
    if (!site) return null;

    const pages: RenderPage[] = site.pages.map((p) => ({
      id: p.id,
      order: p.order,
      path: p.path,
      title: p.title,
      seo: asPageSeo(p.seo),
      sections: p.sections.map((s) => ({
        id: s.id,
        sectionType: s.sectionType,
        variant: s.variant,
        colorScheme: s.colorScheme as ColorScheme,
        content: (s.content as Record<string, unknown>) ?? {},
      })),
    }));

    return {
      meta: {
        businessName: site.businessName,
        language: site.language === "en" ? "en" : "ar",
        seo: asSiteSeo(site.seo),
      },
      theme: {
        paletteKey: site.theme?.paletteKey ?? null,
        primaryColor: site.theme?.primaryColor ?? null,
        secondaryColor: site.theme?.secondaryColor ?? null,
        fontKey: site.theme?.fontKey ?? null,
        headerVariant: site.theme?.headerVariant ?? null,
        headerScheme: site.theme?.headerScheme ?? null,
        footerVariant: site.theme?.footerVariant ?? null,
        footerScheme: site.theme?.footerScheme ?? null,
      },
      siteData: toRenderData(site),
      pages,
    };
  },
);

// The parsed shape of a snapshot payload (see publishing.repository.buildPayload).
interface SnapshotPayload extends SiteLike {
  language?: string;
  seo?: unknown;
  theme?: {
    paletteKey?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    fontKey?: string | null;
    headerVariant?: string | null;
    headerScheme?: string | null;
    footerVariant?: string | null;
    footerScheme?: string | null;
  } | null;
  pages?: {
    id: string;
    order: number;
    path?: string;
    title?: string;
    seo?: unknown;
    sections: {
      id: string;
      sectionType: string;
      variant: string;
      colorScheme: string;
      content: unknown;
    }[];
  }[];
}

/**
 * Frozen published render data — reads the LATEST publish snapshot and rebuilds
 * both the site data and its pages/sections from that immutable payload. This is
 * what the public site serves, so edits after publishing never leak until the
 * user publishes again. Returns null if the site was never published.
 */
// Cached per request: generateMetadata and the page both call this, so the
// snapshot is read from Postgres only once per render.
export const getPublishedRenderData = cache(
  async (siteId: string): Promise<PublishedRenderData | null> => {
    const snapshot = await getPrisma().publishSnapshot.findFirst({
      where: { siteId },
      orderBy: { version: "desc" },
      select: { payload: true },
    });
    if (!snapshot) return null;

    const payload = snapshot.payload as unknown as SnapshotPayload;
    const pages: RenderPage[] = (payload.pages ?? []).map((p) => ({
      id: p.id,
      order: p.order,
      path: p.path ?? "/",
      title: p.title ?? "",
      seo: asPageSeo(p.seo),
      sections: p.sections.map((s) => ({
        id: s.id,
        sectionType: s.sectionType,
        variant: s.variant,
        colorScheme: s.colorScheme as ColorScheme,
        content: (s.content as Record<string, unknown>) ?? {},
      })),
    }));

    return {
      meta: {
        businessName: payload.businessName,
        language: payload.language === "en" ? "en" : "ar",
        seo: asSiteSeo(payload.seo),
      },
      theme: {
        paletteKey: payload.theme?.paletteKey ?? null,
        primaryColor: payload.theme?.primaryColor ?? null,
        secondaryColor: payload.theme?.secondaryColor ?? null,
        fontKey: payload.theme?.fontKey ?? null,
        headerVariant: payload.theme?.headerVariant ?? null,
        headerScheme: payload.theme?.headerScheme ?? null,
        footerVariant: payload.theme?.footerVariant ?? null,
        footerScheme: payload.theme?.footerScheme ?? null,
      },
      siteData: toRenderData(payload),
      pages,
    };
  },
);
