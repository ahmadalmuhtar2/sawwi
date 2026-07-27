// Foul & Fatteh (Ajami) — template module. Wires the ready-made component to its
// editable-data defaults, the onboarding/editor field schema, and the small
// themeable color set (gold / green / cream). The Ajami lattice is a fixed,
// self-contained pattern inside the component.

import type { TemplateModule } from "../types";
import Component from "./component";

/** A believable default foul-and-fatteh house, so the design reads as complete
 *  before any edit (and the wizard/editor show real values, not blanks). */
const defaults = {
  shop: {
    name: "فول أبو شادي",
    logo: "",
    tagline: "فول · فتّة · حمّص",
    heroLine: "فول وفتّة",
    heroPhoto: "",
    phone: "+963 11 456 7788",
    whatsapp: "+963944567788",
    address: "دمشق — الميدان، شارع الجزماتية، مقابل الجامع",
    hoursNote: "٦:٠٠ ص – ١:٠٠ م",
    socials: { instagram: "", facebook: "", tiktok: "" },
  },
  groups: [
    { id: "foul", label: "الفول" },
    { id: "fatteh", label: "الفتّة" },
    { id: "side", label: "مقبّلات وإضافات" },
    { id: "drink", label: "مشروبات" },
  ],
  items: [
    { group: "foul", name: "فول مدمّس", latin: "Foul medames", desc: "فول، زيت زيتون، كمّون، ليمون.", price: "٢٥٬٠٠٠", mark: "نباتي", photo: "" },
    { group: "foul", name: "فول بالطحينة", latin: "Foul with tahini", desc: "فول، طحينة، ليمون، ثوم.", price: "٣٠٬٠٠٠", mark: "نباتي", photo: "" },
    { group: "foul", name: "فول بالسمنة", latin: "Foul with butter", desc: "فول، سمنة، صنوبر.", price: "٣٥٬٠٠٠", mark: "", photo: "" },
    { group: "foul", name: "مسبّحة", latin: "Msabbaha", desc: "حمّص حبّ، طحينة، زيت زيتون، بقدونس.", price: "٣٠٬٠٠٠", mark: "نباتي", photo: "" },
    { group: "fatteh", name: "فتّة حمّص", latin: "Chickpea fatteh", desc: "خبز محمّص، لبن، حمّص، صنوبر بالسمنة.", price: "٤٠٬٠٠٠", mark: "", photo: "" },
    { group: "fatteh", name: "فتّة فول", latin: "Foul fatteh", desc: "خبز محمّص، فول، لبن بالثوم.", price: "٤٠٬٠٠٠", mark: "", photo: "" },
    { group: "fatteh", name: "فتّة مكدوس", latin: "Makdous fatteh", desc: "خبز محمّص، مكدوس، فول، لبن.", price: "٤٥٬٠٠٠", mark: "حار قليلًا", photo: "" },
    { group: "fatteh", name: "فتّة لحمة", latin: "Lamb fatteh", desc: "خبز محمّص، لبن، حمّص، لحم غنم، صنوبر.", price: "٧٥٬٠٠٠", mark: "", photo: "" },
    { group: "side", name: "حمّص بطحينة", latin: "Hummus", desc: "حمّص، طحينة، ليمون، زيت زيتون.", price: "٢٥٬٠٠٠", mark: "نباتي", photo: "" },
    { group: "side", name: "بليلة", latin: "Balila", desc: "حمّص ساخن، كمّون، ليمون.", price: "٢٠٬٠٠٠", mark: "نباتي", photo: "" },
    { group: "side", name: "شكشوكة بيض", latin: "Egg shakshouka", desc: "بيض، بندورة، فليفلة.", price: "٣٥٬٠٠٠", mark: "", photo: "" },
    { group: "side", name: "مخلّل وزيتون وبصل أخضر", latin: "Pickles, olives, spring onion", desc: "طبق جانبي.", price: "٨٬٠٠٠", mark: "نباتي", photo: "" },
    { group: "side", name: "خبز · رغيفان", latin: "Bread, two", desc: "خبز تنّور ساخن.", price: "٥٬٠٠٠", mark: "", photo: "" },
    { group: "drink", name: "شاي", latin: "Tea", desc: "بالنعنع أو سادة.", price: "٦٬٠٠٠", mark: "", photo: "" },
    { group: "drink", name: "متّة", latin: "Maté", desc: "طقم كامل.", price: "١٢٬٠٠٠", mark: "", photo: "" },
    { group: "drink", name: "عيران", latin: "Ayran", desc: "لبن، ملح، نعنع.", price: "١٠٬٠٠٠", mark: "", photo: "" },
  ],
  // One row per weekday (Syrian week order). Same-hours days are collapsed into
  // ranges on the site; edited via dropdowns in the settings panel. An early
  // morning opener — foul is a breakfast house.
  hours: [
    { day: "السبت", open: "٦:٠٠ ص", close: "١:٠٠ م" },
    { day: "الأحد", open: "٦:٠٠ ص", close: "١:٠٠ م" },
    { day: "الاثنين", open: "٦:٠٠ ص", close: "١:٠٠ م" },
    { day: "الثلاثاء", open: "٦:٠٠ ص", close: "١:٠٠ م" },
    { day: "الأربعاء", open: "٦:٠٠ ص", close: "١:٠٠ م" },
    { day: "الخميس", open: "٦:٠٠ ص", close: "١:٠٠ م" },
    { day: "الجمعة", open: "٦:٠٠ ص", close: "٢:٠٠ م" },
  ],
  visit: {
    dineNote: "تناول في المحلّ · طلبات خارجية",
  },
};

export const foulFatteh: TemplateModule = {
  key: "foul-fatteh",
  label: "فول وفتّة",
  vertical: "restaurant",
  description:
    "قالب مطعم شعبي: قائمة فول وفتّة وحمّص بأقسام، وصفحة زيارة بالأوقات والموقع. عربي بالكامل، بنقش عجمي.",
  tags: ["فول", "فتّة", "فطور شامي", "حمّص", "مطعم شعبي", "قائمة طعام", "عربي", "دمشق"],
  // Catalog cover — a static asset (see public/template-covers). Until the file
  // is dropped in, the gallery shows its generated poster fallback.
  cover: "/template-covers/foul-fatteh.webp",
  // The template has its own strict prop shape; the host spreads merged content
  // onto it, so we widen through `unknown` at this single boundary.
  Component: Component as unknown as TemplateModule["Component"],
  defaults,
  nameKey: "shop.name",
  // Two-tone design: the dominant surface is the cream MENU (the `ink` token),
  // not the green chrome (`ground`). This makes the palette-card preview show the
  // menu as the fill — matching how the site actually reads.
  surfaceToken: "ink",
  // The template ships its own font — no font override in the appearance tab.
  themeFont: false,
  tokens: [
    { key: "accent", label: "لون التمييز", cssVar: "--color-aj-gold", default: "oklch(0.68 0.11 82)" },
    { key: "ground", label: "لون الترويسة", cssVar: "--color-aj-green", default: "oklch(0.24 0.04 165)" },
    { key: "ink", label: "خلفية القائمة", cssVar: "--color-aj-cream", default: "oklch(0.965 0.014 88)" },
  ],
  // Ready-made colorways — the owner picks one instead of raw colors. "عجمي"
  // equals the token defaults (gold/green/cream) so an untouched site reads as
  // that palette. The triples map accent→gold, ground→green, ink→cream.
  //
  // NOTE the tone grouping is INVERTED vs. a normal template: here the dominant
  // surface (the menu) is the `ink` token, so a LIGHT ink = a light-reading site.
  // Hence the light-menu palettes are grouped as "light" (cream menu, dark green
  // chrome — the classic ajami look) and the dark-menu palettes as "dark".
  palettes: [
    // ── Light (cream menu, dark chrome — the classic look) ──────────────────
    { key: "ajami", label: "عجمي", tone: "light", isDefault: true, mood: "أخضر وذهبي", colors: { accent: "oklch(0.68 0.11 82)", ground: "oklch(0.24 0.04 165)", ink: "oklch(0.965 0.014 88)" } },
    { key: "midnight", label: "منتصف الليل", tone: "light", mood: "داكن أزرق", colors: { accent: "oklch(0.6 0.13 235)", ground: "oklch(0.15 0.025 250)", ink: "oklch(0.93 0.02 245)" } },
    { key: "forest", label: "غابة", tone: "light", mood: "داكن أخضر", colors: { accent: "oklch(0.58 0.13 150)", ground: "oklch(0.14 0.02 160)", ink: "oklch(0.93 0.02 130)" } },
    { key: "graphite", label: "غرافيت", tone: "light", mood: "رمادي أنيق", colors: { accent: "oklch(0.68 0.14 55)", ground: "oklch(0.17 0.004 250)", ink: "oklch(0.92 0.01 250)" } },
    { key: "espresso", label: "إسبريسو", tone: "light", mood: "بنّي دافئ", colors: { accent: "oklch(0.66 0.11 60)", ground: "oklch(0.155 0.018 50)", ink: "oklch(0.92 0.02 75)" } },
    { key: "wine", label: "نبيذ", tone: "light", mood: "خمري داكن", colors: { accent: "oklch(0.6 0.15 8)", ground: "oklch(0.15 0.03 12)", ink: "oklch(0.92 0.02 30)" } },
    { key: "ocean", label: "محيط", tone: "light", mood: "أزرق عميق", colors: { accent: "oklch(0.68 0.12 200)", ground: "oklch(0.145 0.03 220)", ink: "oklch(0.93 0.02 210)" } },
    { key: "plum", label: "برقوقي", tone: "light", mood: "أرجواني", colors: { accent: "oklch(0.62 0.17 330)", ground: "oklch(0.16 0.035 320)", ink: "oklch(0.93 0.02 320)" } },
    { key: "onyx", label: "أونيكس", tone: "light", mood: "أسود كهربائي", colors: { accent: "oklch(0.62 0.16 260)", ground: "oklch(0.135 0.003 250)", ink: "oklch(0.93 0.005 250)" } },
    { key: "emerald", label: "زمرّد", tone: "light", mood: "أخضر لامع", colors: { accent: "oklch(0.7 0.15 162)", ground: "oklch(0.13 0.02 158)", ink: "oklch(0.94 0.02 150)" } },
    { key: "copper", label: "نحاسي", tone: "light", mood: "داكن نحاسي", colors: { accent: "oklch(0.64 0.13 48)", ground: "oklch(0.15 0.012 40)", ink: "oklch(0.92 0.02 60)" } },
    { key: "royal", label: "ملكي", tone: "light", mood: "نيلي وذهبي", colors: { accent: "oklch(0.76 0.13 85)", ground: "oklch(0.155 0.035 278)", ink: "oklch(0.93 0.02 280)" } },
    { key: "teal", label: "طاووسي", tone: "light", mood: "أخضر مزرقّ", colors: { accent: "oklch(0.66 0.12 185)", ground: "oklch(0.14 0.025 195)", ink: "oklch(0.93 0.02 190)" } },
    { key: "neon", label: "نيون", tone: "light", mood: "جريء", colors: { accent: "oklch(0.66 0.24 330)", ground: "oklch(0.16 0.035 300)", ink: "oklch(0.95 0.02 320)" } },
    { key: "sunset", label: "غروب", tone: "light", mood: "برتقالي دافئ", colors: { accent: "oklch(0.68 0.19 40)", ground: "oklch(0.165 0.03 28)", ink: "oklch(0.93 0.03 50)" } },
    { key: "tropical", label: "استوائي", tone: "light", mood: "مرجاني", colors: { accent: "oklch(0.68 0.19 18)", ground: "oklch(0.155 0.03 200)", ink: "oklch(0.94 0.02 190)" } },
    // ── Dark (dark menu, light chrome — the inverted variant) ───────────────
    { key: "sand", label: "رملي", tone: "dark", isDefault: true, mood: "فاتح دافئ", colors: { accent: "oklch(0.52 0.14 40)", ground: "oklch(0.95 0.022 75)", ink: "oklch(0.26 0.03 50)" } },
    { key: "ivory", label: "عاجي", tone: "dark", mood: "فاتح نظيف", colors: { accent: "oklch(0.5 0.16 25)", ground: "oklch(0.97 0.006 80)", ink: "oklch(0.24 0.01 60)" } },
    { key: "linen", label: "كتّان", tone: "dark", mood: "فاتح مريمي", colors: { accent: "oklch(0.5 0.1 150)", ground: "oklch(0.96 0.015 110)", ink: "oklch(0.26 0.02 130)" } },
    { key: "blush", label: "وردي فاتح", tone: "dark", mood: "فاتح وردي", colors: { accent: "oklch(0.56 0.15 6)", ground: "oklch(0.96 0.015 15)", ink: "oklch(0.26 0.02 20)" } },
    { key: "sky", label: "سماوي", tone: "dark", mood: "فاتح أزرق", colors: { accent: "oklch(0.52 0.13 245)", ground: "oklch(0.965 0.012 230)", ink: "oklch(0.26 0.02 250)" } },
    { key: "mint", label: "نعناعي", tone: "dark", mood: "فاتح فيروزي", colors: { accent: "oklch(0.5 0.11 185)", ground: "oklch(0.965 0.02 165)", ink: "oklch(0.25 0.02 175)" } },
    { key: "sunny", label: "مشمس", tone: "dark", mood: "مرِح", colors: { accent: "oklch(0.72 0.17 65)", ground: "oklch(0.97 0.02 90)", ink: "oklch(0.3 0.035 60)" } },
  ],
  steps: [
    {
      key: "shop",
      title: "معلومات المطعم",
      hint: "طرق التواصل والموقع. الاسم والنصوص والأقسام والأطباق والصور تُحرَّر مباشرةً على الموقع (نقر مزدوج).",
      fields: [
        // الاسم، الشعار، عنوان/صورة الغلاف، ملاحظة الدوام، والأطباق والأقسام —
        // كلها inline على المعاينة. هنا فقط ما لا يظهر كنص قابل للتحرير.
        { key: "shop.phone", label: "الهاتف", type: "phone", help: "إلزامي — عليه يتّصل الزبون ويطلب." },
        { key: "shop.whatsapp", label: "واتساب (اختياري)", type: "phone", help: "عند إضافته يظهر رابط واتساب في التذييل." },
        { key: "shop.address", label: "العنوان", type: "text" },
        { key: "shop.socials.instagram", label: "رابط إنستغرام", type: "text", ltr: true, placeholder: "https://instagram.com/…", help: "تظهر الأيقونة في الترويسة والتذييل عند إضافة الرابط." },
        { key: "shop.socials.facebook", label: "رابط فيسبوك", type: "text", ltr: true, placeholder: "https://facebook.com/…" },
        { key: "shop.socials.tiktok", label: "رابط تيك توك", type: "text", ltr: true, placeholder: "https://tiktok.com/@…" },
      ],
    },
    // الأقسام + الأطباق تُحرَّر INLINE على المعاينة الحيّة (نقر مزدوج للتعديل،
    // تمرير للحذف، ＋ للإضافة) — كما في قالب الحلاقة. لذلك ليست في اللوحة الجانبية.
    {
      key: "hours",
      title: "أوقات العمل",
      hint: "لكل يوم: مفتوح (من/إلى) أو مغلق. تُجمَع الأيام المتشابهة تلقائيًا على الموقع.",
      fields: [
        { key: "hours", label: "أوقات الدوام", type: "weekhours" },
      ],
    },
  ],
};
