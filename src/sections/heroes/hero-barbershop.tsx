/**
 * HeroBarbershop — Sawwi section library (barbershop vertical, v2)
 *
 *   A "poster"  — full-bleed photo, bottom content panel, fact rule
 *                 mobile: photo band on top, text on a SOLID panel below
 *   B "card"    — text on paper beside a rounded portrait card
 *                 mobile: photo first, then text, full-width buttons
 *   C "emblem"  — one deep color, centered monogram, slow rotating ring
 *
 * Arabic-first (RTL), responsive. Pure React + Tailwind, no runtime deps and no
 * hooks (renders in the server tree). Theme tokens + keyframes: app/globals.css.
 *
 * The bridge to Sawwi's SectionProps (defaults from site settings, auto
 * open/closed from working hours) lives in library.tsx.
 */

/* ────────────────────────────── types ────────────────────────────── */

export type HeroVariant = "A" | "B" | "C";

export interface HeroContent {
  shopName: string;
  latinName: string; // "Qasioun · Barbers"
  monogram: string; // "س"
  established: string; // "EST. 1975"
  city: string; // "دمشق"
  kicker: string; // "دمشق القديمة · حلاقة رجالية"
  titleLine1: string;
  titleLine2: string;
  titleAccent: string; // colored fragment (B)
  body: string;
  primaryCta: string;
  secondaryCta: string;
  primaryHref: string; // resolved button destination (see SectionLink)
  secondaryHref: string;
  primaryIsWhatsapp?: boolean; // show the WhatsApp icon on the primary button
  openLabel: string; // "مفتوح الآن · حتى ١٠ مساءً" — auto-derived from hours
  openShort: string; // "مفتوح الآن" — auto-derived from hours
  openState?: "open" | "closed"; // drives the status-dot color (undefined = neutral)
  addressShort: string; // "سوق الحميدية، دمشق"
  rating: string; // "٤٫٩"
  reviewCount: string; // "٣١٢ تقييمًا"
  ratingLine: string; // "٤٫٩ · ٣١٢ تقييمًا" (derived)
  yearsValue: string; // "٥٠"
  yearsLabel: string; // "عامًا في الحرفة"
  photoCaption: string; // glass chip on B's photo
  whatsapp: string; // digits only
}

export interface HeroImages {
  /** A background, B portrait, C backdrop */
  bg?: string;
  portrait?: string;
}

export interface HeroBarbershopProps {
  variant?: HeroVariant;
  content?: Partial<HeroContent>;
  images?: HeroImages;
  /** false → motion removed (prefers-reduced-motion always wins too) */
  motion?: boolean;
  className?: string;
}

/* ───────────────────────── default content (ar) ───────────────────────── */

export const defaultHeroContent: HeroContent = {
  shopName: "اسم العمل",
  latinName: "", // no default → the Latin tagline only shows if explicitly set
  monogram: "س",
  established: "EST. 1975",
  city: "دمشق",
  kicker: "دمشق القديمة · حلاقة رجالية",
  titleLine1: "حلاقةٌ تُتقَن",
  titleLine2: "على مهلٍ",
  titleAccent: "تُغيّر يومك",
  body: "موسى، مقصّ، ومنشفةٌ ساخنة — بلا استعجال، وبلا مجاملة على حساب النتيجة.",
  primaryCta: "احجز عبر واتساب",
  secondaryCta: "الخدمات والأسعار",
  primaryHref: "#",
  secondaryHref: "#services",
  primaryIsWhatsapp: true,
  openLabel: "مفتوح الآن · حتى ١٠ مساءً",
  openShort: "مفتوح الآن",
  addressShort: "سوق الحميدية، دمشق",
  rating: "٤٫٩",
  reviewCount: "٣١٢ تقييمًا",
  ratingLine: "٤٫٩ · ٣١٢ تقييمًا",
  yearsValue: "٥٠",
  yearsLabel: "عامًا في الحرفة",
  photoCaption: "ثلاثة حلاقين · بلا انتظار",
  whatsapp: "963112223344",
};

/* ────────────────────────────── helpers ────────────────────────────── */

function WhatsAppIcon({ className = "size-[17px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={className}>
      <path d="M8 1.5a6.5 6.5 0 0 0-5.6 9.8L1.5 14.5l3.4-.9A6.5 6.5 0 1 0 8 1.5z" />
    </svg>
  );
}

function StarIcon({ className = "size-[14px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={className}>
      <path d="M8 1.8l1.8 3.8 4.2.5-3.1 2.9.8 4.2L8 11.2 4.3 13.2l.8-4.2L2 6.1l4.2-.5L8 1.8z" />
    </svg>
  );
}

function Dot({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`size-[7px] shrink-0 rounded-full bg-[oklch(0.72_0.15_145)] ${className}`} />
  );
}

/** Photo, or a neutral placeholder so a fresh site never looks broken. */
function Photo({ src, alt, priority }: { src?: string; alt: string; priority?: boolean }) {
  if (!src) {
    return (
      <div
        aria-hidden
        className="absolute inset-0 bg-neutral-200 bg-[repeating-linear-gradient(-45deg,transparent_0_10px,rgba(0,0,0,.035)_10px_20px)]"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL, not a build asset
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      className="absolute inset-0 size-full object-cover"
    />
  );
}

/* ─────────────────────────── A — poster ─────────────────────────── */
/* mobile: 290px photo band + solid ink panel · md+: full-bleed + scrim  */

function HeroPoster({ c, images, m }: { c: HeroContent; images: HeroImages; m: (x: string) => string }) {
  return (
    <section
      dir="rtl"
      className="relative flex flex-col justify-end overflow-hidden bg-ink-950 text-paper md:min-h-[620px]"
    >
      {/* photo: band on mobile, full-bleed from md */}
      <div className="absolute inset-x-0 top-0 h-[290px] overflow-hidden md:h-full">
        <div className={`absolute inset-0 ${m("animate-breathe")}`}>
          <Photo src={images.bg} alt={c.shopName} priority />
        </div>
        {/* scrim only where text sits over the photo */}
        <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(to_top,oklch(0.13_0.008_70/.96)_0%,oklch(0.13_0.008_70/.72)_34%,oklch(0.13_0.008_70/.12)_72%,transparent_100%)] md:block" />
      </div>

      {/* content: below the band on mobile, on solid ink for legibility */}
      <div className="pointer-events-none relative mt-[290px] flex flex-col gap-4 bg-ink-950 px-[22px] pb-7 pt-[26px] md:mt-0 md:gap-5 md:bg-transparent md:px-[52px] md:pb-11 md:pt-14">
        <span className={`inline-flex items-center gap-[11px] ${m("animate-rise")}`}>
          <span className={`h-px w-[34px] origin-right bg-accent-400 ${m("animate-rule [animation-delay:100ms]")}`} />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-300 md:text-[11px]">
            {c.kicker}
          </span>
        </span>

        <h1 className="m-0 max-w-[22ch] font-display text-[34px] font-extrabold leading-[1.3] -tracking-[0.03em] text-balance md:text-[clamp(44px,4.6vw,62px)]">
          <span className={`block ${m("animate-wipe [animation-delay:120ms]")}`}>{c.titleLine1}</span>
          <span className={`block text-accent-300 ${m("animate-wipe [animation-delay:240ms]")}`}>{c.titleLine2}</span>
        </h1>

        <p className={`m-0 max-w-[42ch] text-[15px] leading-[1.8] text-paper/85 md:text-[17px] ${m("animate-rise [animation-delay:360ms]")}`}>
          {c.body}
        </p>

        <div className={`flex flex-col items-stretch gap-2.5 sm:flex-row ${m("animate-rise [animation-delay:480ms]")}`}>
          <a
            href={c.primaryHref}
            className="pointer-events-auto inline-flex h-[52px] items-center justify-center gap-[9px] whitespace-nowrap rounded-xl bg-accent px-6 text-[15px] font-semibold text-white transition-colors hover:bg-accent-700"
          >
            {c.primaryIsWhatsapp && <WhatsAppIcon />}
            {c.primaryCta}
          </a>
          <a
            href={c.secondaryHref}
            className="pointer-events-auto inline-flex h-[52px] items-center justify-center whitespace-nowrap rounded-xl border border-paper/30 px-[22px] text-[15px] font-semibold text-paper/95 transition-colors hover:bg-paper/10"
          >
            {c.secondaryCta}
          </a>
        </div>

        {/* fact rule */}
        <div className="mt-0.5 flex flex-wrap items-center gap-2.5 border-t border-paper/15 pt-4 text-[13px] text-paper/80 md:gap-4 md:pt-[18px]">
          {c.openLabel && (
            <>
              <span className="inline-flex items-center gap-[7px] whitespace-nowrap">
                <Dot className={`${c.openState === "closed" ? "bg-paper/40" : ""} ${m("animate-blink")}`} />
                {c.openLabel}
              </span>
              <span aria-hidden className="hidden h-[13px] w-px bg-paper/20 md:inline-block" />
            </>
          )}
          <span className="whitespace-nowrap">{c.addressShort}</span>
          <span aria-hidden className="hidden h-[13px] w-px bg-paper/20 md:inline-block" />
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <StarIcon className="size-[14px] text-[oklch(0.82_0.13_85)]" />
            {c.ratingLine}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── B — card ──────────────────────────── */
/* mobile: photo first, then text · md+: text start, photo end        */

function HeroCard({ c, images, m }: { c: HeroContent; images: HeroImages; m: (x: string) => string }) {
  return (
    <section dir="rtl" className="bg-paper px-[22px] pb-8 pt-7 md:px-[52px] md:py-[60px]">
      <div className="mx-auto grid max-w-[1120px] grid-cols-[minmax(0,1fr)] items-center gap-6 md:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] md:gap-[52px]">
        {/* text — second on mobile, first from md */}
        <div className="order-2 flex flex-col gap-4 md:order-1 md:gap-5">
          <span className={`inline-flex items-center gap-2.5 ${m("animate-rise")}`}>
            <span className="font-serif text-xs uppercase tracking-[0.2em] text-accent-700">{c.established}</span>
            <span aria-hidden className="h-px w-[26px] bg-accent-300" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">{c.city}</span>
          </span>

          <h1 className={`m-0 max-w-[20ch] font-display text-[32px] font-extrabold leading-[1.28] -tracking-[0.03em] text-balance md:text-[clamp(38px,3.9vw,54px)] ${m("animate-rise [animation-delay:80ms]")}`}>
            {c.titleLine1}
            <br />
            <span className="font-serif font-normal italic">و</span>
            {c.titleLine2} <span className="text-accent-700">{c.titleAccent}</span>
          </h1>

          <p className={`m-0 max-w-[46ch] text-[15px] leading-[1.85] text-muted md:text-[16.5px] ${m("animate-rise [animation-delay:200ms]")}`}>
            {c.body}
          </p>

          <div className={`flex flex-col items-stretch gap-2.5 pt-1 sm:flex-row ${m("animate-rise [animation-delay:300ms]")}`}>
            <a
              href={c.primaryHref}
              className="inline-flex h-[52px] items-center justify-center gap-[9px] whitespace-nowrap rounded-xl bg-ink px-6 text-[15px] font-semibold text-white transition-colors hover:bg-ink-950"
            >
              {c.primaryIsWhatsapp && <WhatsAppIcon className="size-4" />}
              {c.primaryCta}
            </a>
            <a
              href={c.secondaryHref}
              className="inline-flex h-[52px] items-center justify-center whitespace-nowrap rounded-xl border border-line px-[22px] text-[15px] font-semibold text-ink transition-colors hover:bg-neutral-100"
            >
              {c.secondaryCta}
            </a>
          </div>

          {/* two meaningful facts, not a stat wall */}
          <div className="mt-1.5 flex flex-wrap items-center gap-[18px] border-t border-line pt-[18px] md:gap-[26px]">
            <span className="flex flex-col gap-0.5">
              <span className="font-serif text-[30px] leading-none">{c.yearsValue}</span>
              <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.13em] text-faint">
                {c.yearsLabel}
              </span>
            </span>
            <span aria-hidden className="h-[34px] w-px bg-neutral-200" />
            <span className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1.5 font-serif text-[30px] leading-none">
                {c.rating}
                <StarIcon className="size-[15px] text-[oklch(0.72_0.13_85)]" />
              </span>
              <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.13em] text-faint">
                {c.reviewCount}
              </span>
            </span>
            {c.openShort && (
              <span className="ms-auto inline-flex items-center gap-[7px] whitespace-nowrap text-[13px] text-muted">
                <Dot className={`${c.openState === "closed" ? "bg-faint" : "bg-[oklch(0.62_0.14_145)]"} ${m("animate-blink")}`} />
                {c.openShort}
              </span>
            )}
          </div>
        </div>

        {/* photo — first on mobile */}
        <div className="relative order-1 min-h-[260px] self-stretch overflow-hidden rounded-[18px] shadow-[0_26px_60px_-30px_rgba(40,35,30,.45)] md:order-2 md:min-h-[470px]">
          <Photo src={images.portrait} alt={`حلاق في ${c.shopName}`} priority />
          <span className="pointer-events-none absolute bottom-3.5 start-3.5 inline-flex items-center gap-2 whitespace-nowrap rounded-[11px] bg-[color-mix(in_srgb,oklch(0.16_0.008_70)_78%,transparent)] px-3.5 py-[9px] text-[12.5px] font-semibold text-paper backdrop-blur-[8px]">
            <Dot className="size-1.5" />
            {c.photoCaption}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── C — emblem ─────────────────────────── */

function HeroEmblem({ c, images, m }: { c: HeroContent; images: HeroImages; m: (x: string) => string }) {
  return (
    <section
      dir="rtl"
      className="relative flex min-h-[540px] items-center justify-center overflow-hidden bg-accent-900 px-6 py-[50px] text-paper md:min-h-[620px] md:px-10 md:py-[70px]"
    >
      <div className={`absolute -inset-[6%] opacity-[0.17] ${m("animate-drift")}`}>
        <Photo src={images.bg} alt="" priority />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,transparent_0%,oklch(0.22_0.045_155/.82)_100%)]" />

      <div className={`pointer-events-none absolute size-[330px] rounded-full border border-dashed border-paper/15 md:size-[620px] ${m("animate-spin-slow")}`} />
      <div className="pointer-events-none absolute size-[250px] rounded-full border border-paper/10 md:size-[470px]" />

      <div className="pointer-events-none relative flex max-w-[720px] flex-col items-center gap-6 text-center">
        <div className={`flex flex-col items-center gap-3 ${m("animate-rise")}`}>
          <span className="grid size-[62px] place-items-center rounded-[20px] border border-paper/30 font-display text-[28px] font-extrabold md:size-[74px] md:text-[34px]">
            {c.monogram}
          </span>
          <span className="font-serif text-xs uppercase tracking-[0.32em] text-accent-200">{c.latinName}</span>
        </div>

        <h1 className={`m-0 font-display text-[32px] font-extrabold leading-[1.3] -tracking-[0.03em] text-balance md:text-[clamp(40px,4.6vw,62px)] ${m("animate-wipe [animation-delay:160ms]")}`}>
          {c.titleLine1}
          <br />
          <span className="text-[oklch(0.85_0.09_145)]">{c.titleLine2}</span>
        </h1>

        <span className={`flex items-center gap-4 ${m("animate-rise [animation-delay:340ms]")}`}>
          <span aria-hidden className="hidden h-px w-[34px] bg-paper/30 md:block" />
          <span className="max-w-[38ch] text-[15px] leading-[1.8] text-paper/90 md:text-base">{c.body}</span>
          <span aria-hidden className="hidden h-px w-[34px] bg-paper/30 md:block" />
        </span>

        <div className={`flex flex-col items-stretch justify-center gap-2.5 sm:flex-row ${m("animate-rise [animation-delay:460ms]")}`}>
          <a
            href={c.primaryHref}
            className="pointer-events-auto inline-flex h-[52px] items-center justify-center gap-[9px] whitespace-nowrap rounded-full bg-paper px-[26px] text-[15px] font-bold text-accent-900 transition-transform active:translate-y-px"
          >
            {c.primaryIsWhatsapp && <WhatsAppIcon />}
            {c.primaryCta}
          </a>
          <a
            href={c.secondaryHref}
            className="pointer-events-auto inline-flex h-[52px] items-center justify-center whitespace-nowrap rounded-full border border-paper/35 px-6 text-[15px] font-semibold text-paper transition-colors hover:bg-paper/10"
          >
            {c.secondaryCta}
          </a>
        </div>

        {c.openShort && (
          <div className={`flex items-center gap-2.5 pt-1.5 font-mono text-[11px] uppercase tracking-[0.13em] text-accent-200 ${m("animate-rise [animation-delay:580ms]")}`}>
            <Dot className={`${c.openState === "closed" ? "bg-paper/40" : "bg-[oklch(0.78_0.15_145)]"} ${m("animate-blink")}`} />
            {c.openShort} · {c.addressShort}
          </div>
        )}
      </div>
    </section>
  );
}

/* ──────────────────────────── dispatcher ──────────────────────────── */

export default function HeroBarbershop({
  variant = "A",
  content,
  images = {},
  motion = true,
  className,
}: HeroBarbershopProps) {
  const c: HeroContent = { ...defaultHeroContent, ...content };
  // motion helper: drop animation classes when disabled; prefers-reduced-motion
  // always wins. Plain function (no hook) so this renders in the server tree.
  const m = (cls: string) => (motion ? `${cls} motion-reduce:animate-none` : "");

  const Variant = variant === "B" ? HeroCard : variant === "C" ? HeroEmblem : HeroPoster;

  return (
    <div className={className}>
      <Variant c={c} images={images} m={m} />
    </div>
  );
}
