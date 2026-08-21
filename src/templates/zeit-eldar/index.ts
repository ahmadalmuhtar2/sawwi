// زيت الدار (Zeit el-Dar) — template module. A premium single-product landing page
// for a Syrian olive-oil business (16kg tins, delivered inside Syria). Ordering is
// WhatsApp-only (no on-page form → no leads inbox). All visible text + the price +
// the images are edited INLINE on the page (double-click), like the other
// templates; only the contact/config values live in the wizard. Theme = the fixed
// brand palette sampled from the logo.

import type { TemplateModule } from "../types";
import Component from "./component";

/** Believable defaults so the design reads complete before any edit (and the
 *  wizard/editor show real values, not blanks). Text/price/images are edited
 *  inline on the page; these are their starting values. */
const defaults = {
  brand: {
    name: "زيت الدار",
    // The registered WhatsApp number every order + «راسلنا» link opens.
    whatsapp: "+963991234567",
    // ShamCash transfer number — shown as a copy field AND a scannable QR on the site.
    shamcash: "0991 234 567",
  },
  hero: {
    eyebrow: "زيت زيتون بلدي · عصرة جديدة",
    headline: "من العصرة لعندك مباشرة.",
    subline: "زيت بلدي أصلي بتنكة ١٦ كيلو، وتوصيل لكل سوريا. بتشوف صور حقيقية للزيت قبل ما تطلب.",
  },
  product: {
    tin: "تنكة ١٦ كغ",
    // Number only — the currency symbol follows the site's chosen unit (currency enum).
    price: "٤٥٠٬٠٠٠",
    desc: "زيت زيتون بلدي، عصرة جديدة، معبّأ بتنكة معدنية ١٦ كيلو. مناسب للبيت وللمونة.",
    heroImage: "",
    productImage: "",
  },
  why: {
    title: "ليش زيت الدار؟",
    points: [
      { t: "زيت بلدي", b: "زيتون سوري أصلي، بدون خلط." },
      { t: "عصرة جديدة", b: "من عصرة هالموسم، طازة." },
      { t: "صور حقيقية قبل الطلب", b: "منبعتلك صور للزيت الفعلي على واتساب." },
      { t: "توصيل داخل سوريا", b: "منوصّلك لباب البيت." },
    ],
  },
  pay: {
    title: "الطلب والدفع",
    intro: "الطلب بيتم عبر واتساب: بتراسلنا ومنأكّد معك الكمية والتوصيل.",
    shamTitle: "شام كاش (ShamCash)",
    shamNote: "حوّل على رقم شام كاش أو امسح الكود، وبنأكد استلام الحوالة:",
    codTitle: "الدفع عند الاستلام",
    codNote: "بتدفع كاش لَحظة ما توصلك التنكة على الباب. بتفحص الزيت قبل ما تدفع.",
  },
  delivery: {
    area: "دمشق وريف دمشق",
  },
};

export const zeitElDar: TemplateModule = {
  key: "zeit-eldar",
  label: "زيت الدار",
  vertical: "retail",
  description:
    "صفحة منتج واحد لبيع زيت الزيتون البلدي بالتنكة (١٦ كغ) مع توصيل داخل سوريا. الطلب عبر واتساب مباشرة، والدفع بشام كاش (مع رمز QR) أو عند الاستلام.",
  tags: ["زيت زيتون", "منتج غذائي", "بلدي", "تنكة", "واتساب", "شام كاش", "توصيل", "سوريا", "عربي"],
  cover: "/template-covers/zeit-eldar.webp",
  // The template has its own strict prop shape; the host spreads merged content
  // onto it, so we widen through `unknown` at this single boundary.
  Component: Component as unknown as TemplateModule["Component"],
  defaults,
  nameKey: "brand.name",
  // The dominant page surface is the cream ground.
  surfaceToken: "ground",
  // Default price unit; the owner can change it in settings (app currency enum) and
  // the symbol renders beside the inline price everywhere.
  defaultCurrency: "SYP",
  // Ships its own font (Readex + Cairo, like the other templates) — no font override.
  themeFont: false,
  // Three host-themeable tokens. `accent` is the BRAND olive (primary buttons,
  // headings, footer); `ground` is the cream page surface; `ink` is charcoal text.
  // The rest of the palette (tint, the terracotta price accent, muted, border,
  // success-green) is curated and fixed inside the component.
  tokens: [
    { key: "accent", label: "لون العلامة", cssVar: "--zd-brand", default: "#4B4916" },
    { key: "ground", label: "الخلفية", cssVar: "--zd-surface", default: "#FDF6E9" },
    { key: "ink", label: "لون النص", cssVar: "--zd-ink", default: "#2A2810" },
  ],
  // The fixed brand palette sampled from the logo — the default AND only colorway
  // for this template (so every site created from it starts on-brand).
  palettes: [
    { key: "dar", label: "زيت الدار", tone: "light", isDefault: true, mood: "زيتوني وكريمي", colors: { accent: "#4B4916", ground: "#FDF6E9", ink: "#2A2810" } },
  ],
  steps: [
    {
      key: "brand",
      title: "العلامة والتواصل",
      hint: "رقم الواتساب ورقم شام كاش. الاسم والنصوص والسعر والصور تُحرَّر مباشرةً على الصفحة (نقر مزدوج).",
      fields: [
        { key: "brand.name", label: "اسم العلامة", type: "text", placeholder: "زيت الدار" },
        { key: "brand.whatsapp", label: "رقم واتساب", type: "phone", help: "عليه تُفتح كل الطلبات وروابط «راسلنا على واتساب»." },
        { key: "brand.shamcash", label: "رقم شام كاش (ShamCash)", type: "text", ltr: true, placeholder: "0991 234 567", help: "يظهر كحقل نسخ ورمز QR في قسم الدفع." },
      ],
    },
  ],
};
