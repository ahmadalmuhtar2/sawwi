// Server-safe data + types for the Gallery section. Kept OUT of the "use client"
// component module so server code (library.tsx) imports the real values, not the
// client-reference proxies a client module hands back.

export type GalleryVariant = "A" | "B" | "C" | "D";
export type GalleryScheme = "paper" | "dark" | "accent";

export interface GalleryPhoto {
  /** Media Service URL; unset renders a neutral placeholder */
  src?: string;
  /** caption + alt text */
  label: string;
}

export interface GalleryContent {
  kicker: string;
  title: string;
  lede?: string;
  countLabel?: string;
  footnote?: string;
  ctaLabel?: string;
  /** digits only, e.g. "963112223344" */
  whatsapp?: string;
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export const arNum = (n: number) =>
  String(n).padStart(2, "0").replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

export const defaultGalleryContent: GalleryContent = {
  kicker: "من أعمالنا",
  title: "المعرض",
  lede: "صور حقيقية من عملنا اليومي — بلا تجميل ولا فلاتر.",
  countLabel: "صورة",
  footnote: "كل الصور من عملنا الفعلي. لطلب عمل مشابه، راسلنا على واتساب مع الصورة التي أعجبتك.",
  ctaLabel: "اطلب عملًا مشابهًا",
};

export const defaultGalleryPhotos: GalleryPhoto[] = [
  { label: "قصّة كلاسيكية" },
  { label: "حلاقة بالموسى" },
  { label: "تحديد الذقن" },
  { label: "زاوية المحل" },
  { label: "أدوات العمل" },
  { label: "الكرسي الأول" },
  { label: "قبل وبعد" },
  { label: "تفاصيل التصفيف" },
];
