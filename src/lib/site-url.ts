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
