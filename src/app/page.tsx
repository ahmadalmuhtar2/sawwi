import { cookies } from "next/headers";
import { LandingPage } from "@/components/landing/landing-page";
import { PLATFORM_URL } from "@/lib/site-url";

// Structured data (schema.org) so Google can show Sawwi as an organization /
// web app and understand the brand + what it does. One @graph, rendered once on
// the homepage.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${PLATFORM_URL}/#organization`,
      name: "سوّي",
      alternateName: "Sawwi",
      url: PLATFORM_URL,
      logo: `${PLATFORM_URL}/brand/icon-512.png`,
      description: "منصّة عربية لبناء مواقع الأعمال المحلية بقوالب جاهزة، بدون برمجة.",
    },
    {
      "@type": "WebSite",
      "@id": `${PLATFORM_URL}/#website`,
      url: PLATFORM_URL,
      name: "سوّي",
      alternateName: "Sawwi",
      inLanguage: "ar",
      publisher: { "@id": `${PLATFORM_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: "سوّي",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "ar",
      url: PLATFORM_URL,
      description:
        "أنشئ موقع عملك بقوالب عربية جاهزة (مطعم، صالون حلاقة، متجر…) وانشره على نطاقك الفرعي في دقائق — بدون تصميم أو برمجة.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

export default async function LandingRoute() {
  // Read the shared theme cookie so the landing SSRs with the right theme (no
  // flash). Dark is the platform default; only an explicit `light` cookie opts
  // out. The in-page toggle updates the cookie.
  const theme = (await cookies()).get("sawwi_theme")?.value === "light" ? "light" : "dark";
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <LandingPage initialTheme={theme} />
    </>
  );
}
