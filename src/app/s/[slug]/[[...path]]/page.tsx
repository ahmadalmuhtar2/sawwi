import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPrisma } from "@/lib/db";
import { getPublishedTemplateData } from "@/server/sites/template-data";
import { buildSiteMetadata } from "@/server/seo/metadata";
import { isServable } from "@/server/billing/billing.rules";
import { getTemplate } from "@/templates/registry";
import { getPath } from "@/templates/content";
import { TemplateHost } from "@/components/public/template-host";
import { HoldingPage, type HoldingVariant } from "@/components/public/holding-page";

type Params = Promise<{ slug: string; path?: string[] }>;

type LoadedSite = {
  id: string;
  status: string;
  businessName: string;
  templateKey: string | null;
  content: unknown;
  logoUrl: string | null;
  maintenanceMode: boolean;
  subscription: { expiry: Date } | null;
};

// Cached slug lookup (shared by metadata + the page).
const loadSite = cache(async (slug: string): Promise<LoadedSite | null> =>
  getPrisma().site.findUnique({
    where: { slug },
    select: {
      id: true,
      status: true,
      businessName: true,
      templateKey: true,
      content: true,
      logoUrl: true,
      maintenanceMode: true,
      subscription: { select: { expiry: true } },
    },
  }),
);

// The DISPLAY business name = the brand the owner configured in the template
// content (via the template's nameKey, e.g. "shop.name"), NOT the internal
// Site.businessName entered at creation. Falls back to it when unset.
function displayName(site: LoadedSite): string | null {
  const tpl = site.templateKey ? getTemplate(site.templateKey) : null;
  if (tpl?.nameKey) {
    const fromContent = getPath(site.content, tpl.nameKey);
    if (typeof fromContent === "string" && fromContent.trim()) return fromContent.trim();
    const fromDefaults = getPath(tpl.defaults, tpl.nameKey);
    if (typeof fromDefaults === "string" && fromDefaults.trim()) return fromDefaults.trim();
  }
  return site.businessName || null;
}

// A site serves its real content only when published, not paused, and paid-through.
function isSiteServed(site: LoadedSite): boolean {
  if (site.status !== "published") return false;
  if (site.maintenanceMode) return false;
  if (site.subscription && !isServable(site.subscription.expiry, new Date())) return false;
  return true;
}

// Which branded holding page to show when a site isn't serving its content.
function holdingVariant(site: LoadedSite): HoldingVariant {
  if (site.maintenanceMode) return "maintenance";
  if (site.status !== "published") return "coming-soon"; // draft — served from minute 0
  return "expired"; // published but lapsed
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const site = await loadSite(slug);
  // Not serving? Show the business name (or سوّي) — nicer than a bare fallback,
  // and avoids exposing draft SEO before publish.
  if (!site) return { title: "سوّي" };
  if (!isSiteServed(site)) return { title: displayName(site) || "سوّي" };

  const published = await getPublishedTemplateData(site.id);
  if (!published) return { title: "سوّي" };

  // Templates are self-contained (their own internal nav), so metadata is
  // site-level — no per-page path resolution.
  return buildSiteMetadata({
    businessName: published.meta.businessName,
    language: published.meta.language,
    slug,
    pagePath: "/",
    siteSeo: published.meta.seo,
    pageSeo: {},
  });
}

export default async function PublicSitePage({ params }: { params: Params }) {
  const { slug } = await params;
  const site = await loadSite(slug);
  if (!site) notFound();

  // Not serving its content (draft / paused / expired) → branded holding page.
  if (!isSiteServed(site)) {
    return (
      <HoldingPage
        variant={holdingVariant(site)}
        businessName={displayName(site)}
        logoUrl={site.logoUrl}
      />
    );
  }

  // Serve the frozen published snapshot — NOT the live draft.
  const published = await getPublishedTemplateData(site.id);
  if (!published) notFound();

  return (
    <TemplateHost
      templateKey={published.templateKey}
      content={published.content}
      theme={published.theme}
      currency={published.currency}
    />
  );
}
