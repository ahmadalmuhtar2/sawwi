// Client-safe public host config. The root domain is read from the environment
// (never hardcoded) so the same build shows localhost in dev and the real
// domain in production. NEXT_PUBLIC_* is inlined at build time, so this works in
// both server and client components. The server-side canonical origin (with
// protocol/port) is built in src/server/seo/metadata.ts#publicOrigin.

/** The public root host label, e.g. "localhost:3000" or "sawwi.online". */
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

/** A tenant's public host — `{slug}.{root domain}` — for display in the UI. */
export function siteHost(slug: string): string {
  return `${slug}.${ROOT_DOMAIN}`;
}

/** A tenant's full public URL, protocol-correct for dev (http/localhost) and
 *  production (https). Client-safe — reads NEXT_PUBLIC_ROOT_DOMAIN, inlined at
 *  build time. Use this for "visit website" links (never hardcode localhost). */
export function siteUrl(slug: string): string {
  const local = ROOT_DOMAIN.startsWith("localhost") || ROOT_DOMAIN.startsWith("127.0.0.1");
  return `${local ? "http" : "https"}://${slug}.${ROOT_DOMAIN}`;
}

/** The platform's OWN canonical origin — the apex marketing site, e.g.
 *  https://sawwi.online. This is what SEO (metadataBase, canonicals, sitemap,
 *  structured data) points at, so the brand pages consolidate onto one host. */
export const PLATFORM_URL = (() => {
  const local = ROOT_DOMAIN.startsWith("localhost") || ROOT_DOMAIN.startsWith("127.0.0.1");
  return `${local ? "http" : "https"}://${ROOT_DOMAIN}`;
})();
