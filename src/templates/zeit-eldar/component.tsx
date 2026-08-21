"use client";

// زيت الدار (Zeit el-Dar) — a premium single-product landing page for a Syrian
// olive-oil business (16kg tins, delivered inside Syria). Arabic-only, full RTL,
// mobile-first. Ordering is WhatsApp-only (no on-page form): the hero, product and
// payment CTAs plus a floating bubble all deep-link to the registered number.
//
// Editing: every headline/paragraph is inline-editable (double-click) via the
// shared EditableText/EditableImage primitives — inert on the published site,
// live in the builder. The price is inline-editable and auto-converts Latin digits
// to Arabic-Indic on commit; the currency symbol follows the site's chosen unit
// (the app currency enum, passed as the `currency` prop).
//
// Theme = the fixed brand palette sampled from the logo (see index.ts). Roles are
// STRICT: surface is the page background; tint only for bands/cards; brand for
// primary/headings/footer; accent (terracotta) ONLY for price + small badges;
// success (green) ONLY for WhatsApp buttons + the floating bubble.

import * as React from "react";
import { MessageCircle, ChevronDown, Copy, Check, Sprout, Droplets, Camera, Truck, Wallet, Banknote, MapPin, Phone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { EditableText, EditableImage, useEditList } from "@/components/templates/inline-edit";

const HEAD = "'Readex Pro Variable','Readex Pro',sans-serif";
const BODY = "'Cairo Variable','Cairo',sans-serif";

interface Brand { name?: string; whatsapp?: string; shamcash?: string }
interface Hero { eyebrow?: string; headline?: string; subline?: string }
interface Product { tin?: string; price?: string; desc?: string; heroImage?: string; productImage?: string }
interface WhyPoint { t: string; b: string }
interface Why { title?: string; points?: WhyPoint[] }
interface Pay { title?: string; intro?: string; shamTitle?: string; shamNote?: string; codTitle?: string; codNote?: string }
interface Delivery { area?: string }
interface Props {
  brand?: Brand;
  hero?: Hero;
  product?: Product;
  why?: Why;
  pay?: Pay;
  delivery?: Delivery;
  currency?: string;
}

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

/** wa.me deep link from a raw number + optional prefilled text. Null when no number. */
const waLink = (num?: string, text?: string) => {
  const digits = (num ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};

/* The curated fixed palette (roles beyond the 3 host tokens brand/surface/ink). */
const FIXED_VARS: React.CSSProperties = {
  ["--zd-brand-dark" as string]: "#343210",
  ["--zd-tint" as string]: "#FAE4BD",
  ["--zd-accent" as string]: "#A2522B",
  ["--zd-muted" as string]: "#7A7550",
  ["--zd-border" as string]: "#E8D6B4",
  ["--zd-success" as string]: "#2E7D5B",
};

export default function ZeitElDar({ brand = {}, hero = {}, product = {}, why = {}, pay = {}, delivery = {}, currency = "ل.س" }: Props) {
  const name = brand.name?.trim() || "زيت الدار";
  const whatsapp = brand.whatsapp || "";
  const wa = waLink(whatsapp, `مرحبا، بدي اطلب ${name} 🫒`);

  return (
    <div
      style={{ ...FIXED_VARS, fontFamily: BODY, background: "var(--zd-surface)", color: "var(--zd-ink)" }}
      className="min-h-screen w-full overflow-x-hidden"
    >
      {/* slow ken-burns for the hero image — motion-safe only */}
      <style>{`@keyframes zd-kb{from{transform:scale(1.03)}to{transform:scale(1.13)}}@media (prefers-reduced-motion:no-preference){.zd-kb{animation:zd-kb 22s ease-in-out infinite alternate}}`}</style>

      <HeroSection name={name} hero={hero} heroImage={product.heroImage} wa={wa} />
      <ProductCard name={name} product={product} currency={currency} wa={wa} />
      <WhyUs why={why} />
      <OrderingPayment pay={pay} shamcash={brand.shamcash} delivery={delivery} wa={wa} />
      <Footer name={name} whatsapp={whatsapp} delivery={delivery} wa={wa} />
      {/* No floating button here: the Sawwi host renders its own floating «راسلنا»
          contact widget on every served site, which posts to the site's internal
          messages inbox (dashboard «الرسائل»). The prominent CTAs above go to
          WhatsApp; the floating bubble is that host messages widget. */}
    </div>
  );
}

/* ─────────────────────────── layout helpers ─────────────────────────── */

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[640px] px-5 ${className}`}>{children}</div>;
}

/* ─────────────────────────── hero (full-bleed) ─────────────────────────── */

function HeroSection({ name, hero, heroImage, wa }: { name: string; hero: Hero; heroImage?: string; wa: string | null }) {
  return (
    <header
      className="relative flex min-h-[80svh] w-full items-end overflow-hidden"
      style={{ background: "linear-gradient(160deg, var(--zd-brand), var(--zd-brand-dark))" }}
    >
      {/* image layer — swappable inline; empty → the brand gradient shows through */}
      <EditableImage path="product.heroImage" className="absolute inset-0 block">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- storage URL, priority hero (LCP)
          <img src={heroImage} alt={name} loading="eager" decoding="async" fetchPriority="high" className="zd-kb absolute inset-0 h-full w-full object-cover" />
        ) : null}
      </EditableImage>

      {/* effects: bottom scrim for text legibility + a soft vignette for depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(41,40,16,0.9) 0%, rgba(41,40,16,0.55) 34%, rgba(41,40,16,0.12) 62%, rgba(41,40,16,0.28) 100%)" }}
      />
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 180px 40px rgba(41,40,16,0.55)" }} />

      {/* copy */}
      <Container className="relative z-[2] pb-12 pt-28 sm:pb-16 sm:pt-32">
        <EditableText
          path="hero.eyebrow"
          value={hero.eyebrow ?? ""}
          as="p"
          placeholder="سطر تعريفي"
          className="mb-3 text-[13.5px] font-bold tracking-wide"
          style={{ color: "var(--zd-tint)", textShadow: "0 1px 8px rgba(0,0,0,.35)" }}
        />
        <EditableText
          path="brand.name"
          value={name}
          as="h1"
          className="text-[46px] leading-[1.05] font-extrabold sm:text-[64px]"
          style={{ fontFamily: HEAD, color: "var(--zd-surface)", textShadow: "0 2px 18px rgba(0,0,0,.4)" }}
        />
        <EditableText
          path="hero.headline"
          value={hero.headline ?? ""}
          as="p"
          placeholder="عنوان قصير"
          className="mt-3 text-[19px] font-bold sm:text-[22px]"
          style={{ color: "var(--zd-surface)", textShadow: "0 1px 12px rgba(0,0,0,.45)" }}
        />
        <EditableText
          path="hero.subline"
          value={hero.subline ?? ""}
          as="p"
          multiline
          placeholder="وصف قصير عن الزيت والتوصيل"
          className="mt-2 max-w-[34rem] text-[15.5px] leading-relaxed"
          style={{ color: "rgba(253,246,233,0.92)", textShadow: "0 1px 10px rgba(0,0,0,.4)" }}
        />
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl px-7 text-[16.5px] font-bold shadow-lg"
              style={{ background: "var(--zd-success)", color: "var(--zd-surface)" }}
            >
              <MessageCircle className="size-5" /> اطلب عبر واتساب
            </a>
          )}
          <button
            type="button"
            onClick={() => scrollTo("product")}
            className="inline-flex min-h-[54px] items-center justify-center gap-1.5 rounded-2xl border px-7 text-[16px] font-semibold backdrop-blur-sm"
            style={{ borderColor: "rgba(253,246,233,0.55)", color: "var(--zd-surface)", background: "rgba(253,246,233,0.08)" }}
          >
            شوف التفاصيل <ChevronDown className="size-4" />
          </button>
        </div>
      </Container>
    </header>
  );
}

/* ─────────────────────────── product card ─────────────────────────── */

function ProductCard({ name, product, currency, wa }: { name: string; product: Product; currency: string; wa: string | null }) {
  return (
    // The whole section IS one premium card (no colored band). The product image
    // spans the full card width; the order area sits beneath it.
    <section id="product" className="px-5 py-12 sm:py-16" style={{ background: "var(--zd-surface)" }}>
      <div className="mx-auto w-full max-w-[880px] overflow-hidden rounded-[32px] border shadow-xl" style={{ borderColor: "var(--zd-border)", background: "var(--zd-surface)" }}>
        {/* full-width product image with a soft scrim + a floating tin chip */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16 / 10" }}>
          <EditableImage path="product.productImage" className="absolute inset-0 block">
            {product.productImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- storage URL
              <img src={product.productImage} alt={name} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center" style={{ background: "linear-gradient(135deg, var(--zd-tint), color-mix(in srgb, var(--zd-brand) 20%, var(--zd-tint)))" }} aria-hidden>
                <Droplets className="size-12 opacity-40" style={{ color: "var(--zd-brand)" }} />
              </div>
            )}
          </EditableImage>
          <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(41,40,16,0.3), transparent 28%)" }} />
          <span className="absolute start-4 top-4 inline-flex items-center rounded-full px-3.5 py-1.5 text-[12.5px] font-bold shadow-sm backdrop-blur-sm" style={{ background: "rgba(253,246,233,0.92)", color: "var(--zd-accent)" }}>
            <EditableText path="product.tin" value={product.tin ?? ""} placeholder="حجم التنكة" />
          </span>
        </div>

        {/* order area */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <EditableText path="brand.name" value={name} as="h2" className="text-[26px] font-extrabold sm:text-[30px]" style={{ fontFamily: HEAD, color: "var(--zd-brand)" }} />
            {/* price: inline-editable NUMBER (auto Latin→Arabic on commit) + the
                site currency symbol from the app currency enum. */}
            <div className="flex items-baseline gap-1.5">
              <EditableText path="product.price" value={product.price ?? ""} as="span" placeholder="٠" className="text-[30px] leading-none font-extrabold sm:text-[34px]" style={{ color: "var(--zd-accent)" }} />
              <span className="text-[16px] font-bold" style={{ color: "var(--zd-accent)" }}>{currency}</span>
              <span className="text-[13px]" style={{ color: "var(--zd-ink)" }}>/ للتنكة</span>
            </div>
          </div>
          <EditableText path="product.desc" value={product.desc ?? ""} as="p" multiline placeholder="وصف قصير للمنتج…" className="mt-4 text-[15.5px] leading-relaxed" style={{ color: "var(--zd-ink)" }} />
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-2xl text-[17px] font-bold shadow-lg transition-transform hover:scale-[1.01]" style={{ background: "var(--zd-success)", color: "var(--zd-surface)" }}>
              <MessageCircle className="size-5" /> اطلب التنكة عبر واتساب
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── why us ─────────────────────────── */

const WHY_ICONS = [Sprout, Droplets, Camera, Truck];

function WhyUs({ why }: { why: Why }) {
  const points = why.points ?? [];
  const edit = useEditList("why.points", points);
  return (
    <section className="py-11 sm:py-16" style={{ background: "var(--zd-surface)" }}>
      <Container>
        <EditableText path="why.title" value={why.title ?? ""} as="h2" placeholder="عنوان القسم" className="mb-6 text-center text-[24px] font-extrabold" style={{ fontFamily: HEAD, color: "var(--zd-brand)" }} />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {points.map((p, i) => {
            const Icon = WHY_ICONS[i % WHY_ICONS.length];
            return (
              <div key={i} className="flex items-start gap-3.5 rounded-2xl border p-4" style={{ borderColor: "var(--zd-border)", background: "var(--zd-tint)" }}>
                <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: "var(--zd-brand)" }}>
                  <Icon className="size-5" style={{ color: "var(--zd-surface)" }} />
                </span>
                <div>
                  <EditableText value={p.t} onCommit={(t) => edit.setField(i, "t", t)} as="h3" placeholder="ميزة" className="text-[16px] font-bold" style={{ color: "var(--zd-ink)" }} />
                  <EditableText value={p.b} onCommit={(t) => edit.setField(i, "b", t)} as="p" multiline placeholder="شرح قصير" className="mt-0.5 text-[14px] leading-relaxed" style={{ color: "var(--zd-ink)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ─────────────────────────── ordering & payment ─────────────────────────── */

function OrderingPayment({ pay, shamcash, delivery, wa }: { pay: Pay; shamcash?: string; delivery?: Delivery; wa: string | null }) {
  const area = delivery?.area?.trim();
  return (
    <section className="py-11 sm:py-16" style={{ background: "var(--zd-tint)" }}>
      <Container>
        <EditableText path="pay.title" value={pay.title ?? ""} as="h2" placeholder="عنوان القسم" className="mb-2 text-center text-[24px] font-extrabold" style={{ fontFamily: HEAD, color: "var(--zd-brand)" }} />
        <EditableText path="pay.intro" value={pay.intro ?? ""} as="p" multiline placeholder="اشرح كيف يتم الطلب…" className="mx-auto mb-6 max-w-[460px] text-center text-[15px] leading-relaxed" style={{ color: "var(--zd-ink)" }} />

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {/* ShamCash — number, copy field, and a scannable QR */}
          <div className="rounded-2xl border p-5" style={{ borderColor: "var(--zd-border)", background: "var(--zd-surface)" }}>
            <div className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-xl" style={{ background: "var(--zd-brand)" }}>
                <Wallet className="size-5" style={{ color: "var(--zd-surface)" }} />
              </span>
              <EditableText path="pay.shamTitle" value={pay.shamTitle ?? ""} as="h3" placeholder="شام كاش" className="text-[16.5px] font-bold" style={{ color: "var(--zd-ink)" }} />
            </div>
            <EditableText path="pay.shamNote" value={pay.shamNote ?? ""} as="p" multiline placeholder="تعليمات التحويل…" className="mt-3 text-[14px] leading-relaxed" style={{ color: "var(--zd-ink)" }} />
            <ShamCash number={shamcash?.trim() || ""} />
          </div>

          {/* Cash on delivery */}
          <div className="rounded-2xl border p-5" style={{ borderColor: "var(--zd-border)", background: "var(--zd-surface)" }}>
            <div className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-xl" style={{ background: "var(--zd-brand)" }}>
                <Banknote className="size-5" style={{ color: "var(--zd-surface)" }} />
              </span>
              <EditableText path="pay.codTitle" value={pay.codTitle ?? ""} as="h3" placeholder="الدفع عند الاستلام" className="text-[16.5px] font-bold" style={{ color: "var(--zd-ink)" }} />
            </div>
            <EditableText path="pay.codNote" value={pay.codNote ?? ""} as="p" multiline placeholder="تفاصيل الدفع عند الاستلام…" className="mt-3 text-[14px] leading-relaxed" style={{ color: "var(--zd-ink)" }} />
          </div>
        </div>

        {wa && (
          <div className="mt-6 text-center">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl px-8 text-[16.5px] font-bold" style={{ background: "var(--zd-success)", color: "var(--zd-surface)" }}>
              <MessageCircle className="size-5" /> اطلب الآن عبر واتساب
            </a>
            {area && <p className="mt-3 text-[13.5px]" style={{ color: "var(--zd-ink)" }}>التوصيل {area}</p>}
          </div>
        )}
      </Container>
    </section>
  );
}

/** ShamCash number: a copy-to-clipboard field + a scannable QR of the number. */
function ShamCash({ number }: { number: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    if (!number) return;
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the number is still visible to copy by hand */
    }
  };
  return (
    <div className="mt-3">
      <div dir="ltr" className="flex items-stretch overflow-hidden rounded-xl border" style={{ borderColor: "var(--zd-border)", background: "var(--zd-tint)" }}>
        <span className="flex min-w-0 flex-1 items-center truncate px-3.5 py-3 font-mono text-[16px] font-bold tracking-wide" style={{ color: "var(--zd-ink)" }}>
          {number || "—"}
        </span>
        <button type="button" onClick={copy} disabled={!number} aria-label="نسخ الرقم" className="flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-[13.5px] font-bold disabled:opacity-50" style={{ background: "var(--zd-brand)", color: "var(--zd-surface)" }}>
          {copied ? <><Check className="size-4" /> تم</> : <><Copy className="size-4" /> نسخ</>}
        </button>
      </div>
      {number && (
        <div className="mt-3 flex flex-col items-center gap-1.5">
          <span className="rounded-2xl border p-2.5" style={{ borderColor: "var(--zd-border)", background: "#FDF6E9" }}>
            <QRCodeSVG value={number} size={128} bgColor="#FDF6E9" fgColor="#343210" level="M" marginSize={0} />
          </span>
          <span className="text-[12px]" style={{ color: "var(--zd-muted)" }}>امسح الكود للتحويل</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── footer ─────────────────────────── */

function Footer({ name, whatsapp, delivery, wa }: { name: string; whatsapp: string; delivery?: Delivery; wa: string | null }) {
  const phone = whatsapp.trim();
  const area = delivery?.area?.trim();
  const year = "٢٠٢٦";
  return (
    <footer className="py-9" style={{ background: "var(--zd-brand)", color: "var(--zd-surface)" }}>
      <Container className="text-center">
        <EditableText path="brand.name" value={name} as="h2" className="text-[22px] font-extrabold" style={{ fontFamily: HEAD, color: "var(--zd-surface)" }} />
        <div className="mt-4 flex flex-col items-center gap-3">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[15px] font-semibold">
              <MessageCircle className="size-4" /> راسلنا على واتساب
            </a>
          )}
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, "")}`} dir="ltr" className="inline-flex items-center gap-2 text-[15px] font-semibold">
              <Phone className="size-4" /> {phone}
            </a>
          )}
          {area && (
            <span className="inline-flex items-center gap-2 text-[14px] opacity-90">
              <MapPin className="size-4" /> التوصيل <EditableText path="delivery.area" value={area} as="span" className="font-semibold" />
            </span>
          )}
        </div>
        <p className="mt-6 text-[12.5px] opacity-80">© {year} {name} — كل الحقوق محفوظة.</p>
      </Container>
    </footer>
  );
}
