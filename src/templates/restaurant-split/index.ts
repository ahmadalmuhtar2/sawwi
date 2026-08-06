// قسّم الفاتورة (restaurant-split) — a splitter-ONLY published site. The whole
// site is the bill-splitting tool a table opens via a QR code: add people, enter
// what was ordered and who shared it, and get each person's fair total (items by
// who-shared-them, service+tax split equally per head). All the table state is
// transient and client-side (localStorage + a shareable link) — no backend.
//
// The owner only configures the frame: restaurant name/logo and the DEFAULT
// service/tax percentages (guests can still adjust them at the table). Colours
// are themeable via the three tokens; the rest of the warm look is house design.

import type { TemplateModule } from "../types";
import Component from "./component";

const defaults = {
  shop: {
    name: "مطعم الشام",
    logo: "",
    tagline: "قسّم الفاتورة بالعدل — كلٌّ على قدّه",
  },
  // Default charges shown pre-filled at the table (percent). Guests may adjust.
  charges: { service: 10, tax: 5 },
  // Rounding step in SYP for the cash/exact modes.
  round: 500,
};

export const restaurantSplit: TemplateModule = {
  key: "restaurant-split",
  label: "قسّم الفاتورة",
  vertical: "restaurant",
  description:
    "أداة تقسيم فاتورة المطعم: كلٌّ يدفع ما طلبه، والخدمة والضريبة تنقسم بالتساوي على الجميع. يفتحها الزبائن عبر رمز QR على الطاولة.",
  tags: ["مطعم", "تقسيم الفاتورة", "حساب", "خدمة", "ضريبة", "مازة", "عربي", "طاولة"],
  cover: "/template-covers/restaurant-split.webp",
  Component: Component as unknown as TemplateModule["Component"],
  defaults,
  nameKey: "shop.name",
  defaultCurrency: "SYP",
  themeFont: false,
  surfaceToken: "ground",
  // Three themeable colours; the warm cards/borders/amber + avatar palette are
  // fixed house design inside the component.
  tokens: [
    { key: "accent", label: "لون التمييز", cssVar: "--sb-accent", default: "#3B4530" },
    { key: "ground", label: "الخلفية", cssVar: "--sb-ground", default: "#F7F2E9" },
    { key: "ink", label: "لون النص", cssVar: "--sb-ink", default: "#22261C" },
  ],
  // The component picks a light or dark surface set from the ground's luminance,
  // so both tones render correctly. The light default "زيتوني" equals the token
  // defaults (the shipped design); a dark default "ليلي" is offered beside it.
  palettes: [
    // ── Light ─────────────────────────────────────────────────────────────
    { key: "olive", label: "زيتوني", tone: "light", isDefault: true, mood: "زيتي دافئ", colors: { accent: "#3B4530", ground: "#F7F2E9", ink: "#22261C" } },
    { key: "clay", label: "طيني", tone: "light", mood: "طوبي دافئ", colors: { accent: "#A0432E", ground: "#F7F0E9", ink: "#241E1B" } },
    { key: "indigo", label: "نيلي", tone: "light", mood: "أزرق هادئ", colors: { accent: "#2E3A52", ground: "#F2F3F7", ink: "#1C2026" } },
    { key: "cumin", label: "كموني", tone: "light", mood: "ذهبي ترابي", colors: { accent: "#7A5A20", ground: "#F8F3E7", ink: "#26221A" } },
    { key: "charcoal", label: "فحمي", tone: "light", mood: "رمادي أنيق", colors: { accent: "#2C2E2C", ground: "#F4F2EE", ink: "#1A1A1A" } },
    { key: "plum", label: "برقوقي", tone: "light", mood: "أرجواني هادئ", colors: { accent: "#5B2E52", ground: "#F5F0F4", ink: "#221C21" } },
    // ── Dark ──────────────────────────────────────────────────────────────
    // Mid-tone accents (dark enough for white button text; the component lightens
    // a copy for accent-coloured TEXT on the dark cards).
    { key: "night", label: "ليلي", tone: "dark", isDefault: true, mood: "زيتي داكن", colors: { accent: "#4C7A54", ground: "#171A13", ink: "#ECEFE6" } },
    { key: "ember", label: "جمر", tone: "dark", mood: "طوبي داكن", colors: { accent: "#B85A38", ground: "#1A1512", ink: "#F0E9E4" } },
    { key: "midnight", label: "منتصف الليل", tone: "dark", mood: "أزرق داكن", colors: { accent: "#4468B8", ground: "#12151C", ink: "#E7ECF4" } },
    { key: "brass", label: "نحاسي", tone: "dark", mood: "ذهبي داكن", colors: { accent: "#9C7A2E", ground: "#181510", ink: "#F1ECE0" } },
    { key: "onyx", label: "أونيكس", tone: "dark", mood: "رمادي داكن", colors: { accent: "#5E7E86", ground: "#161614", ink: "#EDEDEA" } },
    { key: "mulberry", label: "توتي", tone: "dark", mood: "أرجواني داكن", colors: { accent: "#9A4E90", ground: "#1A131A", ink: "#F1E9F0" } },
  ],
  steps: [
    {
      key: "shop",
      title: "المطعم",
      hint: "اسم المطعم والشعار — يظهران في ترويسة أداة التقسيم.",
      fields: [
        { key: "shop.name", label: "اسم المطعم", type: "text", placeholder: "مطعم الشام" },
        { key: "shop.logo", label: "الشعار", type: "image" },
        { key: "shop.tagline", label: "جملة ترحيب", type: "text", placeholder: "قسّم الفاتورة بالعدل" },
      ],
    },
    {
      key: "charges",
      title: "الخدمة والضريبة",
      hint: "النِّسَب الافتراضية المعبّأة مسبقًا على الطاولة (يمكن للزبائن تعديلها). تنقسم بالتساوي على عدد الأشخاص.",
      fields: [
        { key: "charges.service", label: "نسبة الخدمة (٪)", type: "text", placeholder: "10" },
        { key: "charges.tax", label: "نسبة الضريبة (٪)", type: "text", placeholder: "5" },
      ],
    },
  ],
};
