// Foul & Fatteh (Ajami) — template module. Wires the ready-made component to its
// editable-data defaults, the onboarding/editor field schema, and the small
// themeable color set (gold / green / cream). The Ajami lattice is a fixed,
// self-contained pattern inside the component.

import type { TemplateModule } from "../types";
import Component from "./component";

/** A believable default foul-and-fatteh house, so the design reads as complete
 *  before any edit (and the wizard/editor show real values, not blanks). */
const defaults = {
  shop: {
    name: "فول أبو شادي",
    latinName: "Abu Shadi Foul",
    tagline: "فول · فتّة · حمّص",
    heroLine: "فول وفتّة",
    heroPhoto: "",
    phone: "+963 11 456 7788",
    whatsapp: "+963944567788",
    address: "دمشق — الميدان، شارع الجزماتية، مقابل الجامع",
    mapsUrl: "",
    hoursNote: "٦:٠٠ ص – ١:٠٠ م",
  },
  groups: [
    { id: "foul", label: "الفول" },
    { id: "fatteh", label: "الفتّة" },
    { id: "side", label: "مقبّلات وإضافات" },
    { id: "drink", label: "مشروبات" },
  ],
  items: [
    { group: "foul", name: "فول مدمّس", latin: "Foul medames", desc: "فول، زيت زيتون، كمّون، ليمون.", price: "٢٥٬٠٠٠", mark: "نباتي", photo: "" },
    { group: "foul", name: "فول بالطحينة", latin: "Foul with tahini", desc: "فول، طحينة، ليمون، ثوم.", price: "٣٠٬٠٠٠", mark: "نباتي", photo: "" },
    { group: "foul", name: "فول بالسمنة", latin: "Foul with butter", desc: "فول، سمنة، صنوبر.", price: "٣٥٬٠٠٠", mark: "", photo: "" },
    { group: "foul", name: "مسبّحة", latin: "Msabbaha", desc: "حمّص حبّ، طحينة، زيت زيتون، بقدونس.", price: "٣٠٬٠٠٠", mark: "نباتي", photo: "" },
    { group: "fatteh", name: "فتّة حمّص", latin: "Chickpea fatteh", desc: "خبز محمّص، لبن، حمّص، صنوبر بالسمنة.", price: "٤٠٬٠٠٠", mark: "", photo: "" },
    { group: "fatteh", name: "فتّة فول", latin: "Foul fatteh", desc: "خبز محمّص، فول، لبن بالثوم.", price: "٤٠٬٠٠٠", mark: "", photo: "" },
    { group: "fatteh", name: "فتّة مكدوس", latin: "Makdous fatteh", desc: "خبز محمّص، مكدوس، فول، لبن.", price: "٤٥٬٠٠٠", mark: "حار قليلًا", photo: "" },
    { group: "fatteh", name: "فتّة لحمة", latin: "Lamb fatteh", desc: "خبز محمّص، لبن، حمّص، لحم غنم، صنوبر.", price: "٧٥٬٠٠٠", mark: "", photo: "" },
    { group: "side", name: "حمّص بطحينة", latin: "Hummus", desc: "حمّص، طحينة، ليمون، زيت زيتون.", price: "٢٥٬٠٠٠", mark: "نباتي", photo: "" },
    { group: "side", name: "بليلة", latin: "Balila", desc: "حمّص ساخن، كمّون، ليمون.", price: "٢٠٬٠٠٠", mark: "نباتي", photo: "" },
    { group: "side", name: "شكشوكة بيض", latin: "Egg shakshouka", desc: "بيض، بندورة، فليفلة.", price: "٣٥٬٠٠٠", mark: "", photo: "" },
    { group: "side", name: "مخلّل وزيتون وبصل أخضر", latin: "Pickles, olives, spring onion", desc: "طبق جانبي.", price: "٨٬٠٠٠", mark: "نباتي", photo: "" },
    { group: "side", name: "خبز · رغيفان", latin: "Bread, two", desc: "خبز تنّور ساخن.", price: "٥٬٠٠٠", mark: "", photo: "" },
    { group: "drink", name: "شاي", latin: "Tea", desc: "بالنعنع أو سادة.", price: "٦٬٠٠٠", mark: "", photo: "" },
    { group: "drink", name: "متّة", latin: "Maté", desc: "طقم كامل.", price: "١٢٬٠٠٠", mark: "", photo: "" },
    { group: "drink", name: "عيران", latin: "Ayran", desc: "لبن، ملح، نعنع.", price: "١٠٬٠٠٠", mark: "", photo: "" },
  ],
  hours: [
    { days: "السبت – الخميس", time: "٦:٠٠ – ١:٠٠" },
    { days: "الجمعة", time: "٦:٠٠ – ٢:٠٠" },
    { days: "العطل", time: "حسب الإعلان" },
  ],
  visit: {
    mapPhoto: "",
    directionsUrl: "",
    dineNote: "تناول في المحلّ · طلبات خارجية",
  },
  socials: [
    { title: "إنستغرام", glyph: "◎" },
    { title: "فيسبوك", glyph: "f" },
  ],
};

export const foulFatteh: TemplateModule = {
  key: "foul-fatteh",
  label: "فول وفتّة",
  vertical: "restaurant",
  description:
    "قالب مطعم شعبي: قائمة فول وفتّة وحمّص بأقسام، وصفحة زيارة بالأوقات والموقع. عربي بالكامل، بنقش عجمي.",
  tags: ["فول", "فتّة", "فطور شامي", "حمّص", "مطعم شعبي", "قائمة طعام", "عربي", "دمشق"],
  // Catalog cover — a static asset (see public/template-covers). Until the file
  // is dropped in, the gallery shows its generated poster fallback.
  cover: "/template-covers/foul-fatteh.webp",
  // The template has its own strict prop shape; the host spreads merged content
  // onto it, so we widen through `unknown` at this single boundary.
  Component: Component as unknown as TemplateModule["Component"],
  defaults,
  nameKey: "shop.name",
  themeFont: true,
  tokens: [
    { key: "accent", label: "لون التمييز", cssVar: "--color-aj-gold", default: "oklch(0.68 0.11 82)" },
    { key: "ground", label: "لون الترويسة", cssVar: "--color-aj-green", default: "oklch(0.24 0.04 165)" },
    { key: "ink", label: "خلفية القائمة", cssVar: "--color-aj-cream", default: "oklch(0.965 0.014 88)" },
  ],
  steps: [
    {
      key: "shop",
      title: "معلومات المطعم",
      hint: "الاسم، الشعار، وطرق التواصل والموقع.",
      fields: [
        { key: "shop.name", label: "اسم المطعم", type: "text", placeholder: "فول أبو شادي" },
        { key: "shop.latinName", label: "الاسم اللاتيني", type: "text", placeholder: "Abu Shadi Foul" },
        { key: "shop.tagline", label: "الشعار", type: "text", placeholder: "فول · فتّة · حمّص" },
        { key: "shop.heroLine", label: "عنوان الغلاف", type: "text", placeholder: "فول وفتّة" },
        { key: "shop.heroPhoto", label: "صورة الغلاف", type: "image" },
        { key: "shop.hoursNote", label: "ملاحظة الدوام", type: "text", placeholder: "٦:٠٠ ص – ١:٠٠ م" },
        { key: "shop.phone", label: "الهاتف", type: "phone", help: "إلزامي — عليه يتّصل الزبون ويطلب." },
        { key: "shop.address", label: "العنوان", type: "text" },
        { key: "shop.mapsUrl", label: "رابط الخريطة", type: "text" },
      ],
    },
    {
      key: "menu",
      title: "القائمة",
      hint: "الأقسام والأطباق مع الأسعار.",
      fields: [
        {
          key: "groups", label: "أقسام القائمة", type: "categories", itemLabel: "قسم",
          optionValue: "id", optionLabel: "label",
          dependents: { list: "items", key: "group" },
          placeholder: "مثال: الفول",
        },
        {
          key: "items", label: "الأطباق", type: "list", itemLabel: "طبق",
          blank: { group: "", name: "", latin: "", desc: "", price: "", mark: "", photo: "" },
          item: [
            {
              key: "group", label: "القسم", type: "select",
              optionsFrom: "groups", optionValue: "id", optionLabel: "label",
              placeholder: "اختر القسم",
            },
            { key: "name", label: "اسم الطبق", type: "text" },
            { key: "latin", label: "الاسم اللاتيني", type: "text" },
            { key: "desc", label: "الوصف", type: "textarea" },
            { key: "price", label: "السعر", type: "text", placeholder: "٢٥٬٠٠٠" },
            { key: "mark", label: "وسم (اختياري)", type: "text", placeholder: "نباتي" },
            { key: "photo", label: "صورة", type: "image" },
          ],
        },
      ],
    },
    {
      key: "visit",
      title: "الزيارة",
      hint: "أوقات العمل، الخريطة، والاتجاهات.",
      fields: [
        {
          key: "hours", label: "أوقات العمل", type: "list", itemLabel: "صف",
          blank: { days: "", time: "" },
          item: [
            { key: "days", label: "الأيام", type: "text", placeholder: "السبت – الخميس" },
            { key: "time", label: "الوقت", type: "text", placeholder: "٦:٠٠ – ١:٠٠" },
          ],
        },
        { key: "visit.dineNote", label: "ملاحظة الخدمة", type: "text", placeholder: "تناول في المحلّ · طلبات خارجية" },
        { key: "visit.mapPhoto", label: "صورة الخريطة", type: "image" },
        { key: "visit.directionsUrl", label: "رابط الاتجاهات", type: "text" },
      ],
    },
  ],
};
