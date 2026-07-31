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
    carsKicker: "سيارات مستعملة وجديدة",
    homesKicker: "شقق ومنازل للبيع والإيجار",
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
      // The heading + section kickers are edited INLINE on the page (click the
      // text in the builder preview), so they are intentionally NOT in this wizard.
      fields: [
        { key: "shop.sellerName", label: "اسم جهة الاتصال", type: "text", placeholder: "المعرض / المكتب", help: "الاسم الافتراضي على بطاقة البائع في صفحة الإعلان، يُستخدم للإعلانات التي لا تحدّد اسمًا خاصًا بها." },
        { key: "shop.sellerKind", label: "الصفة", type: "text", placeholder: "معرض سيارات / مكتب عقاري", help: "صفة تظهر أسفل اسم البائع على بطاقة الإعلان (مثل: معرض، مكتب عقاري، مالك)." },
        { key: "shop.phone", label: "رقم الهاتف", type: "phone", help: "رقم افتراضي يظهر في الإعلانات التي لا رقم لها، بعد ضغط الزائر «إظهار الرقم»." },
        { key: "shop.whatsapp", label: "واتساب", type: "phone", help: "يشغّل زر «تواصل معنا» في أعلى الموقع وقائمة الجوّال." },
      ],
    },
  ],

  tokens: [
    { key: "accent", label: "لون التمييز", cssVar: "--color-mk-accent", default: "oklch(0.34 0.055 262)" },
    { key: "ground", label: "الخلفية", cssVar: "--color-mk-bg", default: "oklch(0.966 0.009 88)" },
    { key: "ink", label: "لون النص", cssVar: "--color-mk-ink", default: "oklch(0.25 0.03 262)" },
  ],

  // YALLAKEYS identity by default — deep navy on a warm-cream canvas, paired with a
  // constant brand gold for premium/featured accents. Alternate swatches vary only
  // the accent while keeping the cream ground + navy ink.
  palettes: [
    { key: "navy", label: "كحلي وذهبي", tone: "light", isDefault: true, mood: "احترافي", colors: { accent: "oklch(0.34 0.055 262)", ground: "oklch(0.966 0.009 88)", ink: "oklch(0.25 0.03 262)" } },
    { key: "emerald", label: "أخضر", tone: "light", mood: "موثوق", colors: { accent: "oklch(0.47 0.105 158)", ground: "oklch(0.966 0.009 88)", ink: "oklch(0.25 0.03 262)" } },
    { key: "azure", label: "أزرق", tone: "light", mood: "حيوي", colors: { accent: "oklch(0.52 0.13 248)", ground: "oklch(0.966 0.009 88)", ink: "oklch(0.25 0.03 262)" } },
    { key: "terracotta", label: "طيني", tone: "light", mood: "دافئ", colors: { accent: "oklch(0.56 0.13 42)", ground: "oklch(0.966 0.009 88)", ink: "oklch(0.25 0.03 262)" } },
    { key: "plum", label: "أرجواني", tone: "light", mood: "أنيق", colors: { accent: "oklch(0.5 0.14 300)", ground: "oklch(0.966 0.009 88)", ink: "oklch(0.25 0.03 262)" } },
  ],

  defaultCurrency: "USD", // cars/property are commonly quoted in USD
  themeFont: false,
  ownsAuthUI: true, // mandatory in-page auth gate (buyer/seller) — no floating widget
};
