// شغلة (Shaghleh) — a single-page placeholder for a Syrian services marketplace.
// Its job is lead capture: recruit PROVIDERS (the hard side) and route CUSTOMERS
// to WhatsApp. Both forms POST to /api/sites/[siteId]/submissions and land in the
// dashboard "الطلبات" inbox. The look is a FIXED light teal brand — the only
// themeable token is the brand accent; there are no dark sections by design.

import type { TemplateModule } from "../types";
import { SERVICE_CATEGORIES } from "@/shared/submissions";
import Component from "./component";

const defaults = {
  shop: {
    name: "شغلة",
    // The WhatsApp number every "راسلنا" link + the customer confirmation opens.
    whatsapp: "+963991234567",
    logo: "",
  },
  // The service categories are SITE CONFIG — they drive the category grid and both
  // forms' selects. Every submission's `category` is one of these (server bounds
  // it as a string, never a hardcoded enum), so a site can change them freely.
  categories: [...SERVICE_CATEGORIES],
};

export const shaghleh: TemplateModule = {
  key: "shaghleh",
  label: "سوق خدمات",
  vertical: "marketplace",
  description:
    "صفحة واحدة لسوق خدمات: تجمع مزوّدي الخدمات وتوصل الزبائن بهم عبر واتساب. الطلبات تُدار من لوحة التحكم.",
  tags: ["سوق خدمات", "حرفيين", "مستقلين", "صفحة هبوط", "واتساب", "سوريا", "عربي"],
  cover: "/template-covers/shaghleh.webp",
  Component: Component as unknown as TemplateModule["Component"],
  defaults,
  nameKey: "shop.name",
  themeFont: false,
  // The public page's provider + customer forms feed the «الطلبات» inbox.
  collectsSubmissions: true,
  // Three themeable tokens: the brand accent, the page ground, and the ink. The
  // component derives its card/border/muted surfaces from the ground's luminance,
  // so BOTH light and dark palettes render correctly.
  tokens: [
    { key: "accent", label: "لون العلامة", cssVar: "--tpl-accent", default: "#00A08A" },
    { key: "ground", label: "الخلفية", cssVar: "--sh-ground", default: "#FFFFFF" },
    { key: "ink", label: "لون النص", cssVar: "--sh-ink", default: "#10201F" },
  ],
  // The dominant page surface is the ground — draw the palette-card preview from it.
  surfaceToken: "ground",
  // Paired light + dark colorways. Each dark accent is mid-tone (readable with white
  // button text); accent-coloured TEXT is lightened by the component on dark grounds.
  palettes: [
    // ── Light ──────────────────────────────────────────────────────────────
    { key: "teal", label: "أخضر بحري", tone: "light", isDefault: true, mood: "العلامة الأساسية", colors: { accent: "#00A08A", ground: "#FFFFFF", ink: "#10201F" } },
    { key: "indigo", label: "نيلي", tone: "light", mood: "أزرق هادئ", colors: { accent: "#3D5AC9", ground: "#FFFFFF", ink: "#141A2E" } },
    { key: "plum", label: "برقوقي", tone: "light", mood: "أرجواني", colors: { accent: "#8A4FBF", ground: "#FFFFFF", ink: "#1E1526" } },
    { key: "forest", label: "زيتي", tone: "light", mood: "أخضر داكن", colors: { accent: "#2F8F4E", ground: "#FFFFFF", ink: "#10231A" } },
    { key: "clay", label: "طوبي", tone: "light", mood: "برتقالي دافئ", colors: { accent: "#C4632F", ground: "#FFFFFF", ink: "#241811" } },
    // ── Dark ───────────────────────────────────────────────────────────────
    // Grounds are lifted off pure black (so the derived cards/borders read as clean
    // elevation) and inks are bright for high text contrast; accents stay mid-tone
    // so white button text remains legible. Surfaces/muted derive from these.
    { key: "night", label: "ليلي", tone: "dark", isDefault: true, mood: "أخضر بحري داكن", colors: { accent: "#2AA992", ground: "#101E1A", ink: "#EAF4F0" } },
    { key: "midnight", label: "منتصف الليل", tone: "dark", mood: "أزرق داكن", colors: { accent: "#5065C8", ground: "#12162A", ink: "#E8EBF7" } },
    { key: "mulberry", label: "توتي", tone: "dark", mood: "أرجواني داكن", colors: { accent: "#9A54C0", ground: "#191227", ink: "#F1EAF7" } },
    { key: "pine", label: "صنوبري", tone: "dark", mood: "أخضر داكن", colors: { accent: "#3E9A57", ground: "#101E18", ink: "#E8F3EB" } },
    { key: "ember", label: "جمر", tone: "dark", mood: "طوبي داكن", colors: { accent: "#C4703E", ground: "#1D1610", ink: "#F5ECE3" } },
  ],
  steps: [
    {
      key: "shop",
      title: "العلامة والتواصل",
      hint: "اسم العلامة والشعار ورقم الواتساب الذي تصل عليه الطلبات المستعجلة.",
      fields: [
        { key: "shop.name", label: "الاسم", type: "text", placeholder: "شغلة" },
        { key: "shop.logo", label: "الشعار", type: "image" },
        { key: "shop.whatsapp", label: "رقم واتساب", type: "phone", help: "عليه تُفتح روابط «راسلنا على واتساب» وتأكيد الزبون." },
      ],
    },
  ],
};
