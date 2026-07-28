// Restaurant — template module. Wires the ready-made component to its
// editable-data defaults, the onboarding/editor field schema, and the small
// themeable color set (gold / warm / cream). Frozen allergen labels live inside
// the component.

import type { TemplateModule } from "../types";
import Component from "./component";

/** A believable default restaurant, so the design reads as complete before any
 *  edit (and the wizard/editor show real values, not blanks). */
const defaults = {
  shop: {
    name: "دار الياسمين",
    logo: "",
    tagline: "مطبخ شامي · أبو رمّانة",
    heroLine: "طعام دمشقي يُطبَخ كما كان يُطبَخ",
    heroLatin: "Dar Al-Yasmine · Damascus, since 1974",
    heroBlurb:
      "خمسون عامًا في بيت دمشقي واحد. القائمة تتغيّر مع الموسم، واللحم والخضار يوميّان — ولا شيء في مطبخنا مجمّد.",
    heroPhoto: "",
    brandNote: "Damascus · since 1974",
    openNote: "مفتوح الآن حتى ١٢:٠٠",
    address: "دمشق — أبو رمّانة، شارع الجلاء ١٢، مقابل حديقة السبكي",
    whatsapp: "+963933337788",
    phone: "+963 11 333 7788",
    since: "١٩٧٤",
    socials: { instagram: "", facebook: "", tiktok: "" },
  },
  pillars: [
    { icon: "farm", title: "من المزارع مباشرة", body: "اثنا عشر مزارعًا حول دمشق يوصلون الخضار واللبن أسبوعيًا — نعرفهم بالاسم." },
    { icon: "coal", title: "فحم بلوط، لا غاز", body: "كل ما يُشوى يمرّ على فحم البلوط. الطعم لا يأتي من مكان آخر." },
    { icon: "book", title: "وصفات لم تُحدَّث", body: "دفتر الوصفات نفسه منذ ١٩٧٤، بخطّ المؤسّس، بلا اختصارات." },
  ],
  courses: [
    { id: "mezze", label: "مقبّلات" },
    { id: "mains", label: "أطباق رئيسية" },
    { id: "grill", label: "من الفحم" },
    { id: "sea", label: "بحريات" },
    { id: "sweet", label: "حلويات" },
  ],
  dishes: [
    { course: "mezze", name: "حمّص بالصنوبر والزبدة", latin: "Hummus, pine nuts, brown butter", desc: "حمّص مطحون يدويًا مع زبدة مُحمّرة وصنوبر بلدي، يُقدَّم مع خبز التنّور الساخن.", price: "٦٥٬٠٠٠", mark: "", pair: "", allergens: ["G", "D", "N", "S"], photo: "" },
    { course: "mezze", name: "متبّل باذنجان مشوي على الحجر", latin: "Stone-roasted aubergine, tahini", desc: "باذنجان يُشوى على حجرٍ ساخن حتى يدخّن، مع طحينة وليمون ونعنع طازج.", price: "٥٥٬٠٠٠", mark: "نباتي", pair: "", allergens: ["S"], photo: "" },
    { course: "mezze", name: "كبّة نيّة بزيت الزيتون", latin: "Kibbeh nayyeh, first-press olive oil", desc: "لحم غنم طازج يُدقّ في الجرن مع البرغل الناعم، وزيت زيتون من عصرة هذا الموسم.", price: "١٢٠٬٠٠٠", mark: "الأكثر طلبًا", pair: "عرق بلدي مُعتَّق", allergens: ["G"], photo: "" },
    { course: "mains", name: "فتّة لحم غنم بالسمن", latin: "Lamb fatteh, clarified butter", desc: "طبقات من الخبز المحمّص واللبن ولحم الغنم المطبوخ ست ساعات، بسمنٍ بلدي وصنوبر.", price: "١٨٥٬٠٠٠", mark: "", pair: "Domaine de Bargylus — أحمر", allergens: ["G", "D", "N"], photo: "" },
    { course: "mains", name: "شيخ المحشي بالجوز", latin: "Sheikh el-mahshi, walnut", desc: "كوسا محشيّ بلحم الغنم والجوز في صلصة لبن، من مطبخ الجدّة تمامًا.", price: "١٦٥٬٠٠٠", mark: "", pair: "", allergens: ["D", "N"], photo: "" },
    { course: "grill", name: "مشاوي مختارة للطاولة", latin: "Selected charcoal grill, for the table", desc: "شيش طاووق، كستليتة غنم، وكباب خشخاش — تُشوى على فحم البلوط وتُقدَّم على صينية واحدة.", price: "٣٢٠٬٠٠٠", mark: "للمشاركة", pair: "Château Musar — أحمر", allergens: ["D", "H"], photo: "" },
    { course: "grill", name: "دجاج بالثوم والسمّاق", latin: "Charcoal chicken, garlic, sumac", desc: "نصف دجاج بلدي يُتبّل ليلة كاملة ويُشوى ببطء، مع ثوم مهروس وسمّاق.", price: "١٤٥٬٠٠٠", mark: "", pair: "", allergens: [], photo: "" },
    { course: "sea", name: "سمك الفرات بالطحينة", latin: "Euphrates fish, tahini crust", desc: "سمك يومي من الفرات، يُخبز بقشرة طحينة وبصل مكرمل ولوز محمّص.", price: "٢٢٠٬٠٠٠", mark: "طبق الموسم", pair: "Bargylus Blanc", allergens: ["F", "S", "N"], photo: "" },
    { course: "sea", name: "جمبري بالثوم والكزبرة", latin: "Prawns, garlic, coriander", desc: "جمبري متوسّطي يُقلى سريعًا بالثوم والكزبرة والفلفل الأخضر الحار.", price: "٢٤٥٬٠٠٠", mark: "", pair: "", allergens: ["F", "H"], photo: "" },
    { course: "sweet", name: "هريسة الجوز بالقشطة", latin: "Semolina cake, clotted cream", desc: "هريسة سمولينا تُخبز على الطلب، مع قشطة طازجة وقطر ماء الزهر.", price: "٧٥٬٠٠٠", mark: "", pair: "", allergens: ["G", "D", "N"], photo: "" },
    { course: "sweet", name: "مهلبية الفستق الحلبي", latin: "Pistachio mahalabia", desc: "مهلبية باردة بحليب الجاموس وفستق حلبي مجروش، ورشّة ماء ورد.", price: "٦٥٬٠٠٠", mark: "", pair: "", allergens: ["D", "N"], photo: "" },
  ],
  featured: [2, 5, 7],
  reviews: [
    { stars: "★★★★★", quote: "”أقرب طعم إلى بيت جدّتي في الشعلان. الفتّة وحدها تستحقّ الطريق.“", name: "ريم ع. · دمشق" },
    { stars: "★★★★★", quote: "”حجزنا قائمة التذوّق لعشاء العائلة، وخرجنا ونحن نتحدّث عن كل طبق.“", name: "سامر خ. · حلب" },
    { stars: "★★★★★", quote: "”خدمة هادئة ومطبخ يعرف ما يفعله. أطباق دمشقية بطعمها الأصيل.“", name: "Julien M. · Paris" },
  ],
  chef: {
    name: "الشيف نديم الحلبي",
    quote:
      "”المطبخ الشامي لا يحتاج تحديثًا — يحتاج أن يُطبخ كما كان يُطبخ، بمكوّنات بهذه الجودة. هذا كل ما نفعله هنا.“",
    photo: "",
    stats: [
      { value: "٥٠", label: "عامًا" },
      { value: "٧", label: "أطباق تذوّق" },
      { value: "١٢", label: "مزارعًا" },
    ],
  },
  hall: {
    title: "الطابق العلوي للمجموعات",
    body:
      "قاعة دمشقية بسقف خشبي تتّسع لأربعين شخصًا، مع قائمة مُتّفق عليها مسبقًا. تُحجز كاملة للعائلات والشركات، وتُجهَّز في يومين.",
    photo: "",
  },
  milestones: [
    { year: "١٩٧٤", title: "أول موقد", body: "افتُتح المطعم بستّ طاولات في بيت دمشقي قديم." },
    { year: "١٩٩١", title: "الجيل الثاني", body: "تسلّم أبناء المؤسّس المطبخ، وبقيت الوصفات كما هي." },
    { year: "٢٠٠٨", title: "المزارع الشركاء", body: "بدأنا الشراء المباشر من اثني عشر مزارعًا حول دمشق." },
    { year: "اليوم", title: "قائمة التذوّق", body: "سبعة أطباق تتغيّر كل موسم، يقدّمها الشيف بنفسه.", now: true },
  ],
  gallery: [
    { label: "زيت الزيتون", photo: "" },
    { label: "الفحم", photo: "" },
    { label: "خبز التنّور", photo: "" },
    { label: "الصالة", photo: "" },
    { label: "التحضير", photo: "" },
  ],
  // One row per weekday (Syrian week order). Same-hours days are collapsed into
  // ranges on the site; edited via dropdowns in the settings panel.
  hours: [
    { day: "السبت", open: "١٢:٣٠ م", close: "١٢:٠٠ ص" },
    { day: "الأحد", open: "١٢:٣٠ م", close: "١٢:٠٠ ص" },
    { day: "الاثنين", closed: true },
    { day: "الثلاثاء", open: "١٢:٣٠ م", close: "١١:٣٠ م" },
    { day: "الأربعاء", open: "١٢:٣٠ م", close: "١١:٣٠ م" },
    { day: "الخميس", open: "١٢:٣٠ م", close: "١١:٣٠ م" },
    { day: "الجمعة", open: "١٢:٣٠ م", close: "١٢:٠٠ ص" },
  ],
  reservation: {
    days: [
      { label: "الخميس", date: "٣٠/٧" },
      { label: "الجمعة", date: "٣١/٧" },
      { label: "السبت", date: "١/٨" },
      { label: "الأحد", date: "٢/٨" },
    ],
  },
  visit: {
    parking: "مواقف مجانية في الشارع الخلفي بعد السابعة مساءً",
  },
  showGallery: true,
};

export const restaurant: TemplateModule = {
  key: "restaurant",
  label: "مطعم",
  vertical: "restaurant",
  description:
    "قالب مطعم راقٍ: قائمة طعام بأقسام، قصة المطعم، وحجز طاولة عبر واتساب. عربي بالكامل.",
  tags: ["مطعم", "مطبخ شامي", "قائمة طعام", "حجز طاولة", "أطباق", "عربي", "دمشق"],
  // Catalog cover — a static asset (see public/template-covers). Until the file
  // is dropped in, the gallery shows its generated poster fallback.
  cover: "/template-covers/restaurant.webp",
  // The template has its own strict prop shape; the host spreads merged content
  // onto it, so we widen through `unknown` at this single boundary.
  Component: Component as unknown as TemplateModule["Component"],
  defaults,
  nameKey: "shop.name",
  // Default price unit shown across the site (owner can change it in settings).
  defaultCurrency: "SYP",
  // The template ships its own font — no font override in the appearance tab.
  themeFont: false,
  tokens: [
    { key: "accent", label: "لون التمييز", cssVar: "--color-gold", default: "oklch(0.76 0.09 85)" },
    { key: "ground", label: "الخلفية", cssVar: "--color-warm", default: "oklch(0.115 0.006 60)" },
    { key: "ink", label: "لون النص", cssVar: "--color-cream", default: "oklch(0.96 0.01 85)" },
  ],
  // Ready-made colorways — the owner picks one instead of raw colors. "ذهبي دمشقي"
  // equals the token defaults so an untouched site reads as that palette.
  palettes: [
    // ── Dark ──────────────────────────────────────────────────────────────
    { key: "damascene", label: "ذهبي دمشقي", tone: "dark", isDefault: true, mood: "داكن دافئ", colors: { accent: "oklch(0.76 0.09 85)", ground: "oklch(0.115 0.006 60)", ink: "oklch(0.96 0.01 85)" } },
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
      title: "معلومات التواصل",
      hint: "طرق التواصل والعنوان. النصوص والصور والأقسام والأطباق تُحرَّر مباشرةً على الموقع.",
      fields: [
        // الاسم، الشعار، نصوص الواجهة، الأطباق، القصة، المعرض — كلها inline على
        // المعاينة (نقر مزدوج). هنا فقط ما لا يظهر كنص قابل للتحرير.
        { key: "shop.whatsapp", label: "رقم واتساب", type: "phone", help: "إلزامي — عليه تصل طلبات الحجز." },
        { key: "shop.phone", label: "الهاتف", type: "phone" },
        { key: "shop.address", label: "العنوان", type: "text" },
        { key: "shop.socials.instagram", label: "رابط إنستغرام", type: "text", ltr: true, placeholder: "https://instagram.com/…", help: "تظهر الأيقونة في الترويسة والتذييل عند إضافة الرابط." },
        { key: "shop.socials.facebook", label: "رابط فيسبوك", type: "text", ltr: true, placeholder: "https://facebook.com/…" },
        { key: "shop.socials.tiktok", label: "رابط تيك توك", type: "text", ltr: true, placeholder: "https://tiktok.com/@…" },
      ],
    },
    // القائمة، قصة المطعم، والمعرض تُحرَّر INLINE على المعاينة الحيّة (نقر مزدوج
    // للتعديل، تمرير للحذف، ＋ للإضافة) — انظر مكوّن المطعم. لا تظهر في اللوحة الجانبية.
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
