// The marketplace's SINGLE SOURCE of truth (build spec §7): the per-vertical
// field set drives the create/edit stepper, the public filter rail, the review
// chips, AND the detail specs. Add a field here and it appears in all of them.
//
// Pure data + types — no React, no DB. Shared by the public template component
// and the dashboard authoring stepper. Arabic-first (labels/opts in Arabic;
// numbers render as Arabic-Indic in the UI layer).

export type Vertical = "car" | "home";
// text: free text · number: numeric input (+ unit/currency) · select: dropdown
// enum (long option lists) · chips: button enum (short lists) · multi: many-select
// · phone: our phone input · area: textarea · photos: image uploader.
export type FieldType = "text" | "number" | "select" | "chips" | "multi" | "area" | "photos" | "phone";
export type FilterKind = "range" | "chips" | "multi";

const arDigits = (v: string | number) => String(v).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);

/** Model-year options (newest first) — a select enum, regenerated each year. */
export const YEARS: string[] = (() => {
  const start = new Date().getFullYear() + 1;
  const out: string[] = [];
  for (let y = start; y >= 1990; y--) out.push(arDigits(y));
  return out;
})();

/** Syrian governorates — the city select enum. */
export const CITIES = [
  "دمشق", "ريف دمشق", "حلب", "حمص", "حماة", "اللاذقية", "طرطوس",
  "إدلب", "درعا", "السويداء", "القنيطرة", "دير الزور", "الرقة", "الحسكة", "أخرى",
];

export interface FieldDef {
  k: string;
  label: string;
  type: FieldType;
  req: boolean;
  /** This field also appears as a filter for visitors (build spec's core idea). */
  filter: boolean;
  opts?: string[];
  unit?: string; // "" means "use the site currency symbol"
  placeholder?: string;
  hint?: string;
  full?: boolean; // span both columns
}

export interface StepDef {
  id: string;
  label: string;
  title: string;
  hint: string;
  fields: FieldDef[];
}

export interface FilterDef {
  k: string;
  kind: FilterKind;
  label: string;
  opts?: string[];
  min?: number;
  max?: number;
  step?: number;
  money?: boolean; // bounds derived from the actual listings; renders with currency
  unit?: string;
}

export type ListingStatus = "available" | "reserved" | "sold";

export const STATUS_LABEL: Record<ListingStatus, string> = {
  available: "متاح",
  reserved: "محجوز",
  sold: "مُباع",
};

/** A listing as the template component consumes it (serializable; DB-decoupled). */
export interface MarketplaceListing {
  id: string;
  vertical: Vertical;
  title: string;
  price: number | null;
  offer?: string | null; // homes: "إيجار" | "بيع"
  place?: string | null;
  description?: string | null;
  images: string[];
  features: string[];
  specs: Record<string, string | number>;
  featured?: boolean;
  status?: ListingStatus;
}

export const VERTICAL_LABEL: Record<Vertical, string> = { car: "سيارات", home: "عقارات" };
export const VERTICAL_WORD: Record<Vertical, string> = { car: "سوق السيارات", home: "سوق العقارات" };

export const OFFER_RENT = "إيجار";
export const OFFER_BUY = "بيع";

/* ─────────────────────────── extras (multi) ─────────────────────────── */

const CAR_EXTRAS = [
  "ملاحة", "كاميرا خلفية", "حساسات ركن", "مقاعد مدفأة",
  "فتحة سقف", "خطاف جر", "مثبت سرعة", "شاشة لمس",
];
const HOME_EXTRAS = [
  "شرفة", "حديقة", "مصعد", "موقف سيارات", "قبو",
  "مفروش", "يسمح بالحيوانات", "تدفئة أرضية", "مطبخ مجهز",
];

/* ───────────────────────────── filters ──────────────────────────────── */

export const FILTERS: Record<Vertical, FilterDef[]> = {
  car: [
    { k: "price", kind: "range", label: "السعر حتى", money: true },
    { k: "km", kind: "range", label: "المسافة حتى", min: 0, max: 300000, step: 10000, unit: " كم" },
    { k: "fuel", kind: "chips", label: "الوقود", opts: ["بنزين", "ديزل", "هجين", "كهرباء"] },
    { k: "trans", kind: "chips", label: "ناقل الحركة", opts: ["يدوي", "أوتوماتيك"] },
    { k: "body", kind: "chips", label: "نوع الهيكل", opts: ["هاتشباك", "سيدان", "ستيشن", "دفع رباعي", "فان"] },
    { k: "seatsMin", kind: "chips", label: "المقاعد", opts: ["+٤", "+٥", "+٧"] },
    { k: "features", kind: "multi", label: "الإضافات", opts: CAR_EXTRAS },
  ],
  home: [
    { k: "offer", kind: "chips", label: "العرض", opts: [OFFER_RENT, OFFER_BUY] },
    { k: "price", kind: "range", label: "السعر حتى", money: true },
    { k: "type", kind: "chips", label: "نوع العقار", opts: ["شقة", "منزل", "استوديو", "دوبلكس"] },
    { k: "roomsMin", kind: "chips", label: "عدد الغرف", opts: ["+١", "+٢", "+٣", "+٤"] },
    { k: "sizeMin", kind: "range", label: "المساحة من", min: 0, max: 500, step: 10, unit: " م²" },
    { k: "heat", kind: "chips", label: "التدفئة", opts: ["مركزية", "غاز", "كهرباء", "مكيّف"] },
    { k: "features", kind: "multi", label: "الإضافات", opts: HOME_EXTRAS },
  ],
};

/* ─────────────────────── the create/edit stepper ────────────────────── */

export const STEPS: Record<Vertical, StepDef[]> = {
  car: [
    {
      id: "vehicle", label: "المركبة", title: "ما الذي تبيعه؟",
      hint: "الشركة والطراز وسنة الصنع تحدّد مكان سيارتك في النتائج.",
      fields: [
        { k: "make", label: "الشركة الصانعة", type: "chips", req: true, filter: true, opts: ["تويوتا", "هيونداي", "كيا", "مرسيدس", "BMW", "فولكس واغن", "شفروليه", "نيسان", "أخرى"], hint: "المشترون يبحثون بالشركة أكثر من أي شيء." },
        { k: "model", label: "الطراز", type: "text", req: true, filter: true, placeholder: "كامري LE", hint: "اكتبه كما في أوراق السيارة." },
        { k: "year", label: "سنة الصنع", type: "select", req: true, filter: true, opts: YEARS, placeholder: "اختر السنة" },
        { k: "body", label: "نوع الهيكل", type: "chips", req: true, filter: true, opts: ["هاتشباك", "سيدان", "ستيشن", "دفع رباعي", "فان"] },
      ],
    },
    {
      id: "price", label: "السعر والمسافة", title: "السعر وعدد الكيلومترات",
      hint: "كلاهما فلتر نطاقي، فالرقم الواقعي يُبقيك ضمن عمليات البحث الفعلية.",
      fields: [
        { k: "price", label: "السعر المطلوب", type: "number", req: true, filter: true, unit: "", placeholder: "18500" },
        { k: "km", label: "عدد الكيلومترات", type: "number", req: true, filter: true, unit: "كم", placeholder: "62000" },
        { k: "cond", label: "الحالة", type: "chips", req: true, filter: true, opts: ["جديدة", "مستعملة", "تحتاج صيانة"] },
        { k: "owners", label: "عدد المالكين السابقين", type: "chips", req: false, filter: true, opts: ["١", "٢", "٣", "٤", "٥+"], hint: "اختياري، لكن المشترين ينتبهون له." },
      ],
    },
    {
      id: "engine", label: "المحرك", title: "المحرك وناقل الحركة",
      hint: "الوقود وناقل الحركة أول فلترين يضبطهما أغلب المشترين.",
      fields: [
        { k: "fuel", label: "الوقود", type: "chips", req: true, filter: true, opts: ["بنزين", "ديزل", "هجين", "كهرباء"] },
        { k: "trans", label: "ناقل الحركة", type: "chips", req: true, filter: true, opts: ["يدوي", "أوتوماتيك"] },
        { k: "hp", label: "القوة", type: "number", req: false, filter: true, unit: "حصان", placeholder: "203" },
        { k: "drive", label: "نظام الدفع", type: "chips", req: false, filter: true, opts: ["أمامي", "خلفي", "رباعي"] },
      ],
    },
    {
      id: "photos", label: "الصور والوصف", title: "الصور والوصف",
      hint: "الصورة الأولى هي ما يراه المشتري في النتائج. أربع صور تكفي لتؤخذ على محمل الجد.",
      fields: [
        { k: "photos", label: "الصور", type: "photos", req: true, filter: false, hint: "أضف الصور. الأولى تصبح صورة الغلاف." },
        { k: "title", label: "عنوان الإعلان", type: "text", req: true, filter: false, placeholder: "تويوتا كامري ٢٠٢١، مالك واحد" },
        { k: "desc", label: "الوصف", type: "area", req: false, filter: false, full: true, placeholder: "سجل الصيانة، الإطارات، ما يشمله البيع…", hint: "اذكر ما قد يضطر المشتري لسؤاله." },
      ],
    },
    {
      id: "contact", label: "التواصل", title: "كيف يصل إليك المشترون؟",
      hint: "المدينة فلتر أيضًا — أغلب المشترين يبدؤون بمنطقتهم.",
      fields: [
        { k: "seller", label: "اسمك", type: "text", req: true, filter: false, placeholder: "م. خالد" },
        { k: "place", label: "المدينة", type: "select", req: true, filter: true, opts: CITIES, placeholder: "اختر المدينة" },
        { k: "phone", label: "رقم الهاتف", type: "phone", req: true, filter: false, hint: "يظهر فقط بعد أن يضغط المشتري لإظهاره." },
        { k: "sellerKind", label: "الصفة", type: "chips", req: false, filter: true, opts: ["بائع خاص", "معرض"] },
      ],
    },
  ],
  home: [
    {
      id: "property", label: "العقار", title: "ما الذي تعرضه؟",
      hint: "نوع العرض ونوع العقار أول فلترين يضبطهما الزائر.",
      fields: [
        { k: "offer", label: "العرض", type: "chips", req: true, filter: true, opts: [OFFER_RENT, OFFER_BUY] },
        { k: "type", label: "نوع العقار", type: "chips", req: true, filter: true, opts: ["شقة", "منزل", "استوديو", "دوبلكس"] },
        { k: "place", label: "المدينة", type: "select", req: true, filter: true, opts: CITIES, placeholder: "اختر المدينة" },
        { k: "district", label: "المنطقة", type: "text", req: false, filter: true, placeholder: "المزة", hint: "اختياري، وكثير البحث." },
      ],
    },
    {
      id: "facts", label: "المعلومات الأساسية", title: "السعر والمساحة والغرف",
      hint: "هذه الثلاثة تحمل أغلب عمليات البحث. الغرف والمساحة فلاتر نطاقية.",
      fields: [
        { k: "price", label: "السعر", type: "number", req: true, filter: true, unit: "", placeholder: "95000", hint: "الإيجار الشهري أو سعر البيع." },
        { k: "size", label: "المساحة", type: "number", req: true, filter: true, unit: "م²", placeholder: "145" },
        { k: "rooms", label: "عدد الغرف", type: "chips", req: true, filter: true, opts: ["١", "٢", "٣", "٤", "٥", "٦", "٧", "٨+"] },
        { k: "baths", label: "عدد الحمامات", type: "chips", req: false, filter: true, opts: ["١", "٢", "٣", "٤+"] },
      ],
    },
    {
      id: "building", label: "المبنى", title: "المبنى نفسه",
      hint: "التدفئة وسنة البناء يهمّان كل من يفكّر في تكاليف التشغيل.",
      fields: [
        { k: "floor", label: "الطابق", type: "number", req: true, filter: true, placeholder: "4", hint: "٠ للطابق الأرضي." },
        { k: "built", label: "سنة البناء", type: "select", req: true, filter: true, opts: YEARS, placeholder: "اختر السنة" },
        { k: "heat", label: "التدفئة", type: "chips", req: true, filter: true, opts: ["مركزية", "غاز", "كهرباء", "مكيّف"] },
        { k: "cond", label: "الحالة", type: "chips", req: false, filter: true, opts: ["جديد", "مجدّد", "جيد", "يحتاج صيانة"] },
      ],
    },
    {
      id: "photos", label: "الصور والوصف", title: "الصور والوصف",
      hint: "غرف فارغة في وضح النهار. الصورة الأولى هي التي تظهر في النتائج.",
      fields: [
        { k: "photos", label: "الصور", type: "photos", req: true, filter: false, hint: "أضف الصور. الأولى تصبح صورة الغلاف." },
        { k: "title", label: "عنوان الإعلان", type: "text", req: true, filter: false, placeholder: "شقة مشمسة ٣ غرف مع شرفة" },
        { k: "desc", label: "الوصف", type: "area", req: false, filter: false, full: true, placeholder: "التوزيع، الإضاءة، الشارع، ما يقرب منها…", hint: "اذكر ما لا تُظهره الصور." },
      ],
    },
    {
      id: "contact", label: "التواصل", title: "من يعرض العقار؟",
      hint: "طلبات المعاينة تصل مباشرة إلى جهة الاتصال هذه.",
      fields: [
        { k: "seller", label: "اسمك", type: "text", req: true, filter: false, placeholder: "أ. سمير" },
        { k: "phone", label: "رقم الهاتف", type: "phone", req: true, filter: false, hint: "يظهر فقط بعد أن يضغط الزائر لإظهاره." },
        { k: "sellerKind", label: "الصفة", type: "chips", req: false, filter: true, opts: ["مالك", "مكتب عقاري"] },
        { k: "available", label: "متاح اعتبارًا من", type: "text", req: false, filter: true, placeholder: "١ أيلول" },
      ],
    },
  ],
};

/* ─────────────────────────── boost (optional) ───────────────────────── */

export const BOOST: Record<Vertical, FieldDef[]> = {
  car: [
    { k: "colour", label: "اللون", type: "chips", req: false, filter: true, opts: ["أسود", "أبيض", "رمادي", "فضي", "أزرق", "أحمر", "أخضر"], hint: "فلتر بحد ذاته." },
    { k: "seats", label: "عدد المقاعد", type: "chips", req: false, filter: true, opts: ["٢", "٤", "٥", "٧", "٨"], hint: "العائلات تفلتر بهذا." },
    { k: "doors", label: "عدد الأبواب", type: "chips", req: false, filter: true, opts: ["٣", "٤", "٥"] },
    { k: "service", label: "سجل الصيانة", type: "chips", req: false, filter: true, opts: ["كامل", "جزئي", "لا يوجد"], hint: "أكبر إشارة ثقة في سيارة مستعملة." },
    { k: "warranty", label: "الكفالة حتى", type: "text", req: false, filter: false, placeholder: "٠٣/٢٠٢٧", hint: "تظهر كشارة على بطاقتك." },
    { k: "consumption", label: "استهلاك الوقود", type: "number", req: false, filter: false, unit: "ل/١٠٠كم", placeholder: "7.5" },
    { k: "features", label: "الإضافات", type: "multi", req: false, filter: true, full: true, opts: CAR_EXTRAS, hint: "كل إضافة تختارها فلتر إضافي تظهر فيه." },
  ],
  home: [
    { k: "beds", label: "غرف النوم", type: "chips", req: false, filter: true, opts: ["١", "٢", "٣", "٤", "٥"], hint: "يُبحث عنها بقدر إجمالي الغرف." },
    { k: "energy", label: "فئة الطاقة", type: "chips", req: false, filter: true, opts: ["A", "B", "C", "D", "E"] },
    { k: "deposit", label: "التأمين", type: "text", req: false, filter: false, unit: "", placeholder: "٣ أشهر", hint: "المستأجرون يفلترونه مبكرًا." },
    { k: "orientation", label: "الاتجاه", type: "chips", req: false, filter: true, opts: ["شمال", "شرق", "جنوب", "غرب"] },
    { k: "pets", label: "الحيوانات الأليفة", type: "chips", req: false, filter: true, opts: ["مسموح", "حسب الطلب", "غير مسموح"] },
    { k: "plot", label: "مساحة الأرض", type: "number", req: false, filter: false, unit: "م²", placeholder: "420", hint: "للمنازل فقط." },
    { k: "commission", label: "العمولة", type: "chips", req: false, filter: true, opts: ["لا يوجد", "على المشتري", "مناصفة"] },
    { k: "features", label: "الإضافات", type: "multi", req: false, filter: true, full: true, opts: HOME_EXTRAS, hint: "كل إضافة تختارها فلتر إضافي تظهر فيه." },
  ],
};

export const SORTS = [
  { k: "new", label: "الأحدث" },
  { k: "asc", label: "السعر ↑" },
  { k: "desc", label: "السعر ↓" },
] as const;
export type SortKey = (typeof SORTS)[number]["k"];

/** The labelled specs shown on a listing's detail page, per vertical, in order. */
export const DETAIL_SPECS: Record<Vertical, { k: string; label: string; unit?: string }[]> = {
  car: [
    { k: "make", label: "الشركة" },
    { k: "model", label: "الطراز" },
    { k: "year", label: "سنة الصنع" },
    { k: "km", label: "المسافة", unit: "كم" },
    { k: "fuel", label: "الوقود" },
    { k: "trans", label: "ناقل الحركة" },
    { k: "body", label: "نوع الهيكل" },
    { k: "hp", label: "القوة", unit: "حصان" },
    { k: "drive", label: "نظام الدفع" },
    { k: "colour", label: "اللون" },
    { k: "seats", label: "المقاعد" },
    { k: "doors", label: "الأبواب" },
    { k: "cond", label: "الحالة" },
    { k: "owners", label: "المالكون السابقون" },
    { k: "service", label: "سجل الصيانة" },
    { k: "consumption", label: "الاستهلاك", unit: "ل/١٠٠كم" },
  ],
  home: [
    { k: "type", label: "نوع العقار" },
    { k: "size", label: "المساحة", unit: "م²" },
    { k: "rooms", label: "الغرف" },
    { k: "beds", label: "غرف النوم" },
    { k: "baths", label: "الحمامات" },
    { k: "floor", label: "الطابق" },
    { k: "built", label: "سنة البناء" },
    { k: "heat", label: "التدفئة" },
    { k: "cond", label: "الحالة" },
    { k: "energy", label: "فئة الطاقة" },
    { k: "orientation", label: "الاتجاه" },
    { k: "plot", label: "مساحة الأرض", unit: "م²" },
    { k: "district", label: "المنطقة" },
    { k: "available", label: "متاح من" },
    { k: "pets", label: "الحيوانات" },
    { k: "commission", label: "العمولة" },
  ],
};

/** The short spec line under a card title (build spec: the vertical's identity). */
export function cardSpecLine(l: MarketplaceListing): string {
  const s = l.specs;
  if (l.vertical === "car") {
    return [s.year ? arDigits(s.year) : null, s.km != null ? `${arDigits(s.km)} كم` : null, s.fuel, s.trans]
      .filter(Boolean)
      .join(" · ");
  }
  return [s.type, s.size != null ? `${arDigits(s.size)} م²` : null, s.rooms != null ? `${arDigits(s.rooms)} غرف` : null, l.place]
    .filter(Boolean)
    .join(" · ");
}

/** Fields whose values free-text search also matches (besides the title). */
export const SEARCH_KEYS: Record<Vertical, string[]> = {
  car: ["make", "model"],
  home: ["type", "district"],
};

/* ─────────────────────── form ↔ listing payload ─────────────────────── */

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
/** Spec keys stored as numbers (so sort/filter compare numerically). */
const NUMERIC_SPEC = new Set([
  "year", "km", "size", "rooms", "beds", "baths", "floor", "built", "hp", "owners", "seats", "doors", "plot",
]);

/** Parse an Arabic-or-Latin numeric string to a number (null if none). */
export function parseNum(v: string | null | undefined): number | null {
  if (v == null) return null;
  const latin = String(v).replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
  const n = parseFloat(latin.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** The listing payload shape (create/update) built from the stepper's flat form. */
export interface ListingPayload {
  vertical: Vertical;
  title: string;
  price: number | null;
  offer: string | null;
  place: string | null;
  description: string | null;
  images: string[];
  features: string[];
  specs: Record<string, string | number>;
}

/** Split the stepper's flat form map into the listing's columns + specs JSON. */
export function formToListing(vertical: Vertical, form: Record<string, string | string[]>): ListingPayload {
  const specs: Record<string, string | number> = {};
  let title = "", price: number | null = null, offer: string | null = null;
  let place: string | null = null, description: string | null = null;
  let images: string[] = [], features: string[] = [];
  for (const [k, v] of Object.entries(form)) {
    if (k === "title") title = String(v);
    else if (k === "price") price = parseNum(v as string);
    else if (k === "offer") offer = (v as string) || null;
    else if (k === "place") place = (v as string) || null;
    else if (k === "desc") description = (v as string) || null;
    else if (k === "photos") images = Array.isArray(v) ? v : [];
    else if (k === "features") features = Array.isArray(v) ? v : [];
    else if (typeof v === "string" && v.trim()) specs[k] = NUMERIC_SPEC.has(k) ? (parseNum(v) ?? v) : v;
  }
  return { vertical, title, price, offer, place, description, images, features, specs };
}
