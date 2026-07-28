import type { MetadataRoute } from "next";
import { PLATFORM_URL } from "@/lib/site-url";
import { listTemplates } from "@/templates/registry";

// Served at /sitemap.xml. The public, indexable surface: the marketing home,
// the "start free" entry, and one page per ready-made template (each is a real,
// full-bleed showcase — strong landing pages for "قالب مطعم", "قالب صالون…").
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const templatePages: MetadataRoute.Sitemap = listTemplates().map((t) => ({
    url: `${PLATFORM_URL}/templates/${t.key}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    { url: PLATFORM_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${PLATFORM_URL}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    ...templatePages,
  ];
}
