// Server-safe data + types for the Contact section. Kept OUT of the "use client"
// component so server code (library.tsx) imports the real values. Most data
// comes from site SETTINGS; the section carries copy + a few pick-lists.

export type ContactVariant = "A" | "B" | "C" | "D";
export type ContactScheme = "paper" | "dark" | "accent";

export interface HoursRow {
  days: string;
  time: string;
}

export interface BookingService {
  label: string;
  /** free text incl. thousands separators, no currency */
  price: string;
  duration: string;
}

export interface ContactSocials {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
}

export interface ContactContent {
  kicker: string;
  title?: string;
  lede?: string;
  /** digits only, e.g. "963112223344" — REQUIRED for the WhatsApp submit */
  whatsapp?: string;
  phone?: string;
  address?: string;
  mapsUrl?: string;
  currency?: string;
  replyLine?: string;
  formTitle?: string;
  formNote?: string;
  submitLabel?: string;
  privacyNote?: string;
}

export const defaultContactContent: ContactContent = {
  kicker: "نحن هنا",
  currency: "ل.س",
  replyLine: "نرد خلال دقائق",
  formTitle: "أرسل رسالة سريعة",
  formNote: "اكتب سؤالك وسنعاود التواصل معك على واتساب.",
  submitLabel: "أرسل عبر واتساب",
  privacyNote: "يفتح واتساب برسالتك جاهزة — لا نحتفظ بأي بيانات.",
};

export const defaultHours: HoursRow[] = [
  { days: "السبت – الخميس", time: "٩:٠٠ – ٢٢:٠٠" },
  { days: "الجمعة", time: "١٤:٠٠ – ٢٢:٠٠" },
];

export const defaultSubjects = ["حجز موعد", "سؤال عن سعر", "خدمة خاصة", "شيء آخر"];

export const defaultServices: BookingService[] = [
  { label: "قصّة كلاسيكية", price: "٥٠٬٠٠٠", duration: "٣٠ دقيقة" },
  { label: "حلاقة بالموسى", price: "٣٥٬٠٠٠", duration: "٢٠ دقيقة" },
  { label: "قصّة + حلاقة", price: "٨٠٬٠٠٠", duration: "٤٥ دقيقة" },
  { label: "عناية بالبشرة", price: "٧٠٬٠٠٠", duration: "٤٠ دقيقة" },
];

export const defaultDays = ["اليوم", "غدًا", "السبت", "الأحد"];
export const defaultTimes = ["١٠:٣٠", "١٢:٠٠", "١٧:٣٠", "١٩:٠٠"];
