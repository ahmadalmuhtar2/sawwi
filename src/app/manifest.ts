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
    icons: [
      { src: "/brand/logo.png", sizes: "600x327", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "600x327", type: "image/png", purpose: "any" },
    ],
  };
}
