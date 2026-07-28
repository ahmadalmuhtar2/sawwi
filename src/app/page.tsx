import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  MousePointerClick,
  Rocket,
  Scissors,
  UtensilsCrossed,
  Wrench,
  Check,
  MessageCircle,
  Palette,
  LayoutGrid,
  Globe,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ROOT_DOMAIN, PLATFORM_URL } from "@/lib/site-url";

// Structured data (schema.org) so Google can show Sawwi as an organization /
// web app and understand the brand + what it does. One @graph, rendered once on
// the homepage.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${PLATFORM_URL}/#organization`,
      name: "سوّي",
      alternateName: "Sawwi",
      url: PLATFORM_URL,
      logo: `${PLATFORM_URL}/icon.svg`,
      description:
        "منصّة عربية لبناء مواقع الأعمال المحلية بقوالب جاهزة، بدون برمجة.",
    },
    {
      "@type": "WebSite",
      "@id": `${PLATFORM_URL}/#website`,
      url: PLATFORM_URL,
      name: "سوّي",
      alternateName: "Sawwi",
      inLanguage: "ar",
      publisher: { "@id": `${PLATFORM_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: "سوّي",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "ar",
      url: PLATFORM_URL,
      description:
        "أنشئ موقع عملك بقوالب عربية جاهزة (مطعم، صالون حلاقة، متجر…) وانشره على نطاقك الفرعي في دقائق — بدون تصميم أو برمجة.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

export default function LandingPage() {
  return (
    <div className="bg-bg text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo className="h-9 w-auto" />
          <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
            <a href="#how" className="hover:text-ink">كيف يعمل</a>
            <a href="#templates" className="hover:text-ink">القوالب</a>
            <a href="#sections" className="hover:text-ink">الأقسام</a>
            <a href="#pricing" className="hover:text-ink">الأسعار</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">دخول</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">ابدأ مجانًا</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-100 px-3 py-1 text-xs font-medium text-accent-900">
              <span className="size-1.5 rounded-full bg-accent" />
              منصّة عربية — RTL أولًا
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">
              أنشئ موقع عملك
              <br />
              في <span className="text-accent">دقائق</span> — لا تصميم من الصفر.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
              اختر قالبًا لمجالك، رتّب الأقسام الجاهزة، واملأ بياناتك. سوّي يحمل
              جودة التصميم عنك — أنت فقط تختار.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  ابدأ الآن مجانًا <ArrowLeft className="size-4" />
                </Button>
              </Link>
              <a href="#templates">
                <Button size="lg" variant="secondary">استعرض القوالب</Button>
              </a>
            </div>
            <p className="mt-4 text-sm text-faint">
              النشر باشتراك سنوي — التصميم والمعاينة مجانًا تمامًا.
            </p>
          </div>

          {/* Browser mockup */}
          <div className="relative">
            <div className="rounded-lg border border-line bg-surface shadow-lg">
              <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
                <span className="size-2.5 rounded-full bg-danger/40" />
                <span className="size-2.5 rounded-full bg-warn/50" />
                <span className="size-2.5 rounded-full bg-accent/40" />
                <span className="ms-3 font-label text-[10px] text-faint">
                  ABU-ALI.{ROOT_DOMAIN}
                </span>
              </div>
              <div className="space-y-4 p-5">
                <div className="rounded-md bg-accent px-5 py-8 text-white">
                  <div className="h-3 w-24 rounded bg-white/70" />
                  <div className="mt-3 h-6 w-40 rounded bg-white/90" />
                  <div className="mt-4 h-8 w-28 rounded bg-white/20" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-md border border-line p-3">
                      <div className="h-10 rounded bg-accent-100" />
                      <div className="mt-2 h-2 w-3/4 rounded bg-line" />
                      <div className="mt-1.5 h-2 w-1/2 rounded bg-line" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 rounded-md bg-accent-100 px-4 py-3">
                  <MessageCircle className="size-4 text-accent" />
                  <div className="h-2 w-32 rounded bg-accent/30" />
                </div>
              </div>
            </div>
            <div className="absolute -inset-6 -z-10 rounded-full bg-accent-100/60 blur-3xl" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionTitle kicker="كيف يعمل" title="ثلاث خطوات إلى موقع احترافي" />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { icon: <LayoutGrid className="size-6" />, t: "اختر قالبًا", d: "قالب جاهز لمجالك: حلاقة، مطعم، خدمات — بمحتوى عربي مبدئي." },
              { icon: <MousePointerClick className="size-6" />, t: "رتّب واملأ", d: "بدّل الأقسام وأنماطها وألوانها، واملأ خدماتك وساعات العمل." },
              { icon: <Rocket className="size-6" />, t: "انشُر", d: "انشر موقعك على نطاقك الفرعي فورًا، مع معاينة حيّة قبل النشر." },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="flex size-12 items-center justify-center rounded-lg bg-accent-100 text-accent">
                  {s.icon}
                </div>
                <h3 className="mt-4 text-lg font-bold">{s.t}</h3>
                <p className="mt-2 leading-relaxed text-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="mx-auto max-w-6xl px-5 py-20">
        <SectionTitle kicker="القوالب" title="ابدأ من قالب مصمّم لمجالك" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: <Scissors />, t: "صالون حلاقة", d: "خدمات، أسعار، معرض صور، ساعات عمل، وموقع." },
            { icon: <UtensilsCrossed />, t: "مطعم", d: "قائمة طعام بالأسعار، معرض، وزر تواصل واتساب." },
            { icon: <Wrench />, t: "خدمات عامة", d: "لأي نشاط خدمي: تعريف، خدمات، وآراء العملاء." },
          ].map((c, i) => (
            <div
              key={i}
              className="group rounded-card border border-line bg-surface p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex size-12 items-center justify-center rounded-lg bg-accent text-white [&_svg]:size-6">
                {c.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold">{c.t}</h3>
              <p className="mt-2 leading-relaxed text-muted">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section library */}
      <section id="sections" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionTitle
            kicker="مكتبة الأقسام"
            title="أقسام جاهزة، جودة مضمونة"
            subtitle="١٣ نوع قسم مصمّم بعناية — يستحيل أن تخرج بموقع غير أنيق."
          />
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {[
              "الواجهة", "من نحن", "الخدمات", "قائمة الأسعار", "المعرض",
              "آراء العملاء", "الفريق", "ساعات العمل", "الخريطة والعنوان",
              "واتساب", "الأسئلة الشائعة", "شريط إعلان", "تواصل",
            ].map((s) => (
              <span
                key={s}
                className="rounded-full border border-line bg-bg px-4 py-2 text-sm text-ink"
              >
                {s}
              </span>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-muted">
            <span className="inline-flex items-center gap-2"><Palette className="size-4 text-accent" /> أنماط وألوان لكل قسم</span>
            <span className="inline-flex items-center gap-2"><Layers className="size-4 text-accent" /> إعادة ترتيب بالسحب</span>
            <span className="inline-flex items-center gap-2"><Globe className="size-4 text-accent" /> عربي و RTL بالكامل</span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-20">
        <SectionTitle kicker="الأسعار" title="اشتراك سنوي بسيط" />
        <div className="mx-auto mt-12 max-w-md rounded-card border-2 border-accent bg-surface p-8 shadow-md">
          <h3 className="text-lg font-bold">موقع منشور</h3>
          <p className="mt-1 text-muted">كل ما تحتاجه لموقع عمل احترافي.</p>
          <div className="mt-6 flex items-end gap-2">
            <span className="text-4xl font-extrabold">سنويًا</span>
            <span className="mb-1 text-muted">/ نقدًا</span>
          </div>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              `موقع كامل على نطاق فرعي‏ {slug}.${ROOT_DOMAIN}`,
              "كل أنواع الأقسام والقوالب",
              "تعديلات ونشر غير محدود",
              "معاينة وتصميم مجانًا قبل الاشتراك",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link href="/register" className="mt-8 block">
            <Button size="lg" className="w-full">ابدأ مجانًا</Button>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-card bg-accent px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-extrabold">جاهز لإطلاق موقعك؟</h2>
          <p className="mx-auto mt-3 max-w-md text-white/80">
            أنشئ حسابك الآن وابدأ التصميم مجانًا — لن تدفع إلا عند النشر.
          </p>
          <Link href="/register" className="mt-8 inline-block">
            <Button size="lg" variant="secondary">إنشاء حساب مجاني</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted md:flex-row">
          <Logo variant="mono-ink" className="h-7 w-auto opacity-80" />
          <p>© سوّي — منصّة مواقع الأعمال المحلية</p>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center">
      <span className="font-label text-xs text-accent">{kicker}</span>
      <h2 className="mt-2 text-3xl font-extrabold">{title}</h2>
      {subtitle && <p className="mx-auto mt-3 max-w-xl text-muted">{subtitle}</p>}
    </div>
  );
}
