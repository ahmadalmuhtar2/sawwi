import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPrisma } from "@/lib/db";
import { getPublishedTemplateData } from "@/server/sites/template-data";
import { buildSiteMetadata } from "@/server/seo/metadata";
import { isServable } from "@/server/billing/billing.rules";
import { TemplateHost } from "@/components/public/template-host";

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
  const { slug } = await params;
  const site = await loadSite(slug);
  if (!site || !isSiteServed(site)) return { title: "سوّي" };

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
