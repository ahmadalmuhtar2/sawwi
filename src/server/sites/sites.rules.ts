// Pure domain rules for sites. Zero deps (except the shared error vocabulary).
// A slug becomes {slug}.sawwi.online, so it must be a safe DNS label and must not
// collide with a platform subdomain. Schema constraint: unique, [a-z0-9-]{3,40}.

import { errors } from "@/shared/errors";

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;

/** Subdomains the platform itself uses — never allowed as a site slug. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "app", "www", "api", "admin", "dashboard", "media", "cdn", "static",
  "assets", "mail", "smtp", "ftp", "ns1", "ns2", "billing", "auth", "login",
  "status", "docs", "blog", "help", "support", "sawwi",
]);

// Valid: starts/ends alphanumeric, only [a-z0-9-] between, no doubled hyphen.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9]|-(?!-))*[a-z0-9]$/;

export type SlugError =
  | "empty"
  | "too_short"
  | "too_long"
  | "invalid_chars"
  | "reserved";

/** Best-effort normalization; result may still be invalid, so re-validate it. */
export function normalizeSlug(input: string): string {
  return input
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateSlug(
  slug: string,
): { ok: true } | { ok: false; error: SlugError } {
  if (slug.length === 0) return { ok: false, error: "empty" };
  if (slug.length < SLUG_MIN) return { ok: false, error: "too_short" };
  if (slug.length > SLUG_MAX) return { ok: false, error: "too_long" };
  if (!SLUG_RE.test(slug)) return { ok: false, error: "invalid_chars" };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, error: "reserved" };
  return { ok: true };
}

export function isValidSlug(slug: string): boolean {
  return validateSlug(slug).ok;
}

const SLUG_MESSAGES_AR: Record<SlugError, string> = {
  empty: "الرابط مطلوب",
  too_short: "الرابط قصير جدًا (٣ أحرف على الأقل)",
  too_long: "الرابط طويل جدًا (٤٠ حرفًا كحد أقصى)",
  invalid_chars: "الرابط يقبل أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط",
  reserved: "هذا الرابط محجوز",
};

/** Throw a field-scoped validation error if the slug is invalid (defense in depth). */
export function assertSlugValid(slug: string): void {
  const result = validateSlug(slug);
  if (!result.ok) {
    throw errors.validation("رابط غير صالح", {
      slug: SLUG_MESSAGES_AR[result.error],
    });
  }
}
