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

export function getCurrency(key?: string | null): CurrencyDef {
  return CURRENCIES.find((c) => c.key === key) ?? CURRENCIES[0];
}

export const symbolOf = (key?: string | null): string => getCurrency(key).symbol;

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
/** Convert any Latin digits in a string to Arabic-Indic (٠-٩); other chars pass through. */
export const toArabicDigits = (s: string): string => s.replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);

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
