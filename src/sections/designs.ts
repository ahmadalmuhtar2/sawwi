// The section DESIGN catalog — the bridge that makes section layouts
// template-aware. A section's `variant` field stores a *design key*; each key
// maps to (1) a render component (see library.tsx) and (2) the set of verticals
// allowed to pick it in the builder.
//
// Sharing model:
//   verticals: "all"                → shared design, offered to every template
//   verticals: ["barbershop"]       → exclusive to that vertical
//   verticals: ["barbershop","spa"] → shared by a specific subset
//
// The RENDERER dispatches purely by key (a design always renders, whatever the
// site's vertical); the `verticals` filter only governs what the builder OFFERS.
// So a template seed can still assign any key, and legacy rows keep working.
//
// Adding a design is two edits: add the render component + register its key in
// library.tsx, then add an entry here with the verticals it's offered to.

import { SECTION_FIELDS } from "./meta";
import type { SectionLink } from "./types";

export interface SectionDesign {
  /** Stored in Section.variant. Legacy rows use "A"/"B"/"C". */
  key: string;
  /** Arabic label shown in the builder's design picker. */
  label: string;
  /** Which site verticals may choose this design. "all" = shared. */
  verticals: "all" | readonly string[];
}

// Editable fields shown in the builder inspector. Text/image/list values live in
// the section's `content` JSON; image fields store a storage URL under their key.
//   group → a repeatable list of records (e.g. values, stats, milestones); each
//           record is edited with the `fields` sub-inputs and stored as an object.
export type FieldType = "text" | "textarea" | "image" | "list" | "link" | "group";

/** A sub-input inside a `group` field (one column of each repeated record). */
export interface GroupSubField {
  key: string;
  label: string;
  /** "text" (default) | "textarea" | "image" (URL) | "rating" (1–5 slider). */
  type?: "text" | "textarea" | "image" | "rating";
  /** Legacy shorthand for `type: "textarea"`. */
  textarea?: boolean;
}

export interface DesignField {
  key: string;
  label: string;
  type: FieldType;
  /** For `link` fields: the destination used when the reseller hasn't set one. */
  defaultLink?: SectionLink;
  /** For `group` fields: the columns of each repeated record. */
  fields?: readonly GroupSubField[];
  /** For `group` fields: the "add" button label (e.g. "إضافة قيمة"). */
  addLabel?: string;
  /** For `group` fields: the maximum number of records the user may add. */
  max?: number;
  /** Override which inspector section this field is grouped under. */
  inspectorGroup?: "content" | "buttons" | "media" | "list";
}

// First entry per section is the sensible default. "A"/"B"/"C" are the original
// shared layouts (kept so existing sites + template seeds don't break); new
// vertical-specific designs get descriptive keys like "barber-classic".
export const SECTION_DESIGNS: Record<string, readonly SectionDesign[]> = {
  Hero: [
    // Barbershop-exclusive designs (bespoke). These are the ONLY hero designs a
    // barbershop site sees — the old generic A/B/C variants are retired for it.
    { key: "barber-cinematic", label: "سينمائي", verticals: ["barbershop"] },
    { key: "barber-editorial", label: "تحريري", verticals: ["barbershop"] },
    { key: "barber-emblem", label: "شعار", verticals: ["barbershop"] },
    // Generic layouts kept ONLY for verticals without a bespoke hero yet
    // (restaurant, services). Never offered to barbershop. Replace as their
    // bespoke designs arrive.
    { key: "A", label: "كلاسيكي", verticals: ["restaurant", "services"] },
    { key: "B", label: "عنوان بارز", verticals: ["restaurant", "services"] },
    { key: "C", label: "مقسّم", verticals: ["restaurant", "services"] },
  ],
  About: [
    { key: "about-photo", label: "صورة", verticals: "all" },
    { key: "about-statement", label: "بيان", verticals: "all" },
    { key: "about-milestones", label: "مسيرة", verticals: "all" },
  ],
  ServicesGrid: [
    { key: "services-numbered", label: "مرقّم", verticals: "all" },
    { key: "services-list", label: "قائمة أسعار", verticals: "all" },
    { key: "services-photos", label: "صور", verticals: "all" },
  ],
  Gallery: [
    { key: "gallery-mosaic", label: "فسيفساء", verticals: "all" },
    { key: "gallery-bands", label: "شرائط", verticals: "all" },
    { key: "gallery-stage", label: "عرض", verticals: "all" },
    { key: "gallery-columns", label: "أعمدة", verticals: "all" },
  ],
  Testimonials: [
    { key: "reviews-grid", label: "شبكة", verticals: "all" },
    { key: "reviews-marquee", label: "شريط", verticals: "all" },
    { key: "reviews-solo", label: "مفرد", verticals: "all" },
    { key: "reviews-summary", label: "ملخّص", verticals: "all" },
  ],
  Team: [
    { key: "team-portraits", label: "صور طولية", verticals: "all" },
    { key: "team-rows", label: "صفوف", verticals: "all" },
    { key: "team-squares", label: "مربّعات", verticals: "all" },
    { key: "team-featured", label: "مميّز", verticals: "all" },
  ],
  PriceList: [{ key: "A", label: "قائمة", verticals: "all" }],
  OpeningHours: [
    { key: "hours-table", label: "جدول", verticals: "all" },
    { key: "hours-status", label: "حالة مباشرة", verticals: "all" },
    { key: "hours-week", label: "أسبوع", verticals: "all" },
    { key: "hours-address", label: "مع العنوان", verticals: "all" },
  ],
  MapAddress: [
    { key: "map-split", label: "مقسّم", verticals: "all" },
    { key: "map-wide", label: "عريض", verticals: "all" },
    { key: "map-overlay", label: "بطاقة", verticals: "all" },
    { key: "map-branches", label: "فروع", verticals: "all" },
  ],
  Faq: [
    { key: "faq-accordion", label: "أكورديون", verticals: "all" },
    { key: "faq-columns", label: "عمودان", verticals: "all" },
    { key: "faq-grouped", label: "مصنّف", verticals: "all" },
    { key: "faq-qa", label: "سؤال وجواب", verticals: "all" },
  ],
  // Restaurant menu with category tabs + plate cards (photo/price/description).
  Menu: [
    { key: "menu-tabs", label: "تبويبات", verticals: ["restaurant"] },
    { key: "menu-sections", label: "أقسام", verticals: ["restaurant"] },
    { key: "menu-cards", label: "بطاقات بالصور", verticals: ["restaurant"] },
  ],
  ContactBlock: [
    { key: "contact-simple", label: "بسيط", verticals: "all" },
    { key: "contact-rich", label: "كامل", verticals: "all" },
    { key: "contact-booking", label: "حجز", verticals: "all" },
    { key: "contact-channels", label: "قنوات", verticals: "all" },
  ],
  AnnouncementBanner: [{ key: "A", label: "افتراضي", verticals: "all" }],
  WhatsAppCTA: [
    { key: "wa-band", label: "شريط", verticals: "all" },
    { key: "wa-centered", label: "وسط", verticals: "all" },
    { key: "wa-chat", label: "محادثة", verticals: "all" },
    { key: "wa-floating", label: "زر عائم", verticals: "all" },
  ],
};

const DEFAULT_DESIGNS: readonly SectionDesign[] = [
  { key: "A", label: "افتراضي", verticals: "all" },
];

/** Every design registered for a section type (unfiltered). */
export function designsForSection(sectionType: string): readonly SectionDesign[] {
  return SECTION_DESIGNS[sectionType] ?? DEFAULT_DESIGNS;
}

/**
 * Designs a given vertical may pick for a section type. When the vertical has
 * bespoke (scoped) designs, ONLY those are offered — the shared "all" fallbacks
 * are hidden. Verticals without bespoke designs fall back to the shared ones.
 */
export function designsFor(
  sectionType: string,
  verticalKey: string,
): readonly SectionDesign[] {
  const all = designsForSection(sectionType);
  const scoped = all.filter(
    (d) => d.verticals !== "all" && d.verticals.includes(verticalKey),
  );
  return scoped.length > 0 ? scoped : all.filter((d) => d.verticals === "all");
}

/** The default design key for a section type (its first registered design). */
export function defaultDesignKey(sectionType: string): string {
  return designsForSection(sectionType)[0]?.key ?? "A";
}

// Gallery: the four motion/layout designs share ONE field set — a header + a
// repeatable photo list (image + caption). Photos are per-section content.
const GALLERY_FIELDS: readonly DesignField[] = [
  { key: "kicker", label: "سطر تمهيدي", type: "text" },
  { key: "title", label: "العنوان", type: "text" },
  { key: "lede", label: "المقدّمة", type: "textarea" },
  { key: "countLabel", label: "وصف العدد", type: "text" },
  { key: "photos", label: "الصور", type: "group", addLabel: "إضافة صورة", max: 7,
    fields: [
      { key: "src", label: "الصورة", type: "image" },
      { key: "label", label: "الوصف (اتركه فارغًا لإخفائه)" },
    ] },
  { key: "footnote", label: "ملاحظة أسفل القسم", type: "textarea" },
  { key: "ctaLabel", label: "نص زر واتساب", type: "text" },
];

// Reviews: the four designs share ONE field set — a header + a repeatable review
// list (name / meta / rating / text). Reviews are per-section content, editable
// in the builder (add/remove); the average + distribution are computed from them.
const REVIEWS_FIELDS: readonly DesignField[] = [
  { key: "kicker", label: "سطر تمهيدي", type: "text" },
  { key: "title", label: "العنوان", type: "text" },
  { key: "lede", label: "المقدّمة", type: "textarea" },
  { key: "reviews", label: "الآراء", type: "group", addLabel: "إضافة رأي", inspectorGroup: "list",
    fields: [
      { key: "name", label: "الاسم" },
      { key: "meta", label: "التعريف (اختياري)" },
      { key: "rating", label: "التقييم", type: "rating" },
      { key: "text", label: "الرأي", textarea: true },
    ] },
  { key: "writeLabel", label: "نص زر «اكتب رأيك»", type: "text" },
  { key: "footnote", label: "ملاحظة أسفل القسم", type: "textarea" },
  { key: "ctaLabel", label: "نص زر واتساب", type: "text" },
];

// Team: the four designs share ONE field set — a header + a repeatable member
// list (name / role / photo / years / bio / quote / socials). Members are
// per-section content, editable in the builder; photos upload per row.
const TEAM_FIELDS: readonly DesignField[] = [
  { key: "kicker", label: "سطر تمهيدي", type: "text" },
  { key: "title", label: "العنوان", type: "text" },
  { key: "lede", label: "المقدّمة", type: "textarea" },
  { key: "members", label: "أعضاء الفريق", type: "group", addLabel: "إضافة عضو", inspectorGroup: "list",
    fields: [
      { key: "name", label: "الاسم" },
      { key: "role", label: "الدور" },
      { key: "photo", label: "الصورة", type: "image" },
      { key: "years", label: "سنوات الخبرة" },
      { key: "bio", label: "نبذة", textarea: true },
      { key: "quote", label: "اقتباس (للعضو المميّز)", textarea: true },
      { key: "instagram", label: "رابط إنستغرام" },
      { key: "whatsapp", label: "واتساب (أرقام فقط)" },
    ] },
  { key: "featuredLabel", label: "وصف العضو المميّز", type: "text" },
  { key: "footnote", label: "ملاحظة أسفل القسم", type: "textarea" },
  { key: "ctaLabel", label: "نص زر واتساب", type: "text" },
];

// Opening hours: the schedule + address come from site SETTINGS (not per-section).
// Only the section's COPY is editable here. Four designs share this field set.
const HOURS_FIELDS: readonly DesignField[] = [
  { key: "kicker", label: "سطر تمهيدي", type: "text" },
  { key: "title", label: "العنوان", type: "text" },
  { key: "lede", label: "المقدّمة", type: "textarea" },
  { key: "seasonalNote", label: "ملاحظة موسمية (رمضان مثلًا)", type: "textarea" },
  { key: "bookLabel", label: "نص زر الحجز", type: "text" },
  { key: "footnote", label: "ملاحظة أسفل القسم", type: "textarea" },
  { key: "ctaLabel", label: "نص زر واتساب", type: "text" },
];

// Location/Map: address + phone + map link come from site SETTINGS. Only the
// section's copy is editable — plus, for the "branches" design, a branch list.
const MAP_FIELDS_BASE: readonly DesignField[] = [
  { key: "kicker", label: "سطر تمهيدي", type: "text" },
  { key: "title", label: "العنوان", type: "text" },
  { key: "lede", label: "المقدّمة", type: "textarea" },
  { key: "transportNote", label: "كيف تصل (مواقف/مواصلات)", type: "textarea" },
  { key: "landmarkLabel", label: "أقرب معلم", type: "text" },
  { key: "directionsLabel", label: "نص زر الاتجاهات", type: "text" },
  { key: "copyLabel", label: "نص زر نسخ العنوان", type: "text" },
];
const MAP_BRANCHES_FIELDS: readonly DesignField[] = [
  { key: "lede", label: "المقدّمة", type: "textarea" },
  { key: "branches", label: "الفروع", type: "group", addLabel: "إضافة فرع", inspectorGroup: "list",
    fields: [
      { key: "name", label: "اسم الفرع" },
      { key: "address", label: "العنوان" },
      { key: "hours", label: "الدوام (مثال: ٩:٠٠ – ٢٢:٠٠)" },
      { key: "phone", label: "الهاتف" },
      { key: "mapsUrl", label: "رابط الخريطة" },
    ] },
];

// WhatsApp CTA: the number comes from site SETTINGS. Copy + quick-reply chips
// are editable. Four designs share this field set.
const WHATSAPP_FIELDS: readonly DesignField[] = [
  { key: "title", label: "العنوان", type: "text" },
  { key: "subtext", label: "النص", type: "textarea" },
  { key: "ctaLabel", label: "نص الزر", type: "text" },
  { key: "replyLine", label: "سطر وقت الرد", type: "text" },
  { key: "messageText", label: "الرسالة المُعبّأة مسبقًا", type: "textarea" },
  { key: "bubbleTitle", label: "عنوان الفقاعة (الزر العائم)", type: "text" },
  { key: "quickMessages", label: "رسائل سريعة", type: "group", addLabel: "إضافة رسالة", inspectorGroup: "list",
    fields: [{ key: "label", label: "النص على الزر" }, { key: "text", label: "الرسالة المُرسلة", textarea: true }] },
];

// FAQ: questions are a per-section list (with an optional category for the
// "grouped" design). Copy + help box editable. Four designs share this set.
const FAQ_FIELDS: readonly DesignField[] = [
  { key: "kicker", label: "سطر تمهيدي", type: "text" },
  { key: "title", label: "العنوان", type: "text" },
  { key: "lede", label: "المقدّمة", type: "textarea" },
  { key: "items", label: "الأسئلة", type: "group", addLabel: "إضافة سؤال", inspectorGroup: "list",
    fields: [
      { key: "question", label: "السؤال" },
      { key: "answer", label: "الجواب", textarea: true },
      { key: "group", label: "التصنيف (اختياري)" },
    ] },
  { key: "helpTitle", label: "عنوان صندوق المساعدة", type: "text" },
  { key: "helpBody", label: "نص صندوق المساعدة", type: "textarea" },
  { key: "helpCta", label: "نص زر المساعدة", type: "text" },
];

// Restaurant Menu: plates are a per-section group; each carries a category that
// drives the menu's tabs (like FAQ). Prices use the site-wide currency at render.
const MENU_FIELDS: readonly DesignField[] = [
  { key: "kicker", label: "سطر تمهيدي", type: "text" },
  { key: "title", label: "العنوان", type: "text" },
  { key: "lede", label: "المقدّمة", type: "textarea" },
  { key: "items", label: "الأطباق", type: "group", addLabel: "إضافة طبق", inspectorGroup: "list",
    fields: [
      { key: "category", label: "التصنيف (تبويب)" },
      { key: "name", label: "اسم الطبق" },
      { key: "price", label: "السعر (رقم فقط)" },
      { key: "description", label: "الوصف", textarea: true },
      { key: "badge", label: "شارة (اختياري)" },
      { key: "image", label: "صورة الطبق", type: "image" },
    ] },
  { key: "footnote", label: "ملاحظة أسفل القائمة", type: "textarea" },
  { key: "ctaLabel", label: "نص زر الطلب", type: "text" },
];

// Contact: channels + hours + booking services come from site SETTINGS/services.
// The section carries copy + a few pick-lists (subjects/days/times).
const CONTACT_FIELDS: readonly DesignField[] = [
  { key: "kicker", label: "سطر تمهيدي", type: "text" },
  { key: "title", label: "العنوان", type: "text" },
  { key: "lede", label: "المقدّمة", type: "textarea" },
  { key: "replyLine", label: "سطر وقت الرد", type: "text" },
  { key: "formTitle", label: "عنوان النموذج", type: "text" },
  { key: "formNote", label: "ملاحظة النموذج", type: "textarea" },
  { key: "submitLabel", label: "نص زر الإرسال", type: "text" },
  { key: "privacyNote", label: "ملاحظة الخصوصية", type: "text" },
  // Currency is a site-wide setting (settings → services), not per-section.
  { key: "subjects", label: "مواضيع الرسائل (تصميم «كامل»)", type: "list" },
  { key: "days", label: "أيام الحجز (تصميم «حجز»)", type: "list" },
  { key: "times", label: "أوقات الحجز (تصميم «حجز»)", type: "list" },
];

// Editable fields PER DESIGN. When a design isn't listed here, the inspector
// falls back to the section-type fields in meta.ts (the shared A/B/C layouts).
const DESIGN_FIELDS: Record<string, readonly DesignField[]> = {
  "contact-simple": CONTACT_FIELDS,
  "contact-rich": CONTACT_FIELDS,
  "contact-booking": CONTACT_FIELDS,
  "contact-channels": CONTACT_FIELDS,
  "faq-accordion": FAQ_FIELDS,
  "faq-columns": FAQ_FIELDS,
  "faq-grouped": FAQ_FIELDS,
  "faq-qa": FAQ_FIELDS,
  "menu-tabs": MENU_FIELDS,
  "menu-sections": MENU_FIELDS,
  "menu-cards": MENU_FIELDS,
  "wa-band": WHATSAPP_FIELDS,
  "wa-centered": WHATSAPP_FIELDS,
  "wa-chat": WHATSAPP_FIELDS,
  "wa-floating": WHATSAPP_FIELDS,
  "map-split": MAP_FIELDS_BASE,
  "map-wide": MAP_FIELDS_BASE,
  "map-overlay": MAP_FIELDS_BASE,
  "map-branches": MAP_BRANCHES_FIELDS,
  "hours-table": HOURS_FIELDS,
  "hours-status": HOURS_FIELDS,
  "hours-week": HOURS_FIELDS,
  "hours-address": HOURS_FIELDS,
  "team-portraits": TEAM_FIELDS,
  "team-rows": TEAM_FIELDS,
  "team-squares": TEAM_FIELDS,
  "team-featured": TEAM_FIELDS,
  "gallery-mosaic": GALLERY_FIELDS,
  "gallery-bands": GALLERY_FIELDS,
  "gallery-stage": GALLERY_FIELDS,
  "gallery-columns": GALLERY_FIELDS,
  "reviews-grid": REVIEWS_FIELDS,
  "reviews-marquee": REVIEWS_FIELDS,
  "reviews-solo": REVIEWS_FIELDS,
  "reviews-summary": REVIEWS_FIELDS,
  // Field order MIRRORS each design's top-to-bottom visual flow (first field =
  // first thing on screen). The auto-filled identity field (shop name, not shown
  // in these photo-forward designs) sits last.

  // A — poster: eyebrow → title → body → CTAs → fact rule → photo.
  "barber-cinematic": [
    { key: "kicker", label: "سطر تمهيدي", type: "text" },
    { key: "titleLine1", label: "العنوان — السطر ١", type: "text" },
    { key: "titleLine2", label: "العنوان — السطر ٢", type: "text" },
    { key: "body", label: "النص", type: "textarea" },
    { key: "primaryCta", label: "زر أساسي", type: "text" },
    { key: "primaryLink", label: "وجهة الزر الأساسي", type: "link", defaultLink: { kind: "whatsapp" } },
    { key: "secondaryCta", label: "زر ثانوي", type: "text" },
    { key: "secondaryLink", label: "وجهة الزر الثانوي", type: "link", defaultLink: { kind: "section", value: "services" } },
    { key: "addressShort", label: "العنوان المختصر", type: "text" },
    { key: "rating", label: "التقييم", type: "text" },
    { key: "reviewCount", label: "عدد التقييمات", type: "text" },
    { key: "bgUrl", label: "صورة الخلفية", type: "image" },
    { key: "shopName", label: "اسم الصالون", type: "text" },
  ],
  // B — card: eyebrow → title → body → CTAs → facts → photo + caption.
  "barber-editorial": [
    { key: "established", label: "سنة التأسيس", type: "text" },
    { key: "city", label: "المدينة", type: "text" },
    { key: "titleLine1", label: "العنوان — السطر ١", type: "text" },
    { key: "titleLine2", label: "العنوان — السطر ٢", type: "text" },
    { key: "titleAccent", label: "الكلمة المميّزة", type: "text" },
    { key: "body", label: "النص", type: "textarea" },
    { key: "primaryCta", label: "زر أساسي", type: "text" },
    { key: "primaryLink", label: "وجهة الزر الأساسي", type: "link", defaultLink: { kind: "whatsapp" } },
    { key: "secondaryCta", label: "زر ثانوي", type: "text" },
    { key: "secondaryLink", label: "وجهة الزر الثانوي", type: "link", defaultLink: { kind: "section", value: "pricelist" } },
    { key: "yearsValue", label: "سنوات الخبرة (رقم)", type: "text" },
    { key: "yearsLabel", label: "سنوات الخبرة (وصف)", type: "text" },
    { key: "rating", label: "التقييم", type: "text" },
    { key: "reviewCount", label: "عدد التقييمات", type: "text" },
    { key: "portraitUrl", label: "الصورة الرئيسية", type: "image" },
    { key: "photoCaption", label: "تعليق الصورة", type: "text" },
    { key: "shopName", label: "اسم الصالون", type: "text" },
  ],
  // C — emblem: mark → latin name → title → body → CTAs → status.
  "barber-emblem": [
    { key: "monogram", label: "الحرف/الشعار", type: "text" },
    { key: "latinName", label: "الاسم اللاتيني", type: "text" },
    { key: "titleLine1", label: "العنوان — السطر ١", type: "text" },
    { key: "titleLine2", label: "العنوان — السطر ٢", type: "text" },
    { key: "body", label: "النص", type: "textarea" },
    { key: "primaryCta", label: "زر أساسي", type: "text" },
    { key: "primaryLink", label: "وجهة الزر الأساسي", type: "link", defaultLink: { kind: "whatsapp" } },
    { key: "secondaryCta", label: "زر ثانوي", type: "text" },
    { key: "secondaryLink", label: "وجهة الزر الثانوي", type: "link", defaultLink: { kind: "section", value: "services" } },
    { key: "addressShort", label: "العنوان المختصر", type: "text" },
    { key: "bgUrl", label: "صورة الخلفية", type: "image" },
    { key: "shopName", label: "اسم الصالون", type: "text" },
  ],

  // ── About (shared, all verticals). Fields mirror the visual flow. Values /
  // stats / milestones are repeatable `group` records, not flat inputs. ──
  // A — photo beside copy: eyebrow → title → lede → body → values → stats → badge → photo.
  "about-photo": [
    { key: "kicker", label: "سطر تمهيدي", type: "text" },
    { key: "titleLine1", label: "العنوان — السطر ١", type: "text" },
    { key: "titleLine2", label: "العنوان — السطر ٢ (مميّز)", type: "text" },
    { key: "lede", label: "المقدّمة", type: "textarea" },
    { key: "body", label: "النص", type: "textarea" },
    { key: "values", label: "القيم", type: "group", addLabel: "إضافة قيمة",
      fields: [{ key: "title", label: "العنوان" }, { key: "body", label: "الوصف", textarea: true }] },
    { key: "stats", label: "الأرقام", type: "group", addLabel: "إضافة رقم",
      fields: [{ key: "value", label: "الرقم" }, { key: "label", label: "الوصف" }] },
    { key: "badgeValue", label: "الشارة — الرقم", type: "text" },
    { key: "badgeLabel", label: "الشارة — الوصف", type: "text" },
    { key: "mainUrl", label: "الصورة", type: "image" },
  ],
  // B — centered statement: eyebrow → title → lede → body → value cards → stats → signature.
  "about-statement": [
    { key: "kicker", label: "سطر تمهيدي", type: "text" },
    { key: "titleLine1", label: "العنوان — السطر ١", type: "text" },
    { key: "titleLine2", label: "العنوان — السطر ٢ (مميّز)", type: "text" },
    { key: "lede", label: "المقدّمة", type: "textarea" },
    { key: "body", label: "النص", type: "textarea" },
    { key: "values", label: "القيم", type: "group", addLabel: "إضافة قيمة",
      fields: [{ key: "title", label: "العنوان" }, { key: "body", label: "الوصف", textarea: true }] },
    { key: "stats", label: "الأرقام", type: "group", addLabel: "إضافة رقم",
      fields: [{ key: "value", label: "الرقم" }, { key: "label", label: "الوصف" }] },
    { key: "signature", label: "التوقيع", type: "text" },
    { key: "signatureMeta", label: "التوقيع — التفصيل", type: "text" },
  ],
  // C — milestones beside a collage: eyebrow → title → lede → timeline → stats → 3 photos.
  "about-milestones": [
    { key: "kicker", label: "سطر تمهيدي", type: "text" },
    { key: "titleLine1", label: "العنوان — السطر ١", type: "text" },
    { key: "titleLine2", label: "العنوان — السطر ٢ (مميّز)", type: "text" },
    { key: "lede", label: "المقدّمة", type: "textarea" },
    { key: "milestones", label: "المحطّات", type: "group", addLabel: "إضافة محطّة",
      fields: [{ key: "year", label: "السنة" }, { key: "title", label: "العنوان" }, { key: "body", label: "الوصف", textarea: true }] },
    { key: "stats", label: "الأرقام", type: "group", addLabel: "إضافة رقم",
      fields: [{ key: "value", label: "الرقم" }, { key: "label", label: "الوصف" }] },
    { key: "mainUrl", label: "الصورة الرئيسية", type: "image" },
    { key: "detailUrl", label: "صورة جانبية", type: "image" },
    { key: "teamUrl", label: "صورة الفريق", type: "image" },
  ],

  // ── ServicesGrid (shared). The service items come from the site's services
  // list (edited in the services editor), so only the section's HEADER copy +
  // (photos design) its images are edited here. ──
  "services-numbered": [
    { key: "kicker", label: "سطر تمهيدي", type: "text" },
    { key: "title", label: "العنوان", type: "text" },
    { key: "lede", label: "المقدّمة", type: "textarea" },
    { key: "countLabel", label: "وصف العدد", type: "text" },
    { key: "footnote", label: "ملاحظة أسفل القسم", type: "textarea" },
    { key: "ctaLabel", label: "نص زر واتساب", type: "text" },
  ],
  "services-list": [
    { key: "kicker", label: "سطر تمهيدي", type: "text" },
    { key: "title", label: "العنوان", type: "text" },
    { key: "lede", label: "المقدّمة", type: "textarea" },
    { key: "countLabel", label: "وصف العدد", type: "text" },
    { key: "footnote", label: "ملاحظة أسفل القسم", type: "textarea" },
    { key: "ctaLabel", label: "نص زر واتساب", type: "text" },
  ],
  "services-photos": [
    { key: "kicker", label: "سطر تمهيدي", type: "text" },
    { key: "title", label: "العنوان", type: "text" },
    { key: "lede", label: "المقدّمة", type: "textarea" },
    { key: "countLabel", label: "وصف العدد", type: "text" },
    { key: "footnote", label: "ملاحظة أسفل القسم", type: "textarea" },
    { key: "ctaLabel", label: "نص زر واتساب", type: "text" },
    { key: "photo1Url", label: "صورة الخدمة ١", type: "image" },
    { key: "photo2Url", label: "صورة الخدمة ٢", type: "image" },
    { key: "photo3Url", label: "صورة الخدمة ٣", type: "image" },
  ],
};

/**
 * Editable fields for a section given its chosen design. Design-specific fields
 * win; otherwise the shared section-type fields (meta.ts) are normalized to the
 * DesignField shape.
 */
export function fieldsFor(sectionType: string, variant: string): readonly DesignField[] {
  const byDesign = DESIGN_FIELDS[variant];
  if (byDesign) return byDesign;
  // Legacy rows may still store a short key (A/B/C) for a section whose designs
  // moved to bespoke keys (Gallery/About/Services). Fall back to the section's
  // DEFAULT design fields when they exist, so those rows still expose the real
  // editor (e.g. the gallery photo list) instead of the old title-only fields.
  const defaultKey = designsForSection(sectionType)[0]?.key;
  if (defaultKey && DESIGN_FIELDS[defaultKey]) return DESIGN_FIELDS[defaultKey];
  return (SECTION_FIELDS[sectionType] ?? []).map((f) => ({
    key: f.key,
    label: f.label,
    type: f.textarea ? ("textarea" as const) : ("text" as const),
  }));
}

/** All design keys registered across every section (for server-side validation). */
export const KNOWN_DESIGN_KEYS: ReadonlySet<string> = new Set(
  Object.values(SECTION_DESIGNS).flatMap((list) => list.map((d) => d.key)),
);
