// Resolve a page's effective metadata: PageSeo merged over SiteSeo, mapped to
// Next's Metadata. Used by the public site's generateMetadata.

import type { Metadata } from "next";
import type { SiteSeo, PageSeo } from "@/shared/seo";
import { getEnv } from "@/lib/env";

export interface MetadataInput {
  businessName: string;
  language: "ar" | "en";
  slug: string;
  /** The page's public path, e.g. "/" or "/about". */
  pagePath: string;
  /** The page's own name (fallback title). */
  pageTitle?: string;
  siteSeo: SiteSeo;
  pageSeo: PageSeo;
}

/** The public origin for a site's slug, e.g. https://diwan.sawwi.com. */
export function publicOrigin(slug: string): string {
  const env = getEnv();
  let protocol = "https:";
  let port = "";
  try {
    const app = new URL(env.NEXT_PUBLIC_APP_URL);
    protocol = app.protocol;
    port = app.port ? `:${app.port}` : "";
  } catch {
    /* fall back to defaults */
  }
  return `${protocol}//${slug}.${env.ROOT_DOMAIN}${port}`;
}

function firstNonEmpty(...vals: (string | undefined)[]): string | undefined {
  for (const v of vals) {
    const t = v?.trim();
    if (t) return t;
  }
  return undefined;
}

export function buildSiteMetadata(i: MetadataInput): Metadata {
  const baseTitle = firstNonEmpty(i.siteSeo.title, i.businessName) ?? "سوّي";
  const pageTitle = firstNonEmpty(i.pageSeo.title, i.pageTitle);
  const isLanding = !i.pagePath || i.pagePath === "/";

  const title =
    !pageTitle || pageTitle === baseTitle || isLanding
      ? baseTitle
      : `${pageTitle} — ${baseTitle}`;

  const description = firstNonEmpty(i.pageSeo.description, i.siteSeo.description);
  const ogImage = firstNonEmpty(i.pageSeo.ogImageUrl, i.siteSeo.ogImageUrl);
  const favicon = firstNonEmpty(i.siteSeo.faviconUrl);

  const origin = publicOrigin(i.slug);
  const url = isLanding ? origin : `${origin}${i.pagePath}`;
  let metadataBase: URL | undefined;
  try {
    metadataBase = new URL(origin);
  } catch {
    metadataBase = undefined;
  }

  return {
    title,
    description,
    keywords: i.siteSeo.keywords?.length ? i.siteSeo.keywords : undefined,
    metadataBase,
    alternates: { canonical: url },
    robots: i.pageSeo.noindex ? { index: false, follow: false } : undefined,
    icons: favicon ? { icon: favicon } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: baseTitle,
      type: "website",
      locale: i.language === "ar" ? "ar_AR" : "en_US",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
