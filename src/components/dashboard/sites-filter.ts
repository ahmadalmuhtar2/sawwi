// Shared site-filter definitions — the single source used by BOTH the server
// page (which filters server-side from the URL) and the client table (which
// renders the chips + writes the URL). Kept framework-free (no "use client", no
// hooks) so the server component can import and run the predicates.

export interface SiteRow {
  id: string;
  businessName: string;
  slug: string;
  host: string;
  status: "draft" | "published" | "suspended";
  templateKey: string | null;
  templateLabel: string;
  logoUrl: string | null;
  /** Unread visitor messages — not a column; passed through to the row menu. */
  unread: number;
  /** NEW leads — not a column; passed through to the row menu badge. */
  newSubmissions: number;
  /** Counted visits (per browser session) — the الزيارات column. */
  visits: number;
  canDelete: boolean;
  expiry: { status: "active" | "expiring" | "expired"; dateLabel: string; daysLeft: number } | null;
}

export type SiteFilterKey = "all" | "published" | "draft" | "suspended" | "expiring";

export const SITE_FILTERS: SiteFilterKey[] = ["all", "published", "draft", "suspended", "expiring"];

export const SITE_FILTER_MATCH: Record<SiteFilterKey, (r: SiteRow) => boolean> = {
  all: () => true,
  published: (r) => r.status === "published",
  draft: (r) => r.status === "draft",
  suspended: (r) => r.status === "suspended",
  expiring: (r) => !!r.expiry && r.expiry.status !== "active",
};

export const SITE_FILTER_LABEL: Record<SiteFilterKey, string> = {
  all: "الكل",
  published: "منشور",
  draft: "مسودة",
  suspended: "موقوف",
  expiring: "ينتهي قريبًا",
};

/** Validate a raw `?filter=` value; anything unknown falls back to "all". */
export function parseSiteFilter(raw: string | undefined | null): SiteFilterKey {
  return SITE_FILTERS.includes(raw as SiteFilterKey) ? (raw as SiteFilterKey) : "all";
}
