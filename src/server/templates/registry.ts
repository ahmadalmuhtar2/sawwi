// Vertical templates as DATA (AGENT_GUIDE §6 / PRD §4.3). Each is a recipe:
// pages + section arrangement + default variants + Arabic placeholder content +
// seed services + business settings. Creating a site from a template
// instantiates real DB rows (see templates.service.ts).

import type { ColorScheme } from "@/shared/domain";

export interface TemplateSection {
  type: string;
  variant?: string;
  scheme?: ColorScheme;
  content?: Record<string, unknown>;
}

export interface TemplatePage {
  path: string;
  pageType: "landing" | "about" | "contact" | "services" | "custom";
  title: string;
  sections: TemplateSection[];
}

export interface TemplateService {
  name: string;
  price?: string;
  duration?: string;
  description?: string;
}

export interface Template {
  key: string;
  label: string;
  vertical: string;
  description: string;
  pages: TemplatePage[];
  services?: TemplateService[];
  /** Site-wide header/footer styling seeded onto SiteTheme. */
  theme?: {
    headerVariant?: string; // A | B | C
    headerScheme?: string; // light | dark | accent
    footerVariant?: string; // A | B | C
    footerScheme?: string; // dark | light | accent
  };
  settings?: {
    whatsappNumber?: string;
    phone?: string;
    address?: string;
    googleMapsUrl?: string;
    openingHours?: Record<string, { open: string; close: string } | { closed: true }>;
  };
}

const WEEK_9_9 = {
  sat: { open: "09:00", close: "22:00" },
  sun: { open: "09:00", close: "22:00" },
  mon: { open: "09:00", close: "22:00" },
  tue: { open: "09:00", close: "22:00" },
  wed: { open: "09:00", close: "22:00" },
  thu: { open: "09:00", close: "23:00" },
  fri: { open: "14:00", close: "22:00" },
};

// Shared placeholder content reused across the barbershop's pages, so a change
// (services, reviews, team…) is made in one place rather than per page.
const BARBER_ABOUT = {
  kicker: "من نحن",
  titleLine1: "كرسيٌّ واحد،",
  titleLine2: "حرفةٌ تُورّث",
  lede: "بدأ أبو خالد بمحلٍّ صغير وأدواتٍ ورثها عن أبيه، وبقي المبدأ نفسه: كل عميل يُخدَم كأنه الوحيد في المكان.",
  body: "لا نبيع وعودًا كبيرة — نقول ما نستطيع ثم ننفّذه في وقته المتّفق عليه. هذا وحده كافٍ ليعود الناس إلينا ويرسلوا لنا من يعرفون.",
  values: [
    { title: "عملٌ متقن", body: "نراجع كل تفصيل قبل أن نقول إنه جاهز." },
    { title: "مواعيد محترمة", body: "الوقت المتّفق عليه هو الوقت الفعلي." },
    { title: "أسعار واضحة", body: "السعر معروف قبل أن تجلس على الكرسي." },
  ],
  stats: [
    { value: "٢٧", label: "عامًا" },
    { value: "٤٬٠٠٠+", label: "عميل" },
    { value: "٤٫٩", label: "تقييم" },
  ],
  signature: "— أبو خالد وفريقه",
  // signatureMeta intentionally omitted → falls back to the site's business name.
};

const BARBER_PHOTOS = [
  { src: "", label: "قصّة كلاسيكية" },
  { src: "", label: "حلاقة بالموسى" },
  { src: "", label: "تحديد الذقن" },
  { src: "", label: "تصفيف نهائي" },
  { src: "", label: "زاوية المحل" },
  { src: "", label: "أدوات العمل" },
  { src: "", label: "قبل وبعد" },
];

const BARBER_REVIEWS = [
  { name: "رامي خوري", meta: "زبون دائم · ٣ سنوات", rating: "5", text: "أفضل قصّة أخذتها في دمشق. يشتغلون على مهلهم ويسألون قبل كل خطوة — وهذا نادر." },
  { name: "سامر الحلبي", meta: "زبون جديد", rating: "5", text: "المكان نظيف والأسعار واضحة معلّقة على الحيط. صرت أرجع كل شهر." },
  { name: "كريم عودة", meta: "زبون دائم · سنتان", rating: "4", text: "حلاقة الموسى مع المنشفة الساخنة تجربة ثانية. تستاهل الانتظار." },
  { name: "هادي منصور", meta: "أب لطفلين", rating: "5", text: "ابني ما بيخاف عندهم. صاروا يعرفون كيف يتعاملون معه." },
  { name: "وسيم درويش", meta: "زبون جديد", rating: "5", text: "حجزت عبر واتساب ودخلت بوقتي بالثانية. ما انتظرت دقيقة واحدة." },
];

const BARBER_TEAM = [
  { name: "أبو خالد", role: "صاحب المكان · حلاق أول", years: "27", bio: "تعلّم الحرفة عن أبيه وفتح المحل عام ١٩٩٨. يقصّ بالمقص فقط.", photo: "", quote: "", instagram: "", whatsapp: "" },
  { name: "رامي خوري", role: "حلاق · حلاقة بالموسى", years: "9", bio: "متخصّص بحلاقة الموسى والمنشفة الساخنة. هادئ ودقيق.", photo: "", quote: "", instagram: "", whatsapp: "" },
  { name: "سامر عودة", role: "حلاق · قصّات حديثة", years: "6", bio: "يتابع القصّات الجديدة ويحسن التعامل مع الشباب والأطفال.", photo: "", quote: "", instagram: "", whatsapp: "" },
  { name: "نور فارس", role: "عناية بالبشرة", years: "4", bio: "جلسات تنظيف وترطيب للوجه قبل الحلاقة أو بعدها.", photo: "", quote: "", instagram: "", whatsapp: "" },
];

const BARBER_FAQ = [
  { question: "هل أحتاج موعدًا مسبقًا؟", answer: "نستقبل بلا موعد، لكن الحجز عبر واتساب يوفّر عليك الانتظار — خصوصًا بعد الرابعة عصرًا.", group: "المواعيد" },
  { question: "كم أنتظر عادةً بلا موعد؟", answer: "بين عشر دقائق ونصف ساعة بحسب الوقت. صباحًا الانتظار شبه معدوم.", group: "المواعيد" },
  { question: "هل الأسعار المعلنة نهائية؟", answer: "نعم، الأسعار نهائية وتشمل كل شيء — بلا رسوم إضافية ولا مفاجآت عند الدفع.", group: "الأسعار" },
  { question: "ما طرق الدفع المتاحة؟", answer: "نقدًا بالليرة السورية، أو تحويلًا عبر شام كاش. لا نقبل البطاقات حاليًا.", group: "الأسعار" },
  { question: "هل تستقبلون الأطفال؟", answer: "نعم، ولدينا حلاق متخصّص بالتعامل مع الأطفال. الأفضل صباحًا حين يكون المكان هادئًا.", group: "الخدمات" },
  { question: "هل الأدوات معقّمة لكل زبون؟", answer: "كل الأدوات تُعقّم بعد كل زبون، والشفرات تُستخدم مرة واحدة ثم تُرمى أمامك.", group: "الخدمات" },
];

// A multi-page site (6 linked pages). Nav is auto-built from the pages in order,
// so «احجز موعد» shows both as a nav link AND as the header CTA (the Header
// adapter detects the booking page and points the CTA button at it).
const barbershop: Template = {
  key: "barbershop",
  label: "صالون حلاقة",
  vertical: "barbershop",
  description:
    "موقع من ٦ صفحات مترابطة: الرئيسية، الخدمات، المعرض، من نحن، تواصل، وصفحة «احجز موعد» بارزة في الترويسة — واجهة سينمائية، فريق، أوقات عمل حيّة، وحجز عبر واتساب.",
  theme: {
    headerVariant: "B", // two-tier: hours + phone ride in the utility strip
    headerScheme: "light",
    footerVariant: "A", // columns
    footerScheme: "dark",
  },
  settings: {
    whatsappNumber: "963991234567",
    phone: "+963 11 222 3344",
    address: "دمشق — سوق الحميدية، بجانب باب البريد، بناء ٢٤ الطابق الأرضي",
    googleMapsUrl: "https://maps.google.com/?q=Damascus+Al-Hamidiyah",
    openingHours: WEEK_9_9,
  },
  services: [
    { name: "قصّة شعر كلاسيكية", price: "٥٠٬٠٠٠ ل.س", duration: "٣٠ دقيقة", description: "قصّة بالمقص والماكينة مع تصفيف نهائي." },
    { name: "حلاقة ذقن بالموسى", price: "٣٥٬٠٠٠ ل.س", duration: "٢٠ دقيقة", description: "منشفة ساخنة، زيت، وحلاقة تقليدية بالموسى." },
    { name: "قصّة + حلاقة", price: "٨٠٬٠٠٠ ل.س", duration: "٤٥ دقيقة", description: "الخدمتان معًا بسعر أوفر — الأكثر اختيارًا." },
    { name: "تحديد وتشذيب الذقن", price: "٢٥٬٠٠٠ ل.س", duration: "١٥ دقيقة", description: "تحديد الخطوط وتشذيب الطول مع ترطيب." },
    { name: "عناية بالبشرة", price: "٧٠٬٠٠٠ ل.س", duration: "٤٠ دقيقة", description: "تنظيف عميق وماسك مرطّب للوجه." },
    { name: "قصّ أطفال", price: "٣٠٬٠٠٠ ل.س", duration: "٢٠ دقيقة", description: "جلسة قصيرة ولطيفة لمن هم دون ١٢ عامًا." },
  ],
  pages: [
    // ─────────────────────────────── / (الرئيسية) ───────────────────────────────
    {
      path: "/",
      pageType: "landing",
      title: "الرئيسية",
      sections: [
        {
          type: "Hero",
          variant: "barber-cinematic",
          scheme: "primary",
          content: {
            // shopName omitted → the hero shows the site's business name.
            kicker: "دمشق · حلاقة رجالية كلاسيكية",
            titleLine1: "حلاقةٌ تُتقَن",
            titleLine2: "على مهل",
            body: "منذ عام ١٩٩٨، نمنح كل كرسيٍّ وقته الكامل — قصّةٌ بالمقص، حلاقةٌ بالموسى، ومنشفةٌ ساخنة. بلا استعجال، وبلا مفاجآت في السعر.",
            primaryCta: "احجز عبر واتساب",
            secondaryCta: "تصفّح الخدمات",
            addressShort: "سوق الحميدية، دمشق",
            rating: "٤٫٩",
            reviewCount: "٣١٢ تقييمًا",
          },
        },
        {
          type: "About",
          variant: "about-statement",
          scheme: "light",
          content: BARBER_ABOUT,
        },
        {
          type: "ServicesGrid",
          variant: "services-numbered",
          scheme: "dark",
          content: {
            limit: 3, // home shows the top three; /services has the full list
            kicker: "ما نقدّمه",
            title: "الخدمات الأكثر طلبًا",
            lede: "أسعار واضحة ومدد معروفة مسبقًا — تختار ما يناسبك وتحجز في دقيقة.",
            ctaLabel: "كل الخدمات والأسعار",
          },
        },
        {
          type: "Gallery",
          variant: "gallery-bands",
          scheme: "light",
          content: {
            kicker: "من أعمالنا",
            title: "المعرض",
            lede: "صور حقيقية من عملنا اليومي — بلا تجميل ولا فلاتر.",
            ctaLabel: "المعرض كامل",
            photos: BARBER_PHOTOS,
          },
        },
        {
          type: "Testimonials",
          variant: "reviews-grid",
          scheme: "muted",
          content: {
            kicker: "ماذا قالوا",
            title: "آراء عملائنا",
            lede: "كلامٌ حقيقي من زبائن حقيقيين — بأسمائهم وبما قالوه فعلًا.",
            average: "٤٫٩",
            totalLabel: "من ٣١٢ تقييمًا",
            reviews: BARBER_REVIEWS,
          },
        },
        {
          type: "OpeningHours",
          variant: "hours-status",
          scheme: "dark",
          content: {
            kicker: "متى نفتح",
            title: "أوقات العمل",
            lede: "نفتح كل يوم — والجمعة بعد الصلاة. آخر موعد يُقبل قبل الإغلاق بنصف ساعة.",
            seasonalNote: "في رمضان: من بعد الإفطار حتى الثانية بعد منتصف الليل.",
            bookLabel: "احجز موعدًا",
            ctaLabel: "اسأل عن موعد اليوم",
          },
        },
        {
          type: "WhatsAppCTA",
          variant: "wa-band",
          scheme: "accent",
          content: {
            title: "سؤال سريع؟ راسلنا على واتساب",
            subtext: "احجز موعدًا أو اسأل عن أي خدمة — بلا استمارات ولا انتظار على الهاتف.",
            ctaLabel: "ابدأ محادثة",
            replyLine: "نرد عادةً خلال دقائق في أوقات العمل",
            messageText: "مرحبًا {name}! عندي سؤال",
          },
        },
      ],
    },

    // ─────────────────────────────── /services (الخدمات) ───────────────────────────────
    {
      path: "/services",
      pageType: "services",
      title: "الخدمات",
      sections: [
        {
          type: "ServicesGrid",
          variant: "services-numbered",
          scheme: "light",
          content: {
            kicker: "القائمة الكاملة",
            title: "الخدمات والأسعار",
            lede: "أسعار واضحة ومدد معروفة مسبقًا — تختار ما يناسبك وتحجز في دقيقة.",
            footnote: "الأسعار تشمل كل شيء بلا رسوم مخفية. للاستفسار عن خدمة غير مذكورة، راسلنا على واتساب.",
            ctaLabel: "راسلنا على واتساب",
          },
        },
        {
          type: "Faq",
          variant: "faq-accordion",
          scheme: "muted",
          content: {
            kicker: "قبل أن تسأل",
            title: "الأسئلة الشائعة",
            lede: "أكثر ما يُسأل عنه، بإجابات مباشرة. إن لم تجد سؤالك فراسلنا على واتساب.",
            items: BARBER_FAQ,
            helpTitle: "لم تجد سؤالك؟",
            helpBody: "راسلنا على واتساب — نرد عادةً خلال دقائق في أوقات العمل.",
            helpCta: "اسأل على واتساب",
          },
        },
      ],
    },

    // ─────────────────────────────── /gallery (المعرض) ───────────────────────────────
    {
      path: "/gallery",
      pageType: "custom",
      title: "المعرض",
      sections: [
        {
          type: "Gallery",
          variant: "gallery-mosaic",
          scheme: "light",
          content: {
            kicker: "من أعمالنا",
            title: "المعرض",
            lede: "صور حقيقية من عملنا اليومي — بلا تجميل ولا فلاتر.",
            photos: BARBER_PHOTOS,
          },
        },
        {
          type: "WhatsAppCTA",
          variant: "wa-band",
          scheme: "accent",
          content: {
            title: "أعجبك ما رأيت؟ احجز موعدك",
            subtext: "راسلنا على واتساب واحجز في دقيقة.",
            ctaLabel: "احجز الآن",
            messageText: "مرحبًا {name}! شفت المعرض وبدّي أحجز",
          },
        },
      ],
    },

    // ─────────────────────────────── /about (من نحن) ───────────────────────────────
    {
      path: "/about",
      pageType: "about",
      title: "من نحن",
      sections: [
        {
          type: "About",
          variant: "about-milestones",
          scheme: "light",
          content: {
            kicker: "من نحن",
            titleLine1: "من محلٍّ واحد",
            titleLine2: "إلى فريقٍ يعرفه الحيّ",
            lede: "لم يحدث شيء بسرعة، وهذا جيد. كل خطوة أخذت وقتها حتى صارت ثابتة.",
            milestones: [
              { year: "١٩٩٨", title: "البداية بمحلٍّ صغير", body: "غرفة واحدة وأدوات بسيطة وأول عميل جاء بالمصادفة." },
              { year: "٢٠٠٩", title: "المكان الحالي", body: "انتقلنا إلى موقعٍ أوسع في سوق الحميدية، وبقي الطاقم نفسه." },
              { year: "٢٠١٨", title: "فريقٌ مُدرَّب", body: "صار لدينا من يتعلّم الحرفة عندنا ثم يبقى معنا." },
              { year: "اليوم", title: "حجزٌ عبر واتساب", body: "تحجز في دقيقة، وتأتي في وقتك المحدّد." },
            ],
            stats: BARBER_ABOUT.stats,
          },
        },
        {
          type: "Team",
          variant: "team-portraits",
          scheme: "muted",
          content: {
            kicker: "من يعمل عندنا",
            title: "الفريق",
            lede: "وجوهٌ ستراها كل مرة تزورنا — نفس الفريق منذ سنوات.",
            members: BARBER_TEAM,
          },
        },
        {
          type: "Testimonials",
          variant: "reviews-solo",
          scheme: "dark",
          content: {
            kicker: "بصوت صاحب المكان",
            title: "لماذا نعمل هكذا",
            reviews: [
              {
                name: "أبو خالد",
                meta: "صاحب المكان · ٢٧ عامًا في الحرفة",
                rating: "5",
                text: "الحلاقة ليست خدمة تُشترى بسرعة — إنها عشرون دقيقة يجلس فيها الرجل ويثق بك. هذه الثقة هي كل ما بنيته.",
              },
            ],
          },
        },
      ],
    },

    // ─────────────────────────────── /contact (تواصل) ───────────────────────────────
    {
      path: "/contact",
      pageType: "contact",
      title: "تواصل",
      sections: [
        {
          type: "ContactBlock",
          variant: "contact-simple",
          scheme: "light",
          content: {
            kicker: "نحن هنا",
            title: "تواصل معنا",
            lede: "اختر ما يناسبك — واتساب أسرع، والهاتف متاح، والباب مفتوح.",
            submitLabel: "أرسل عبر واتساب",
            privacyNote: "يفتح واتساب برسالتك جاهزة — لا نحتفظ بأي بيانات.",
          },
        },
        {
          type: "MapAddress",
          variant: "map-wide",
          scheme: "muted",
          content: {
            kicker: "أين نحن",
            title: "تجدنا هنا",
            lede: "في قلب دمشق القديمة، على بعد دقائق من باب البريد. الوصول سهل سيرًا أو بالسيارة.",
            transportNote: "أقرب موقف سيارات: ساحة المرجة (٤ دقائق سيرًا). سرافيس باب البريد يقف على الزاوية.",
            landmarkLabel: "باب البريد",
            directionsLabel: "الاتجاهات على الخريطة",
            copyLabel: "انسخ العنوان",
          },
        },
        {
          type: "OpeningHours",
          variant: "hours-table",
          scheme: "dark",
          content: {
            kicker: "متى نفتح",
            title: "أوقات العمل",
            lede: "نفتح كل يوم — والجمعة بعد الصلاة.",
            seasonalNote: "في رمضان: من بعد الإفطار حتى الثانية بعد منتصف الليل.",
          },
        },
      ],
    },

    // ─────────────────────────────── /book (احجز موعد) ───────────────────────────────
    {
      path: "/book",
      pageType: "custom",
      title: "احجز موعد",
      sections: [
        {
          type: "ContactBlock",
          variant: "contact-booking",
          scheme: "dark",
          content: {
            kicker: "الحجز",
            title: "احجز موعدك",
            lede: "اختر الخدمة والوقت، وسنؤكّد لك الموعد على واتساب خلال دقائق. بلا دفع مسبق.",
            replyLine: "نرد خلال دقائق",
            submitLabel: "أكّد الطلب على واتساب",
            privacyNote: "يفتح واتساب بطلبك جاهزًا — لا نحتفظ بأي بيانات.",
            currency: "ل.س",
            subjects: ["حجز موعد", "سؤال عن سعر", "خدمة خاصة", "شيء آخر"],
            days: ["اليوم", "غدًا", "السبت", "الأحد"],
            times: ["١٠:٣٠", "١٢:٠٠", "١٧:٣٠", "١٩:٠٠"],
          },
        },
      ],
    },
  ],
};

const genericServices: Template = {
  key: "generic-services",
  label: "خدمات عامة",
  vertical: "services",
  description: "لأي نشاط خدمي: تعريف، خدمات، آراء العملاء، وتواصل.",
  settings: {
    whatsappNumber: "963900000000",
    phone: "0911111111",
    address: "دمشق",
    openingHours: WEEK_9_9,
  },
  services: [
    { name: "الخدمة الأولى", price: "حسب الطلب" },
    { name: "الخدمة الثانية", price: "حسب الطلب" },
    { name: "الخدمة الثالثة", price: "حسب الطلب" },
  ],
  pages: [
    {
      path: "/",
      pageType: "landing",
      title: "الرئيسية",
      sections: [
        { type: "Hero", variant: "B", scheme: "primary", content: { headline: "اسم نشاطك التجاري", subtext: "وصف قصير وجذّاب لما تقدّمه.", ctaLabel: "تواصل معنا" } },
        { type: "About", variant: "about-photo", scheme: "light", content: {} },
        { type: "ServicesGrid", variant: "services-numbered", scheme: "primary", content: {} },
        { type: "Testimonials", variant: "reviews-grid", scheme: "light", content: {} },
        { type: "WhatsAppCTA", variant: "wa-centered", scheme: "accent", content: { title: "هل لديك سؤال؟", subtext: "راسلنا على واتساب." } },
      ],
    },
  ],
};

const restaurantLite: Template = {
  key: "restaurant-lite",
  label: "مطعم",
  vertical: "restaurant",
  description: "قائمة طعام بالأسعار، معرض صور، وتواصل واتساب.",
  settings: {
    whatsappNumber: "963900000000",
    phone: "0911111111",
    address: "دمشق",
    openingHours: WEEK_9_9,
  },
  services: [
    { name: "طبق اليوم", price: "١٥٠٠٠ ل.س" },
    { name: "مشاوٍ مشكّلة", price: "٢٥٠٠٠ ل.س" },
    { name: "حلويات", price: "٨٠٠٠ ل.س" },
  ],
  pages: [
    {
      path: "/",
      pageType: "landing",
      title: "الرئيسية",
      sections: [
        { type: "Hero", variant: "A", scheme: "dark", content: { headline: "مطعم الشام", subtext: "أشهى الأطباق السورية الأصيلة.", ctaLabel: "اطلب الآن" } },
        { type: "PriceList", variant: "B", scheme: "light", content: { title: "قائمة الطعام" } },
        { type: "Gallery", variant: "gallery-mosaic", scheme: "primary", content: { title: "من أطباقنا" } },
        { type: "OpeningHours", variant: "hours-table", scheme: "dark", content: {} },
        { type: "WhatsAppCTA", variant: "wa-centered", scheme: "accent", content: { title: "احجز طاولتك", subtext: "تواصل معنا عبر واتساب." } },
      ],
    },
  ],
};

export const TEMPLATES: Record<string, Template> = {
  barbershop,
  "generic-services": genericServices,
  "restaurant-lite": restaurantLite,
};

export function listTemplates() {
  return Object.values(TEMPLATES).map((t) => ({
    key: t.key,
    label: t.label,
    vertical: t.vertical,
    description: t.description,
  }));
}

export function getTemplate(key: string): Template | null {
  return TEMPLATES[key] ?? null;
}
