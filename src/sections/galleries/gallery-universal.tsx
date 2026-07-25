"use client";

/**
 * GalleryUniversal — Sawwi section library
 * Shared photo gallery, business-agnostic. Four variants × three schemes.
 *
 *   A "mosaic"  — STATIC. Deliberate grid rhythm, staggered rise on entry.
 *   B "bands"   — MOTION. Two tracks drifting in opposite directions, seamless.
 *   C "stage"   — MOTION. One large image, slow Ken Burns + cross-fade, tick progress.
 *   D "columns" — INTERACTION. Vertical slices that expand on hover/tap.
 *
 * Arabic-first (RTL). Client component (variants B/C/D use state + timers). The
 * theme tokens + keyframes it needs live in globals.css.
 */

import * as React from "react";
import {
  arNum,
  defaultGalleryContent,
  defaultGalleryPhotos,
  type GalleryPhoto,
  type GalleryContent,
  type GalleryVariant,
  type GalleryScheme,
} from "./gallery-data";

export type {
  GalleryPhoto,
  GalleryContent,
  GalleryVariant,
  GalleryScheme,
} from "./gallery-data";
export { arNum, defaultGalleryContent, defaultGalleryPhotos } from "./gallery-data";

/* ────────────────────────────── types ────────────────────────────── */

export interface GalleryUniversalProps {
  variant?: GalleryVariant;
  scheme?: GalleryScheme;
  photos?: GalleryPhoto[];
  content?: Partial<GalleryContent>;
  /** false → all motion removed (also auto-removed under prefers-reduced-motion) */
  motion?: boolean;
  showCaptions?: boolean;
  showCount?: boolean;
  /** ms per slide in variant C. Default 5200. */
  slideMs?: number;
  className?: string;
}

/** Mosaic placement — a deliberate rhythm, not a uniform grid. Desktop classes
 *  carry the `md:` prefix per-token (literal strings so Tailwind emits them). */
const MOSAIC_DESKTOP = [
  "md:col-span-2 md:row-span-2",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-2",
  "md:col-span-2 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-2 md:row-span-1",
];
const MOSAIC_MOBILE = [
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-1",
];

/* ────────────────────────────── tokens ────────────────────────────── */

interface Tokens {
  root: string;
  hairline: string;
  kicker: string;
  link: string;
  stage: string;
  tickTrack: string;
  tickFill: string;
}

function tokensFor(scheme: GalleryScheme): Tokens {
  switch (scheme) {
    case "dark":
      return {
        root: "bg-ink-900 text-paper",
        hairline: "border-paper/15",
        kicker: "text-accent-300",
        link: "text-accent-300 hover:text-accent-200",
        stage: "bg-ink",
        tickTrack: "bg-paper/20",
        tickFill: "bg-accent-300",
      };
    case "accent":
      return {
        root: "bg-accent-900 text-paper",
        hairline: "border-paper/20",
        kicker: "text-paper/85",
        link: "text-paper hover:text-white",
        stage: "bg-accent-900",
        tickTrack: "bg-paper/25",
        tickFill: "bg-paper",
      };
    default:
      return {
        root: "bg-paper text-ink",
        hairline: "border-line",
        kicker: "text-accent-700",
        link: "text-accent-700 hover:text-accent-800",
        stage: "bg-neutral-200",
        tickTrack: "bg-neutral-300",
        tickFill: "bg-accent",
      };
  }
}

/* ───────────────────────────── pieces ───────────────────────────── */

/** Photo or a neutral placeholder. */
function Photo({ photo, priority }: { photo: GalleryPhoto; priority?: boolean }) {
  if (!photo.src) {
    return (
      <div
        aria-hidden
        className="size-full bg-neutral-200 bg-[repeating-linear-gradient(-45deg,transparent_0_10px,rgba(0,0,0,.035)_10px_20px)]"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL
    <img
      src={photo.src}
      alt={photo.label}
      loading={priority ? "eager" : "lazy"}
      className="size-full object-cover"
    />
  );
}

function Caption({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <figcaption
      className={`pointer-events-none absolute inset-x-0 bottom-0 flex bg-[linear-gradient(to_top,oklch(0.14_0.008_70/.78)_0%,transparent_100%)] px-3.5 pb-3 pt-[26px] text-paper ${className}`}
    >
      {children}
    </figcaption>
  );
}

const Arrow = ({ back }: { back?: boolean }) => (
  <svg viewBox="0 0 16 16" fill="none" className="size-[17px]" aria-hidden>
    <path
      d={back ? "M10 4L6 8l4 4" : "M6 4l4 4-4 4"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ──────────────────────────── component ──────────────────────────── */

export default function GalleryUniversal({
  variant = "A",
  scheme = "paper",
  photos = defaultGalleryPhotos,
  content,
  motion = true,
  showCaptions = true,
  showCount = true,
  slideMs = 5200,
  className,
}: GalleryUniversalProps) {
  const c: GalleryContent = { ...defaultGalleryContent, ...content };
  const t = tokensFor(scheme);

  const stagePhotos = photos.slice(0, 5);
  const columnPhotos = photos.slice(0, 5);
  const mosaicPhotos = photos.slice(0, 7);

  // Variant B is ONE continuous band. Repeat the photos until there are enough
  // tiles to fill the row even with just 2–3 images, then duplicate that set so
  // a -50% translate loops seamlessly (no empty gap, no wrap to a second line).
  const bandFill: GalleryPhoto[] = [];
  while (photos.length > 0 && bandFill.length < 10) bandFill.push(...photos);
  const bandTrack = bandFill.concat(bandFill);

  const [active, setActive] = React.useState(0);
  const [openCol, setOpenCol] = React.useState(0);

  // variant C auto-advance; any manual interaction stops it for good
  const [auto, setAuto] = React.useState(true);
  React.useEffect(() => {
    if (variant !== "C" || !motion || !auto) return;
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % stagePhotos.length),
      slideMs
    );
    return () => window.clearInterval(id);
  }, [variant, motion, auto, slideMs, stagePhotos.length]);

  const goTo = (i: number) => {
    setAuto(false);
    setActive((i + stagePhotos.length) % stagePhotos.length);
  };

  const m = (cls: string) => (motion ? `${cls} motion-reduce:animate-none` : "");

  return (
    <section
      dir="rtl"
      className={`px-[22px] py-[30px] md:px-[52px] md:pb-11 md:pt-[58px] ${t.root} ${className ?? ""}`}
    >
      {/* ── head ── */}
      <div
        className={`mb-[22px] flex flex-wrap items-end justify-between gap-6 border-b pb-[22px] md:mb-[30px] md:pb-7 ${t.hairline}`}
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
        {showCount && (
          <span className="hidden flex-col items-end gap-1 md:flex">
            <span className="font-serif text-[34px] leading-none">{arNum(photos.length)}</span>
            <span className="whitespace-nowrap text-[11.5px] opacity-[0.58]">{c.countLabel}</span>
          </span>
        )}
      </div>

      {/* ── A — mosaic (static) ── */}
      {variant === "A" && (
        <div className="grid auto-rows-[112px] grid-cols-2 gap-2 md:auto-rows-[168px] md:grid-cols-4 md:gap-3">
          {mosaicPhotos.map((photo, i) => (
            <figure
              key={`${photo.label}-${i}`}
              className={`relative m-0 overflow-hidden rounded-[3px] ${MOSAIC_MOBILE[i]} ${MOSAIC_DESKTOP[i]} ${m("animate-rise")}`}
              style={motion ? { animationDelay: `${i * 90}ms` } : undefined}
            >
              <Photo photo={photo} priority={i === 0} />
              {showCaptions && photo.label && (
                <Caption className="items-baseline gap-2">
                  <span className="font-serif text-xs tracking-[0.06em] text-accent-200">
                    {arNum(i + 1)}
                  </span>
                  <span className="text-[12.5px] font-medium">{photo.label}</span>
                </Caption>
              )}
            </figure>
          ))}
        </div>
      )}

      {/* ── B — one drifting band (motion), always full, never a second line ── */}
      {variant === "B" && (
        <div className="flex flex-col gap-2 md:gap-3">
          {/* -mx pulls the band to the section's bleed edge. dir=ltr on the VIEWPORT
              (not just the track) so the strip is left-anchored and extends rightward;
              under the section's RTL it would be right-anchored and drain the right
              edge as it scrolls left, leaving an empty gap then a reset flash. */}
          <div dir="ltr" className="-mx-[22px] overflow-hidden md:-mx-[52px]">
            {/* track = filled set + its duplicate → translating 50% loops seamlessly.
                Spacing is a trailing margin per tile (NOT a flex gap) so one half is an
                exact repeat unit — a flex gap would leave a half-gap seam. */}
            <div className={`flex w-max ${m("animate-drift-start")}`}>
              {bandTrack.map((photo, i) => (
                <figure
                  key={i}
                  className="relative m-0 me-2 h-[142px] w-[200px] shrink-0 overflow-hidden rounded-[3px] md:me-3 md:h-[210px] md:w-[300px]"
                >
                  <Photo photo={photo} />
                  {showCaptions && photo.label && (
                    <Caption className="pb-2.5 pt-[22px] text-xs font-medium">{photo.label}</Caption>
                  )}
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

      {/* ── C — stage with slow zoom (motion) ── */}
      {variant === "C" && (
        <div className="flex flex-col gap-3.5">
          <div className={`relative h-[300px] overflow-hidden rounded-[3px] md:h-[520px] ${t.stage}`}>
            {stagePhotos.map((photo, i) => (
              <div
                key={`${photo.label}-${i}`}
                aria-hidden={i !== active}
                className={`absolute inset-0 transition-opacity duration-[900ms] ease-[cubic-bezier(.4,0,.2,1)] ${
                  i === active ? "z-10 opacity-100" : "z-0 opacity-0"
                }`}
              >
                {/* Ken Burns runs only on the visible slide, so it always starts from scale 1 */}
                <div
                  key={i === active ? `ken-${active}` : undefined}
                  className={`absolute inset-0 ${i === active ? m("animate-ken") : ""}`}
                  style={i === active && motion ? { animationDuration: `${slideMs + 1400}ms` } : undefined}
                >
                  <Photo photo={photo} priority={i === 0} />
                </div>
              </div>
            ))}

            {showCaptions && stagePhotos[active]?.label && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-1.5 bg-[linear-gradient(to_top,oklch(0.14_0.008_70/.82)_0%,transparent_100%)] px-6 pb-[22px] pt-[60px]">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-200">
                  {arNum(active + 1)} / {arNum(stagePhotos.length)}
                </span>
                <span className="font-display text-lg font-bold text-paper md:text-2xl">
                  {stagePhotos[active].label}
                </span>
              </div>
            )}

            {/* arrows are logical-start/end, so they mirror with direction */}
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              aria-label="السابق"
              className="absolute end-3.5 top-1/2 z-30 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink-950/55 text-paper backdrop-blur-[6px] md:inline-flex"
            >
              <Arrow back />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              aria-label="التالي"
              className="absolute start-3.5 top-1/2 z-30 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink-950/55 text-paper backdrop-blur-[6px] md:inline-flex"
            >
              <Arrow />
            </button>
          </div>

          {/* hairline ticks double as progress + jump targets */}
          <div className="flex items-center gap-2.5">
            {stagePhotos.map((photo, i) => (
              <button
                key={`${photo.label}-${i}`}
                type="button"
                onClick={() => goTo(i)}
                aria-label={photo.label}
                aria-current={i === active}
                className={`relative h-0.5 flex-1 overflow-hidden border-0 p-0 ${t.tickTrack}`}
              >
                <span
                  key={i === active ? `sweep-${active}` : undefined}
                  className={`absolute inset-0 origin-right ${t.tickFill} ${
                    i === active && motion && auto ? m("animate-sweep") : ""
                  } ${i <= active ? "scale-x-100" : "scale-x-0"}`}
                  style={i === active && motion && auto ? { animationDuration: `${slideMs}ms` } : undefined}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── D — expanding columns (interaction) ── */}
      {variant === "D" && (
        // NOTE: stacked on mobile the flex row runs down the BLOCK axis, so a
        // `flex-basis: 0` would zero each slice's height and the variant would
        // vanish. Mobile sizes by height; only ≥md uses flex growth.
        <div className="flex flex-col gap-2 md:h-[460px] md:flex-row md:gap-3">
          {columnPhotos.map((photo, i) => {
            const open = i === openCol;
            return (
              <figure
                key={`${photo.label}-${i}`}
                onMouseEnter={() => setOpenCol(i)}
                onClick={() => setOpenCol(i)}
                className={`relative m-0 min-w-0 cursor-pointer overflow-hidden rounded-[3px] transition-[height,flex-grow] duration-[700ms] ease-[cubic-bezier(.3,.8,.2,1)] md:h-full ${
                  open ? "h-[230px] md:flex-[2.6_1_0%]" : "h-[104px] md:flex-[1_1_0%]"
                }`}
              >
                <Photo photo={photo} priority={i === 0} />
                <span
                  aria-hidden
                  className={`pointer-events-none absolute inset-0 transition-colors duration-[600ms] ${
                    open ? "bg-transparent" : "bg-ink-950/30"
                  }`}
                />
                {showCaptions && photo.label && (
                  <Caption className="flex-col gap-1.5 px-4 pb-4 pt-[50px]">
                    <span className="font-serif text-xs tracking-[0.06em] text-accent-200">
                      {arNum(i + 1)}
                    </span>
                    <span
                      className={`whitespace-nowrap font-display text-[15px] font-bold transition-opacity duration-500 ${
                        open ? "opacity-100" : "opacity-75"
                      }`}
                    >
                      {photo.label}
                    </span>
                  </Caption>
                )}
              </figure>
            );
          })}
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
              href={
                c.whatsapp
                  ? `https://wa.me/${c.whatsapp}?text=${encodeURIComponent("مرحبًا، أريد عملًا مشابهًا لما في المعرض")}`
                  : "#contact"
              }
              className={`inline-flex items-center gap-2 whitespace-nowrap font-display text-sm font-bold transition-colors ${t.link}`}
            >
              {c.ctaLabel}
              <span className="-scale-x-100">
                <Arrow />
              </span>
            </a>
          )}
        </div>
      )}
    </section>
  );
}
