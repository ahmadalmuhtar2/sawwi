import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPrisma } from "@/lib/db";
import { getPublishedRenderData } from "@/server/sites/site-data";
import { buildSiteMetadata } from "@/server/seo/metadata";
import { isServable } from "@/server/billing/billing.rules";
import { pathFromSegments, pickPage, buildNav } from "@/server/sites/render-helpers";
import { SiteRender } from "@/components/public/site-render";

type Params = Promise<{ slug: string; path?: string[] }>;

// Cached slug → {id,status,subscription} lookup (shared by metadata + the page).
const loadSite = cache(async (slug: string) =>
  getPrisma().site.findUnique({
    where: { slug },
    select: { id: true, status: true, subscription: { select: { expiry: true } } },
  }),
);

// Product decision: a published site stops being served once its paid-through
// date passes. Sites without a subscription row are unaffected (legacy/pre-billing).
function isSiteServed(site: { status: string; subscription: { expiry: Date } | null }): boolean {
  if (site.status !== "published") return false;
  if (site.subscription && !isServable(site.subscription.expiry, new Date())) return false;
  return true;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, path } = await params;
  const site = await loadSite(slug);
  if (!site || !isSiteServed(site)) return { title: "سوّي" };

  const published = await getPublishedRenderData(site.id);
  if (!published) return { title: "سوّي" };

  const page = pickPage(published.pages, pathFromSegments(path));
  if (!page) return { title: published.meta.businessName };

  return buildSiteMetadata({
    businessName: published.meta.businessName,
    language: published.meta.language,
    slug,
    pagePath: page.path,
    pageTitle: page.title,
    siteSeo: published.meta.seo,
    pageSeo: page.seo,
  });
}

export default async function PublicSitePage({ params }: { params: Params }) {
  const { slug, path } = await params;
  const site = await loadSite(slug);
  if (!site) notFound();

  // Only published, paid-through sites are served (drafts + expired stay private).
  if (!isSiteServed(site)) {
    const expired = site.status === "published";
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
        <h1 className="text-2xl font-extrabold text-ink">الموقع غير متاح حاليًا</h1>
        <p className="mt-2 text-muted">
          {expired ? "انتهت مدة اشتراك هذا الموقع." : "هذا الموقع غير منشور بعد."}
        </p>
      </main>
    );
  }

  // Serve the frozen published snapshot — NOT the live draft.
  const published = await getPublishedRenderData(site.id);
  if (!published) notFound();

  const page = pickPage(published.pages, pathFromSegments(path));
  if (!page) notFound();

  return (
    <SiteRender
      siteData={published.siteData}
      nav={buildNav(published.pages)}
      page={page}
      basePath=""
      theme={published.theme}
    />
  );
}
