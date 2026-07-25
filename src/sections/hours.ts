// Live "open now / closed" status derived from a site's working hours. Computed
// in the shop's local timezone (Syria → Asia/Damascus) so it's correct wherever
// the server runs. Pure + universal (Intl + Date) — safe on server and client.

import type { SiteRenderData } from "./types";

type Hours = NonNullable<SiteRenderData["settings"]["openingHours"]>;

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export const toArabicDigits = (s: string) => s.replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);

const SHOP_TZ = "Asia/Damascus";

/** Current weekday key (sat…fri) + minutes-since-midnight in the shop timezone. */
function nowInShop(): { dayKey: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TZ,
    hour12: false,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const dayKey = get("weekday").toLowerCase().slice(0, 3); // "Sat" → "sat"
  let hour = Number.parseInt(get("hour"), 10);
  if (hour === 24) hour = 0; // some runtimes emit 24 for midnight
  const minute = Number.parseInt(get("minute"), 10);
  return { dayKey, minutes: hour * 60 + minute };
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map((x) => Number.parseInt(x, 10));
  return h * 60 + m;
};

type OpenDay = { open: string; close: string };

/**
 * A day counts as OPEN only when it has real open/close times AND isn't flagged
 * closed. NOTE: we must check `closed === true`, not `"closed" in h` — a day
 * saved as `{ closed: false, open, close }` has the key but is still open, and
 * the naive `in` check silently dropped every such day (empty hours everywhere).
 */
function openDay(h: unknown): h is OpenDay {
  if (!h || typeof h !== "object") return false;
  const d = h as { closed?: unknown; open?: unknown; close?: unknown };
  return d.closed !== true && typeof d.open === "string" && typeof d.close === "string" && d.open !== d.close;
}

/** Format "22:00" → "١٠ مساءً" (12-hour, Arabic-Indic digits). */
function formatTime(t: string): string {
  const [h, m] = t.split(":").map((x) => Number.parseInt(x, 10));
  const period = h < 12 ? "صباحًا" : "مساءً";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const label = m ? `${h12}:${String(m).padStart(2, "0")}` : `${h12}`;
  return `${toArabicDigits(label)} ${period}`;
}

export interface OpenStatus {
  open: boolean;
  label: string;
}

/**
 * Open/closed status for right now, or null if no hours are configured (caller
 * hides the indicator). Assumes same-day close (close > open).
 */
export function openStatus(hours?: Hours | null): OpenStatus | null {
  if (!hours || Object.keys(hours).length === 0) return null;
  const { dayKey, minutes } = nowInShop();
  const today = hours[dayKey];

  if (openDay(today)) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (minutes >= open && minutes < close) {
      return { open: true, label: `مفتوح الآن · حتى ${formatTime(today.close)}` };
    }
    if (minutes < open) {
      return { open: false, label: `مغلق الآن · يفتح ${formatTime(today.open)}` };
    }
  }
  return { open: false, label: "مغلق الآن" };
}

const DAY_ORDER = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"] as const;
const AR_DAYS: Record<string, string> = {
  sat: "السبت", sun: "الأحد", mon: "الاثنين", tue: "الثلاثاء",
  wed: "الأربعاء", thu: "الخميس", fri: "الجمعة",
};

export interface HoursRow {
  days: string;
  time: string;
}

/**
 * Group a week of opening hours into compact rows for the footer — consecutive
 * days with identical times collapse into a range ("السبت – الخميس"). Closed days
 * break a range and are omitted.
 */
export function groupedHours(hours?: Hours | null): HoursRow[] {
  if (!hours) return [];
  const rows: HoursRow[] = [];
  let i = 0;
  while (i < DAY_ORDER.length) {
    const h = hours[DAY_ORDER[i]];
    if (!openDay(h)) {
      i++;
      continue;
    }
    const time = `${toArabicDigits(h.open)} – ${toArabicDigits(h.close)}`;
    let j = i;
    while (j + 1 < DAY_ORDER.length) {
      const nh = hours[DAY_ORDER[j + 1]];
      if (openDay(nh) && `${toArabicDigits(nh.open)} – ${toArabicDigits(nh.close)}` === time) j++;
      else break;
    }
    rows.push({
      days: i === j ? AR_DAYS[DAY_ORDER[i]] : `${AR_DAYS[DAY_ORDER[i]]} – ${AR_DAYS[DAY_ORDER[j]]}`,
      time,
    });
    i = j + 1;
  }
  return rows;
}
