"use client";

/**
 * ReviewsUniversal — Sawwi section library
 * Shared customer-reviews section, business-agnostic. Four variants × three schemes.
 *
 *   A "grid"     — STATIC. Hairline-separated columns, staggered rise on entry.
 *   B "marquee"  — MOTION. Cards drifting horizontally, seamless loop.
 *   C "solo"     — MOTION. One large rotating quote with progress dots.
 *   D "summary"  — STATIC. Rating average + star distribution beside a review list.
 *
 * Avatars are tinted INITIAL monograms, not photos — at 30–38px a real photo
 * (and any upload chrome) is unreadable, and small businesses rarely have
 * customer portraits.
 *
 * Arabic-first (RTL). Client component (variants B/C animate). Theme tokens +
 * keyframes live in globals.css.
 */

import * as React from "react";
import {
  arInt,
  initialOf,
  defaultReviews,
  defaultReviewsContent,
  defaultBuckets,
  type ReviewItem,
  type RatingBucket,
  type ReviewsContent,
  type ReviewsVariant,
  type ReviewsScheme,
} from "./reviews-data";

export type {
  ReviewItem,
  RatingBucket,
  ReviewsContent,
  ReviewsVariant,
  ReviewsScheme,
} from "./reviews-data";
export { arInt, initialOf, defaultReviews, defaultReviewsContent, defaultBuckets } from "./reviews-data";

/* ────────────────────────────── types ────────────────────────────── */

export interface ReviewsUniversalProps {
  variant?: ReviewsVariant;
  scheme?: ReviewsScheme;
  reviews?: ReviewItem[];
  /** variant D's distribution bars; omit to hide them */
  buckets?: RatingBucket[];
  content?: Partial<ReviewsContent>;
  /** false → all motion removed (also auto-removed under prefers-reduced-motion) */
  motion?: boolean;
  showStars?: boolean;
  showAvatars?: boolean;
  /** ms per quote in variant C. Default 6000. */
  rotateMs?: number;
  /** how many reviews variant D lists. Default 4. */
  listCount?: number;
  className?: string;
}

/* ────────────────────────────── tokens ────────────────────────────── */

interface Tokens {
  root: string;
  hairline: string;
  kicker: string;
  link: string;
  star: string;
  card: string;
  barTrack: string;
  barFill: string;
  dotOn: string;
  dotOff: string;
}

function tokensFor(scheme: ReviewsScheme): Tokens {
  switch (scheme) {
    case "dark":
      return {
        root: "bg-ink-900 text-paper",
        hairline: "border-paper/15",
        kicker: "text-accent-300",
        link: "text-accent-300 hover:text-accent-200",
        star: "text-[oklch(0.78_0.12_82)]",
        card: "bg-paper/[0.04] border-paper/[0.14]",
        barTrack: "bg-paper/[0.16]",
        barFill: "bg-accent-300",
        dotOn: "bg-accent-300",
        dotOff: "bg-paper/[0.22]",
      };
    case "accent":
      return {
        root: "bg-accent-900 text-paper",
        hairline: "border-paper/20",
        kicker: "text-paper/85",
        link: "text-paper hover:text-white",
        star: "text-[oklch(0.88_0.11_88)]",
        card: "bg-paper/[0.07] border-paper/[0.18]",
        barTrack: "bg-paper/20",
        barFill: "bg-[oklch(0.94_0.04_145)]",
        dotOn: "bg-paper",
        dotOff: "bg-paper/[0.28]",
      };
    default:
      return {
        root: "bg-paper text-ink",
        hairline: "border-line",
        kicker: "text-accent-700",
        link: "text-accent-700 hover:text-accent-800",
        star: "text-[oklch(0.66_0.13_82)]",
        card: "bg-surface border-line",
        barTrack: "bg-neutral-200",
        barFill: "bg-accent",
        dotOn: "bg-accent",
        dotOff: "bg-neutral-300",
      };
  }
}

/** Monogram tints — only meaningful on the paper scheme; the tinted schemes
 *  use one translucent plate so the circles don't fight the ground. */
const TINTS = [
  { bg: "bg-[oklch(0.93_0.02_155)]", fg: "text-[oklch(0.36_0.07_155)]" },
  { bg: "bg-[oklch(0.93_0.02_250)]", fg: "text-[oklch(0.38_0.06_260)]" },
  { bg: "bg-[oklch(0.94_0.025_70)]", fg: "text-[oklch(0.4_0.06_60)]" },
  { bg: "bg-[oklch(0.93_0.02_20)]", fg: "text-[oklch(0.42_0.07_25)]" },
  { bg: "bg-[oklch(0.93_0.015_310)]", fg: "text-[oklch(0.4_0.05_310)]" },
];

function tintFor(i: number, scheme: ReviewsScheme) {
  if (scheme === "dark") return { bg: "bg-paper/[0.12]", fg: "text-accent-200" };
  if (scheme === "accent") return { bg: "bg-paper/[0.18]", fg: "text-paper" };
  return TINTS[i % TINTS.length];
}

/* ───────────────────────────── pieces ───────────────────────────── */

function Stars({
  rating,
  t,
  size = 13,
}: {
  rating: number;
  t: Tokens;
  size?: number;
}) {
  return (
    <span
      className="inline-flex items-center gap-[3px]"
      role="img"
      aria-label={`${arInt(rating)} من ٥`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden
          style={{ width: size, height: size }}
          className={n <= rating ? t.star : "opacity-[0.22]"}
        >
          <path d="M8 1.8l1.8 3.8 4.2.5-3.1 2.9.8 4.2L8 11.2 4.3 13.2l.8-4.2L2 6.1l4.2-.5L8 1.8z" />
        </svg>
      ))}
    </span>
  );
}

/** Tinted initial monogram, or a real photo when one is supplied. */
function Avatar({
  review,
  index,
  scheme,
  size,
}: {
  review: ReviewItem;
  index: number;
  scheme: ReviewsScheme;
  size: number;
}) {
  const tint = tintFor(index, scheme);
  if (review.avatarSrc) {
    return (
      <span
        className="inline-flex shrink-0 overflow-hidden rounded-full"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL */}
        <img src={review.avatarSrc} alt={review.name} loading="lazy" className="size-full object-cover" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold ${tint.bg} ${tint.fg}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initialOf(review.name)}
    </span>
  );
}

function Attribution({
  review,
  index,
  scheme,
  showAvatars,
  size = 34,
  nameCls = "text-sm",
  metaCls = "text-[11.5px]",
}: {
  review: ReviewItem;
  index: number;
  scheme: ReviewsScheme;
  showAvatars: boolean;
  size?: number;
  nameCls?: string;
  metaCls?: string;
}) {
  return (
    <>
      {showAvatars && <Avatar review={review} index={index} scheme={scheme} size={size} />}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={`font-semibold ${nameCls}`}>{review.name}</span>
        {review.meta && <span className={`opacity-[0.55] ${metaCls}`}>{review.meta}</span>}
      </span>
    </>
  );
}

const Arrow = () => (
  <svg viewBox="0 0 16 16" fill="none" className="size-[15px] -scale-x-100" aria-hidden>
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ──────────────────────────── component ──────────────────────────── */

export default function ReviewsUniversal({
  variant = "A",
  scheme = "paper",
  reviews = defaultReviews,
  buckets = defaultBuckets,
  content,
  motion = true,
  showStars = true,
  showAvatars = true,
  rotateMs = 6000,
  listCount = 4,
  className,
}: ReviewsUniversalProps) {
  const c: ReviewsContent = { ...defaultReviewsContent, ...content };
  const t = tokensFor(scheme);
  const m = (cls: string) => (motion ? `${cls} motion-reduce:animate-none` : "");

  const [active, setActive] = React.useState(0);
  const [auto, setAuto] = React.useState(true);

  React.useEffect(() => {
    if (variant !== "C" || !motion || !auto || reviews.length < 2) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % reviews.length), rotateMs);
    return () => window.clearInterval(id);
  }, [variant, motion, auto, rotateMs, reviews.length]);

  const goTo = (i: number) => {
    setAuto(false);
    setActive(i);
  };

  const waHref = c.whatsapp
    ? `https://wa.me/${c.whatsapp}?text=${encodeURIComponent("مرحبًا، أريد مشاركة رأيي")}`
    : "#contact";

  const act = reviews[active] ?? reviews[0];

  // Variant B is ONE continuous marquee. Repeat until there are enough cards to
  // fill the row even with 2–3 reviews, then duplicate that set so a -50%
  // translate loops seamlessly (see the dir=ltr note in the JSX below).
  const marqueeFill: ReviewItem[] = [];
  while (reviews.length > 0 && marqueeFill.length < 8) marqueeFill.push(...reviews);
  const marqueeTrack = marqueeFill.concat(marqueeFill);

  return (
    <section
      dir="rtl"
      className={`px-[22px] py-[30px] md:px-[52px] md:pb-11 md:pt-[58px] ${t.root} ${className ?? ""}`}
    >
      {/* ── head ── */}
      <div
        className={`mb-2 flex flex-wrap items-end justify-between gap-6 border-b pb-[22px] md:mb-3.5 md:pb-7 ${t.hairline}`}
      >
        <div className="flex flex-col gap-3">
          <span className={`text-xs font-semibold tracking-[0.08em] ${t.kicker}`}>{c.kicker}</span>
          <h2 className="m-0 font-display text-[clamp(28px,3vw,42px)] font-extrabold leading-[1.3] -tracking-[0.028em] text-balance">
            {c.title}
          </h2>
          {c.lede && (
            <p className="m-0 max-w-[50ch] text-[15px] leading-[1.85] opacity-70 text-pretty md:text-[15.5px]">
              {c.lede}
            </p>
          )}
        </div>

        {c.average && (
          <span className="hidden flex-col items-end gap-1 md:flex">
            <span className="flex items-baseline gap-[7px]">
              <span className="font-serif text-[34px] leading-none">{c.average}</span>
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={`size-[17px] ${t.star}`}>
                <path d="M8 1.8l1.8 3.8 4.2.5-3.1 2.9.8 4.2L8 11.2 4.3 13.2l.8-4.2L2 6.1l4.2-.5L8 1.8z" />
              </svg>
            </span>
            <span className="whitespace-nowrap text-[11.5px] opacity-[0.58]">{c.totalLabel}</span>
          </span>
        )}
      </div>

      {/* ── A — grid (static) ── */}
      {variant === "A" && (
        <div className="grid grid-cols-1 gap-y-0 md:grid-cols-3 md:gap-x-[42px]">
          {reviews.map((r, i) => (
            <figure
              key={`${r.name}-${i}`}
              className={`m-0 flex flex-col gap-3.5 border-t py-5 md:pb-[26px] md:pt-6 ${t.hairline} ${m("animate-rise")}`}
              style={motion ? { animationDelay: `${i * 70}ms` } : undefined}
            >
              {showStars && <Stars rating={r.rating} t={t} />}
              <blockquote className="m-0 font-serif text-[15px] leading-[1.8] text-pretty md:text-base">
                {r.text}
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-[11px] pt-1.5">
                <Attribution review={r} index={i} scheme={scheme} showAvatars={showAvatars} />
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* ── B — drifting marquee (motion) ── */}
      {variant === "B" && (
        <div className="flex flex-col gap-3">
          {/* -mx pulls the track to the section's bleed edge. dir=ltr on the VIEWPORT
              (not just the track) so the strip is left-anchored and extends rightward;
              under the section's RTL it would be right-anchored and drain the right
              edge as it scrolls left, leaving an empty gap then a reset flash. Card
              spacing is a physical mr per card (NOT a flex gap) so one half is an exact
              repeat unit; each card is dir=rtl again for its Arabic text. */}
          <div dir="ltr" className="-mx-[22px] overflow-hidden md:-mx-[52px]">
            <div className={`flex w-max ${m("animate-drift-start")}`}>
              {marqueeTrack.map((r, i) => (
                <figure
                  key={i}
                  dir="rtl"
                  className={`m-0 mr-3.5 flex w-[260px] shrink-0 flex-col gap-3 rounded border p-[22px] md:w-[340px] ${t.card}`}
                >
                  {showStars && <Stars rating={r.rating} t={t} size={12} />}
                  <blockquote className="m-0 font-serif text-[15px] leading-[1.75]">{r.text}</blockquote>
                  <figcaption className="mt-auto flex items-center gap-2.5">
                    <Attribution
                      review={r}
                      index={i % reviews.length}
                      scheme={scheme}
                      showAvatars={showAvatars}
                      size={30}
                      nameCls="text-[13.5px]"
                      metaCls="text-[11px]"
                    />
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          <span className="flex items-center gap-2.5 pt-1 text-[11.5px] tracking-[0.04em] opacity-[0.48]">
            <span aria-hidden className="h-px w-5 bg-current" />
            {motion ? "ينساب تلقائيًا · بلا أزرار" : "الحركة متوقّفة"}
          </span>
        </div>
      )}

      {/* ── C — single rotating quote (motion) ── */}
      {variant === "C" && (
        <div className="flex flex-col items-center gap-6 pt-2.5 text-center md:pt-5">
          <span className={`font-serif text-[70px] leading-[0.7] opacity-[0.16] md:text-[110px] ${t.kicker}`} aria-hidden>
            ”
          </span>

          {/* keyed remount so each quote fades in from the start */}
          <blockquote
            key={active}
            className={`m-0 max-w-[30ch] font-serif text-[22px] leading-[1.6] text-balance md:text-[clamp(26px,2.9vw,38px)] ${m("animate-fade-up")}`}
          >
            {act.text}
          </blockquote>

          <div className="flex flex-col items-center gap-3">
            {showStars && <Stars rating={act.rating} t={t} size={15} />}
            <span className="flex items-center gap-[11px] text-start">
              <Attribution
                review={act}
                index={active}
                scheme={scheme}
                showAvatars={showAvatars}
                size={38}
                nameCls="text-[14.5px]"
              />
            </span>
          </div>

          {reviews.length > 1 && (
            <div className="flex items-center gap-[7px] pt-1">
              {reviews.map((r, i) => (
                <button
                  key={`${r.name}-${i}`}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={r.name}
                  aria-current={i === active}
                  className={`h-1.5 rounded-full border-0 p-0 transition-[width,background-color] duration-[400ms] ${
                    i === active ? `w-[26px] ${t.dotOn}` : `w-1.5 ${t.dotOff}`
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── D — summary + list (static) ── */}
      {variant === "D" && (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-[52px]">
          <div className="flex flex-col gap-5">
            {c.average && (
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-[54px] leading-none -tracking-[0.02em] md:text-[76px]">
                  {c.average}
                </span>
                <span className="flex flex-col gap-1.5">
                  <Stars rating={5} t={t} size={14} />
                  <span className="whitespace-nowrap text-[11.5px] opacity-[0.58]">{c.totalLabel}</span>
                </span>
              </div>
            )}

            {buckets.length > 0 && (
              <div className="flex flex-col gap-[9px]">
                {buckets.map((b) => (
                  <span key={b.label} className="flex items-center gap-2.5">
                    <span className="min-w-[14px] font-serif text-[13px] opacity-70">{b.label}</span>
                    <span className={`h-[5px] flex-1 overflow-hidden ${t.barTrack}`}>
                      <span className={`block h-full ${t.barFill}`} style={{ width: `${b.pct}%` }} />
                    </span>
                    <span className="min-w-[34px] text-end font-serif text-[12.5px] opacity-50">
                      {arInt(b.count)}
                    </span>
                  </span>
                ))}
              </div>
            )}

            <a
              href={waHref}
              className={`mt-1 inline-flex items-center gap-2 font-display text-sm font-bold transition-colors ${t.link}`}
            >
              {c.writeLabel}
              <Arrow />
            </a>
          </div>

          <div className="flex flex-col">
            {reviews.slice(0, listCount).map((r, i) => (
              <figure key={`${r.name}-${i}`} className={`m-0 flex gap-3.5 border-b py-[18px] ${t.hairline}`}>
                {showAvatars && <Avatar review={r} index={i} scheme={scheme} size={38} />}
                <span className="flex min-w-0 flex-1 flex-col gap-[7px]">
                  <span className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[14.5px] font-semibold">{r.name}</span>
                    {showStars && <Stars rating={r.rating} t={t} size={11} />}
                    {r.meta && (
                      <span className="ms-auto text-[11px] opacity-[0.48]">{r.meta}</span>
                    )}
                  </span>
                  <blockquote className="m-0 font-serif text-[15px] leading-[1.75] text-pretty">
                    {r.text}
                  </blockquote>
                </span>
              </figure>
            ))}
          </div>
        </div>
      )}

      {/* ── footnote + one quiet CTA ── */}
      {(c.footnote || c.ctaLabel) && (
        <div
          className={`mt-6 flex flex-wrap items-baseline justify-between gap-5 border-t pt-5 md:mt-[34px] ${t.hairline}`}
        >
          {c.footnote && (
            <span className="max-w-[54ch] text-[13px] leading-[1.7] opacity-60">{c.footnote}</span>
          )}
          {c.ctaLabel && (
            <a
              href={waHref}
              className={`inline-flex items-center gap-2 whitespace-nowrap font-display text-sm font-bold transition-colors ${t.link}`}
            >
              {c.ctaLabel}
              <Arrow />
            </a>
          )}
        </div>
      )}
    </section>
  );
}
