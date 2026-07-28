import type { MetadataRoute } from "next";
import { PLATFORM_URL } from "@/lib/site-url";

// Served at /robots.txt. Let crawlers index the public marketing + template
// pages, and keep them out of the app, auth, API, and per-site previews.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/onboarding",
        "/api/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/verified",
        "/preview/",
      ],
    },
    sitemap: `${PLATFORM_URL}/sitemap.xml`,
    host: PLATFORM_URL,
  };
}
