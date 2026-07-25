// Opening-hours validation (SiteSettings.openingHours). Structured data, per the
// "structured content over free text" principle (AGENT_GUIDE §9), so it can feed
// schema.org LocalBusiness output. Pure validation — no DB.

export const WEEKDAYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

/** One day: either closed, or an open/close time in "HH:MM" (24h). */
export type DayHours =
  | { closed: true }
  | { closed?: false; open: string; close: string };

export type OpeningHours = Partial<Record<Weekday, DayHours>>;

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

export type HoursError =
  | { day: Weekday; error: "bad_time" | "close_not_after_open" };

/**
 * Validate an opening-hours map. Missing days are allowed (treated as
 * unspecified). For open days, both times must be valid "HH:MM" and close must
 * be strictly after open (no overnight spans in v1).
 */
export function validateOpeningHours(
  hours: OpeningHours,
): { ok: true } | { ok: false; errors: HoursError[] } {
  const errors: HoursError[] = [];

  for (const day of WEEKDAYS) {
    const entry = hours[day];
    if (!entry) continue; // unspecified
    if (entry.closed) continue; // closed all day

    const { open, close } = entry;
    if (!isValidTime(open) || !isValidTime(close)) {
      errors.push({ day, error: "bad_time" });
      continue;
    }
    if (toMinutes(close) <= toMinutes(open)) {
      errors.push({ day, error: "close_not_after_open" });
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
