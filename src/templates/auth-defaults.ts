// Which templates REQUIRE end-user auth by default. Some templates are auth-first
// (a marketplace has no meaning without buyer/seller accounts); others never need
// it. For those listed here, end-user auth is ON regardless of the owner's settings
// toggle — the toggle is hidden/locked in the dashboard for them.
//
// Pure data (no React/Prisma) so both the server gate (site-auth.service) and the
// dashboard can import it freely.

const AUTH_BY_DEFAULT = new Set<string>(["marketplace"]);

/** True when this template turns end-user auth on by default (not owner-toggled). */
export function authOnByDefault(templateKey: string | null | undefined): boolean {
  return !!templateKey && AUTH_BY_DEFAULT.has(templateKey);
}
