"use client";

/**
 * HoursUniversal — Sawwi section library
 * Shared opening-hours section, business-agnostic. Four variants × three schemes.
 *
 *   A "table"  — day list with dotted leaders; today tinted + tagged
 *   B "status" — a large live sentence ("مفتوح حتى ٢٢:٠٠") beside the schedule
 *   C "week"   — seven columns whose bars map real opening spans
 *   D "address"— schedule beside a map plate + directions
 *
 * The open/closed state is COMPUTED from the SHOP clock (Asia/Damascus) against
 * the schedule and re-evaluates every minute — so it's correct wherever the
 * visitor is. Client component (live clock). Arabic-first (RTL).
 */

import * as React from "react";
import {
  defaultSchedule,
  defaultHoursContent,
  evaluateStatus,
  buildDays,
  type DaySchedule,
  type HoursContent,
  type HoursVariant,
  type HoursScheme,
  type StatusKey,
  type StatusResult,
  type ShopNow,
} from "./hours-data";

export type {
  DaySchedule,
  HoursContent,
  HoursVariant,
  HoursScheme,
} from "./hours-data";
export { defaultSchedule, defaultHoursContent } from "./hours-data";

export interface HoursUniversalProps {
  variant?: HoursVariant;
  scheme?: HoursScheme;
  /** ordered as you want it displayed; defaults start Saturday */
  schedule?: DaySchedule[];
  content?: Partial<HoursContent>;
  showStatus?: boolean;
  highlightToday?: boolean;
  showSeasonalNote?: boolean;
  className?: string;
}

const SHOP_TZ = "Asia/Damascus";
const JS_BY_SHORT: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

/** The shop's current day + minutes (Asia/Damascus), read via Intl. */
function shopNow(): ShopNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TZ,
    hour12: false,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const jsDay = JS_BY_SHORT[get("weekday").toLowerCase().slice(0, 3)] ?? 6;
  let hour = Number.parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  const minute = Number.parseInt(get("minute"), 10);
  return { jsDay, minutes: hour * 60 + minute };
}

/** Live shop clock, ticking once a minute. Undefined until mounted so SSR and the
 *  first client paint agree (no hydration mismatch). */
function useShopNow() {
  const [now, setNow] = React.useState<ShopNow | undefined>(undefined);
  React.useEffect(() => {
    const tick = () => setNow(shopNow());
    // Async first tick (not a synchronous setState in the effect body) so SSR and
    // the first client paint agree, then re-evaluate every minute.
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);
  return now;
}

/* ────────────────────────────── tokens ────────────────────────────── */

interface Tokens {
  root: string;
  hairline: string;
  kicker: string;
  link: string;
  dotted: string;
  todayRow: string;
  tag: string;
  barTrack: string;
  barOpen: string;
  barToday: string;
  note: string;
  cta: string;
  map: string;
  mapLine: string;
  mapRoad: string;
  pin: string;
  mapPlate: string;
}

function tokensFor(scheme: HoursScheme): Tokens {
  switch (scheme) {
    case "dark":
      return {
        root: "bg-ink-900 text-paper",
        hairline: "border-paper/15",
        kicker: "text-accent-300",
        link: "text-accent-300 hover:text-accent-200",
        dotted: "border-paper/[0.22]",
        todayRow: "bg-paper/[0.07]",
        tag: "bg-accent-600 text-white",
        barTrack: "bg-paper/[0.12]",
        barOpen: "bg-accent-400",
        barToday: "bg-accent-200",
        note: "bg-paper/[0.06]",
        cta: "bg-accent-600 text-white hover:bg-accent-700",
        map: "bg-ink",
        mapLine: "oklch(0.95 0.004 95 / .07)",
        mapRoad: "bg-paper/[0.09]",
        pin: "text-accent-300",
        mapPlate: "bg-paper text-ink",
      };
    case "accent":
      return {
        root: "bg-accent-900 text-paper",
        hairline: "border-paper/20",
        kicker: "text-paper/85",
        link: "text-paper hover:text-white",
        dotted: "border-paper/[0.28]",
        todayRow: "bg-paper/[0.09]",
        tag: "bg-paper text-accent-900",
        barTrack: "bg-paper/[0.16]",
        barOpen: "bg-[oklch(0.9_0.06_145)]",
        barToday: "bg-paper",
        note: "bg-paper/[0.08]",
        cta: "bg-paper text-accent-900 hover:bg-white",
        map: "bg-accent-900",
        mapLine: "oklch(0.96 0.01 95 / .08)",
        mapRoad: "bg-paper/10",
        pin: "text-[oklch(0.92_0.06_145)]",
        mapPlate: "bg-paper text-accent-900",
      };
    default:
      return {
        root: "bg-paper text-ink",
        hairline: "border-line",
        kicker: "text-accent-700",
        link: "text-accent-700 hover:text-accent-800",
        dotted: "border-neutral-300",
        todayRow: "bg-accent-100",
        tag: "bg-accent text-white",
        barTrack: "bg-neutral-200",
        barOpen: "bg-accent-500",
        barToday: "bg-accent",
        note: "bg-neutral-100",
        cta: "bg-accent text-white hover:bg-accent-700",
        map: "bg-neutral-200",
        mapLine: "oklch(0.26 0.012 70 / .07)",
        mapRoad: "bg-ink/[0.08]",
        pin: "text-accent",
        mapPlate: "bg-ink text-paper",
      };
  }
}

function statusStyle(key: StatusKey, scheme: HoursScheme) {
  const paper = scheme === "paper";
  switch (key) {
    case "open":
      return paper
        ? "bg-[oklch(0.94_0.04_150)] text-[oklch(0.4_0.09_150)]"
        : "bg-paper/[0.12] text-[oklch(0.88_0.08_148)]";
    case "soon":
      return paper
        ? "bg-[oklch(0.96_0.05_82)] text-[oklch(0.48_0.1_70)]"
        : "bg-paper/[0.12] text-[oklch(0.88_0.09_82)]";
    default:
      return paper ? "bg-neutral-200 text-muted" : "bg-paper/10 text-paper/[0.82]";
  }
}

/* ───────────────────────────── pieces ───────────────────────────── */

function StatusPill({
  status,
  scheme,
  className = "",
}: {
  status: StatusResult;
  scheme: HoursScheme;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-2.5 rounded-full px-4 py-2.5 ${statusStyle(status.key, scheme)} ${className}`}
    >
      <span
        className={`size-2 rounded-full bg-current ${
          status.key === "open" ? "animate-pulse-soft motion-reduce:animate-none" : ""
        }`}
      />
      <span className="whitespace-nowrap text-[13.5px] font-semibold">{status.label}</span>
    </span>
  );
}

function TodayTag({ t }: { t: Tokens }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-2 py-[3px] text-[10px] font-semibold ${t.tag}`}>
      اليوم
    </span>
  );
}

function SeasonalNote({ note, t, className = "" }: { note: string; t: Tokens; className?: string }) {
  return (
    <span className={`flex items-start gap-2.5 rounded p-4 text-[13px] leading-[1.7] ${t.note} ${className}`}>
      <svg viewBox="0 0 16 16" fill="none" className="mt-[3px] size-[15px] shrink-0 opacity-70" aria-hidden>
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 7v4M8 5h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="opacity-[0.82]">{note}</span>
    </span>
  );
}

/** Schematic map plate — no API key. Becomes a real link when mapsUrl is set. */
function MapPlate({ t, mapsUrl }: { t: Tokens; mapsUrl?: string }) {
  const Tag = (mapsUrl ? "a" : "div") as "a";
  return (
    <Tag
      {...(mapsUrl ? { href: mapsUrl, target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label="الاتجاهات على الخريطة"
      className={`relative block h-[200px] overflow-hidden rounded-[3px] md:h-[250px] ${t.map}`}
    >
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${t.mapLine} 1px, transparent 1px), linear-gradient(90deg, ${t.mapLine} 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }}
      />
      <span aria-hidden className={`absolute inset-x-0 top-[38%] h-3 ${t.mapRoad}`} />
      <span aria-hidden className={`absolute inset-y-0 start-[36%] w-3 ${t.mapRoad}`} />
      <span aria-hidden className={`absolute start-[36%] top-[38%] -translate-y-full translate-x-1/2 ${t.pin}`}>
        <svg viewBox="0 0 16 16" fill="currentColor" className="size-7">
          <path d="M8 15s5-5 5-8.2A5 5 0 0 0 8 1.8 5 5 0 0 0 3 6.8C3 10 8 15 8 15z" />
        </svg>
      </span>
      {mapsUrl && (
        <span
          className={`absolute bottom-3 start-3 inline-flex items-center gap-2 whitespace-nowrap rounded-[3px] px-3.5 py-[9px] text-[13px] font-semibold ${t.mapPlate}`}
        >
          <svg viewBox="0 0 16 16" fill="none" className="size-3.5 -scale-x-100" aria-hidden>
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          الاتجاهات على الخريطة
        </span>
      )}
    </Tag>
  );
}

const Arrow = () => (
  <svg viewBox="0 0 16 16" fill="none" className="size-[15px] -scale-x-100" aria-hidden>
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className="size-4">
    <path d="M8 1.5a6.5 6.5 0 0 0-5.6 9.8L1.5 14.5l3.4-.9A6.5 6.5 0 1 0 8 1.5z" />
  </svg>
);

interface DayView {
  name: string;
  short: string;
  time: string;
  isToday: boolean;
  closed: boolean;
  barStart: string;
  barWidth: string;
}

/** Shared day list — used by A, B and D. */
function DayList({
  days,
  t,
  showLeaders,
  dense,
}: {
  days: DayView[];
  t: Tokens;
  showLeaders: boolean;
  dense?: boolean;
}) {
  return (
    <>
      {days.map((d) => (
        <div
          key={d.name}
          className={`flex items-baseline gap-3 border-b ${t.hairline} ${
            dense ? "py-3" : "py-3.5 md:py-4"
          } ${d.isToday ? `-mx-3 px-3 ${t.todayRow}` : ""}`}
        >
          <span
            className={`min-w-[72px] md:min-w-[96px] ${dense ? "text-sm" : "text-[14.5px] md:text-[15.5px]"} ${
              d.isToday ? "font-bold" : "font-normal"
            }`}
          >
            {d.name}
          </span>
          {d.isToday && <TodayTag t={t} />}
          {showLeaders && (
            <span
              aria-hidden
              className={`hidden min-w-[24px] flex-[1_0_24px] border-b border-dotted md:block ${t.dotted}`}
            />
          )}
          <span
            className={`whitespace-nowrap font-serif ${dense ? "ms-auto text-[15px] md:ms-0" : "text-[15px] md:text-[17px]"} ${
              d.closed ? "opacity-[0.45]" : d.isToday ? "opacity-100" : "opacity-[0.85]"
            }`}
          >
            {d.time}
          </span>
        </div>
      ))}
    </>
  );
}

/* ──────────────────────────── component ──────────────────────────── */

export default function HoursUniversal({
  variant = "A",
  scheme = "paper",
  schedule = defaultSchedule,
  content,
  showStatus = true,
  highlightToday = true,
  showSeasonalNote = true,
  className,
}: HoursUniversalProps) {
  const c: HoursContent = { ...defaultHoursContent, ...content };
  const t = tokensFor(scheme);
  const now = useShopNow();

  const status = evaluateStatus(schedule, now);
  const days = buildDays(schedule, now ? now.jsDay : -1, highlightToday);
  const today = days.find((d) => d.isToday);

  const note = showSeasonalNote && c.seasonalNote ? c.seasonalNote : null;
  const waHref = c.whatsapp
    ? `https://wa.me/${c.whatsapp}?text=${encodeURIComponent("مرحبًا، أريد السؤال عن موعد اليوم")}`
    : "#contact";

  return (
    <section
      dir="rtl"
      className={`px-[22px] py-[30px] md:px-[52px] md:pb-11 md:pt-[58px] ${t.root} ${className ?? ""}`}
    >
      {/* ── head ── */}
      <div
        className={`mb-[22px] flex flex-wrap items-end justify-between gap-6 border-b pb-[22px] md:mb-8 md:pb-7 ${t.hairline}`}
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
        {/* B renders its own large status block. Everywhere else the pill stays. */}
        {showStatus && variant !== "B" && <StatusPill status={status} scheme={scheme} />}
      </div>

      {/* ── A — schedule table ── */}
      {variant === "A" && (
        <div className="flex max-w-full flex-col md:max-w-[620px]">
          <DayList days={days} t={t} showLeaders />
          {note && <SeasonalNote note={note} t={t} className="mt-5" />}
        </div>
      )}

      {/* ── B — big live status ── */}
      {variant === "B" && (
        <div className="grid grid-cols-1 items-start gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-[52px]">
          <div className="flex flex-col gap-[18px]">
            {showStatus && <StatusPill status={status} scheme={scheme} />}
            <span className="max-w-[20ch] font-display text-[28px] font-extrabold leading-[1.25] -tracking-[0.03em] text-balance md:text-[clamp(30px,3.2vw,44px)]">
              {status.line}
            </span>
            {today && (
              <div className={`flex items-baseline gap-3 border-t pt-3.5 ${t.hairline}`}>
                <span className="text-[12.5px] opacity-60">اليوم</span>
                <span className="font-serif text-[26px] leading-none md:text-[34px]">{today.time}</span>
              </div>
            )}
            <span className="max-w-[40ch] text-[13.5px] leading-[1.8] opacity-70 text-pretty">
              آخر موعد يُقبل قبل الإغلاق بنصف ساعة. للحجز المسبق راسلنا على واتساب.
            </span>
            <a
              href={waHref}
              className={`inline-flex h-12 w-fit items-center justify-center gap-2.5 whitespace-nowrap rounded-[3px] px-[22px] font-display text-[14.5px] font-bold transition-colors ${t.cta}`}
            >
              <WhatsAppIcon />
              {c.bookLabel}
            </a>
          </div>

          <div className="flex flex-col">
            <DayList days={days} t={t} showLeaders={false} dense />
            {note && <SeasonalNote note={note} t={t} className="mt-[18px]" />}
          </div>
        </div>
      )}

      {/* ── C — week columns ── */}
      {variant === "C" && (
        <div className="flex flex-col gap-[22px]">
          <div className="grid grid-cols-7 gap-[5px] md:gap-2.5">
            {days.map((d, i) => (
              <div
                key={d.name}
                className={`flex flex-col items-center gap-2.5 rounded-[3px] px-1 py-2.5 text-center md:px-2.5 md:py-3.5 ${
                  d.isToday ? t.todayRow : ""
                } animate-rise motion-reduce:animate-none`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className={`whitespace-nowrap text-[11px] md:text-[13px] ${d.isToday ? "font-bold" : "font-normal"}`}>
                  {d.short}
                </span>
                {/* bar position/width map the real opening span across a 24h track */}
                <span className={`relative block h-[5px] w-full overflow-hidden rounded-sm md:h-[7px] ${t.barTrack}`}>
                  <span
                    className={`absolute inset-y-0 origin-right rounded-sm animate-grow-x motion-reduce:animate-none ${
                      d.isToday ? t.barToday : t.barOpen
                    }`}
                    style={{ insetInlineStart: d.barStart, width: d.barWidth, animationDelay: `${i * 60}ms` }}
                  />
                </span>
                <span
                  className={`font-serif text-[10.5px] leading-[1.4] md:text-[12.5px] ${
                    d.closed ? "opacity-[0.45]" : d.isToday ? "opacity-100" : "opacity-[0.85]"
                  }`}
                >
                  {d.time}
                </span>
              </div>
            ))}
          </div>
          <div className={`flex flex-wrap items-center justify-between gap-4 border-t pt-4 ${t.hairline}`}>
            <span className="flex flex-wrap items-center gap-4 text-xs opacity-[0.62]">
              <span className="inline-flex items-center gap-[7px]">
                <span className={`h-1.5 w-3.5 rounded-sm ${t.barOpen}`} />
                ساعات العمل
              </span>
              <span className="inline-flex items-center gap-[7px]">
                <span className={`h-1.5 w-3.5 rounded-sm ${t.barTrack}`} />
                مغلق
              </span>
            </span>
            {note && <span className="text-[12.5px] opacity-[0.62]">{note}</span>}
          </div>
        </div>
      )}

      {/* ── D — schedule + address ── */}
      {variant === "D" && (
        <div className="grid grid-cols-1 gap-[30px] md:grid-cols-2 md:gap-[52px]">
          <div className="flex flex-col">
            <span className={`mb-3.5 text-xs font-semibold tracking-[0.06em] ${t.kicker}`}>الجدول الأسبوعي</span>
            <DayList days={days} t={t} showLeaders dense />
          </div>

          <div className="flex flex-col gap-[18px]">
            <span className={`text-xs font-semibold tracking-[0.06em] ${t.kicker}`}>كيف تصل إلينا</span>
            <MapPlate t={t} mapsUrl={c.mapsUrl} />
            <div className="flex flex-col gap-3">
              {c.address && (
                <span className="flex items-start gap-2.5 text-sm leading-[1.7]">
                  <svg viewBox="0 0 16 16" fill="none" className="mt-1 size-[15px] shrink-0 opacity-60" aria-hidden>
                    <path d="M8 14s4.5-4 4.5-7A4.5 4.5 0 0 0 8 2.5 4.5 4.5 0 0 0 3.5 7c0 3 4.5 7 4.5 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    <circle cx="8" cy="7" r="1.4" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                  <span className="text-pretty">{c.address}</span>
                </span>
              )}
              {c.phone && (
                <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="flex items-center gap-2.5 text-sm text-current">
                  <span className="shrink-0 opacity-60">
                    <WhatsAppIcon />
                  </span>
                  <span dir="ltr" className="font-mono text-[13px]">
                    {c.phone}
                  </span>
                </a>
              )}
              {note && <SeasonalNote note={note} t={t} className="mt-1" />}
            </div>
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
