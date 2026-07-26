// Barbershop "five-star" — template module. Wires the ready-made component to
// its editable-data defaults, the onboarding/editor field schema, and the small
// themeable color set. Frozen house copy lives inside the component.

import type { TemplateModule } from "../types";
import Component from "./component";

/** A believable default shop, so the design reads as complete before any edit
 *  (and the wizard/editor show real values, not blanks). */
const defaults = {
  shop: {
    name: "صالون قاسيون",
    latinName: "QASIOUN",
    tagline: "حلاقة كلاسيكية بمعايير خمس نجوم",
    heroLine: "الكرسي جاهز في وقته تمامًا",
    heroBlurb:
      "شفرة جديدة تُفتح أمامك، منشفة ساخنة بزيت اللافندر، ونتيجة نُريك إياها في المرآة قبل أن تنهض.",
    heroPhoto: "",
    whatsapp: "+963991112233",
    phone: "+963112223344",
    address: "دمشق — المزة، شارع الجلاء",
    mapsUrl: "",
    lastAppointment: "٩:٣٠",
    socials: { instagram: "", facebook: "", tiktok: "" },
    stats: [
      { value: "٤٫٩", label: "تقييم الزبائن" },
      { value: "١٢", label: "سنة خبرة" },
      { value: "٦", label: "حلاقين محترفين" },
    ],
  },
  groups: [
    { id: "hair", label: "الشعر" },
    { id: "beard", label: "الذقن" },
    { id: "combo", label: "باقات" },
    { id: "extra", label: "إضافات" },
  ],
  services: [
    { group: "hair", name: "قصّة كلاسيكية", price: "٢٥٬٠٠٠", duration: "٤٥ دقيقة", desc: "قصّ بالمقص للشكل ثم تدرّج بالماكينة، مع تصفيف وشرح.", mark: "الأكثر طلبًا", photo: "" },
    { group: "hair", name: "تدرّج (فايد)", price: "٣٠٬٠٠٠", duration: "٥٠ دقيقة", desc: "تدرّج نظيف من الصفر مع تحديد دقيق للخطوط.", photo: "" },
    { group: "beard", name: "تهذيب ذقن بالموسى", price: "١٥٬٠٠٠", duration: "٢٥ دقيقة", desc: "منشفة ساخنة، زيت، وتحديد بالموسى.", photo: "" },
    { group: "combo", name: "شعر + ذقن", price: "٣٨٬٠٠٠", duration: "٧٥ دقيقة", desc: "الباقة الكاملة بسعر موفّر.", mark: "توفير", photo: "" },
    { group: "extra", name: "غسيل وتصفيف", price: "٨٬٠٠٠", duration: "١٥ دقيقة", desc: "شامبو وتدليك فروة وتصفيف.", photo: "" },
  ],
  barbers: [
    { name: "أبو أحمد", role: "المعلّم", years: 20, bio: "خبرة عشرين عامًا في القصّات الكلاسيكية.", availableToday: true, photo: "" },
    { name: "سامر", role: "أخصّائي تدرّج", years: 8, availableToday: true, photo: "" },
    { name: "وسيم", role: "حلاق", years: 5, availableToday: false, photo: "" },
  ],
  hours: [
    { days: "السبت – الخميس", time: "١٠:٠٠ ص – ١٠:٠٠ م", primary: true },
    { days: "الجمعة", time: "٢:٠٠ م – ١٠:٠٠ م" },
  ],
};

export const barbershopFiveStar: TemplateModule = {
  key: "barbershop-five-star",
  label: "صالون حلاقة",
  vertical: "barbershop",
  description: "قالب صالون حلاقة راقٍ: خدمات، حلاقون، عناية، وحجز موعد. عربي بالكامل.",
  tags: ["حلاقة", "صالون رجالي", "باربر شوب", "حجز مواعيد", "خدمات وأسعار", "فريق العمل", "عربي", "هاتف أولًا"],
  // Catalog cover — a static asset shipped with the code (see public/template-covers).
  // Until the file is dropped in, the gallery shows its generated poster fallback.
  cover: "/template-covers/barbershop-five-star.webp",
  // The template has its own strict prop shape; the host spreads merged content
  // onto it, so we widen through `unknown` at this single boundary.
  Component: Component as unknown as TemplateModule["Component"],
  defaults,
  nameKey: "shop.name",
  themeFont: true,
  tokens: [
    { key: "accent", label: "لون التمييز", cssVar: "--color-oxblood", default: "oklch(0.48 0.16 25)" },
    { key: "ground", label: "الخلفية", cssVar: "--color-ink", default: "oklch(0.115 0.006 45)" },
    { key: "ink", label: "لون النص", cssVar: "--color-bone", default: "oklch(0.93 0.018 70)" },
  ],
  steps: [
    {
      key: "shop",
      title: "معلومات المحل",
      hint: "الاسم، نبذة الواجهة، وطرق التواصل.",
      fields: [
        { key: "shop.name", label: "اسم المحل", type: "text", placeholder: "صالون قاسيون" },
        { key: "shop.latinName", label: "الاسم اللاتيني", type: "text", placeholder: "QASIOUN" },
        { key: "shop.tagline", label: "الشعار", type: "text", placeholder: "حلاقة كلاسيكية بمعايير خمس نجوم" },
        { key: "shop.heroLine", label: "عنوان الواجهة", type: "text" },
        { key: "shop.heroBlurb", label: "نبذة الواجهة", type: "textarea" },
        { key: "shop.heroPhoto", label: "صورة الواجهة", type: "image" },
        { key: "shop.whatsapp", label: "رقم واتساب", type: "phone", help: "إلزامي — عليه تصل طلبات الحجز." },
        { key: "shop.phone", label: "الهاتف", type: "phone" },
        { key: "shop.address", label: "العنوان", type: "text" },
        { key: "shop.mapsUrl", label: "رابط الخريطة", type: "text" },
        { key: "shop.lastAppointment", label: "آخر موعد", type: "text", placeholder: "٩:٣٠" },
        {
          key: "shop.stats", label: "أرقام لافتة", type: "list", itemLabel: "رقم",
          blank: { value: "", label: "" },
          item: [
            { key: "value", label: "القيمة", type: "text", placeholder: "٤٫٩" },
            { key: "label", label: "الوصف", type: "text", placeholder: "تقييم الزبائن" },
          ],
        },
      ],
    },
    {
      key: "services",
      title: "الخدمات",
      hint: "الأقسام والخدمات مع الأسعار.",
      fields: [
        {
          key: "groups", label: "أقسام الخدمات", type: "list", itemLabel: "قسم",
          blank: { id: "", label: "" },
          item: [
            { key: "id", label: "المعرّف (إنجليزي)", type: "text", placeholder: "hair" },
            { key: "label", label: "الاسم", type: "text", placeholder: "الشعر" },
          ],
        },
        {
          key: "services", label: "الخدمات", type: "list", itemLabel: "خدمة",
          blank: { group: "", name: "", price: "", duration: "", desc: "", mark: "", photo: "" },
          item: [
            { key: "group", label: "القسم (المعرّف)", type: "text", placeholder: "hair" },
            { key: "name", label: "اسم الخدمة", type: "text" },
            { key: "price", label: "السعر", type: "text", placeholder: "٢٥٬٠٠٠" },
            { key: "duration", label: "المدة", type: "text", placeholder: "٤٥ دقيقة" },
            { key: "desc", label: "الوصف", type: "textarea" },
            { key: "mark", label: "وسم (اختياري)", type: "text", placeholder: "الأكثر طلبًا" },
            { key: "photo", label: "صورة", type: "image" },
          ],
        },
      ],
    },
    {
      key: "barbers",
      title: "الحلاقون",
      hint: "فريق الحلاقين.",
      fields: [
        {
          key: "barbers", label: "الحلاقون", type: "list", itemLabel: "حلاق",
          blank: { name: "", role: "", years: 0, bio: "", availableToday: true, photo: "" },
          item: [
            { key: "name", label: "الاسم", type: "text" },
            { key: "role", label: "الدور", type: "text", placeholder: "المعلّم" },
            { key: "bio", label: "نبذة", type: "textarea" },
            { key: "photo", label: "صورة", type: "image" },
          ],
        },
      ],
    },
    {
      key: "hours",
      title: "أوقات العمل",
      hint: "صفوف أوقات الدوام.",
      fields: [
        {
          key: "hours", label: "أوقات العمل", type: "list", itemLabel: "صف",
          blank: { days: "", time: "", primary: false },
          item: [
            { key: "days", label: "الأيام", type: "text", placeholder: "السبت – الخميس" },
            { key: "time", label: "الوقت", type: "text", placeholder: "١٠:٠٠ ص – ١٠:٠٠ م" },
          ],
        },
      ],
    },
  ],
};
