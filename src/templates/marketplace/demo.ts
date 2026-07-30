// Demo inventory — a complete, believable business so the template reads as
// finished in the gallery/preview BEFORE any real listing exists (TEMPLATE_GUIDE
// §3.1). The public component falls back to this when it receives no `listings`
// prop (gallery/template page). A real site always passes its own array (even
// if empty → the real empty state). Prices are USD integers; the UI renders them
// Arabic-Indic with the site currency.

import type { MarketplaceListing } from "./schema";

export const DEMO_LISTINGS: MarketplaceListing[] = [
  {
    id: "demo-car-1", vertical: "car", title: "تويوتا كامري LE ٢٠٢١، مالك واحد",
    price: 18500, place: "دمشق", featured: true, status: "available",
    images: [], features: ["ملاحة", "كاميرا خلفية", "مقاعد مدفأة", "حساسات ركن"],
    specs: { make: "تويوتا", model: "كامري LE", year: 2021, km: 62000, fuel: "بنزين", trans: "أوتوماتيك", hp: 203, body: "سيدان", cond: "مستعملة", owners: 1, colour: "أبيض", seats: 5, doors: 4, drive: "أمامي", service: "كامل" },
    description: "مالك واحد، صيانة دورية في الوكالة. إطارات جديدة ومكيّف ممتاز.",
  },
  {
    id: "demo-car-2", vertical: "car", title: "كيا سبورتاج ٢٠٢١ دفع رباعي",
    price: 24000, place: "دمشق", featured: true, status: "reserved",
    images: [], features: ["ملاحة", "كاميرا خلفية", "فتحة سقف", "شاشة لمس"],
    specs: { make: "كيا", model: "سبورتاج", year: 2021, km: 55000, fuel: "بنزين", trans: "أوتوماتيك", body: "دفع رباعي", cond: "مستعملة", colour: "رمادي", seats: 5, doors: 5, drive: "رباعي" },
    description: "بحالة الوكالة، فحص كامل متاح. دفع رباعي مناسب لكل الطرقات.",
  },
  {
    id: "demo-car-3", vertical: "car", title: "هيونداي إلنترا ٢٠٢٠",
    price: 15900, place: "حلب", status: "available",
    images: [], features: ["حساسات ركن", "مثبت سرعة"],
    specs: { make: "هيونداي", model: "إلنترا", year: 2020, km: 48000, fuel: "بنزين", trans: "أوتوماتيك", body: "سيدان", cond: "مستعملة", colour: "فضي", seats: 5, doors: 4 },
    description: "اقتصادية بالوقود، غير مصدومة، أوراق جاهزة للنقل.",
  },
  {
    id: "demo-car-4", vertical: "car", title: "مرسيدس E200 ٢٠١٩ فل أوبشن",
    price: 32000, place: "اللاذقية", status: "available",
    images: [], features: ["مقاعد مدفأة", "فتحة سقف", "ملاحة", "كاميرا خلفية"],
    specs: { make: "مرسيدس", model: "E200", year: 2019, km: 78000, fuel: "بنزين", trans: "أوتوماتيك", body: "سيدان", cond: "مستعملة", colour: "أسود", seats: 5, doors: 4, drive: "خلفي" },
    description: "فل مواصفات، جلد أصلي. صيانة موثّقة بالكامل.",
  },
  {
    id: "demo-car-5", vertical: "car", title: "فولكس واغن غولف ٢٠١٨",
    price: 12500, place: "حمص", status: "available",
    images: [], features: ["مثبت سرعة"],
    specs: { make: "فولكس واغن", model: "غولف", year: 2018, km: 96000, fuel: "بنزين", trans: "يدوي", body: "هاتشباك", cond: "مستعملة", colour: "أحمر", seats: 5, doors: 5 },
    description: "عملية واقتصادية، مناسبة للمدينة. سعر قابل للتفاوض.",
  },
  {
    id: "demo-car-6", vertical: "car", title: "نيسان صني ٢٠٢٢ بحالة الوكالة",
    price: 13900, place: "حماة", status: "sold",
    images: [], features: ["كاميرا خلفية"],
    specs: { make: "نيسان", model: "صني", year: 2022, km: 30000, fuel: "بنزين", trans: "أوتوماتيك", body: "سيدان", cond: "مستعملة", colour: "أبيض", seats: 5, doors: 4 },
    description: "كيلومترات قليلة، أول استعمال. ضمان المحرك ساري.",
  },

  {
    id: "demo-home-1", vertical: "home", title: "شقة مشمسة ٣ غرف مع شرفة",
    price: 95000, offer: "بيع", place: "دمشق", featured: true, status: "available",
    images: [], features: ["شرفة", "مصعد", "موقف سيارات", "مطبخ مجهز"],
    specs: { type: "شقة", size: 145, rooms: 3, beds: 2, baths: 2, floor: 4, built: 2015, heat: "مركزية", cond: "مجدّد", district: "المزة", energy: "B", orientation: "جنوب" },
    description: "إطلالة مفتوحة، تشطيب حديث. قريبة من المدارس والخدمات.",
  },
  {
    id: "demo-home-2", vertical: "home", title: "دوبلكس فاخر مع تدفئة أرضية",
    price: 320000, offer: "بيع", place: "دمشق", featured: true, status: "available",
    images: [], features: ["مصعد", "موقف سيارات", "تدفئة أرضية", "مطبخ مجهز"],
    specs: { type: "دوبلكس", size: 320, rooms: 6, beds: 4, baths: 4, floor: 5, built: 2020, heat: "مركزية", cond: "جديد", district: "أبو رمانة", energy: "A", orientation: "شرق" },
    description: "تشطيب فندقي، مساحات واسعة. مصعد خاص وموقفان في المرآب.",
  },
  {
    id: "demo-home-3", vertical: "home", title: "منزل مستقل مع حديقة",
    price: 210000, offer: "بيع", place: "اللاذقية", status: "available",
    images: [], features: ["حديقة", "موقف سيارات", "قبو"],
    specs: { type: "منزل", size: 260, rooms: 5, beds: 4, baths: 3, floor: 0, built: 2018, heat: "مركزية", cond: "جيد", plot: 420, orientation: "جنوب" },
    description: "حديقة ٤٢٠ م² جنوبية، موقفان على الأرض. هادئ ومناسب للعائلات.",
  },
  {
    id: "demo-home-4", vertical: "home", title: "شقة مفروشة للإيجار ٣ غرف",
    price: 450, offer: "إيجار", place: "حلب", status: "available",
    images: [], features: ["مفروش", "شرفة", "مصعد"],
    specs: { type: "شقة", size: 110, rooms: 3, beds: 2, baths: 1, floor: 2, built: 2010, heat: "غاز", cond: "جيد", available: "فورًا", pets: "حسب الطلب" },
    description: "مفروشة بالكامل وجاهزة للسكن. عقد مرن وموقع مركزي.",
  },
  {
    id: "demo-home-5", vertical: "home", title: "استوديو وسط المدينة",
    price: 220, offer: "إيجار", place: "دمشق", status: "reserved",
    images: [], features: ["مفروش"],
    specs: { type: "استوديو", size: 45, rooms: 1, beds: 1, baths: 1, floor: 3, built: 2005, heat: "كهرباء", cond: "جيد", available: "فورًا" },
    description: "مناسب لشخص واحد، كل الخدمات على بعد دقائق سيرًا.",
  },
];
