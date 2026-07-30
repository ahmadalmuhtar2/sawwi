// Pure helpers for site-auth: IP fingerprinting, rate-limit constants, and role
// label resolution. No DB, no clock passed in where avoidable.

import { createHash } from "node:crypto";
import type { SiteUserRole } from "@/generated/prisma/enums";

export const AUTH_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
export const MAX_ATTEMPTS_PER_IP = 20; // register + login combined, per window
export const MAX_SIGNUPS_PER_SITE_WINDOW = 30; // signup flood guard, per site

/** Coarse, non-reversible IP fingerprint — an abuse signal, never stored PII. */
export function hashIp(ip: string | null | undefined): string | null {
  const t = ip?.trim();
  if (!t) return null;
  return createHash("sha256").update(t).digest("hex").slice(0, 16);
}

/** First client IP from an x-forwarded-for chain (Caddy sets it in prod). */
export function clientIpFromHeaders(headers: Headers): string | null {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || null;
  return headers.get("x-real-ip");
}

/** Default Arabic labels for the 3 roles (owner can override per site). */
export const DEFAULT_ROLE_LABELS: Record<SiteUserRole, string> = {
  manager: "مدير",
  contributor: "مساهم",
  member: "عضو",
};

/** Merge a site's custom role labels over the defaults, always returning all 3. */
export function roleLabelsOf(raw: unknown): Record<SiteUserRole, string> {
  const l = raw && typeof raw === "object" ? (raw as Record<string, string>) : {};
  return {
    manager: l.manager?.trim() || DEFAULT_ROLE_LABELS.manager,
    contributor: l.contributor?.trim() || DEFAULT_ROLE_LABELS.contributor,
    member: l.member?.trim() || DEFAULT_ROLE_LABELS.member,
  };
}
