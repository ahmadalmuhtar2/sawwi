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
    latinName: "Dar Al-Yasmine",
    tagline: "مطبخ شامي · أبو رمّانة",
    heroLine: "طعام دمشقي يُطبَخ كما كان يُطبَخ",
    heroLatin: "Dar Al-Yasmine · Damascus, since 1974",
    heroBlurb:
      "خمسون عامًا في بيت دمشقي واحد. القائمة تتغيّر مع الموسم، واللحم والخضار يوميّان — ولا شيء في مطبخنا مجمّد.",
    heroPhoto: "",
    brandNote: "Damascus · since 1974",
    openNote: "مفتوح الآن حتى ١٢:٠٠",
    address: "دمشق — أبو رمّانة، شارع الجلاء ١٢، مقابل حديقة السبكي",
    mapsUrl: "",
    whatsapp: "+963933337788",
    phone: "+963 11 333 7788",
    since: "١٩٧٤",
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
  hours: [
    { days: "الثلاثاء – الخميس", time: "١٢:٣٠ – ١١:٣٠" },
    { days: "الجمعة – الأحد", time: "١٢:٣٠ – ١٢:٠٠" },
    { days: "الاثنين", time: "مغلق" },
  ],
  reservation: {
    days: [
      { label: "الخميس", date: "٣٠/٧" },
      { label: "الجمعة", date: "٣١/٧" },
      { label: "السبت", date: "١/٨" },
      { label: "الأحد", date: "٢/٨" },
    ],
    times: ["٧:٣٠", "٨:٣٠", "٩:٣٠", "١٠:٣٠"],
    party: ["٢", "٣", "٤", "٦", "٨"],
  },
  visit: {
    parking: "مواقف مجانية في الشارع الخلفي بعد السابعة مساءً",
    mapPhoto: "",
    directionsUrl: "",
  },
  socials: [
    { title: "إنستغرام", glyph: "◎" },
    { title: "فيسبوك", glyph: "f" },
    { title: "تيك توك", glyph: "♪" },
  ],
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
  themeFont: true,
  tokens: [
    { key: "accent", label: "لون التمييز", cssVar: "--color-gold", default: "oklch(0.76 0.09 85)" },
    { key: "ground", label: "الخلفية", cssVar: "--color-warm", default: "oklch(0.115 0.006 60)" },
    { key: "ink", label: "لون النص", cssVar: "--color-cream", default: "oklch(0.96 0.01 85)" },
  ],
  steps: [
    {
      key: "shop",
      title: "معلومات المطعم",
      hint: "الاسم، نبذة الواجهة، وطرق التواصل.",
      fields: [
        { key: "shop.name", label: "اسم المطعم", type: "text", placeholder: "دار الياسمين" },
        { key: "shop.latinName", label: "الاسم اللاتيني", type: "text", placeholder: "Dar Al-Yasmine" },
        { key: "shop.tagline", label: "الشعار", type: "text", placeholder: "مطبخ شامي · أبو رمّانة" },
        { key: "shop.heroLine", label: "عنوان الواجهة", type: "text" },
        { key: "shop.heroBlurb", label: "نبذة الواجهة", type: "textarea" },
        { key: "shop.heroPhoto", label: "صورة الواجهة", type: "image" },
        { key: "shop.openNote", label: "ملاحظة الدوام", type: "text", placeholder: "مفتوح الآن حتى ١٢:٠٠" },
        { key: "shop.whatsapp", label: "رقم واتساب", type: "phone", help: "إلزامي — عليه تصل طلبات الحجز." },
        { key: "shop.phone", label: "الهاتف", type: "phone" },
        { key: "shop.address", label: "العنوان", type: "text" },
        { key: "shop.mapsUrl", label: "رابط الخريطة", type: "text" },
      ],
    },
    {
      key: "menu",
      title: "القائمة",
      hint: "الأقسام والأطباق مع الأسعار ومسبّبات الحساسية.",
      fields: [
        {
          key: "courses", label: "أقسام القائمة", type: "categories", itemLabel: "قسم",
          optionValue: "id", optionLabel: "label",
          dependents: { list: "dishes", key: "course" },
          placeholder: "مثال: مقبّلات",
        },
        {
          key: "dishes", label: "الأطباق", type: "list", itemLabel: "طبق",
          blank: { course: "", name: "", latin: "", desc: "", price: "", mark: "", pair: "", photo: "" },
          item: [
            {
              key: "course", label: "القسم", type: "select",
              optionsFrom: "courses", optionValue: "id", optionLabel: "label",
              placeholder: "اختر القسم",
            },
            { key: "name", label: "اسم الطبق", type: "text" },
            { key: "latin", label: "الاسم اللاتيني", type: "text" },
            { key: "desc", label: "الوصف", type: "textarea" },
            { key: "price", label: "السعر", type: "text", placeholder: "٦٥٬٠٠٠" },
            { key: "mark", label: "وسم (اختياري)", type: "text", placeholder: "الأكثر طلبًا" },
            { key: "pair", label: "يُقترح معه (اختياري)", type: "text" },
            { key: "photo", label: "صورة", type: "image" },
          ],
        },
      ],
    },
    {
      key: "about",
      title: "قصة المطعم",
      hint: "الشيف، «لماذا هنا»، والمسيرة.",
      fields: [
        { key: "chef.name", label: "اسم الشيف", type: "text", placeholder: "الشيف نديم الحلبي" },
        { key: "chef.quote", label: "اقتباس الشيف", type: "textarea" },
        { key: "chef.photo", label: "صورة الشيف", type: "image" },
        {
          key: "chef.stats", label: "أرقام لافتة", type: "list", itemLabel: "رقم",
          blank: { value: "", label: "" },
          item: [
            { key: "value", label: "القيمة", type: "text", placeholder: "٥٠" },
            { key: "label", label: "الوصف", type: "text", placeholder: "عامًا" },
          ],
        },
        {
          key: "pillars", label: "لماذا هنا", type: "list", itemLabel: "ميزة",
          blank: { icon: "", title: "", body: "" },
          item: [
            { key: "icon", label: "الأيقونة (farm / coal / book)", type: "text", placeholder: "farm" },
            { key: "title", label: "العنوان", type: "text" },
            { key: "body", label: "الوصف", type: "textarea" },
          ],
        },
        {
          key: "milestones", label: "المسيرة", type: "list", itemLabel: "محطة",
          blank: { year: "", title: "", body: "" },
          item: [
            { key: "year", label: "السنة", type: "text", placeholder: "١٩٧٤" },
            { key: "title", label: "العنوان", type: "text" },
            { key: "body", label: "الوصف", type: "textarea" },
          ],
        },
        { key: "hall.title", label: "قاعة المناسبات — العنوان", type: "text", placeholder: "الطابق العلوي للمجموعات" },
        { key: "hall.body", label: "قاعة المناسبات — الوصف", type: "textarea" },
        { key: "hall.photo", label: "قاعة المناسبات — الصورة", type: "image" },
        {
          key: "gallery", label: "معرض الصور", type: "list", itemLabel: "صورة",
          blank: { label: "", photo: "" },
          item: [
            { key: "label", label: "الوصف", type: "text", placeholder: "الصالة" },
            { key: "photo", label: "الصورة", type: "image" },
          ],
        },
      ],
    },
    {
      key: "visit",
      title: "الحجز والزيارة",
      hint: "أوقات العمل، خيارات الحجز، والوصول.",
      fields: [
        {
          key: "hours", label: "أوقات العمل", type: "list", itemLabel: "صف",
          blank: { days: "", time: "" },
          item: [
            { key: "days", label: "الأيام", type: "text", placeholder: "الثلاثاء – الخميس" },
            { key: "time", label: "الوقت", type: "text", placeholder: "١٢:٣٠ – ١١:٣٠" },
          ],
        },
        { key: "visit.parking", label: "المواقف", type: "text", placeholder: "مواقف مجانية في الشارع الخلفي" },
        { key: "visit.mapPhoto", label: "صورة الخريطة", type: "image" },
        { key: "visit.directionsUrl", label: "رابط الاتجاهات", type: "text" },
      ],
    },
  ],
};
