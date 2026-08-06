// Portfolio (universal) — template module. A bilingual, scroll-driven one-page
// portfolio for any profession. The Arabic seed (Ahmad Almuhtar, full-stack) is
// the shipped demo; the wizard lets a creator start in Arabic OR English (the
// English seed below). `lang` flips direction + the font pairing in the component.

import type { TemplateModule } from "../types";
import Component from "./component";

/* ── the shipped Arabic demo — also the canonical content shape ─────────── */
const defaults = {
  lang: "ar",
  shop: {
    name: "أحمد ناصر المهتار",
    brand: "أ. المهتار",
    role: "مطوّر Full-stack",
    kicker: "بورتفوليو · أيسن، ألمانيا · مستقل",
    headline: "واجهات أنيقة وخوادم لا تسقط.",
    pitch: "أحوّل الأفكار إلى منتجات حقيقية: واجهة سريعة، خادم متين، وتفاصيل لا يراها المستخدم لكنه يشعر بها.",
    status: "أستقبل مشاريع جديدة",
    logo: "",
    email: "",
    whatsapp: "",
    phone: "",
    heroPhoto: "https://media.sawwi.online/production/templates/portfolio/Gemini_Generated_Image_ixlz03ixlz03ixlz.webp",
    aboutPhoto: "https://media.sawwi.online/production/templates/portfolio/Gemini_Generated_Image_n1xxwvn1xxwvn1xx.webp",
    heroCaption: "المكتب، منتصف مشروع",
    socials: {
      instagram: "https://www.instagram.com/ahmadalmuhtar/",
      linkedin: "https://www.linkedin.com/in/ahmad-naser-almuhtar-bb9078235",
      github: "https://github.com/ahmadalmuhtar2",
    },
  },
  marquee: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Prisma", "Docker", "CI/CD"],
  works: [
    { title: "سوّي — منصة بناء مواقع متعددة المستأجرين", meta: "2026 · SaaS · مؤسس ومطوّر منفرد", outcome: "موقع كامل جاهز للنشر في أقل من ٣٠ دقيقة، دون كتابة سطر كود واحد.", desc: "منصة تتيح للوكالات وأصحاب الأعمال بناء مواقع عربية بالكامل عبر محرر مرئي، مع مساحات عمل متعددة المستخدمين وصلاحيات مقيّدة لكل موقع. كل موقع له هويته وخطوطه وإعداداته، مع سجل نسخ كامل وإمكانية التراجع.", tags: ["Next.js", "PostgreSQL", "Docker"], photo: "https://media.sawwi.online/production/templates/portfolio/Gemini_Generated_Image_9sl9d69sl9d69sl9.png" },
    { title: "Commerly — إنشاء إعلانات ومنتجات بالذكاء الاصطناعي", meta: "2025 · تجارة إلكترونية · ذكاء اصطناعي", outcome: "أفكار وإعلانات جاهزة للنشر خلال ثوانٍ، بدل ساعات من العمل.", desc: "منصة تجارة إلكترونية مدعومة بالذكاء الاصطناعي: يصف التاجر منتجه، فتولّد المنصة أفكار حملات ونصوص إعلانات ومحتوى تسويقي جاهزًا. تحوّل صفحة منتج عادية إلى حملة متكاملة دون الحاجة إلى خبرة تسويقية.", tags: ["Next.js", "OpenAI", "PostgreSQL"], photo: "https://media.sawwi.online/production/templates/portfolio/Logos_Commerly_Black%20logo%20with%20white%20bg.png" },
    { title: "متجر إلكتروني متكامل", meta: "2024 · تجارة إلكترونية · Full-stack", outcome: "زمن تحميل أقل من ثانية واحدة، وسلة شراء لا تفقد محتواها.", desc: "متجر كامل من الكتالوغ حتى إتمام الطلب: بحث وتصفية، إدارة مخزون، لوحة تحكم للطلبات، ودعم كامل للعربية واتجاه RTL. بُني ليتحمّل موجات الزيارات في مواسم العروض.", tags: ["React", "TypeScript", "PostgreSQL"], photo: "https://media.sawwi.online/production/templates/portfolio/Gemini_Generated_Image_o4j8nxo4j8nxo4j8.webp" },
    { title: "لوحة تحليلات لحظية", meta: "2022 · بيانات · Full-stack", outcome: "ملايين السجلات تتحوّل إلى لوحة تُحدَّث كل ثانيتين.", desc: "لوحة تعرض تدفق البيانات لحظياً عبر WebSocket، مبنية فوق طبقة تجميع تعالج الأحداث قبل وصولها إلى الواجهة. الهدف كان أن يقرأ الفريق الرقم الصحيح دون انتظار.", tags: ["Node.js", "PostgreSQL", "Docker"], photo: "https://media.sawwi.online/production/templates/portfolio/Gemini_Generated_Image_gjw7v6gjw7v6gjw7.webp" },
  ],
  about: {
    heading: "من الفكرة إلى الإطلاق، وحدي",
    body: "أعمل على المشروع كاملاً: أجلس مع الفكرة، أرسم البنية، أبني الواجهة والخادم، ثم أنشره وأبقى بعد الإطلاق. ست سنوات علّمتني أن الجزء الصعب ليس كتابة الكود، بل القرارات التي تُتخذ قبله — ما الذي يُبنى الآن وما الذي يُؤجل. أحبّ الواجهات التي تبدو بسيطة لأن التعقيد أُخفي في مكانه الصحيح، والخوادم التي لا يتذكرها أحد لأنها لا تسقط. أعمل من ألمانيا، بالعربية والألمانية والإنكليزية.",
  },
  facts: [
    { value: 6, suffix: " سنوات", label: "في بناء البرمجيات" },
    { value: 4, suffix: "", label: "مشاريع كبرى" },
    { value: 12, suffix: "+", label: "تقنية أتقنها" },
  ],
  services: [
    { title: "بناء", body: "من الصفحة البيضاء إلى منتج يعمل فعلاً: تصميم الواجهة، بناء الخادم، والنشر على الإنتاج." },
    { title: "إنقاذ", body: "مشروع متوقّف أو كود ورثته عن غيرك؟ أدخل، أوقف النزيف، وأعيده إلى حالة يمكن البناء عليها." },
    { title: "استشارة", body: "قرارات معمارية واضحة قبل أن تصبح مكلفة: اختيار التقنيات، حدود النظام، وخطة إطلاق واقعية." },
  ],
  timeline: [
    { year: "2026—", role: "مؤسس ومطوّر منفرد", org: "سوّي (sawwi.online)", note: "منصة بناء مواقع عربية بنيتها من الصفر وحدي." },
    { year: "2025—2026", role: "شريك مؤسس ومهندس البرمجيات", org: "Commerly", note: "منصة تجارة إلكترونية بالذكاء الاصطناعي لإنشاء الإعلانات — كل الهندسة عليّ." },
    { year: "2023—2025", role: "مطوّر Full-stack (عن بُعد)", org: "Digitalsite FZCO، دبي", note: "منتجات ومتاجر إلكترونية لعملاء في الخليج." },
    { year: "2020—2024", role: "مهندس بيانات", org: "Rechenwerk GmbH، ألمانيا", note: "خطوط بيانات ولوحات تحليلات في بيئة إنتاج." },
  ],
  quote: { text: "أعطيته فكرة ناقصة وأعادها منتجاً يعمل. لم أضطر لمتابعته ولا مرة.", by: "— عميل، مؤسس منتج رقمي" },
  contact: {
    heading: "عندك فكرة تحتاج من يبنيها؟",
    body: "اكتب لي سطرين عن المشروع، وسأرد خلال ٢٤ ساعة.",
    note: "بلا نماذج — رسالة مباشرة تصلني كما هي.",
  },
  footer: "أيسن · بتوقيت وسط أوروبا",
};

/* ── the alternate English seed (chosen in the wizard) ──────────────────── */
const enSeed = {
  lang: "en",
  shop: {
    name: "Ahmad Naser Almuhtar",
    brand: "A. Almuhtar",
    role: "Full-stack Developer",
    kicker: "Portfolio · Essen, Germany · available",
    headline: "Elegant front-ends and back-ends that don't fall over.",
    pitch: "I turn ideas into real products: fast UI, solid backend, and the details users don't see but feel.",
    status: "Available for new projects",
    heroCaption: "The desk, mid-project",
    socials: {
      instagram: "https://www.instagram.com/ahmadalmuhtar/",
      linkedin: "https://www.linkedin.com/in/ahmad-naser-almuhtar-bb9078235",
      github: "https://github.com/ahmadalmuhtar2",
    },
  },
  marquee: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Prisma", "Docker", "CI/CD"],
  works: [
    { title: "Sawwi — Multi-tenant website builder", meta: "2026 · SaaS · Founder & sole engineer", outcome: "A full site live in under 30 minutes, without writing a line of code.", desc: "A platform that lets agencies and business owners build fully Arabic sites through a visual editor, with multi-user workspaces and site-scoped permissions. Every site carries its own theme, fonts and settings, with full version history and rollback.", tags: ["Next.js", "PostgreSQL", "Docker"], photo: "https://media.sawwi.online/production/templates/portfolio/Gemini_Generated_Image_9sl9d69sl9d69sl9.png" },
    { title: "Commerly — AI product ads & ideas platform", meta: "2025 · E-commerce · AI", outcome: "Ready-to-publish ideas and ads for your products in seconds, not hours.", desc: "An AI-powered e-commerce platform: a merchant describes their product and it generates campaign ideas, ad copy, and marketing content ready to publish — turning a plain product page into a full campaign with no marketing expertise required.", tags: ["Next.js", "OpenAI", "PostgreSQL"], photo: "https://media.sawwi.online/production/templates/portfolio/Logos_Commerly_Black%20logo%20with%20white%20bg.png" },
    { title: "Full e-commerce store", meta: "2024 · E-commerce · Full-stack", outcome: "Sub-second page loads and a cart that never loses its contents.", desc: "A complete store from catalog to checkout: search and filtering, inventory management, an order dashboard, and full Arabic/RTL support. Built to hold up under seasonal traffic spikes.", tags: ["React", "TypeScript", "PostgreSQL"], photo: "https://media.sawwi.online/production/templates/portfolio/Gemini_Generated_Image_o4j8nxo4j8nxo4j8.webp" },
    { title: "Real-time analytics dashboard", meta: "2022 · Data · Full-stack", outcome: "Millions of records turned into a dashboard that refreshes every 2 seconds.", desc: "A dashboard streaming live data over WebSocket, built on an aggregation layer that processes events before they reach the UI. The goal was simple: the team reads the right number without waiting.", tags: ["Node.js", "PostgreSQL", "Docker"], photo: "https://media.sawwi.online/production/templates/portfolio/Gemini_Generated_Image_gjw7v6gjw7v6gjw7.webp" },
  ],
  about: {
    heading: "From idea to launch, on my own.",
    body: "I take the whole project: I sit with the idea, sketch the architecture, build the frontend and the backend, ship it, and stay after launch. Six years taught me the hard part isn't writing code — it's the decisions made before it, what gets built now and what waits. I like interfaces that look simple because the complexity was hidden in the right place, and servers nobody thinks about because they don't go down. I work from Germany, in Arabic, German and English.",
  },
  facts: [
    { value: 6, suffix: " yrs", label: "Building software" },
    { value: 4, suffix: "", label: "Major projects" },
    { value: 12, suffix: "+", label: "Technologies mastered" },
  ],
  services: [
    { title: "Build", body: "From a blank page to a product that actually runs — interface, backend, and deployment to production." },
    { title: "Rescue", body: "Stalled project or a codebase you inherited? I come in, stop the bleeding, and get it back to something you can build on." },
    { title: "Advise", body: "Clear architectural decisions before they get expensive — stack, system boundaries, and a realistic launch plan." },
  ],
  timeline: [
    { year: "2026—", role: "Founder & sole engineer", org: "Sawwi (sawwi.online)", note: "An Arabic website-builder platform I built from zero, alone." },
    { year: "2025—2026", role: "Co-founder & sole engineer", org: "Commerly", note: "AI e-commerce platform for generating product ads — the entire engineering side was mine." },
    { year: "2023—2025", role: "Full-stack developer (remote)", org: "Digitalsite FZCO, Dubai", note: "Products and e-commerce stores for clients across the Gulf." },
    { year: "2020—2024", role: "Data engineer", org: "Rechenwerk GmbH, Germany", note: "Data pipelines and analytics dashboards in production." },
  ],
  quote: { text: "I handed him half an idea and he handed back a working product. I never once had to chase him.", by: "— Client, digital product founder" },
  contact: {
    heading: "Got an idea that needs building?",
    body: "Send me two lines about the project — I reply within 24 hours.",
    note: "No forms — a direct message reaches me as-is.",
  },
  footer: "Essen · CET",
};

export const portfolio: TemplateModule = {
  key: "portfolio",
  label: "بورتفوليو",
  vertical: "portfolio",
  description: "بورتفوليو من صفحة واحدة لأي مهنة — أعمال، خبرات، وتواصل. عربي أو إنجليزي، مع تأثيرات تمرير راقية.",
  tags: ["بورتفوليو", "أعمال شخصية", "مطوّر", "مصمم", "مصوّر", "سيرة ذاتية", "عربي وإنجليزي", "صفحة واحدة"],
  cover: "https://media.sawwi.online/production/templates/portfolio/Gemini_Generated_Image_y1x4w1y1x4w1y1x4.webp",
  Component: Component as unknown as TemplateModule["Component"],
  defaults,
  nameKey: "shop.name",
  defaultCurrency: "SYP",
  // Fixed, language-paired fonts (El Messiri / Newsreader) — no font picker.
  themeFont: false,
  // The dominant surface is the page ground.
  surfaceToken: "ground",
  tokens: [
    { key: "accent", label: "لون التمييز", cssVar: "--pf-accent", default: "oklch(0.5 0.08 165)" },
    { key: "ground", label: "الخلفية", cssVar: "--pf-ground", default: "oklch(0.955 0.004 90)" },
    { key: "ink", label: "لون النص", cssVar: "--pf-ink", default: "oklch(0.26 0.012 70)" },
  ],
  // The token defaults equal the light "paper" default, so an untouched site
  // reads as the design's native editorial look. A dark default is offered too.
  palettes: [
    // ── Light ─────────────────────────────────────────────────────────────
    { key: "paper", label: "ورقي", tone: "light", isDefault: true, mood: "فاتح دافئ", colors: { accent: "oklch(0.5 0.08 165)", ground: "oklch(0.955 0.004 90)", ink: "oklch(0.26 0.012 70)" } },
    // Platform-matched light — same accent/ground/ink as Sawwi's own light theme.
    { key: "sawwi", label: "سَوّي", tone: "light", mood: "هوية سَوّي", colors: { accent: "#0b7a5f", ground: "#ffffff", ink: "#0d1b1e" } },
    { key: "ivory", label: "عاجي", tone: "light", mood: "أبيض نظيف", colors: { accent: "oklch(0.5 0.1 160)", ground: "oklch(0.98 0.003 95)", ink: "oklch(0.24 0.01 60)" } },
    { key: "sky", label: "سماوي", tone: "light", mood: "فاتح أزرق", colors: { accent: "oklch(0.52 0.12 245)", ground: "oklch(0.965 0.008 230)", ink: "oklch(0.26 0.02 250)" } },
    { key: "clay", label: "طيني", tone: "light", mood: "فاتح نحاسي", colors: { accent: "oklch(0.55 0.13 45)", ground: "oklch(0.96 0.014 70)", ink: "oklch(0.28 0.025 45)" } },
    { key: "lilac", label: "أرجواني فاتح", tone: "light", mood: "فاتح بنفسجي", colors: { accent: "oklch(0.53 0.13 300)", ground: "oklch(0.965 0.008 310)", ink: "oklch(0.27 0.02 300)" } },
    { key: "sage", label: "ميرمية", tone: "light", mood: "فاتح أخضر", colors: { accent: "oklch(0.52 0.1 150)", ground: "oklch(0.96 0.012 140)", ink: "oklch(0.26 0.02 150)" } },
    // ── Dark ──────────────────────────────────────────────────────────────
    { key: "ink", label: "حِبر", tone: "dark", isDefault: true, mood: "داكن دافئ", colors: { accent: "oklch(0.64 0.1 165)", ground: "oklch(0.17 0.01 70)", ink: "oklch(0.93 0.008 85)" } },
    // Platform-matched dark — same emerald accent + dark-teal ground/ink as Sawwi's dark theme.
    { key: "sawwiDark", label: "سَوّي داكن", tone: "dark", mood: "هوية سَوّي", colors: { accent: "#16a37b", ground: "#0a1416", ink: "#ecf1f0" } },
    { key: "midnight", label: "منتصف الليل", tone: "dark", mood: "داكن أزرق", colors: { accent: "oklch(0.66 0.12 235)", ground: "oklch(0.16 0.025 250)", ink: "oklch(0.93 0.015 245)" } },
    { key: "ember", label: "جمر", tone: "dark", mood: "داكن نحاسي", colors: { accent: "oklch(0.68 0.14 45)", ground: "oklch(0.165 0.02 40)", ink: "oklch(0.93 0.015 70)" } },
    { key: "plum", label: "برقوقي", tone: "dark", mood: "أرجواني داكن", colors: { accent: "oklch(0.66 0.15 320)", ground: "oklch(0.165 0.03 315)", ink: "oklch(0.93 0.015 320)" } },
    { key: "forest", label: "غابة", tone: "dark", mood: "أخضر عميق", colors: { accent: "oklch(0.68 0.13 155)", ground: "oklch(0.15 0.02 160)", ink: "oklch(0.93 0.015 140)" } },
    { key: "onyx", label: "أونيكس", tone: "dark", mood: "أسود أنيق", colors: { accent: "oklch(0.66 0.12 200)", ground: "oklch(0.145 0.004 250)", ink: "oklch(0.93 0.006 250)" } },
  ],
  // Bilingual create choice — the chosen variant's seed becomes the new site's
  // starting content (name/logo from the fields merge over it). See onboarding.
  create: {
    label: "لغة الموقع",
    default: "ar",
    options: [
      { value: "ar", label: "العربية", seed: { lang: "ar" } },
      { value: "en", label: "English", seed: enSeed },
    ],
  },
  steps: [
    {
      key: "identity",
      title: "الهوية",
      hint: "الاسم والعنوان والنبذة والأعمال تُحرَّر مباشرةً على الموقع (نقر مزدوج). هنا التفاصيل الصغيرة.",
      fields: [
        { key: "shop.brand", label: "الاسم المختصر (الترويسة)", type: "text", placeholder: "أ. المهتار" },
        { key: "shop.role", label: "المسمّى المهني", type: "text", placeholder: "مطوّر Full-stack" },
        { key: "shop.status", label: "حالة التوفّر", type: "text", placeholder: "أستقبل مشاريع جديدة" },
        { key: "footer", label: "تذييل (يمين)", type: "text", placeholder: "أيسن · بتوقيت وسط أوروبا" },
      ],
    },
    {
      key: "contact",
      title: "التواصل",
      hint: "تظهر أيقونة كل حقل تملؤه فقط؛ الحقول الفارغة لا تظهر.",
      fields: [
        { key: "shop.email", label: "البريد الإلكتروني", type: "text", ltr: true, placeholder: "you@example.com", help: "زر التواصل الأساسي في لوحة التواصل." },
        { key: "shop.whatsapp", label: "رقم واتساب", type: "phone" },
        { key: "shop.phone", label: "الهاتف", type: "phone" },
        { key: "shop.socials.instagram", label: "رابط إنستغرام", type: "text", ltr: true, placeholder: "https://instagram.com/…" },
        { key: "shop.socials.linkedin", label: "رابط لينكدإن", type: "text", ltr: true, placeholder: "https://linkedin.com/in/…" },
        { key: "shop.socials.github", label: "رابط غيت هَب", type: "text", ltr: true, placeholder: "https://github.com/…" },
      ],
    },
  ],
};
