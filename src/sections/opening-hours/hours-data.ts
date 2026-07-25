// Server-safe data + pure logic for the Opening-Hours section. Kept OUT of the
// "use client" component so server code (library.tsx) imports the real values.
// The schedule comes from the site's SETTINGS; only the section's copy is edited.

export type HoursVariant = "A" | "B" | "C" | "D";
export type HoursScheme = "paper" | "dark" | "accent";

export interface DaySchedule {
  /** JS getDay(): 0=Sun … 6=Sat */
  js: number;
  name: string;
  /** short label for variant C's columns */
  short: string;
  /** minutes from midnight; open === close (or omitted) means closed */
  open?: number;
  close?: number;
}

export interface HoursContent {
  kicker: string;
  title: string;
  lede?: string;
  /** seasonal/Ramadan note — rendered in every variant when provided */
  seasonalNote?: string;
  address?: string;
  phone?: string;
  /** Google Maps URL from SiteSettings — makes the map plate a real link */
  mapsUrl?: string;
  footnote?: string;
  ctaLabel?: string;
  bookLabel?: string;
  /** digits only, e.g. "963112223344" */
  whatsapp?: string;
}

/* ───────────────────────── numerals + defaults ───────────────────────── */

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export const arInt = (n: number | string) =>
  String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
/** minutes-from-midnight → "٠٩:٣٠" */
export const hhmm = (mins: number) =>
  arInt(String(Math.floor(mins / 60)).padStart(2, "0")) +
  ":" +
  arInt(String(mins % 60).padStart(2, "0"));

const H = (h: number, m = 0) => h * 60 + m;
export const DAY_MIN = 24 * 60;

/** Week starts Saturday, Friday opens after prayer — the Syrian norm. */
export const defaultSchedule: DaySchedule[] = [
  { js: 6, name: "السبت", short: "سبت", open: H(9), close: H(22) },
  { js: 0, name: "الأحد", short: "أحد", open: H(9), close: H(22) },
  { js: 1, name: "الاثنين", short: "اثنين", open: H(9), close: H(22) },
  { js: 2, name: "الثلاثاء", short: "ثلاثاء", open: H(9), close: H(22) },
  { js: 3, name: "الأربعاء", short: "أربعاء", open: H(9), close: H(22) },
  { js: 4, name: "الخميس", short: "خميس", open: H(9), close: H(23) },
  { js: 5, name: "الجمعة", short: "جمعة", open: H(14), close: H(22) },
];

export const defaultHoursContent: HoursContent = {
  kicker: "متى نفتح",
  title: "أوقات العمل",
  lede: "نفتح كل يوم — والجمعة بعد الصلاة. آخر موعد يُقبل قبل الإغلاق بنصف ساعة.",
  seasonalNote: "في رمضان: من بعد الإفطار حتى الثانية بعد منتصف الليل.",
  footnote: "الأوقات قد تتغيّر في الأعياد والمناسبات — نعلن أي تغيير على إنستغرام قبل يومين.",
  ctaLabel: "اسأل عن موعد اليوم",
  bookLabel: "احجز موعدًا",
};

/* ─────────────────────── live open/closed evaluation ─────────────────────── */

export type StatusKey = "open" | "soon" | "closed" | "unknown";

export interface StatusResult {
  key: StatusKey;
  /** short pill label */
  label: string;
  /** full sentence for variant B */
  line: string;
}

/** The current moment in the shop's timezone — day-of-week + minutes since midnight. */
export interface ShopNow {
  jsDay: number;
  minutes: number;
}

export const isClosed = (d: DaySchedule) =>
  d.open == null || d.close == null || d.close <= d.open;

/** open / closing-soon / opening-soon / closed(+next opening) — computed against
 *  the shop clock passed in. `undefined` (SSR/first paint) → a neutral label. */
export function evaluateStatus(schedule: DaySchedule[], now?: ShopNow): StatusResult {
  if (!now) {
    return { key: "unknown", label: "أوقات العمل", line: "راجع الجدول أدناه" };
  }

  const { jsDay, minutes: mins } = now;
  const idxToday = schedule.findIndex((d) => d.js === jsDay);
  const today = idxToday >= 0 ? schedule[idxToday] : undefined;

  if (today && !isClosed(today)) {
    const open = today.open!;
    const close = today.close!;
    if (mins >= open && mins < close) {
      const left = close - mins;
      if (left <= 45) {
        return { key: "soon", label: "يُغلق قريبًا", line: `نُغلق بعد ${arInt(left)} دقيقة` };
      }
      return { key: "open", label: "مفتوح الآن", line: `مفتوح حتى ${hhmm(close)}` };
    }
    if (mins < open) {
      const wait = open - mins;
      if (wait <= 60) {
        return { key: "soon", label: "يفتح قريبًا", line: `نفتح بعد ${arInt(wait)} دقيقة` };
      }
      return { key: "closed", label: "مغلق الآن", line: `نفتح اليوم ${hhmm(open)}` };
    }
  }

  // after close, or closed today — find the next day that opens
  for (let step = 1; step <= schedule.length; step++) {
    const d = schedule[(Math.max(idxToday, 0) + step) % schedule.length];
    if (!isClosed(d)) {
      const when = step === 1 ? "غدًا" : `يوم ${d.name}`;
      return { key: "closed", label: "مغلق الآن", line: `نفتح ${when} ${hhmm(d.open!)}` };
    }
  }
  return { key: "closed", label: "مغلق", line: "راجع الجدول" };
}

export interface DayView {
  name: string;
  short: string;
  time: string;
  isToday: boolean;
  closed: boolean;
  /** % from the RTL start edge, and % width, over a 24h track */
  barStart: string;
  barWidth: string;
}

export function buildDays(
  schedule: DaySchedule[],
  jsDay: number,
  highlightToday: boolean,
): DayView[] {
  return schedule.map((d) => {
    const closed = isClosed(d);
    return {
      name: d.name,
      short: d.short,
      time: closed ? "مغلق" : `${hhmm(d.open!)} – ${hhmm(d.close!)}`,
      isToday: highlightToday && d.js === jsDay,
      closed,
      barStart: closed ? "0%" : `${((d.open! / DAY_MIN) * 100).toFixed(1)}%`,
      barWidth: closed ? "0%" : `${(((d.close! - d.open!) / DAY_MIN) * 100).toFixed(1)}%`,
    };
  });
}
