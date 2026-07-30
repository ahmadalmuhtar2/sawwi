// Marketplace template module (cars & homes). Unlike the other templates, its
// browsable CONTENT is the owner's live `Listing` rows (managed in the dashboard,
// served live) — not Site.content. Site.content here holds only the small "house"
// bits: business name, tagline, and the contact shown to visitors. The public
// component receives `listings` + `slug` as extra props from the host.

import type { TemplateModule } from "../types";
import Component from "./component";

const defaults = {
  shop: {
    name: "سوق الشام",
    tagline: "سيارات وعقارات مفحوصة، فلاتر دقيقة، وتواصل مباشر مع البائع.",
    sellerName: "الإدارة",
    sellerKind: "معرض / مكتب عقاري",
    phone: "+963 11 000 0000",
    whatsapp: "+963991112233",
  },
};

export const marketplace: TemplateModule = {
  key: "marketplace",
  label: "سوق السيارات والعقارات",
  vertical: "marketplace",
  description: "قالب سوق للسيارات والعقارات: بحث وفلاتر وصفحات تفصيل، وإدارة إعلانات من لوحة التحكم.",
  tags: ["سيارات", "عقارات", "سوق", "إعلانات", "معرض", "عربي"],
  cover: "/template-covers/marketplace.webp",

  Component: Component as unknown as TemplateModule["Component"],
  defaults,
  nameKey: "shop.name",

  steps: [
    {
      key: "shop",
      title: "معلومات الجهة",
      hint: "الاسم وطرق التواصل التي تظهر للزوّار. الإعلانات تُدار من تبويب «الإعلانات».",
      fields: [
        { key: "shop.tagline", label: "الشعار", type: "text", placeholder: "سيارات وعقارات مفحوصة…" },
        { key: "shop.sellerName", label: "اسم جهة الاتصال", type: "text", placeholder: "المعرض / المكتب" },
        { key: "shop.sellerKind", label: "الصفة", type: "text", placeholder: "معرض سيارات / مكتب عقاري" },
        { key: "shop.phone", label: "رقم الهاتف", type: "phone", help: "يظهر بعد ضغط الزائر على «إظهار الرقم»." },
        { key: "shop.whatsapp", label: "واتساب", type: "phone", help: "زر «تواصل معنا» في الأعلى." },
      ],
    },
  ],

  tokens: [
    { key: "accent", label: "لون التمييز", cssVar: "--color-mk-accent", default: "oklch(0.5 0.086 155)" },
    { key: "ground", label: "الخلفية", cssVar: "--color-mk-bg", default: "oklch(0.968 0.004 95)" },
    { key: "ink", label: "لون النص", cssVar: "--color-mk-ink", default: "oklch(0.26 0.012 70)" },
  ],

  // A warm-paper editorial design — light-only. Palettes vary the ACCENT (the
  // spec's curated swatches) while keeping the paper ground + ink constant.
  palettes: [
    { key: "olive", label: "زيتوني", tone: "light", isDefault: true, mood: "هادئ", colors: { accent: "oklch(0.5 0.086 155)", ground: "oklch(0.968 0.004 95)", ink: "oklch(0.26 0.012 70)" } },
    { key: "azure", label: "أزرق", tone: "light", mood: "موثوق", colors: { accent: "oklch(0.5 0.11 240)", ground: "oklch(0.968 0.004 95)", ink: "oklch(0.26 0.012 70)" } },
    { key: "terracotta", label: "طيني", tone: "light", mood: "دافئ", colors: { accent: "oklch(0.55 0.12 45)", ground: "oklch(0.968 0.006 80)", ink: "oklch(0.26 0.012 60)" } },
    { key: "plum", label: "أرجواني", tone: "light", mood: "أنيق", colors: { accent: "oklch(0.5 0.13 300)", ground: "oklch(0.968 0.004 95)", ink: "oklch(0.26 0.012 70)" } },
    { key: "ink-slate", label: "رمادي داكن", tone: "light", mood: "رسمي", colors: { accent: "oklch(0.42 0.03 250)", ground: "oklch(0.966 0.003 90)", ink: "oklch(0.24 0.01 60)" } },
  ],

  defaultCurrency: "USD", // cars/property are commonly quoted in USD
  themeFont: false,
};
