// Barbershop "five-star" — template module. Wires the ready-made component to
// its editable-data defaults, the onboarding/editor field schema, and the small
// themeable color set. Frozen house copy lives inside the component.

import type { TemplateModule } from "../types";
import Component from "./component";

/** A believable default shop, so the design reads as complete before any edit
 *  (and the wizard/editor show real values, not blanks). */
const defaults = {
  shop: {
    name: "صالون قاسيون",
    logo: "",
    tagline: "حلاقة كلاسيكية بمعايير خمس نجوم",
    heroLine: "الكرسي جاهز في وقته تمامًا",
    heroBlurb:
      "شفرة جديدة تُفتح أمامك، منشفة ساخنة بزيت اللافندر، ونتيجة نُريك إياها في المرآة قبل أن تنهض.",
    heroPhoto: "",
    whatsapp: "+963991112233",
    phone: "+963112223344",
    address: "دمشق — المزة، شارع الجلاء",
    lastAppointment: "٩:٣٠",
    socials: { instagram: "", facebook: "", tiktok: "" },
    stats: [
      { value: "٤٫٩", label: "تقييم الزبائن" },
      { value: "١٢", label: "سنة خبرة" },
      { value: "٦", label: "حلاقين محترفين" },
    ],
  },
  groups: [
    { id: "hair", label: "الشعر" },
    { id: "beard", label: "الذقن" },
    { id: "combo", label: "باقات" },
    { id: "extra", label: "إضافات" },
  ],
  services: [
    { group: "hair", name: "قصّة كلاسيكية", price: "٢٥٬٠٠٠", duration: "٤٥ دقيقة", desc: "قصّ بالمقص للشكل ثم تدرّج بالماكينة، مع تصفيف وشرح.", mark: "الأكثر طلبًا", photo: "" },
    { group: "hair", name: "تدرّج (فايد)", price: "٣٠٬٠٠٠", duration: "٥٠ دقيقة", desc: "تدرّج نظيف من الصفر مع تحديد دقيق للخطوط.", photo: "" },
    { group: "beard", name: "تهذيب ذقن بالموسى", price: "١٥٬٠٠٠", duration: "٢٥ دقيقة", desc: "منشفة ساخنة، زيت، وتحديد بالموسى.", photo: "" },
    { group: "combo", name: "شعر + ذقن", price: "٣٨٬٠٠٠", duration: "٧٥ دقيقة", desc: "الباقة الكاملة بسعر موفّر.", mark: "توفير", photo: "" },
    { group: "extra", name: "غسيل وتصفيف", price: "٨٬٠٠٠", duration: "١٥ دقيقة", desc: "شامبو وتدليك فروة وتصفيف.", photo: "" },
  ],
  barbers: [
    { name: "أبو أحمد", role: "المعلّم", years: 20, bio: "خبرة عشرين عامًا في القصّات الكلاسيكية.", availableToday: true, photo: "" },
    { name: "سامر", role: "أخصّائي تدرّج", years: 8, availableToday: true, photo: "" },
    { name: "وسيم", role: "حلاق", years: 5, availableToday: false, photo: "" },
  ],
  // One row per weekday (Syrian week order). Same-hours days are collapsed into
  // ranges on the site; edited via dropdowns in the settings panel.
  hours: [
    { day: "السبت", open: "١٠:٠٠ ص", close: "١٠:٠٠ م" },
    { day: "الأحد", open: "١٠:٠٠ ص", close: "١٠:٠٠ م" },
    { day: "الاثنين", open: "١٠:٠٠ ص", close: "١٠:٠٠ م" },
    { day: "الثلاثاء", open: "١٠:٠٠ ص", close: "١٠:٠٠ م" },
    { day: "الأربعاء", open: "١٠:٠٠ ص", close: "١٠:٠٠ م" },
    { day: "الخميس", open: "١٠:٠٠ ص", close: "١٠:٠٠ م" },
    { day: "الجمعة", open: "٢:٠٠ م", close: "١٠:٠٠ م" },
  ],
};

export const barbershopFiveStar: TemplateModule = {
  key: "barbershop-five-star",
  label: "صالون حلاقة",
  vertical: "barbershop",
  description: "قالب صالون حلاقة راقٍ: خدمات، حلاقون، عناية، وحجز موعد. عربي بالكامل.",
  tags: ["حلاقة", "صالون رجالي", "باربر شوب", "حجز مواعيد", "خدمات وأسعار", "فريق العمل", "عربي", "هاتف أولًا"],
  // Catalog cover — a static asset shipped with the code (see public/template-covers).
  // Until the file is dropped in, the gallery shows its generated poster fallback.
  cover: "/template-covers/barbershop-five-star.webp",
  // The template has its own strict prop shape; the host spreads merged content
  // onto it, so we widen through `unknown` at this single boundary.
  Component: Component as unknown as TemplateModule["Component"],
  defaults,
  nameKey: "shop.name",
  // The template ships its own font — no font override in the appearance tab.
  themeFont: false,
  tokens: [
    { key: "accent", label: "لون التمييز", cssVar: "--color-oxblood", default: "oklch(0.48 0.16 25)" },
    { key: "ground", label: "الخلفية", cssVar: "--color-ink", default: "oklch(0.115 0.006 45)" },
    { key: "ink", label: "لون النص", cssVar: "--color-bone", default: "oklch(0.93 0.018 70)" },
  ],
  // Ready-made colorways — the owner picks one instead of raw colors. "كلاسيكي"
  // equals the token defaults so an untouched site reads as that palette.
  palettes: [
    // ── Dark ──────────────────────────────────────────────────────────────
    { key: "classic", label: "كلاسيكي", tone: "dark", isDefault: true, mood: "داكن دافئ", colors: { accent: "oklch(0.48 0.16 25)", ground: "oklch(0.115 0.006 45)", ink: "oklch(0.93 0.018 70)" } },
    { key: "midnight", label: "منتصف الليل", tone: "dark", mood: "داكن أزرق", colors: { accent: "oklch(0.6 0.13 235)", ground: "oklch(0.15 0.025 250)", ink: "oklch(0.93 0.02 245)" } },
    { key: "forest", label: "غابة", tone: "dark", mood: "داكن أخضر", colors: { accent: "oklch(0.58 0.13 150)", ground: "oklch(0.14 0.02 160)", ink: "oklch(0.93 0.02 130)" } },
    { key: "graphite", label: "غرافيت", tone: "dark", mood: "رمادي أنيق", colors: { accent: "oklch(0.68 0.14 55)", ground: "oklch(0.17 0.004 250)", ink: "oklch(0.92 0.01 250)" } },
    { key: "espresso", label: "إسبريسو", tone: "dark", mood: "بنّي دافئ", colors: { accent: "oklch(0.66 0.11 60)", ground: "oklch(0.155 0.018 50)", ink: "oklch(0.92 0.02 75)" } },
    { key: "wine", label: "نبيذ", tone: "dark", mood: "خمري داكن", colors: { accent: "oklch(0.6 0.15 8)", ground: "oklch(0.15 0.03 12)", ink: "oklch(0.92 0.02 30)" } },
    { key: "ocean", label: "محيط", tone: "dark", mood: "أزرق عميق", colors: { accent: "oklch(0.68 0.12 200)", ground: "oklch(0.145 0.03 220)", ink: "oklch(0.93 0.02 210)" } },
    { key: "plum", label: "برقوقي", tone: "dark", mood: "أرجواني", colors: { accent: "oklch(0.62 0.17 330)", ground: "oklch(0.16 0.035 320)", ink: "oklch(0.93 0.02 320)" } },
    { key: "onyx", label: "أونيكس", tone: "dark", mood: "أسود كهربائي", colors: { accent: "oklch(0.62 0.16 260)", ground: "oklch(0.135 0.003 250)", ink: "oklch(0.93 0.005 250)" } },
    { key: "emerald", label: "زمرّد", tone: "dark", mood: "أخضر لامع", colors: { accent: "oklch(0.7 0.15 162)", ground: "oklch(0.13 0.02 158)", ink: "oklch(0.94 0.02 150)" } },
    { key: "copper", label: "نحاسي", tone: "dark", mood: "داكن نحاسي", colors: { accent: "oklch(0.64 0.13 48)", ground: "oklch(0.15 0.012 40)", ink: "oklch(0.92 0.02 60)" } },
    { key: "royal", label: "ملكي", tone: "dark", mood: "نيلي وذهبي", colors: { accent: "oklch(0.76 0.13 85)", ground: "oklch(0.155 0.035 278)", ink: "oklch(0.93 0.02 280)" } },
    { key: "teal", label: "طاووسي", tone: "dark", mood: "أخضر مزرقّ", colors: { accent: "oklch(0.66 0.12 185)", ground: "oklch(0.14 0.025 195)", ink: "oklch(0.93 0.02 190)" } },
    { key: "neon", label: "نيون", tone: "dark", mood: "جريء", colors: { accent: "oklch(0.66 0.24 330)", ground: "oklch(0.16 0.035 300)", ink: "oklch(0.95 0.02 320)" } },
    { key: "sunset", label: "غروب", tone: "dark", mood: "برتقالي دافئ", colors: { accent: "oklch(0.68 0.19 40)", ground: "oklch(0.165 0.03 28)", ink: "oklch(0.93 0.03 50)" } },
    { key: "tropical", label: "استوائي", tone: "dark", mood: "مرجاني", colors: { accent: "oklch(0.68 0.19 18)", ground: "oklch(0.155 0.03 200)", ink: "oklch(0.94 0.02 190)" } },
    // ── Light ─────────────────────────────────────────────────────────────
    { key: "sand", label: "رملي", tone: "light", isDefault: true, mood: "فاتح دافئ", colors: { accent: "oklch(0.52 0.14 40)", ground: "oklch(0.95 0.022 75)", ink: "oklch(0.26 0.03 50)" } },
    { key: "ivory", label: "عاجي", tone: "light", mood: "فاتح نظيف", colors: { accent: "oklch(0.5 0.16 25)", ground: "oklch(0.97 0.006 80)", ink: "oklch(0.24 0.01 60)" } },
    { key: "linen", label: "كتّان", tone: "light", mood: "فاتح مريمي", colors: { accent: "oklch(0.5 0.1 150)", ground: "oklch(0.96 0.015 110)", ink: "oklch(0.26 0.02 130)" } },
    { key: "blush", label: "وردي فاتح", tone: "light", mood: "فاتح وردي", colors: { accent: "oklch(0.56 0.15 6)", ground: "oklch(0.96 0.015 15)", ink: "oklch(0.26 0.02 20)" } },
    { key: "sky", label: "سماوي", tone: "light", mood: "فاتح أزرق", colors: { accent: "oklch(0.52 0.13 245)", ground: "oklch(0.965 0.012 230)", ink: "oklch(0.26 0.02 250)" } },
    { key: "mint", label: "نعناعي", tone: "light", mood: "فاتح فيروزي", colors: { accent: "oklch(0.5 0.11 185)", ground: "oklch(0.965 0.02 165)", ink: "oklch(0.25 0.02 175)" } },
    { key: "sunny", label: "مشمس", tone: "light", mood: "مرِح", colors: { accent: "oklch(0.72 0.17 65)", ground: "oklch(0.97 0.02 90)", ink: "oklch(0.3 0.035 60)" } },
  ],
  steps: [
    {
      key: "shop",
      title: "معلومات المحل",
      hint: "طرق التواصل والعنوان. النصوص والصور والأرقام تُحرَّر مباشرةً على الموقع.",
      fields: [
        // الاسم، الشعار، عنوان/نبذة/صورة الواجهة، آخر موعد، والأرقام — كلها inline
        // على المعاينة (نقر مزدوج). هنا فقط ما لا يظهر كنص قابل للتحرير.
        { key: "shop.whatsapp", label: "رقم واتساب", type: "phone", help: "إلزامي — عليه تصل طلبات الحجز." },
        { key: "shop.phone", label: "الهاتف", type: "phone" },
        { key: "shop.address", label: "العنوان", type: "text" },
        { key: "shop.socials.instagram", label: "رابط إنستغرام", type: "text", ltr: true, placeholder: "https://instagram.com/…", help: "تظهر الأيقونة في الترويسة والتذييل عند إضافة الرابط." },
        { key: "shop.socials.facebook", label: "رابط فيسبوك", type: "text", ltr: true, placeholder: "https://facebook.com/…" },
        { key: "shop.socials.tiktok", label: "رابط تيك توك", type: "text", ltr: true, placeholder: "https://tiktok.com/@…" },
      ],
    },
    // الخدمات + الحلاقون are edited INLINE on the live preview (double-click to
    // edit, hover to remove, ＋ to add) — see the barbershop component. They're
    // intentionally not in the side panel.
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
