import { cache } from "react";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPrisma } from "@/lib/db";
import { getPublishedTemplateData } from "@/server/sites/template-data";
import { symbolOf } from "@/shared/currency";
import { listPublishedListings } from "@/server/listings/listings.service";
import { toMarketplaceListing } from "@/server/listings/listing-view";
import { currentUser } from "@/server/site-auth/site-auth.service";
import { SITE_SESSION_COOKIE } from "@/lib/site-host";
import { buildSiteMetadata } from "@/server/seo/metadata";
import { isServable } from "@/server/billing/billing.rules";
import { getTemplate } from "@/templates/registry";
import { authOnByDefault } from "@/templates/auth-defaults";
import { getPath } from "@/templates/content";
import { buildMarketplaceData } from "@/templates/marketplace/filters";
import { TemplateHost } from "@/components/public/template-host";
import { HoldingPage, type HoldingVariant } from "@/components/public/holding-page";
import { ContactWidget } from "@/components/public/contact-widget";
import { VisitBeacon } from "@/components/public/visit-beacon";

type Params = Promise<{ slug: string; path?: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

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
    // Live logo → the site's own favicon + OG image default (no re-publish needed).
    logoUrl: site.logoUrl,
  });
}

export default async function PublicSitePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug, path } = await params;
  const sp = await searchParams;
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

  const isMarketplace = published.templateKey === "marketplace";

  // The brand logo is a LIVE, permanent site asset (Site.logoUrl) — updated the
  // moment the owner uploads it, so read it directly rather than from the frozen
  // publish snapshot (which would need a re-publish to refresh). The snapshot's
  // content.shop.logo is only a fallback for legacy sites with no Site.logoUrl.
  const publishedShop = ((published.content as unknown as Record<string, unknown> | null)?.shop ?? {}) as Record<string, unknown>;
  const logoUrl = site.logoUrl || (typeof publishedShop.logo === "string" && publishedShop.logo) || null;

  // Marketplace listings are served LIVE (not part of the snapshot): load the
  // site's published inventory, then filter + sort it SERVER-SIDE from the URL
  // search params so the results (and the shareable URL) stay in lockstep.
  const marketplaceData = isMarketplace
    ? buildMarketplaceData(
        (await listPublishedListings(site.id)).map(toMarketplaceListing),
        path,
        sp,
      )
    : undefined;

  // End-user auth is a LIVE setting (owner toggles it) — read it directly, not
  // from the frozen snapshot, so turning it on/off takes effect immediately.
  const authSettings = await getPrisma().siteSettings.findUnique({
    where: { siteId: site.id },
    select: { authEnabled: true, roleLabels: true, currency: true },
  });
  const authEnabled = (authSettings?.authEnabled ?? false) || authOnByDefault(published.templateKey);

  // Currency is a LIVE setting for the marketplace: its listings are served live
  // (not from the published snapshot), so the price unit must follow the currency
  // the owner has currently selected — no re-publish needed to switch it.
  const currency = isMarketplace && authSettings?.currency
    ? symbolOf(authSettings.currency)
    : published.currency;

  // Resolve the current site-user server-side so an auth-first template renders its
  // gate/content on first paint (no /me flash). Host = the tenant subdomain.
  const host = (await headers()).get("host");
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  const initialUser = authEnabled ? (await currentUser(host, token)).user : null;

  // The floating contact button follows the site's brand: its accent (or the
  // template's default accent when the site hasn't overridden it).
  const brandAccent =
    published.theme.accent ||
    getTemplate(published.templateKey)?.tokens.find((t) => t.key === "accent")?.default ||
    null;

  return (
    <>
      <TemplateHost
        templateKey={published.templateKey}
        content={published.content}
        theme={published.theme}
        currency={currency}
        data={marketplaceData}
        slug={slug}
        siteId={site.id}
        route={path ?? []}
        logoUrl={logoUrl}
        authEnabled={authEnabled}
        roleLabels={(authSettings?.roleLabels as Record<string, string> | null) ?? undefined}
        initialUser={initialUser}
      />
      {/* Lead capture — visitors reach the owner without leaving the page. Only
          on served sites (this branch); never in the dashboard preview. Prefilled
          from the signed-in site-user when the site has accounts. */}
      <ContactWidget
        slug={slug}
        businessName={displayName(site)}
        defaultName={initialUser?.name}
        defaultContact={initialUser?.phone}
        accent={brandAccent}
      />
      {/* Count this pageview (deduped per browser session by the endpoint). */}
      <VisitBeacon slug={slug} />
    </>
  );
}
