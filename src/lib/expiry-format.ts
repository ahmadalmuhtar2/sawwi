// Shared presentation helpers for subscription expiry (used by the owner banner
// and the الاشتراك page). Pure — safe on server and client.

export type ExpiryStatus = "active" | "expiring" | "expired";

/** Arabic label + Badge tone for a display status. */
export function expiryLabel(status: ExpiryStatus): { label: string; tone: "accent" | "warn" | "danger" } {
  switch (status) {
    case "active":
      return { label: "فعّال", tone: "accent" };
    case "expiring":
      return { label: "ينتهي قريبًا", tone: "warn" };
    case "expired":
      return { label: "منتهٍ", tone: "danger" };
  }
}

/** Gregorian date in Arabic with Arabic-Indic digits, e.g. ٢٩ يوليو ٢٠٢٦. */
export function formatArabicDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("ar-EG-u-nu-arab", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
