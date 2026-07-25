// Server-safe data + types for the Reviews section. Kept OUT of the "use client"
// component module so server code (library.tsx) can import the real values —
// importing runtime values from a client module yields client-reference proxies,
// not the actual arrays/objects.

export type ReviewsVariant = "A" | "B" | "C" | "D";
export type ReviewsScheme = "paper" | "dark" | "accent";

export interface ReviewItem {
  name: string;
  /** "زبون دائم · ٣ سنوات" */
  meta?: string;
  /** 1–5 */
  rating: number;
  text: string;
  /** optional real photo; falls back to a tinted initial monogram */
  avatarSrc?: string;
}

export interface RatingBucket {
  /** "٥" … "١" */
  label: string;
  /** 0–100 */
  pct: number;
  count: number;
}

export interface ReviewsContent {
  kicker: string;
  title: string;
  lede?: string;
  /** e.g. "٤٫٩" — pre-formatted so the caller owns rounding/locale */
  average?: string;
  totalLabel?: string;
  footnote?: string;
  ctaLabel?: string;
  writeLabel?: string;
  /** digits only, e.g. "963112223344" */
  whatsapp?: string;
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export const arInt = (n: number | string) =>
  String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

/** Strip an Arabic kunya prefix so "أبو خالد" initials as "خ", not "أ". */
export const initialOf = (name: string) => name.replace(/^(أبو|أم)\s/, "").charAt(0);

export const defaultReviewsContent: ReviewsContent = {
  kicker: "ماذا قالوا",
  title: "آراء عملائنا",
  lede: "كلامٌ حقيقي من زبائن حقيقيين — بأسمائهم وبما قالوه فعلًا.",
  average: "٤٫٩",
  totalLabel: "من ٣١٢ تقييمًا",
  footnote: "كل الآراء منشورة كما وردت بلا تعديل. إذا زرتنا وأحببت التجربة، رأيك يساعد غيرك.",
  ctaLabel: "شارك رأيك على واتساب",
  writeLabel: "اكتب رأيك",
};

export const defaultReviews: ReviewItem[] = [
  { name: "رامي خوري", meta: "زبون دائم · ٣ سنوات", rating: 5, text: "أفضل قصّة أخذتها في دمشق. يشتغلون على مهلهم ويسألون قبل كل خطوة — وهذا نادر." },
  { name: "سامر الحلبي", meta: "زبون جديد", rating: 5, text: "دخلت بالمصادفة وصرت أرجع كل شهر. المكان نظيف والأسعار واضحة معلّقة على الحيط." },
  { name: "كريم عودة", meta: "زبون دائم · سنتان", rating: 4, text: "حلاقة الموسى مع المنشفة الساخنة تجربة ثانية. الانتظار أحيانًا طويل بالعصر، لكنها تستاهل." },
  { name: "هادي منصور", meta: "زبون دائم", rating: 5, text: "ابني عمره ست سنوات وما بيخاف عندهم. صاروا يعرفون كيف يتعاملون معه." },
  { name: "وسيم درويش", meta: "زبون جديد", rating: 5, text: "حجزت عبر واتساب ودخلت بوقتي بالثانية. ما انتظرت دقيقة واحدة." },
  { name: "طارق عزيز", meta: "زبون دائم · ٥ سنوات", rating: 5, text: "خمس سنوات وما غيّرت. يعرفون قصّتي بلا ما أشرح، وهذا كل المطلوب." },
];

export const defaultBuckets: RatingBucket[] = [
  { label: "٥", pct: 86, count: 268 },
  { label: "٤", pct: 11, count: 34 },
  { label: "٣", pct: 3, count: 8 },
  { label: "٢", pct: 1, count: 2 },
  { label: "١", pct: 0, count: 0 },
];
