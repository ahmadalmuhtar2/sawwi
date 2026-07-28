import type { Metadata } from "next";
import "./globals.css";
import { PLATFORM_URL } from "@/lib/site-url";

const TITLE = "سوّي — أنشئ موقع عملك بقوالب عربية جاهزة في دقائق";
const DESCRIPTION =
  "سوّي منصّة عربية لبناء المواقع: اختر قالبًا جاهزًا (مطعم، صالون حلاقة، متجر…)، عدّل النصوص والصور مباشرةً على الموقع، وانشره على نطاقك الفرعي في دقائق — بدون برمجة ولا تصميم من الصفر.";

// Rich, brand-first keyword set (Arabic + English) so search engines connect
// "سوّي / Sawwi / website builder / قوالب جاهزة" to this platform. Page-level
// metadata (templates, tenants) overrides title/description per route.
const KEYWORDS = [
  // brand
  "سوّي", "سوي", "Sawwi", "sawwi.online",
  // core intent — Arabic
  "منشئ مواقع", "منشئ المواقع", "بناء موقع", "إنشاء موقع", "تصميم موقع",
  "موقع إلكتروني", "عمل موقع", "موقع بدون برمجة", "موقع بدون كود",
  "قوالب جاهزة", "قوالب مواقع", "قالب موقع جاهز", "موقع جاهز", "أنشئ موقعك",
  "منصة عربية لبناء المواقع", "بناء موقع بالعربي", "موقع احترافي",
  "منشئ مواقع عربي", "موقع RTL",
  // verticals — Arabic
  "موقع شركة", "موقع مطعم", "موقع صالون حلاقة", "موقع متجر إلكتروني",
  "قائمة طعام رقمية", "منيو رقمي", "حجز مواعيد", "موقع نشاط تجاري",
  // market — Arabic
  "مواقع الأعمال المحلية", "السوق السوري", "موقع سوري", "نطاق فرعي مجاني",
  // English
  "website builder", "Arabic website builder", "RTL website builder",
  "ready-made templates", "no-code website builder", "business website builder",
  "restaurant website", "barbershop website", "online store", "create a website",
  "Syria website builder",
];

export const metadata: Metadata = {
  metadataBase: new URL(PLATFORM_URL),
  title: { default: TITLE, template: "%s · سوّي" },
  description: DESCRIPTION,
  applicationName: "سوّي",
  keywords: KEYWORDS,
  authors: [{ name: "سوّي", url: PLATFORM_URL }],
  creator: "سوّي",
  publisher: "سوّي",
  category: "technology",
  alternates: {
    canonical: "/",
    languages: { ar: "/", "x-default": "/" },
  },
  openGraph: {
    type: "website",
    siteName: "سوّي",
    locale: "ar_AR",
    url: "/",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      {/* suppressHydrationWarning: browser extensions (e.g. ColorZilla's
          `cz-shortcut-listen`) inject attributes on <body> before hydration.
          This suppresses the resulting attribute mismatch on this element only. */}
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
