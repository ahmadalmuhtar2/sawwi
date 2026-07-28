// Render data for the template model: a site is ONE ready-made template
// (templateKey) + an editable `content` JSON + a small themeable token set.
// Replaces the pages/sections assembly path. Draft = live DB row (preview);
// published = frozen snapshot payload.

import { cache } from "react";
import { getPrisma } from "@/lib/db";
import { symbolOf } from "@/shared/currency";
import { defaultCurrencyOf } from "@/templates/registry";
import { asSiteSeo, type SiteSeo } from "@/shared/seo";

/** The 3 themeable colors (mapped onto existing SiteTheme columns) + font. */
export interface TemplateTheme {
  accent: string | null; // SiteTheme.primaryColor
  ground: string | null; // SiteTheme.bgColor
  ink: string | null; // SiteTheme.secondaryColor
  fontKey: string | null;
}

export interface SiteTemplateData {
  templateKey: string | null;
  content: Record<string, unknown>;
  theme: TemplateTheme;
  /** currency SYMBOL (e.g. "ل.س") the template appends to prices. */
  currency: string;
  meta: { businessName: string; language: "ar" | "en"; seo: SiteSeo };
}

interface ThemeRow {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  bgColor?: string | null;
  fontKey?: string | null;
}

function themeFrom(t: ThemeRow | null | undefined): TemplateTheme {
  return {
    accent: t?.primaryColor ?? null,
    ground: t?.bgColor ?? null,
    ink: t?.secondaryColor ?? null,
    fontKey: t?.fontKey ?? null,
  };
}

/** Live draft — used by the dashboard preview and the content editor. */
export const getDraftTemplateData = cache(
  async (siteId: string): Promise<SiteTemplateData | null> => {
    const site = await getPrisma().site.findUnique({
      where: { id: siteId },
      include: { theme: true, settings: true },
    });
    if (!site) return null;
    return {
      templateKey: site.templateKey,
      content: (site.content as Record<string, unknown>) ?? {},
      theme: themeFrom(site.theme),
      currency: symbolOf(site.settings?.currency ?? defaultCurrencyOf(site.templateKey)),
      meta: {
        businessName: site.businessName,
        language: site.language === "en" ? "en" : "ar",
        seo: asSiteSeo(site.seo),
      },
    };
  },
);

// Parsed shape of the published snapshot payload (see publishing.repository).
interface TemplateSnapshot {
  businessName: string;
  language?: string;
  seo?: unknown;
  templateKey?: string | null;
  content?: Record<string, unknown>;
  theme?: TemplateTheme | null;
  currency?: string | null;
}

/** Frozen published data — reads the latest snapshot. Null if never published. */
export const getPublishedTemplateData = cache(
  async (siteId: string): Promise<SiteTemplateData | null> => {
    const snapshot = await getPrisma().publishSnapshot.findFirst({
      where: { siteId },
      orderBy: { version: "desc" },
      select: { payload: true },
    });
    if (!snapshot) return null;
    const p = snapshot.payload as unknown as TemplateSnapshot;
    return {
      templateKey: p.templateKey ?? null,
      content: p.content ?? {},
      theme: p.theme ?? { accent: null, ground: null, ink: null, fontKey: null },
      currency: symbolOf(p.currency ?? "SYP"),
      meta: {
        businessName: p.businessName,
        language: p.language === "en" ? "en" : "ar",
        seo: asSiteSeo(p.seo),
      },
    };
  },
);
