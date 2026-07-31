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
  /** The site's uploaded logo (absolute R2 URL). Used as the DEFAULT favicon +
   *  OG image when the owner hasn't set explicit SEO images, so every site has
   *  its own branding in tabs and link previews. */
  logoUrl?: string | null;
}

/** The public origin for a site's slug, e.g. https://diwan.sawwi.online. */
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

  // Favicon + OG image ALWAYS resolve to an absolute URL, so tenant subdomains
  // never depend on the platform's root icon/OG files (which don't apply to the
  // /s/[slug] route). Precedence: owner-set SEO image → the site's own logo →
  // the platform's static brand asset. Absolute URLs are required by crawlers.
  const platformBase = getEnv().NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  const logo = i.logoUrl?.trim() || undefined;
  const ogImage =
    firstNonEmpty(i.pageSeo.ogImageUrl, i.siteSeo.ogImageUrl, logo) ??
    `${platformBase}/brand/og-image.png`;
  const favicon =
    firstNonEmpty(i.siteSeo.faviconUrl, logo) ?? `${platformBase}/brand/logo.png`;

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
    icons: { icon: favicon, shortcut: favicon, apple: favicon },
    openGraph: {
      title,
      description,
      url,
      siteName: baseTitle,
      type: "website",
      locale: i.language === "ar" ? "ar_AR" : "en_US",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
