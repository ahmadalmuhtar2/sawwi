// Server-safe data + types for the Location/Map section. Kept OUT of the
// "use client" component so server code (library.tsx) imports real values.
// The primary address/phone/map come from site SETTINGS; branches (variant D)
// are per-section content.

export type MapVariant = "A" | "B" | "C" | "D";
export type MapScheme = "paper" | "dark" | "accent";

/** Where the pin sits on the schematic, as % of the plate. */
export interface PinPosition {
  /** distance from the inline start edge (right in RTL) */
  x: string;
  /** distance from the top */
  y: string;
}

export interface Branch {
  name: string;
  address: string;
  hours?: string;
  phone?: string;
  mapsUrl?: string;
  /** badges the card as the main branch */
  main?: boolean;
  pin?: PinPosition;
}

export interface MapContent {
  kicker: string;
  title: string;
  lede?: string;
  businessName?: string;
  address?: string;
  /** short label under the address, e.g. floor/landmark */
  addressNote?: string;
  phone?: string;
  /** transport / parking guidance — what customers actually ask */
  transportNote?: string;
  /** name of the nearest landmark, shown as a chip on the plate */
  landmarkLabel?: string;
  mapsUrl?: string;
  directionsLabel?: string;
  copyLabel?: string;
  /** digits only, e.g. "963112223344" */
  whatsapp?: string;
}

export const defaultMapContent: MapContent = {
  kicker: "أين نحن",
  title: "تجدنا هنا",
  lede: "في قلب دمشق القديمة، على بعد دقائق من باب البريد. الوصول سهل سيرًا أو بالسيارة.",
  businessName: "اسم العمل",
  address: "دمشق — سوق الحميدية، بجانب باب البريد، بناء ٢٤ الطابق الأرضي",
  phone: "+963 11 222 3344",
  transportNote: "أقرب موقف سيارات: ساحة المرجة (٤ دقائق سيرًا). سرافيس باب البريد يقف على الزاوية.",
  landmarkLabel: "باب البريد",
  directionsLabel: "الاتجاهات على الخريطة",
  copyLabel: "انسخ العنوان",
};

export const defaultBranches: Branch[] = [
  { name: "فرع الحميدية", address: "سوق الحميدية، بجانب باب البريد، بناء ٢٤", hours: "٩:٠٠ – ٢٢:٠٠", phone: "+963 11 222 3344", main: true, pin: { x: "42%", y: "40%" } },
  { name: "فرع المزّة", address: "المزّة، شارع الجلاء، مقابل الحديقة", hours: "١٠:٠٠ – ٢٣:٠٠", phone: "+963 11 555 6677", pin: { x: "58%", y: "52%" } },
  { name: "فرع القصّاع", address: "القصّاع، شارع ابن عساكر، بناء ٧", hours: "٩:٠٠ – ٢١:٠٠", phone: "+963 11 888 9900", pin: { x: "34%", y: "58%" } },
];
