// SEO data shapes, shared by the editors (input validation) and the public
// renderer (metadata resolution). Two levels:
//   - SiteSeo:  site-wide defaults (stored on Site.seo)
//   - PageSeo:  per-page overrides (stored on Page.seo)
// A page's effective metadata is PageSeo merged over SiteSeo (see metadata.ts).

import { z } from "zod";

/** Site-wide SEO defaults. */
export const siteSeoSchema = z.object({
  /** Base/site title (falls back to the business name when empty). */
  title: z.string().trim().max(70, "العنوان طويل — الأفضل ٦٠ حرفًا").optional(),
  /** Default meta description. */
  description: z.string().trim().max(200, "الوصف طويل — الأفضل ١٦٠ حرفًا").optional(),
  /** Search keywords. */
  keywords: z.array(z.string().trim()).max(20).optional(),
  /** Default social share image URL. */
  ogImageUrl: z.string().trim().url("رابط غير صالح").max(500).optional().or(z.literal("")),
  /** Favicon / site icon URL. */
  faviconUrl: z.string().trim().url("رابط غير صالح").max(500).optional().or(z.literal("")),
});
export type SiteSeo = z.infer<typeof siteSeoSchema>;

/** Per-page SEO overrides. */
export const pageSeoSchema = z.object({
  /** Page title (falls back to the page's name, then the site title). */
  title: z.string().trim().max(70, "العنوان طويل — الأفضل ٦٠ حرفًا").optional(),
  description: z.string().trim().max(200, "الوصف طويل — الأفضل ١٦٠ حرفًا").optional(),
  /** Overrides the site's share image for this page. */
  ogImageUrl: z.string().trim().url("رابط غير صالح").max(500).optional().or(z.literal("")),
  /** Exclude this page from search engines. */
  noindex: z.boolean().optional(),
});
export type PageSeo = z.infer<typeof pageSeoSchema>;

/** Safely coerce an unknown JSON blob (from the DB) into a SiteSeo. */
export function asSiteSeo(value: unknown): SiteSeo {
  const parsed = siteSeoSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : {};
}

/** Safely coerce an unknown JSON blob (from the DB) into a PageSeo. */
export function asPageSeo(value: unknown): PageSeo {
  const parsed = pageSeoSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : {};
}
