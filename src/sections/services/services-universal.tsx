/**
 * ServicesUniversal — Sawwi section library
 * Shared services / price-list section, business-agnostic.
 * Three variants × three schemes, driven by ONE service list.
 *
 *   A "numbered" — editorial two-column grid, serif numerals, hairline rules
 *   B "list"     — rows with a dotted leader between name and price
 *   C "photos"   — three sharp-edged photos with copy beneath
 *
 * Toggles (all real props): showPrices · showDuration · showIcons
 * Icons are OFF by default — the numeral carries the row instead.
 *
 * Arabic-first (RTL). Pure component (no hooks) so it renders in the server tree.
 */

import * as React from "react";

/* ────────────────────────────── types ────────────────────────────── */

export type ServicesVariant = "A" | "B" | "C";
export type ServicesScheme = "paper" | "dark" | "accent";
export type ServiceIcon = "scissors" | "razor" | "towel" | "spark" | "face" | "kid";

export interface ServiceItem {
  name: string;
  desc?: string;
  /** free text — "٣٠ دقيقة", "45 min", "يومان" */
  dur?: string;
  /** free text incl. currency — formatting is the caller's business */
  price?: string;
  /** small mono caps label; empty/undefined renders nothing */
  badge?: string;
  /** only drawn when showIcons is true */
  icon?: ServiceIcon;
  /** variant C only — Media Service URL */
  photo?: string;
}

export interface ServicesContent {
  kicker: string;
  title: string;
  lede?: string;
  /** label under the serif count in the header */
  countLabel?: string;
  footnote?: string;
  ctaLabel?: string;
  /** digits only, e.g. "963112223344" — falsy renders an #contact link */
  whatsapp?: string;
}

export interface ServicesUniversalProps {
  variant?: ServicesVariant;
  scheme?: ServicesScheme;
  items?: ServiceItem[];
  content?: Partial<ServicesContent>;
  /** show the price line */
  showPrices?: boolean;
  /** show the duration line */
  showDuration?: boolean;
  /** draw icon plates instead of numerals (A + B). Default false. */
  showIcons?: boolean;
  /** show the serif count in the section header. Default true. */
  showCount?: boolean;
  /** variant C renders this many items. Default 3. */
  photoCount?: number;
  className?: string;
}

/* ───────────────────────── numerals (Arabic-Indic) ───────────────────────── */

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Derived, never a lookup table — lists longer than 10 must keep numbering. */
export const arNum = (n: number) =>
  String(n)
    .padStart(2, "0")
    .replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

/* ───────────────────────────── defaults ───────────────────────────── */

export const defaultServicesContent: ServicesContent = {
  kicker: "ما نقدّمه",
  title: "الخدمات والأسعار",
  lede: "أسعار واضحة ومدد معروفة مسبقًا — تختار ما يناسبك وتحجز في دقيقة.",
  countLabel: "خدمة متاحة",
  footnote: "الأسعار تشمل كل شيء — بلا رسوم مخفية. للاستفسار عن خدمة غير مذكورة، راسلنا على واتساب.",
  ctaLabel: "راسلنا على واتساب",
};

export const defaultServiceItems: ServiceItem[] = [
  { name: "قصّة شعر كلاسيكية", desc: "قصّة بالمقص والماكينة مع تصفيف نهائي.", dur: "٣٠ دقيقة", price: "٥٠٬٠٠٠ ل.س", badge: "الأكثر طلبًا", icon: "scissors" },
  { name: "حلاقة ذقن بالموسى", desc: "منشفة ساخنة، زيت، وحلاقة تقليدية بالموسى.", dur: "٢٠ دقيقة", price: "٣٥٬٠٠٠ ل.س", icon: "razor" },
  { name: "قصّة + حلاقة", desc: "الخدمتان معًا بسعر أوفر — الأكثر اختيارًا.", dur: "٤٥ دقيقة", price: "٨٠٬٠٠٠ ل.س", badge: "توفير", icon: "towel" },
  { name: "تحديد وتشذيب الذقن", desc: "تحديد الخطوط وتشذيب الطول مع ترطيب.", dur: "١٥ دقيقة", price: "٢٥٬٠٠٠ ل.س", icon: "spark" },
  { name: "عناية بالبشرة", desc: "تنظيف عميق وماسك مرطّب للوجه.", dur: "٤٠ دقيقة", price: "٧٠٬٠٠٠ ل.س", badge: "جديد", icon: "face" },
  { name: "قصّ أطفال", desc: "جلسة قصيرة ولطيفة لمن هم تحت ١٢ عامًا.", dur: "٢٠ دقيقة", price: "٣٠٬٠٠٠ ل.س", icon: "kid" },
];

/* ────────────────────────────── tokens ────────────────────────────── */

interface Tokens {
  root: string;
  hairline: string;
  kicker: string;
  price: string;
  num: string;
  badge: string;
  link: string;
  iconPlate: string;
  dotted: string;
}

function tokensFor(scheme: ServicesScheme): Tokens {
  switch (scheme) {
    case "dark":
      return {
        root: "bg-ink-900 text-paper",
        hairline: "border-paper/15",
        kicker: "text-accent-300",
        price: "text-accent-200",
        num: "text-accent-400",
        badge: "text-accent-300",
        link: "text-accent-300 hover:text-accent-200",
        iconPlate: "bg-paper/[0.09] text-accent-300",
        dotted: "border-paper/25",
      };
    case "accent":
      return {
        root: "bg-accent-900 text-paper",
        hairline: "border-paper/20",
        kicker: "text-paper/85",
        price: "text-[oklch(0.95_0.03_145)]",
        num: "text-paper/75",
        badge: "text-[oklch(0.9_0.04_145)]",
        link: "text-paper hover:text-white",
        iconPlate: "bg-paper/[0.13] text-paper",
        dotted: "border-paper/30",
      };
    default:
      return {
        root: "bg-paper text-ink",
        hairline: "border-line",
        kicker: "text-accent-700",
        price: "text-accent-800",
        num: "text-accent-500",
        badge: "text-accent-700",
        link: "text-accent-700 hover:text-accent-800",
        iconPlate: "bg-accent-100 text-accent-800",
        dotted: "border-neutral-300",
      };
  }
}

/* ────────────────────────────── icons ────────────────────────────── */

const SERVICE_ICONS: Record<ServiceIcon, React.ReactNode> = {
  scissors: (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden>
      <path d="M8 8l12 12M20 4L9.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  razor: (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden>
      <path d="M4 20L20 4M14 4h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 15l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  towel: (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden>
      <path d="M5 8c0-2 1.6-3.5 3.6-3.5S12 6 12 8v12H5V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 8c0-2 1.6-3.5 3.6-3.5S19 6 19 8s-1.6 3.5-3.6 3.5H12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden>
      <path d="M12 3l1.9 4.4L18.5 9l-3.4 3.2.8 4.8L12 14.7 8.1 17l.8-4.8L5.5 9l4.6-1.6L12 3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  face: (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 10.5h.01M15 10.5h.01M8.8 15c1.7 1.5 4.7 1.5 6.4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  kid: (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden>
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 20c0-3.4 2.9-5.6 6.5-5.6s6.5 2.2 6.5 5.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

/* ───────────────────────────── pieces ───────────────────────────── */

function Numeral({ n, t, className = "" }: { n: number; t: Tokens; className?: string }) {
  return (
    <span
      aria-hidden
      className={`shrink-0 font-serif tracking-[0.04em] ${t.num} ${className}`}
    >
      {arNum(n)}
    </span>
  );
}

function IconPlate({ icon, t, size = 34 }: { icon: ServiceIcon; t: Tokens; size?: number }) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-[9px] ${t.iconPlate}`}
      style={{ width: size, height: size }}
    >
      {SERVICE_ICONS[icon]}
    </span>
  );
}

function Badge({ label, t }: { label: string; t: Tokens }) {
  return (
    <span className={`whitespace-nowrap font-mono text-[9.5px] uppercase tracking-[0.14em] ${t.badge}`}>
      {label}
    </span>
  );
}

function Price({ value, t, size = "text-[21px]" }: { value: string; t: Tokens; size?: string }) {
  return <span className={`whitespace-nowrap font-serif ${size} ${t.price}`}>{value}</span>;
}

function Duration({ value }: { value: string }) {
  return (
    <span className="whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.12em] opacity-55">
      {value}
    </span>
  );
}

/** Photo or a neutral placeholder — variant C. */
function Photo({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return (
      <div
        aria-hidden
        className="size-full bg-neutral-200 bg-[repeating-linear-gradient(-45deg,transparent_0_10px,rgba(0,0,0,.035)_10px_20px)]"
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL
  return <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />;
}

const WhatsAppArrow = () => (
  <svg viewBox="0 0 16 16" fill="none" className="size-[15px] -scale-x-100" aria-hidden>
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ──────────────────────────── component ──────────────────────────── */

export default function ServicesUniversal({
  variant = "A",
  scheme = "paper",
  items = defaultServiceItems,
  content,
  showPrices = true,
  showDuration = true,
  showIcons = false,
  showCount = true,
  photoCount = 3,
  className,
}: ServicesUniversalProps) {
  const c: ServicesContent = { ...defaultServicesContent, ...content };
  const t = tokensFor(scheme);

  const ctaHref = c.whatsapp
    ? `https://wa.me/${c.whatsapp}?text=${encodeURIComponent("مرحبًا، أريد الاستفسار عن الخدمات")}`
    : "#contact";

  /** A + B lead with an icon plate OR a numeral — never both. */
  const leading = (item: ServiceItem, i: number, size: number, numCls: string) =>
    showIcons && item.icon ? (
      <IconPlate icon={item.icon} t={t} size={size} />
    ) : (
      <Numeral n={i + 1} t={t} className={numCls} />
    );

  const photoItems = items.slice(0, photoCount);

  return (
    <section
      dir="rtl"
      className={`px-[22px] py-[30px] md:px-[52px] md:pb-11 md:pt-[58px] ${t.root} ${className ?? ""}`}
    >
      {/* ── section head ── */}
      <div
        className={`mb-1 flex flex-wrap items-end justify-between gap-6 border-b pb-[22px] md:mb-2.5 md:pb-7 ${t.hairline}`}
      >
        <div className="flex flex-col gap-3">
          <span className={`font-mono text-[11px] uppercase tracking-[0.26em] ${t.kicker}`}>{c.kicker}</span>
          <h2 className="m-0 font-display text-[clamp(28px,3vw,42px)] font-extrabold leading-[1.3] -tracking-[0.028em] text-balance">
            {c.title}
          </h2>
          {c.lede && (
            <p className="m-0 max-w-[52ch] text-[15px] leading-[1.85] opacity-70 text-pretty md:text-[15.5px]">
              {c.lede}
            </p>
          )}
        </div>

        {showCount && (
          <span className="hidden flex-col items-end gap-1 pb-1 text-end md:flex">
            <span className="font-serif text-[34px] leading-none">{arNum(items.length)}</span>
            <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.16em] opacity-55">
              {c.countLabel}
            </span>
          </span>
        )}
      </div>

      {/* ── A — numbered editorial grid ── */}
      {variant === "A" && (
        <div className="grid grid-cols-1 gap-y-0 md:grid-cols-2 md:gap-x-12">
          {items.map((item, i) => (
            <div
              key={item.name}
              className={`flex items-start gap-4 border-t py-[18px] md:py-[22px] ${t.hairline}`}
            >
              {leading(item, i, 34, "min-w-[22px] pt-[5px] text-[15px]")}

              <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
                <span className="flex flex-wrap items-baseline gap-[9px]">
                  <span className="font-display text-[17px] font-bold leading-[1.45]">{item.name}</span>
                  {item.badge && <Badge label={item.badge} t={t} />}
                </span>

                {item.desc && (
                  <span className="max-w-[42ch] text-[13.5px] leading-[1.75] opacity-70 text-pretty">
                    {item.desc}
                  </span>
                )}

                {(showPrices && item.price) || (showDuration && item.dur) ? (
                  <span className="flex items-baseline gap-3 pt-[3px]">
                    {showPrices && item.price && <Price value={item.price} t={t} />}
                    {showDuration && item.dur && <Duration value={item.dur} />}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── B — price list ── */}
      {variant === "B" && (
        <div className="flex flex-col">
          {items.map((item, i) => (
            <div
              key={item.name}
              className={`flex items-start gap-3 border-b py-4 md:items-center md:gap-4 md:px-0.5 md:py-[19px] ${t.hairline}`}
            >
              {/* the icon plate is desktop-only in B — it crowds a phone row */}
              {showIcons && item.icon ? (
                <span className="hidden md:block">
                  <IconPlate icon={item.icon} t={t} size={32} />
                </span>
              ) : (
                <Numeral n={i + 1} t={t} className="min-w-[20px] pt-[3px] text-sm" />
              )}

              <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
                <span className="flex flex-wrap items-baseline gap-[9px]">
                  <span className="font-display text-[16.5px] font-bold">{item.name}</span>
                  {item.badge && <Badge label={item.badge} t={t} />}
                </span>
                {item.desc && (
                  <span className="max-w-[60ch] text-[13.5px] leading-[1.7] opacity-70 text-pretty">
                    {item.desc}
                  </span>
                )}
              </div>

              {showDuration && item.dur && (
                <span className="shrink-0">
                  <Duration value={item.dur} />
                </span>
              )}

              {/* dotted leader: needs a growth floor, or flex-basis:0 makes it invisible */}
              <span
                aria-hidden
                className={`hidden min-w-[24px] flex-[1_0_24px] border-b border-dotted md:block ${t.dotted}`}
              />

              {showPrices && item.price && (
                <span className="shrink-0">
                  <Price value={item.price} t={t} />
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── C — photos ── */}
      {variant === "C" && (
        <div className="grid grid-cols-1 gap-[30px] md:grid-cols-3 md:gap-[34px]">
          {photoItems.map((item, i) => (
            <div key={item.name} className="flex flex-col gap-4">
              {/* sharp-edged, gallery style — not a card */}
              <div className="relative h-[220px] overflow-hidden rounded-[3px] md:h-[260px]">
                <div className="absolute inset-0">
                  <Photo src={item.photo} alt={item.name} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="flex items-baseline gap-2.5">
                  {/* numerals stay in C regardless of showIcons — C has no icon slot,
                      so gating them there would only delete information */}
                  <Numeral n={i + 1} t={t} className="text-sm" />
                  <span className="font-display text-[18px] font-bold leading-[1.4]">{item.name}</span>
                  {item.badge && <Badge label={item.badge} t={t} />}
                </span>

                {item.desc && (
                  <span className="text-[13.5px] leading-[1.75] opacity-70 text-pretty">{item.desc}</span>
                )}

                {(showPrices && item.price) || (showDuration && item.dur) ? (
                  <span className={`mt-0.5 flex items-baseline gap-3 border-t pt-2.5 ${t.hairline}`}>
                    {showPrices && item.price && <Price value={item.price} t={t} size="text-[22px]" />}
                    {showDuration && item.dur && (
                      <span className="ms-auto">
                        <Duration value={item.dur} />
                      </span>
                    )}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── footnote + one quiet CTA ── */}
      {(c.footnote || c.ctaLabel) && (
        <div
          className={`mt-6 flex flex-wrap items-baseline justify-between gap-5 border-t pt-5 md:mt-[34px] ${t.hairline}`}
        >
          {c.footnote && (
            <span className="max-w-[56ch] text-[13px] leading-[1.7] opacity-60">{c.footnote}</span>
          )}
          {c.ctaLabel && (
            <a
              href={ctaHref}
              className={`inline-flex items-center gap-2 whitespace-nowrap font-display text-sm font-bold transition-colors ${t.link}`}
            >
              {c.ctaLabel}
              <WhatsAppArrow />
            </a>
          )}
        </div>
      )}
    </section>
  );
}
