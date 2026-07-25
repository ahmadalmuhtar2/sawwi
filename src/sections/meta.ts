// Section presentation metadata for the configurator: Arabic labels and the
// editable content fields per section type. Pure data — safe on the client.

export const SECTION_LABELS: Record<string, string> = {
  Hero: "الواجهة",
  About: "من نحن",
  ServicesGrid: "الخدمات",
  PriceList: "قائمة الأسعار",
  Gallery: "المعرض",
  Testimonials: "آراء العملاء",
  Team: "الفريق",
  OpeningHours: "ساعات العمل",
  MapAddress: "الخريطة والعنوان",
  WhatsAppCTA: "زر واتساب",
  Faq: "الأسئلة الشائعة",
  AnnouncementBanner: "شريط إعلان",
  ContactBlock: "تواصل",
};

export interface SectionField {
  key: string;
  label: string;
  textarea?: boolean;
}

export const SECTION_FIELDS: Record<string, SectionField[]> = {
  Hero: [
    { key: "headline", label: "العنوان الرئيسي" },
    { key: "subtext", label: "النص الفرعي", textarea: true },
    { key: "ctaLabel", label: "نص الزر" },
  ],
  About: [
    { key: "title", label: "العنوان" },
    { key: "body", label: "النص", textarea: true },
  ],
  ServicesGrid: [{ key: "title", label: "العنوان" }],
  PriceList: [{ key: "title", label: "العنوان" }],
  Gallery: [{ key: "title", label: "العنوان" }],
  Testimonials: [{ key: "title", label: "العنوان" }],
  Team: [{ key: "title", label: "العنوان" }],
  OpeningHours: [{ key: "title", label: "العنوان" }],
  MapAddress: [{ key: "title", label: "العنوان" }],
  WhatsAppCTA: [
    { key: "headline", label: "العنوان" },
    { key: "subtext", label: "النص", textarea: true },
  ],
  Faq: [{ key: "title", label: "العنوان" }],
  AnnouncementBanner: [{ key: "text", label: "نص الإعلان" }],
  ContactBlock: [{ key: "title", label: "العنوان" }],
};

export const COLOR_SCHEMES: { key: string; label: string; swatch: string }[] = [
  { key: "primary", label: "أساسي", swatch: "bg-accent" },
  { key: "bold", label: "غامق", swatch: "bg-accent-900" },
  { key: "accent", label: "مميّز", swatch: "bg-accent-100" },
  { key: "soft", label: "ناعم", swatch: "bg-accent-50 border border-line" },
  { key: "light", label: "فاتح", swatch: "bg-surface border border-line" },
  { key: "muted", label: "هادئ", swatch: "bg-bg border border-line" },
  { key: "dark", label: "داكن", swatch: "bg-[oklch(0.22_0.012_70)]" },
];
