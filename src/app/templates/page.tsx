import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { ThemeInit } from "@/components/dashboard/theme-toggle";
import { PublicTemplatesBrowser } from "@/components/templates/public-templates-browser";

export const metadata: Metadata = {
  title: "كل القوالب — قوالب مواقع جاهزة من سوّي",
  description:
    "تصفّح قوالب سوّي الجاهزة: مطعم، صالون حلاقة، متجر إلكتروني، معرض أعمال والمزيد. عاين كل قالب كموقع حقيقي على صفحة كاملة، ثم استخدمه لبناء موقعك في دقائق.",
  alternates: { canonical: "/templates" },
  openGraph: {
    type: "website",
    url: "/templates",
    title: "كل القوالب — قوالب مواقع جاهزة من سوّي",
    description: "تصفّح قوالب سوّي الجاهزة وعاين كل واحد كموقع حقيقي قبل الاختيار.",
  },
};

// Public gallery — no auth. Reads the theme cookie to apply the saved light/dark
// choice during SSR (shared with the app & landing page), then hands off to the
// backend-driven browser. The #sw-app wrapper carries data-theme so the product
// tokens (bg/ink/surface…) and the portaled dropdowns resolve the right theme.
export default async function TemplatesPage() {
  // Dark is the platform default; only an explicit `light` cookie opts out.
  const saved = (await cookies()).get("sawwi_theme")?.value;
  const theme = saved === "light" ? "light" : "dark";

  return (
    <div id="sw-app" data-theme={theme} style={{ display: "contents" }} suppressHydrationWarning>
      <ThemeInit />
      {/* TemplatesGallery reads search params for its shareable q/tags state. */}
      <Suspense>
        <PublicTemplatesBrowser />
      </Suspense>
    </div>
  );
}
