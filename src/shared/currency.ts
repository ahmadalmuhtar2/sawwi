// Site-wide currency for a customer's prices (services, price lists, booking) —
// distinct from billing currency (that's the reseller's subscription). One
// currency per site, chosen in onboarding step 4 or the settings "services" tab,
// so every price renders with the SAME unit and Arabic-Indic digits regardless of
// what was typed into each service.

export type SiteCurrency = "SYP" | "SYP_NEW" | "USD" | "EUR" | "TRY";

export interface CurrencyDef {
  key: SiteCurrency;
  /** Arabic name shown in the picker. */
  label: string;
  /** Symbol appended to every price on the site. */
  symbol: string;
}

export const CURRENCIES: CurrencyDef[] = [
  { key: "SYP", label: "ليرة سورية (ل.س)", symbol: "ل.س" },
  { key: "SYP_NEW", label: "ليرة سورية جديدة (ل.س.ج)", symbol: "ل.س.ج" },
  { key: "USD", label: "دولار أمريكي ($)", symbol: "$" },
  { key: "EUR", label: "يورو (€)", symbol: "€" },
  { key: "TRY", label: "ليرة تركية (₺)", symbol: "₺" },
];

export const DEFAULT_CURRENCY: SiteCurrency = "SYP";

/** The currency keys as a tuple — the single source for enums/validation
 *  (Prisma `Currency`, Zod schemas, pickers). Keep in sync with CURRENCIES. */
export const CURRENCY_KEYS = CURRENCIES.map((c) => c.key) as [SiteCurrency, ...SiteCurrency[]];

export function getCurrency(key?: string | null): CurrencyDef {
  return CURRENCIES.find((c) => c.key === key) ?? CURRENCIES[0];
}

export const symbolOf = (key?: string | null): string => getCurrency(key).symbol;

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
/** Convert any Latin digits in a string to Arabic-Indic (٠-٩); other chars pass through. */
export const toArabicDigits = (s: string): string => s.replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);

/**
 * The numeric value of a price string, for summing in the order cart. Reads
 * both Arabic-Indic and Latin digits, ignores currency tokens, thousands
 * separators (٬ ,) and any other text. Returns null when the price carries no
 * number (e.g. "حسب الطلب") — such an item can't be added to a running total.
 */
export function priceNumber(raw: string | null | undefined): number | null {
  const latin = (raw ?? "").replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
  const digits = latin.replace(/[^\d]/g, ""); // drop separators, currency, spaces
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

/**
 * Format a computed integer amount (e.g. a cart total) as Arabic-Indic digits
 * with thousands separators (٦٥٬٠٠٠) — no currency symbol; the caller appends
 * the site's unit so it matches every other price on the page.
 */
export function formatArabicAmount(n: number): string {
  const grouped = Math.round(n).toLocaleString("en-US"); // "65,000"
  return toArabicDigits(grouped).replace(/,/g, "٬");
}

/**
 * Format any number for display in Arabic: Arabic-Indic digits, an Arabic
 * thousands separator (٬) and an Arabic decimal separator (٫) — e.g. 120000 →
 * "١٢٠٬٠٠٠", 12.5 → "١٢٫٥". A value that is NOT a plain number (already has a
 * unit, Arabic digits, or is free text like "بنزين") is passed through with only
 * its digits localized, so it's safe as a drop-in wherever a spec may be text.
 * Note: do NOT use this for years — a year would wrongly gain a separator (٢٬٠٢٣).
 */
export function formatArabicNumber(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v).trim();
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const [int, dec] = s.split(".");
    const grouped = Number(int).toLocaleString("en-US");
    return toArabicDigits(dec ? `${grouped}.${dec}` : grouped).replace(/,/g, "٬").replace(/\./g, "٫");
  }
  return toArabicDigits(s);
}

// Any currency token a user might have typed into a price, so we can strip it and
// re-append the site's chosen symbol — this is what makes every service share one
// currency even if they were entered inconsistently. Longest variants first.
const CURRENCY_TOKENS =
  /ل\s*\.?\s*س\s*\.?\s*ج|ل\s*\.?\s*س|ليرة سورية جديدة|ليرة سورية|ليرة تركية|دولار(?:\s*أمريكي)?|يورو|USD|SYP|EUR|TRY|[$€₺]/gi;

/**
 * Format a raw price for display: strip any currency the user typed, convert
 * digits to Arabic-Indic, and append the site's currency symbol. A price with no
 * number (e.g. "حسب الطلب") is returned as-is (digits localized, no symbol), so a
 * "call for a quote" price never gets a stray unit.
 */
export function formatPrice(raw: string | null | undefined, currencyKey?: string | null): string {
  const amount = priceAmount(raw);
  if (!amount) return "";
  const hasNumber = /[٠-٩]/.test(amount);
  return hasNumber ? `${amount} ${symbolOf(currencyKey)}`.trim() : amount;
}

/**
 * The price amount alone — currency stripped, digits localized, no symbol. Use
 * where the symbol is rendered separately (e.g. the booking summary appends it),
 * so a price already carrying a unit doesn't show it twice.
 */
export function priceAmount(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  const stripped = s.replace(CURRENCY_TOKENS, "").replace(/\s{2,}/g, " ").trim();
  return toArabicDigits(stripped || s);
}
