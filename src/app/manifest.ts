import type { MetadataRoute } from "next";

// PWA manifest for the Sawwi dashboard. Next serves this at /manifest.webmanifest
// and auto-injects <link rel="manifest"> on every route. display:standalone makes
// it installable; scope/start_url keep the installed app inside the dashboard.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سوّي — لوحة التحكم",
    short_name: "سوّي",
    description: "أنشئ وأدر مواقع عملك من سوّي.",
    start_url: "/dashboard",
    scope: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "ar",
    background_color: "#ffffff",
    theme_color: "#111318",
    // Installability requires a square 192px AND 512px icon; a maskable variant
    // (extra safe-zone padding) keeps Android's circle/squircle mask from clipping
    // the mark. The old 600x327 logo failed the square-size check, so Chrome never
    // fired beforeinstallprompt and the install button never appeared.
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
