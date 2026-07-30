// Resolve a tenant's slug from the request Host header. Published sites are
// served on `{slug}.{ROOT_DOMAIN}` and rewritten to /s/{slug} by src/proxy.ts —
// but /api/* is EXCLUDED from that rewrite, so public site-scoped API handlers
// (e.g. site-auth) must derive the slug from the Host themselves. This mirrors
// proxy.ts's subdomain() exactly so the two never disagree.

const RESERVED_SUBS = new Set(["app", "www", "api", "media", "admin"]);

const ROOT_HOST = (
  process.env.ROOT_DOMAIN ??
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ??
  "localhost"
)
  .split(":")[0]
  .toLowerCase();

/**
 * The tenant slug for a Host header, or null when the host is the apex, a
 * reserved subdomain (app/www/api/…), or anything not under the root domain.
 * Never trusts client-supplied data — the Host is set by the browser/proxy.
 */
export function siteSlugFromHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const h = host.split(":")[0].toLowerCase();
  if (h === ROOT_HOST) return null;
  if (!h.endsWith(`.${ROOT_HOST}`)) return null;
  const sub = h.slice(0, h.length - ROOT_HOST.length - 1).split(".")[0] || null;
  if (!sub || RESERVED_SUBS.has(sub)) return null;
  return sub;
}

/** Whether cookies should carry the Secure attribute (prod HTTPS, not localhost). */
export function useSecureCookies(): boolean {
  return !ROOT_HOST.startsWith("localhost") && !ROOT_HOST.startsWith("127.0.0.1");
}

/** The site-user session cookie. Host-only (no Domain) → isolated per tenant. */
export const SITE_SESSION_COOKIE = "sawwi_site_session";
