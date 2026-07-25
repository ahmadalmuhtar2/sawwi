// Server-safe data + types for the FAQ section. Kept OUT of the "use client"
// component so server code (library.tsx) imports the real values.

export type FAQVariant = "A" | "B" | "C" | "D";
export type FAQScheme = "paper" | "dark" | "accent";

export interface FAQItem {
  question: string;
  answer: string;
  /** optional category — variant C's rail is built from these */
  group?: string;
}

export interface FAQContent {
  kicker: string;
  title: string;
  lede?: string;
  countLabel?: string;
  helpTitle?: string;
  helpBody?: string;
  helpCta?: string;
  /** digits only, e.g. "963112223344" */
  whatsapp?: string;
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export const arNum = (n: number) =>
  String(n).padStart(2, "0").replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

export const defaultFAQContent: FAQContent = {
  kicker: "قبل أن تسأل",
  title: "الأسئلة الشائعة",
  lede: "أكثر ما يُسأل عنه، بإجابات مباشرة. إن لم تجد سؤالك فراسلنا على واتساب.",
  countLabel: "سؤالًا وجوابًا",
  helpTitle: "لم تجد سؤالك؟",
  helpBody: "راسلنا على واتساب — نرد عادةً خلال دقائق في أوقات العمل.",
  helpCta: "اسأل على واتساب",
};

export const defaultFAQItems: FAQItem[] = [
  { group: "المواعيد", question: "هل أحتاج موعدًا مسبقًا؟", answer: "لا، نستقبل بلا موعد — لكن الحجز عبر واتساب يوفّر عليك الانتظار، خصوصًا بعد الرابعة عصرًا وفي نهاية الأسبوع." },
  { group: "المواعيد", question: "كم أنتظر عادةً بلا موعد؟", answer: "بين عشر دقائق ونصف ساعة بحسب الوقت. صباحًا الانتظار شبه معدوم." },
  { group: "المواعيد", question: "ماذا لو تأخّرت عن موعدي؟", answer: "نحتفظ بالموعد عشر دقائق. إن تأخّرت أكثر أبلغنا على واتساب ونعطيك أول وقت متاح." },
  { group: "الأسعار", question: "هل الأسعار المعلنة نهائية؟", answer: "نعم، الأسعار في قائمة الخدمات نهائية وتشمل كل شيء — بلا رسوم إضافية ولا مفاجآت عند الدفع." },
  { group: "الأسعار", question: "ما طرق الدفع المتاحة؟", answer: "نقدًا بالليرة السورية، أو تحويلًا عبر شام كاش. لا نقبل البطاقات حاليًا." },
  { group: "الخدمات", question: "هل تستقبلون الأطفال؟", answer: "نعم، ولدينا حلاق متخصّص بالتعامل مع الأطفال. الأفضل صباحًا حين يكون المكان هادئًا." },
  { group: "الخدمات", question: "هل تستخدمون أدوات معقّمة لكل زبون؟", answer: "كل الأدوات تُعقّم بعد كل زبون، والشفرات تُستخدم مرة واحدة ثم تُرمى أمامك." },
];
