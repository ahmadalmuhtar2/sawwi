/**
 * AboutUniversal — Sawwi section library
 * Shared "about us" section, business-agnostic. Three variants × three schemes.
 *
 *   A "photo"      — big photo beside copy, values, stats  (default; works anywhere)
 *   B "statement"  — centered single column, serif lede, value cards, signature
 *   C "milestones" — dated timeline beside a 3-photo collage
 *
 * Arabic-first (RTL). Pure component (no hooks) so it renders in the server tree,
 * like the footer. The library adapter maps site data → this design's content.
 */

import * as React from "react";

/* ────────────────────────────── types ────────────────────────────── */

export type AboutVariant = "A" | "B" | "C";
export type AboutScheme = "paper" | "dark" | "accent";

export interface AboutStat {
  value: string;
  label: string;
}

export interface AboutValue {
  title: string;
  body: string;
  icon?: "hand" | "clock" | "star" | "shield";
}

export interface AboutMilestone {
  year: string;
  title: string;
  body: string;
  /** the "today" row — rendered in the accent */
  current?: boolean;
}

export interface AboutImages {
  /** A: single portrait/landscape · C: collage */
  main?: string;
  detail?: string;
  team?: string;
}

export interface AboutContent {
  kicker: string;
  titleLine1: string;
  titleLine2?: string;
  /** colored fragment of titleLine2 */
  titleAccent?: string;
  lede: string;
  body?: string;
  /** B only */
  signature?: string;
  signatureMeta?: string;
  /** A only — the small badge over the photo */
  badgeValue?: string;
  badgeLabel?: string;
  values: AboutValue[];
  stats: AboutStat[];
  milestones: AboutMilestone[];
}

export interface AboutUniversalProps {
  variant?: AboutVariant;
  scheme?: AboutScheme;
  content?: Partial<AboutContent>;
  images?: AboutImages;
  showStats?: boolean;
  showValues?: boolean;
  className?: string;
}

/* ───────────────────────────── defaults ───────────────────────────── */

export const defaultAboutContent: AboutContent = {
  kicker: "من نحن",
  titleLine1: "نعمل بالطريقة",
  titleLine2: "التي نحبّها",
  titleAccent: "التي نحبّها",
  lede: "بدأنا صغارًا وبقينا كذلك بإصرار: فريقٌ واحد يعرف كل عميل بالاسم، ويفضّل إنجاز عملٍ واحد بإتقان على عشرة على عجل.",
  body: "لا نبيع وعودًا كبيرة. نقول ما نستطيع، ثم ننفّذه في الوقت المتّفق عليه — وهذا وحده كافٍ ليعود الناس إلينا ويرسلوا لنا من يعرفون.",
  signature: "— فريق العمل",
  signatureMeta: "اسم العمل · دمشق",
  badgeValue: "٢٧",
  badgeLabel: "عامًا من الخبرة",
  values: [
    { title: "عملٌ متقن", body: "نراجع كل تفصيل قبل أن نقول إنه جاهز.", icon: "hand" },
    { title: "مواعيد مُحترمة", body: "الوقت المتّفق عليه هو الوقت الفعلي.", icon: "clock" },
    { title: "أسعار واضحة", body: "السعر معروف قبل البدء، بلا مفاجآت.", icon: "star" },
  ],
  stats: [
    { value: "٢٧", label: "عامًا" },
    { value: "٤٬٠٠٠+", label: "عميل" },
    { value: "٤٫٩", label: "تقييم" },
  ],
  milestones: [
    { year: "١٩٩٨", title: "البداية بمحلٍّ صغير", body: "غرفة واحدة وأدوات بسيطة وأول عميل جاء بالمصادفة." },
    { year: "٢٠٠٩", title: "المكان الحالي", body: "انتقلنا إلى موقعٍ أوسع في شارع بغداد، وبقي الطاقم نفسه." },
    { year: "٢٠١٨", title: "فريقٌ مُدرَّب", body: "صار لدينا من يتعلّم الحرفة عندنا ثم يبقى معنا." },
    { year: "اليوم", title: "حجزٌ عبر واتساب", body: "تحجز في دقيقة، وتأتي في وقتك المحدّد.", current: true },
  ],
};

/* ────────────────────────────── tokens ────────────────────────────── */

interface Tokens {
  root: string;
  hairline: string;   // border-color class
  kicker: string;
  rule: string;       // bg for the small rules
  accentText: string;
  card: string;       // value card surface
  iconPlate: string;
  badge: string;      // photo badge
  dot: string;        // timeline dot
  ring: string;       // ring color behind a timeline dot (matches the ground)
}

function tokensFor(scheme: AboutScheme): Tokens {
  switch (scheme) {
    case "dark":
      return {
        root: "bg-ink-900 text-paper",
        hairline: "border-paper/15",
        kicker: "text-accent-300",
        rule: "bg-accent-400",
        accentText: "text-accent-300",
        card: "bg-paper/5 border-paper/12",
        iconPlate: "bg-paper/10 text-accent-300",
        badge: "bg-ink-950/85 text-paper",
        dot: "bg-paper/40",
        ring: "ring-ink-900",
      };
    case "accent":
      return {
        root: "bg-accent-900 text-paper",
        hairline: "border-paper/20",
        kicker: "text-paper/85",
        rule: "bg-paper/60",
        accentText: "text-[oklch(0.88_0.08_145)]",
        card: "bg-paper/8 border-paper/16",
        iconPlate: "bg-paper/15 text-paper",
        badge: "bg-paper text-accent-900",
        dot: "bg-paper/45",
        ring: "ring-accent-900",
      };
    default:
      return {
        root: "bg-paper text-ink",
        hairline: "border-line",
        kicker: "text-accent-700",
        rule: "bg-accent-400",
        accentText: "text-accent-700",
        card: "bg-surface border-line",
        iconPlate: "bg-accent-100 text-accent-800",
        badge: "bg-surface text-ink",
        dot: "bg-neutral-300",
        ring: "ring-paper",
      };
  }
}

/* ────────────────────────────── icons ────────────────────────────── */

const VALUE_ICONS: Record<NonNullable<AboutValue["icon"]>, React.ReactNode> = {
  hand: (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
      <path d="M8 11V5.5a1.5 1.5 0 1 1 3 0V11m0 0V4.5a1.5 1.5 0 1 1 3 0V11m0 0V6.5a1.5 1.5 0 1 1 3 0V14a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6v-2.5a1.5 1.5 0 1 1 3 0V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
      <path d="M12 3l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 16.3 6.8 19l1-5.8-4.3-4.1 5.9-.8L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
      <path d="M12 3l7 2.5V12c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V5.5L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/* ───────────────────────────── pieces ───────────────────────────── */

/** Photo or a neutral placeholder. */
function Photo({ src, alt, priority }: { src?: string; alt: string; priority?: boolean }) {
  if (!src) {
    return (
      <div
        aria-hidden
        className="size-full bg-neutral-200 bg-[repeating-linear-gradient(-45deg,transparent_0_10px,rgba(0,0,0,.035)_10px_20px)]"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL
    <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} className="size-full object-cover" />
  );
}

function Kicker({ label, t }: { label: string; t: Tokens }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span aria-hidden className={`h-px w-10 ${t.rule}`} />
      <span className={`font-mono text-[11px] uppercase tracking-[0.24em] ${t.kicker}`}>{label}</span>
    </span>
  );
}

function Stats({ stats, t, centered = false }: { stats: AboutStat[]; t: Tokens; centered?: boolean }) {
  if (!stats.length) return null;
  return (
    <div
      className={`flex flex-wrap gap-x-9 gap-y-5 border-t pt-[18px] ${t.hairline} ${
        centered ? "w-full max-w-[780px] items-center justify-center gap-x-12" : ""
      }`}
    >
      {stats.map((s) => (
        <span key={s.label} className={`flex flex-col gap-[3px] ${centered ? "items-center" : ""}`}>
          <span className="font-serif text-[30px] leading-none">{s.value}</span>
          <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.14em] opacity-60">
            {s.label}
          </span>
        </span>
      ))}
    </div>
  );
}

function ValueRows({ values, t }: { values: AboutValue[]; t: Tokens }) {
  return (
    <div className="flex flex-col gap-[18px]">
      {values.map((v) => (
        <span key={v.title} className="flex items-start gap-3.5">
          <span className={`inline-grid size-9 shrink-0 place-items-center rounded-[11px] ${t.iconPlate}`}>
            {VALUE_ICONS[v.icon ?? "star"]}
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-[15.5px] font-semibold">{v.title}</span>
            <span className="max-w-[42ch] text-[13.5px] leading-[1.7] opacity-75 text-pretty">{v.body}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

function ValueCards({ values, t, cols = 3 }: { values: AboutValue[]; t: Tokens; cols?: number }) {
  return (
    <div className={`grid w-full gap-3.5 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      {values.map((v) => (
        <div
          key={v.title}
          className={`flex flex-col items-center gap-2.5 rounded-2xl border p-[18px] text-center ${t.card}`}
        >
          <span className={`inline-grid size-10 place-items-center rounded-xl ${t.iconPlate}`}>
            {VALUE_ICONS[v.icon ?? "star"]}
          </span>
          <span className="text-[15px] font-semibold">{v.title}</span>
          <span className="text-[13px] leading-[1.65] opacity-75 text-pretty">{v.body}</span>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────── component ──────────────────────────── */

export default function AboutUniversal({
  variant = "A",
  scheme = "paper",
  content,
  images = {},
  showStats = true,
  showValues = true,
  className,
}: AboutUniversalProps) {
  const c: AboutContent = { ...defaultAboutContent, ...content };
  const t = tokensFor(scheme);

  return (
    <section dir="rtl" className={`${t.root} ${className ?? ""}`}>
      {/* ── A — photo beside copy ── */}
      {variant === "A" && (
        <div className="grid gap-8 px-[22px] py-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-[52px] md:px-[46px] md:py-14">
          <div className="flex flex-col gap-5">
            <Kicker label={c.kicker} t={t} />

            <h2 className="m-0 font-display text-[clamp(28px,3.2vw,42px)] font-extrabold leading-[1.32] -tracking-[0.025em] text-balance">
              {c.titleLine1}
              {c.titleLine2 && (
                <>
                  <br />
                  <span className={t.accentText}>{c.titleLine2}</span>
                </>
              )}
            </h2>

            <p className="m-0 max-w-[50ch] text-[15.5px] leading-[1.85] opacity-80 text-pretty">{c.lede}</p>
            {c.body && <p className="m-0 max-w-[50ch] text-[15px] leading-[1.85] opacity-70 text-pretty">{c.body}</p>}

            {showValues && c.values.length > 0 && (
              <div className={`mt-1 border-t pt-5 ${t.hairline}`}>
                <ValueRows values={c.values} t={t} />
              </div>
            )}

            {showStats && <Stats stats={c.stats} t={t} />}
          </div>

          {/* min-height + stretch (not a fixed height) so the column tracks the copy */}
          <div className="relative min-h-[320px] self-stretch overflow-hidden rounded-2xl md:min-h-[440px]">
            <div className="absolute inset-0">
              <Photo src={images.main} alt="" priority />
            </div>
            {c.badgeValue && (
              <span
                className={`pointer-events-none absolute bottom-3.5 start-3.5 flex flex-col gap-0.5 rounded-xl px-4 py-3 shadow-[0_10px_26px_-14px_rgba(0,0,0,.5)] ${t.badge}`}
              >
                <span className="font-serif text-[26px] leading-none">{c.badgeValue}</span>
                <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
                  {c.badgeLabel}
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── B — centered statement ── */}
      {variant === "B" && (
        <div className="flex flex-col items-center gap-6 px-[22px] py-12 text-center md:px-[46px] md:py-16">
          <Kicker label={c.kicker} t={t} />

          <h2 className="m-0 max-w-[24ch] font-display text-[clamp(28px,3.4vw,44px)] font-extrabold leading-[1.32] -tracking-[0.025em] text-balance">
            {c.titleLine1}{" "}
            {c.titleLine2 && <span className={t.accentText}>{c.titleLine2}</span>}
          </h2>

          {/* the lede takes the serif's voice — this is the one place it leads */}
          <p className="m-0 max-w-[46ch] font-serif text-[clamp(19px,1.7vw,24px)] leading-[1.7] opacity-90 text-pretty">
            {c.lede}
          </p>

          {c.body && <p className="m-0 max-w-[54ch] text-[15px] leading-[1.85] opacity-70 text-pretty">{c.body}</p>}

          {showValues && c.values.length > 0 && (
            <div className="w-full max-w-[860px] pt-2">
              <ValueCards values={c.values} t={t} />
            </div>
          )}

          {showStats && <Stats stats={c.stats} t={t} centered />}

          {(c.signature || c.signatureMeta) && (
            <span className="flex flex-col items-center gap-2 pt-2.5">
              {c.signature && <span className="font-serif text-xl italic opacity-80">{c.signature}</span>}
              {c.signatureMeta && (
                <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] opacity-55">{c.signatureMeta}</span>
              )}
            </span>
          )}
        </div>
      )}

      {/* ── C — milestones beside a collage ── */}
      {variant === "C" && (
        <div className="grid gap-8 px-[22px] py-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-[46px] md:px-[46px] md:py-14">
          <div className="flex flex-col gap-5">
            <Kicker label={c.kicker} t={t} />

            <h2 className="m-0 font-display text-[clamp(28px,3.2vw,40px)] font-extrabold leading-[1.32] -tracking-[0.025em] text-balance">
              {c.titleLine1}
              {c.titleLine2 && (
                <>
                  <br />
                  <span className={t.accentText}>{c.titleLine2}</span>
                </>
              )}
            </h2>

            <p className="m-0 max-w-[48ch] text-[15.5px] leading-[1.85] opacity-80 text-pretty">{c.lede}</p>

            <ol className="relative m-0 mt-1.5 flex list-none flex-col gap-[22px] p-0 ps-[22px]">
              <span aria-hidden className={`absolute inset-y-1.5 start-1 w-px border-s ${t.hairline}`} />
              {c.milestones.map((m) => (
                <li key={m.year} className="relative flex flex-col gap-1">
                  <span
                    aria-hidden
                    className={`absolute -start-[22px] top-[5px] size-[9px] rounded-full ring-[3px] ${t.ring} ${
                      m.current ? "bg-accent" : t.dot
                    }`}
                  />
                  <span className={`font-serif text-[15px] tracking-[0.06em] ${t.kicker}`}>{m.year}</span>
                  <span className="text-[15.5px] font-semibold">{m.title}</span>
                  <span className="max-w-[44ch] text-[13.5px] leading-[1.7] opacity-75 text-pretty">{m.body}</span>
                </li>
              ))}
            </ol>

            {showStats && <Stats stats={c.stats} t={t} />}
          </div>

          {/* min-height + stretch keeps the collage the same height as the timeline */}
          <div className="grid min-h-[340px] grid-rows-[minmax(0,1.25fr)_minmax(0,1fr)] gap-3.5 self-stretch md:min-h-[460px]">
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0">
                <Photo src={images.main} alt="" priority />
              </div>
            </div>
            <div className="grid min-h-0 grid-cols-2 gap-3.5">
              <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0">
                  <Photo src={images.detail} alt="" />
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0">
                  <Photo src={images.team} alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
