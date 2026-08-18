// Shared, dependency-free constants for the marketplace submission system (the
// شغلة template's provider/customer forms + the admin inbox). Kept here so the
// public template (client) and the server validation use ONE source of truth for
// the category list, and the admin UI reuses the Arabic labels.

/** The offered service categories, in display order. A rich authored enum — it
 *  drives BOTH the شغلة category showcase grid and the service dropdown on the
 *  provider/customer forms. A site may still edit its own list (it's site config),
 *  but this is the curated starting set. */
export const SERVICE_CATEGORIES = [
  "برمجة وتطوير",
  "تصميم غرافيك",
  "ترجمة",
  "تدريس خصوصي",
  "تصوير",
  "كهرباء",
  "سباكة",
  "نجارة",
  "دهان وديكور",
  "تنظيف منازل",
  "تكييف وتبريد",
  "نقل وتوصيل",
] as const;

/** The catch-all option appended to the category selects. */
export const SERVICE_CATEGORY_OTHER = "غير هيك";

/** Max images a single submission may carry (public form + stored value). */
export const MAX_SUBMISSION_IMAGES = 6;

/** The FULL service catalogue — a rich, sector-grouped enum that aims to cover
 *  every trade/business a Syrian services marketplace might list. Drives the
 *  provider/customer service <select> (rendered as <optgroup>s) and the manual
 *  entry datalist. Distinct from SERVICE_CATEGORIES, which is the small curated
 *  showcase grid on the landing page. Add sectors/items freely — the server bounds
 *  `category` as a string (never a hardcoded enum), so this list can grow safely. */
export const SERVICE_GROUPS: readonly { label: string; items: readonly string[] }[] = [
  {
    label: "حرف ومهن يدوية",
    items: ["كهرباء", "سباكة", "نجارة", "حدادة", "دهان وديكور", "بلاط وسيراميك", "ديكور جبصين", "ألمنيوم", "زجاج ومرايا", "تكييف وتبريد", "صيانة أجهزة كهربائية", "صيانة مصاعد", "لحام", "تمديدات صحية"],
  },
  {
    label: "خدمات المنزل",
    items: ["تنظيف منازل", "تنظيف مكاتب", "غسيل سجاد وكنب", "مكافحة حشرات", "تعقيم وتطهير", "بستنة وتنسيق حدائق", "نقل عفش", "تركيب أثاث", "صيانة عامة"],
  },
  {
    label: "تقنية وبرمجة",
    items: ["برمجة وتطوير مواقع", "تطبيقات موبايل", "تصميم واجهات UI/UX", "دعم فني وصيانة حواسيب", "شبكات", "أمن معلومات", "تحليل بيانات", "ذكاء اصطناعي", "إدخال بيانات"],
  },
  {
    label: "تصميم ووسائط",
    items: ["تصميم غرافيك", "تصميم شعارات وهوية", "تصوير فوتوغرافي", "تصوير فيديو", "مونتاج فيديو", "موشن غرافيك", "رسم وفنون", "خط عربي", "طباعة"],
  },
  {
    label: "تسويق ومحتوى",
    items: ["تسويق رقمي", "إدارة سوشال ميديا", "كتابة محتوى", "تحسين محركات البحث SEO", "إعلانات ممولة", "علاقات عامة"],
  },
  {
    label: "أعمال ومكاتب",
    items: ["محاسبة", "تدقيق مالي", "استشارات قانونية", "محاماة", "ترجمة", "استشارات إدارية", "دراسات جدوى", "موارد بشرية", "سكرتاريا", "خدمة عملاء", "تأمين", "خدمات عقارية"],
  },
  {
    label: "تعليم وتدريب",
    items: ["تدريس خصوصي", "دورات لغات", "تحفيظ قرآن", "دروس موسيقى", "تدريب مهني", "تدريب رياضي", "تعليم قيادة"],
  },
  {
    label: "صحة وعافية",
    items: ["تمريض منزلي", "علاج فيزيائي", "استشارات تغذية", "رعاية مسنين", "رعاية أطفال", "استشارات نفسية", "طب بيطري"],
  },
  {
    label: "تجميل وعناية",
    items: ["حلاقة رجالي", "كوافير نسائي", "مكياج", "عناية بالبشرة", "مناكير وباديكير", "حمّام مغربي", "تدليك (مساج)"],
  },
  {
    label: "طعام وضيافة",
    items: ["طبخ منزلي", "حلويات", "تقديم وضيافة (كاترينغ)", "شيف خاص", "خبز ومعجنات", "باريستا"],
  },
  {
    label: "نقل ولوجستيك",
    items: ["توصيل طلبات", "نقل ركاب", "نقل بضائع", "شحن", "تخليص جمركي"],
  },
  {
    label: "سيارات",
    items: ["ميكانيك سيارات", "كهرباء سيارات", "دهان وسمكرة", "غسيل وتلميع", "إطارات وبطاريات"],
  },
  {
    label: "مناسبات",
    items: ["تنظيم أعراس", "تنظيم مؤتمرات", "دي جي", "فرقة موسيقية", "تنسيق زهور", "تأجير معدات", "تصوير أعراس"],
  },
  {
    label: "حرف أخرى",
    items: ["خياطة وتفصيل", "تنجيد", "ستائر ومفروشات", "إصلاح أحذية", "إصلاح ساعات ومجوهرات", "إصلاح جوالات", "صياغة ذهب"],
  },
];

/** Flat list of every catalogue service (for datalists / reference). */
export const SERVICE_OPTIONS: readonly string[] = SERVICE_GROUPS.flatMap((g) => g.items);

/** Every value the `category` field may take (validated server-side). */
export const ALL_CATEGORIES: readonly string[] = [...SERVICE_CATEGORIES, SERVICE_CATEGORY_OTHER];

export type SubmissionKind = "PROVIDER" | "CUSTOMER";
export type SubmissionStatus = "NEW" | "REVIEWING" | "ACCEPTED" | "REJECTED" | "CONTACTED";

export const KIND_LABEL: Record<SubmissionKind, string> = {
  PROVIDER: "مزوّد",
  CUSTOMER: "زبون",
};

export const STATUS_LABEL: Record<SubmissionStatus, string> = {
  NEW: "جديد",
  REVIEWING: "قيد المراجعة",
  ACCEPTED: "مقبول",
  REJECTED: "مرفوض",
  CONTACTED: "تم التواصل",
};

export const STATUS_ORDER: SubmissionStatus[] = ["NEW", "REVIEWING", "ACCEPTED", "REJECTED", "CONTACTED"];

/** How a submission arrived (the المصدر column). */
export const SOURCE_LABEL: Record<string, string> = {
  web: "الموقع",
  manual: "يدوي",
};
