// Server-safe data + types for the restaurant Menu section. Kept OUT of the
// "use client" component so server code (library.tsx) imports the real values,
// not client-reference proxies.

export type MenuVariant = "A" | "B" | "C";
export type MenuScheme = "paper" | "dark" | "accent";

export interface MenuItem {
  name: string;
  /** already formatted for display (site currency + Arabic digits) */
  price?: string;
  description?: string;
  /** plate photo URL (Media Service); empty → tasteful placeholder */
  image?: string;
  /** category tab this plate belongs to (e.g. "ساخنة" / "دجاج") */
  category?: string;
  /** optional badge, e.g. "الأكثر طلبًا" */
  badge?: string;
}

export interface MenuContent {
  kicker: string;
  title: string;
  lede?: string;
  footnote?: string;
  ctaLabel?: string;
  /** digits only, e.g. "963112223344" */
  whatsapp?: string;
}

export const defaultMenuContent: MenuContent = {
  kicker: "قائمتنا",
  title: "القائمة",
  lede: "أطباقٌ تُحضَّر طازجة عند الطلب — بمكوّنات محليّة وبأسعار واضحة.",
  footnote: "الأسعار تشمل الخدمة. للطلبات الخاصة أو الحساسية الغذائية، أخبِرنا عند الطلب.",
  ctaLabel: "اطلب عبر واتساب",
};

// Seed plates across two category groups so a fresh Menu section looks complete.
export const defaultMenuItems: MenuItem[] = [
  { category: "المقبّلات", name: "حمّص بالطحينة", price: "٢٥٬٠٠٠", description: "حمّص كريمي بزيت الزيتون البلدي والصنوبر.", image: "", badge: "نباتي" },
  { category: "المقبّلات", name: "متبّل باذنجان", price: "٢٥٬٠٠٠", description: "باذنجان مشوي على الفحم مع طحينة وليمون.", image: "" },
  { category: "المشاوي", name: "مشاوي مشكّلة", price: "٩٥٬٠٠٠", description: "شيش طاووق، كباب، وريش غنم مع خضار مشوية.", image: "", badge: "الأكثر طلبًا" },
  { category: "المشاوي", name: "شيش طاووق", price: "٦٥٬٠٠٠", description: "قطع دجاج متبّلة بالثوم والليمون، مشوية طازجة.", image: "" },
  { category: "الحلويات", name: "كنافة نابلسية", price: "٣٠٬٠٠٠", description: "كنافة بالجبن الطازج والقطر، تُقدَّم ساخنة.", image: "" },
];
