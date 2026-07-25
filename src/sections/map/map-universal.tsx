"use client";

/**
 * MapUniversal — Sawwi section library
 * Shared location / address section, business-agnostic. Four variants × three schemes.
 *
 *   A "split"    — address + directions detail beside the map
 *   B "wide"     — full-width map with an info bar beneath
 *   C "overlay"  — white card floating over the map
 *   D "branches" — a card per branch with mini-map, hours and phone
 *
 * The map is a SCHEMATIC drawing: no API key, no tiles, no tracking. Clicking
 * opens the real Google Maps URL from SiteSettings. Arabic-first (RTL). Client
 * component (copy-to-clipboard). Theme tokens + keyframes live in globals.css.
 */

import * as React from "react";
import {
  defaultMapContent,
  defaultBranches,
  type Branch,
  type MapContent,
  type MapVariant,
  type MapScheme,
  type PinPosition,
} from "./map-data";

export type { Branch, MapContent, MapVariant, MapScheme, PinPosition } from "./map-data";
export { defaultMapContent, defaultBranches } from "./map-data";

export interface MapUniversalProps {
  variant?: MapVariant;
  scheme?: MapScheme;
  content?: Partial<MapContent>;
  /** variant D only */
  branches?: Branch[];
  showLandmarks?: boolean;
  showTransport?: boolean;
  /** pin placement on the main plate */
  pin?: PinPosition;
  className?: string;
}

/* ────────────────────────────── tokens ────────────────────────────── */

interface Tokens {
  root: string;
  hairline: string;
  kicker: string;
  link: string;
  border: string;
  mapBg: string;
  mapLine: string;
  road: string;
  roadThin: string;
  block: string;
  pin: string;
  pinHole: string;
  chip: string;
  plate: string;
  cta: string;
  card: string;
  cardHairline: string;
  cardKicker: string;
  cardCta: string;
}

function tokensFor(scheme: MapScheme): Tokens {
  switch (scheme) {
    case "dark":
      return {
        root: "bg-ink-900 text-paper",
        hairline: "border-paper/15",
        kicker: "text-accent-300",
        link: "text-accent-300 hover:text-accent-200",
        border: "border-paper/[0.24]",
        mapBg: "bg-ink-950",
        mapLine: "oklch(0.95 0.004 95 / .07)",
        road: "bg-paper/10",
        roadThin: "bg-paper/[0.06]",
        block: "bg-paper/[0.06]",
        pin: "text-accent-300",
        pinHole: "oklch(0.16 0.008 70)",
        chip: "bg-paper/[0.14] text-paper",
        plate: "bg-paper text-ink",
        cta: "bg-accent-600 text-white hover:bg-accent-700",
        card: "bg-ink text-paper",
        cardHairline: "border-paper/[0.16]",
        cardKicker: "text-accent-300",
        cardCta: "bg-accent-600 text-white hover:bg-accent-700",
      };
    case "accent":
      return {
        root: "bg-accent-900 text-paper",
        hairline: "border-paper/20",
        kicker: "text-paper/85",
        link: "text-paper hover:text-white",
        border: "border-paper/30",
        mapBg: "bg-[oklch(0.22_0.045_155)]",
        mapLine: "oklch(0.96 0.01 95 / .08)",
        road: "bg-paper/[0.11]",
        roadThin: "bg-paper/[0.07]",
        block: "bg-paper/[0.07]",
        pin: "text-[oklch(0.92_0.06_145)]",
        pinHole: "oklch(0.22 0.045 155)",
        chip: "bg-paper text-accent-900",
        plate: "bg-paper text-accent-900",
        cta: "bg-paper text-accent-900 hover:bg-white",
        card: "bg-paper text-accent-900",
        cardHairline: "border-accent-200",
        cardKicker: "text-accent-700",
        cardCta: "bg-accent-900 text-paper hover:bg-accent-800",
      };
    default:
      return {
        root: "bg-paper text-ink",
        hairline: "border-line",
        kicker: "text-accent-700",
        link: "text-accent-700 hover:text-accent-800",
        border: "border-neutral-300",
        mapBg: "bg-neutral-200",
        mapLine: "oklch(0.26 0.012 70 / .07)",
        road: "bg-ink/10",
        roadThin: "bg-ink/[0.06]",
        block: "bg-ink/[0.07]",
        pin: "text-accent",
        pinHole: "oklch(0.93 0.006 85)",
        chip: "bg-surface text-ink",
        plate: "bg-ink text-paper",
        cta: "bg-accent text-white hover:bg-accent-700",
        card: "bg-surface text-ink",
        cardHairline: "border-line",
        cardKicker: "text-accent-700",
        cardCta: "bg-ink text-white hover:bg-ink-950",
      };
  }
}

/* ────────────────────────────── icons ────────────────────────────── */

const PinIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
    <path d="M8 14s4.5-4 4.5-7A4.5 4.5 0 0 0 8 2.5 4.5 4.5 0 0 0 3.5 7c0 3 4.5 7 4.5 7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="8" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);
const WhatsAppIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={className}>
    <path d="M8 1.5a6.5 6.5 0 0 0-5.6 9.8L1.5 14.5l3.4-.9A6.5 6.5 0 1 0 8 1.5z" />
  </svg>
);
const TransitIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4">
    <rect x="3" y="3" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5 13v.5M11 13v.5M3 8h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
const Arrow = () => (
  <svg viewBox="0 0 16 16" fill="none" className="size-[15px] -scale-x-100" aria-hidden>
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ───────────────────────────── map plate ───────────────────────────── */

interface PlateProps {
  t: Tokens;
  pin: PinPosition;
  grid?: number;
  showLandmarks?: boolean;
  landmarkLabel?: string;
  roadW?: number;
  pinSize?: number;
  children?: React.ReactNode;
  className?: string;
}

/** The schematic plate: grid, two crossing roads, optional blocks, a pinging pin. */
function MapPlate({
  t,
  pin,
  grid = 46,
  showLandmarks = true,
  landmarkLabel,
  roadW = 14,
  pinSize = 34,
  children,
  className = "",
}: PlateProps) {
  return (
    <div className={`relative overflow-hidden ${t.mapBg} ${className}`}>
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${t.mapLine} 1px, transparent 1px), linear-gradient(90deg, ${t.mapLine} 1px, transparent 1px)`,
          backgroundSize: `${grid}px ${grid}px`,
        }}
      />
      {/* main crossroads — the pin sits at their intersection */}
      <span aria-hidden className={`absolute inset-x-0 ${t.road}`} style={{ top: pin.y, height: roadW, transform: "translateY(-50%)" }} />
      <span aria-hidden className={`absolute inset-y-0 ${t.road}`} style={{ insetInlineStart: pin.x, width: roadW, transform: "translateX(50%)" }} />
      {/* secondary streets */}
      <span aria-hidden className={`absolute inset-x-0 top-[76%] h-2 ${t.roadThin}`} />
      <span aria-hidden className={`absolute inset-y-0 start-[76%] w-2 ${t.roadThin}`} />

      {showLandmarks && (
        <>
          <span aria-hidden className={`absolute start-[12%] top-[52%] h-[20%] w-[22%] rounded-[3px] ${t.block}`} />
          <span aria-hidden className={`absolute start-[56%] top-[14%] h-[16%] w-[18%] rounded-[3px] ${t.block}`} />
          {landmarkLabel && (
            <span className={`absolute start-3.5 top-3.5 inline-flex items-center whitespace-nowrap rounded-[3px] px-3 py-[7px] text-xs font-semibold ${t.chip}`}>
              {landmarkLabel}
            </span>
          )}
        </>
      )}

      {/* pin + ping */}
      <span
        aria-hidden
        className="absolute inline-flex items-center justify-center"
        style={{ insetInlineStart: pin.x, top: pin.y, transform: "translate(50%, -50%)" }}
      >
        <span
          className={`absolute size-5 rounded-full animate-ping-slow motion-reduce:animate-none ${t.pin.replace("text-", "bg-")}`}
        />
        <span className={`relative drop-shadow-[0_3px_6px_rgba(0,0,0,.3)] ${t.pin}`}>
          <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: pinSize, height: pinSize }}>
            <path d="M8 15s5-5 5-8.2A5 5 0 0 0 8 1.8 5 5 0 0 0 3 6.8C3 10 8 15 8 15z" />
            <circle cx="8" cy="6.6" r="1.7" fill={t.pinHole} />
          </svg>
        </span>
      </span>

      {children}
    </div>
  );
}

function DirectionsPill({
  t,
  label,
  mapsUrl,
  className = "",
}: {
  t: Tokens;
  label: string;
  mapsUrl?: string;
  className?: string;
}) {
  return (
    <a
      href={mapsUrl ?? "#"}
      {...(mapsUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-[3px] px-[15px] py-2.5 font-display text-[13.5px] font-bold shadow-[0_8px_20px_-10px_rgba(0,0,0,.4)] ${t.plate} ${className}`}
    >
      <Arrow />
      {label}
    </a>
  );
}

/* ──────────────────────────── component ──────────────────────────── */

export default function MapUniversal({
  variant = "A",
  scheme = "paper",
  content,
  branches = defaultBranches,
  showLandmarks = true,
  showTransport = true,
  pin = { x: "38%", y: "34%" },
  className,
}: MapUniversalProps) {
  const c: MapContent = { ...defaultMapContent, ...content };
  const t = tokensFor(scheme);

  const [copied, setCopied] = React.useState(false);
  const copyAddress = async () => {
    if (!c.address) return;
    try {
      await navigator.clipboard.writeText(c.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the address is visible on screen anyway */
    }
  };

  const mapsHref = c.mapsUrl ?? "#";
  const mapsAttrs = c.mapsUrl ? { target: "_blank", rel: "noopener noreferrer" as const } : {};

  return (
    <section dir="rtl" className={`${t.root} ${className ?? ""}`}>
      {/* ── A — split ── */}
      {variant === "A" && (
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="flex flex-col gap-5 px-[22px] py-[30px] md:p-[46px]">
            <div className="flex flex-col gap-3">
              <span className={`text-xs font-semibold tracking-[0.08em] ${t.kicker}`}>{c.kicker}</span>
              <h2 className="m-0 font-display text-[clamp(27px,2.8vw,38px)] font-extrabold leading-[1.3] -tracking-[0.028em] text-balance">
                {c.title}
              </h2>
              {c.lede && (
                <p className="m-0 max-w-[42ch] text-[15px] leading-[1.85] opacity-70 text-pretty md:text-[15.5px]">
                  {c.lede}
                </p>
              )}
            </div>

            <div className={`flex flex-col border-t ${t.hairline}`}>
              {c.address && (
                <span className={`flex items-start gap-3 border-b py-[15px] ${t.hairline}`}>
                  <span className="mt-1 shrink-0 opacity-[0.55]">
                    <PinIcon />
                  </span>
                  <span className="flex flex-col gap-[3px]">
                    <span className="text-[11.5px] opacity-[0.55]">العنوان</span>
                    <span className="text-[14.5px] leading-[1.65] text-pretty">{c.address}</span>
                  </span>
                </span>
              )}
              {c.phone && (
                <a
                  href={c.whatsapp ? `https://wa.me/${c.whatsapp}` : `tel:${c.phone.replace(/\s/g, "")}`}
                  className={`flex items-center gap-3 border-b py-[15px] text-current ${t.hairline}`}
                >
                  <span className="shrink-0 opacity-[0.55]">
                    <WhatsAppIcon />
                  </span>
                  <span className="flex flex-col gap-[3px]">
                    <span className="text-[11.5px] opacity-[0.55]">هاتف / واتساب</span>
                    <span dir="ltr" className="text-start font-mono text-sm">{c.phone}</span>
                  </span>
                </a>
              )}
              {showTransport && c.transportNote && (
                <span className={`flex items-start gap-3 border-b py-[15px] ${t.hairline}`}>
                  <span className="mt-1 shrink-0 opacity-[0.55]">
                    <TransitIcon />
                  </span>
                  <span className="flex flex-col gap-[5px]">
                    <span className="text-[11.5px] opacity-[0.55]">كيف تصل</span>
                    <span className="text-[13.5px] leading-[1.7] opacity-80 text-pretty">{c.transportNote}</span>
                  </span>
                </span>
              )}
            </div>

            <div className="flex flex-col items-stretch gap-2.5 md:flex-row md:items-center">
              <a
                href={mapsHref}
                {...mapsAttrs}
                className={`inline-flex h-12 items-center justify-center gap-2.5 whitespace-nowrap rounded-[3px] px-[22px] font-display text-[14.5px] font-bold transition-colors ${t.cta}`}
              >
                <PinIcon />
                {c.directionsLabel}
              </a>
              <button
                type="button"
                onClick={copyAddress}
                className={`inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-[3px] border px-5 font-display text-[14.5px] font-bold text-current ${t.border}`}
              >
                {copied ? "تم النسخ ✓" : c.copyLabel}
              </button>
            </div>
          </div>

          <MapPlate
            t={t}
            pin={pin}
            showLandmarks={showLandmarks}
            landmarkLabel={c.landmarkLabel}
            className={`min-h-[280px] border-s md:min-h-[460px] ${t.hairline}`}
          />
        </div>
      )}

      {/* ── B — wide map + info bar ── */}
      {variant === "B" && (
        <div className="flex flex-col">
          <MapPlate
            t={t}
            pin={{ x: "46%", y: "42%" }}
            grid={52}
            roadW={16}
            pinSize={38}
            showLandmarks={showLandmarks}
            className="h-[260px] md:h-[420px]"
          >
            <div className="absolute end-4 top-4">
              <DirectionsPill t={t} label="الاتجاهات" mapsUrl={c.mapsUrl} />
            </div>
          </MapPlate>

          <div
            className={`flex flex-wrap items-start justify-between gap-6 border-t px-[22px] pb-7 pt-6 md:items-center md:px-[46px] md:pb-[34px] md:pt-[30px] ${t.hairline}`}
          >
            <div className="flex min-w-0 flex-col gap-2">
              <span className={`text-xs font-semibold tracking-[0.06em] ${t.kicker}`}>{c.kicker}</span>
              <span className="font-display text-xl font-bold md:text-[23px]">
                {c.address?.split("—")[0]?.trim() ?? c.businessName}
              </span>
              <span className="max-w-[46ch] text-[13.5px] leading-[1.7] opacity-70 text-pretty">
                {c.address?.split("—").slice(1).join("—").trim()}
                {showTransport && c.transportNote ? ` ${c.transportNote}` : ""}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-[22px]">
              {c.phone && (
                <a
                  href={c.whatsapp ? `https://wa.me/${c.whatsapp}` : `tel:${c.phone.replace(/\s/g, "")}`}
                  className="flex flex-col gap-[3px] text-current"
                >
                  <span className="text-[11.5px] opacity-[0.55]">هاتف / واتساب</span>
                  <span dir="ltr" className="text-start font-mono text-sm">{c.phone}</span>
                </a>
              )}
              <a
                href={c.whatsapp ? `https://wa.me/${c.whatsapp}` : "#contact"}
                className={`inline-flex h-[46px] items-center justify-center gap-2.5 whitespace-nowrap rounded-[3px] px-5 font-display text-sm font-bold transition-colors ${t.cta}`}
              >
                <WhatsAppIcon className="size-[15px]" />
                راسلنا للوصول
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── C — card floating over the map ── */}
      {variant === "C" && (
        <MapPlate
          t={t}
          pin={{ x: "30%", y: "30%" }}
          grid={50}
          roadW={15}
          showLandmarks={showLandmarks}
          className="min-h-0 md:min-h-[520px]"
        >
          <div className="relative flex justify-center p-[22px] md:justify-start md:px-[46px] md:py-12">
            <div
              className={`flex w-full max-w-full flex-col gap-4 rounded p-6 shadow-[0_26px_60px_-28px_rgba(30,25,20,.5)] animate-rise motion-reduce:animate-none md:w-[396px] md:p-[30px] ${t.card}`}
            >
              <div className="flex flex-col gap-2">
                <span className={`text-xs font-semibold tracking-[0.06em] ${t.cardKicker}`}>{c.title}</span>
                <span className="font-display text-2xl font-extrabold -tracking-[0.02em] md:text-[28px]">
                  {c.businessName}
                </span>
              </div>
              {c.address && (
                <span className="text-sm leading-[1.7] opacity-[0.78] text-pretty">{c.address}</span>
              )}
              {showTransport && c.transportNote && (
                <span className={`flex items-start gap-2.5 border-t pt-3 text-[13px] leading-[1.7] opacity-70 ${t.cardHairline}`}>
                  <span className="mt-[3px] shrink-0">
                    <TransitIcon />
                  </span>
                  <span>{c.transportNote}</span>
                </span>
              )}
              {c.phone && (
                <a
                  href={c.whatsapp ? `https://wa.me/${c.whatsapp}` : `tel:${c.phone.replace(/\s/g, "")}`}
                  className={`flex items-center gap-2.5 border-t pt-3 text-current ${t.cardHairline}`}
                >
                  <span className="shrink-0 opacity-60">
                    <WhatsAppIcon className="size-[15px]" />
                  </span>
                  <span dir="ltr" className="text-start font-mono text-[13.5px]">{c.phone}</span>
                </a>
              )}
              <a
                href={mapsHref}
                {...mapsAttrs}
                className={`mt-0.5 inline-flex h-12 items-center justify-center gap-2.5 rounded-[3px] font-display text-[14.5px] font-bold transition-colors ${t.cardCta}`}
              >
                <PinIcon />
                {c.directionsLabel}
              </a>
            </div>
          </div>
        </MapPlate>
      )}

      {/* ── D — branches ── */}
      {variant === "D" && (
        <div className="flex flex-col px-[22px] py-[30px] md:p-[46px]">
          <div className={`mb-6 flex flex-col gap-3 border-b pb-[22px] md:mb-8 md:pb-[26px] ${t.hairline}`}>
            <span className={`text-xs font-semibold tracking-[0.08em] ${t.kicker}`}>فروعنا</span>
            <h2 className="m-0 font-display text-[clamp(27px,2.8vw,38px)] font-extrabold leading-[1.3] -tracking-[0.028em]">
              {`${branches.length} فروع`}
            </h2>
            {c.lede && (
              <p className="m-0 max-w-[50ch] text-[15px] leading-[1.85] opacity-70 md:text-[15.5px]">
                اختر الأقرب إليك — كل فرع بنفس الطاقم والأسعار.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-[26px] md:grid-cols-3 md:gap-7">
            {branches.map((br, i) => (
              <div
                key={`${br.name}-${i}`}
                className={`flex flex-col gap-3.5 border-t-2 pt-5 animate-rise motion-reduce:animate-none ${
                  i === 0 ? t.kicker.replace("text-", "border-") : t.hairline
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <MapPlate
                  t={t}
                  pin={br.pin ?? { x: "42%", y: "40%" }}
                  grid={34}
                  roadW={9}
                  pinSize={26}
                  showLandmarks={false}
                  className="h-[150px] rounded-[3px] md:h-[170px]"
                >
                  {br.main && (
                    <span className={`absolute start-2.5 top-2.5 inline-flex items-center whitespace-nowrap rounded-[3px] px-2.5 py-[5px] text-[11px] font-semibold ${t.chip}`}>
                      الفرع الرئيسي
                    </span>
                  )}
                </MapPlate>

                <div className="flex flex-col gap-2">
                  <span className="font-display text-[17px] font-bold">{br.name}</span>
                  <span className="text-[13.5px] leading-[1.7] opacity-70 text-pretty">{br.address}</span>
                  {br.hours && (
                    <span className="flex items-center gap-2 pt-1.5">
                      <span className="font-serif text-[15px]">{br.hours}</span>
                      <span className="text-[11.5px] opacity-50">يوميًا</span>
                    </span>
                  )}
                  <span className={`mt-1 flex flex-wrap items-center gap-3.5 border-t pt-3 ${t.hairline}`}>
                    {br.phone && (
                      <a
                        href={`tel:${br.phone.replace(/\s/g, "")}`}
                        dir="ltr"
                        className="text-start font-mono text-[13px] text-current opacity-75"
                      >
                        {br.phone}
                      </a>
                    )}
                    <a
                      href={br.mapsUrl ?? "#"}
                      {...(br.mapsUrl ? { target: "_blank", rel: "noopener noreferrer" as const } : {})}
                      className={`ms-auto inline-flex items-center gap-[7px] whitespace-nowrap font-display text-[13.5px] font-bold transition-colors ${t.link}`}
                    >
                      الاتجاهات
                      <Arrow />
                    </a>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
