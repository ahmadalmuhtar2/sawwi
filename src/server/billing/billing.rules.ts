// Billing logic (AGENT_GUIDE §8, PRD §7). Annual cash subscriptions, recorded
// manually. Status flow: active -> grace (7d) -> suspended. Pure date/number
// functions — no DB, no clock (callers pass `now`).

import type { SubscriptionStatus } from "@/shared/domain";

export const GRACE_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Renewal reminder thresholds, in days before expiry: 1 week, 3 days, 1 day. */
export const RENEWAL_ALERT_DAYS = [7, 3, 1] as const;
export type RenewalAlertDay = (typeof RENEWAL_ALERT_DAYS)[number];

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/** Add whole calendar years, clamping Feb-29 -> Feb-28 on non-leap years. */
export function addYears(date: Date, years: number): Date {
  const d = new Date(date.getTime());
  const targetMonth = d.getUTCMonth();
  d.setUTCFullYear(d.getUTCFullYear() + years);
  // If the month rolled over (e.g. Feb 29 -> Mar 1), pull back to last day of
  // the intended month.
  if (d.getUTCMonth() !== targetMonth) {
    d.setUTCDate(0);
  }
  return d;
}

/**
 * Compute status from expiry and current time.
 * - now <= expiry              -> active
 * - expiry < now <= expiry+7d  -> grace
 * - otherwise                  -> suspended
 */
export function computeSubscriptionStatus(
  expiry: Date,
  now: Date,
): SubscriptionStatus {
  if (now.getTime() <= expiry.getTime()) return "active";
  if (now.getTime() <= addDays(expiry, GRACE_DAYS).getTime()) return "grace";
  return "suspended";
}

/**
 * Whether the site is publicly served. Active and grace are still live (grace
 * shows renewal reminders in-dashboard); suspended returns HTTP 402.
 */
export function isSiteLive(status: SubscriptionStatus): boolean {
  return status === "active" || status === "grace";
}

/** Whole days until expiry (negative once expired). Callers pass `now`. */
export function daysUntil(expiry: Date, now: Date): number {
  return Math.ceil((expiry.getTime() - now.getTime()) / MS_PER_DAY);
}

/**
 * Public serving gate (product decision: stop serving exactly on the expiry
 * date — no grace). A site is served only while paid-through.
 */
export function isServable(expiry: Date, now: Date): boolean {
  return now.getTime() <= expiry.getTime();
}

/** Dashboard-facing status: active / expiring (≤7 days) / expired. */
export type BillingDisplayStatus = "active" | "expiring" | "expired";
export function displayStatus(expiry: Date, now: Date): BillingDisplayStatus {
  const d = daysUntil(expiry, now);
  if (d < 0) return "expired";
  if (d <= 7) return "expiring";
  return "active";
}

/**
 * Whether NEW publishes are allowed. AGENT_GUIDE §8: "No active subscription ->
 * no publish." We read that strictly: only `active` may publish. (Grace can
 * still serve its last snapshot but cannot push new ones.) See BACKEND_DECISIONS.
 */
export function canPublishWithSubscription(status: SubscriptionStatus): boolean {
  return status === "active";
}

/**
 * New expiry after recording a payment. A payment always adds one year; if the
 * sub already lapsed we extend from `now`, otherwise we stack onto the current
 * expiry (AGENT_GUIDE §8: "+1 year and reactivates instantly").
 */
export function applyPayment(
  currentExpiry: Date,
  now: Date,
  years = 1,
): Date {
  const base =
    currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
  return addYears(base, years);
}

/**
 * Commission owed to the workspace for a payment, using the pct captured at
 * record time. Percentage is 0..100; result is rounded to 2 decimals.
 */
export function computeCommission(amount: number, pct: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(pct)) {
    throw new Error("amount and pct must be finite numbers");
  }
  if (amount < 0) throw new Error("amount must be >= 0");
  if (pct < 0 || pct > 100) throw new Error("pct must be within 0..100");
  return Math.round(amount * pct) / 100;
}

/**
 * Which renewal reminder (if any) is due now — the most urgent threshold whose
 * window the subscription has entered but not yet passed expiry. Returns null
 * when no reminder applies (already expired, or more than 14 days out).
 */
export function dueRenewalAlert(expiry: Date, now: Date): RenewalAlertDay | null {
  const msLeft = expiry.getTime() - now.getTime();
  if (msLeft < 0) return null; // expired: handled by grace/suspension, not reminders
  const daysLeft = Math.ceil(msLeft / MS_PER_DAY);
  // Check the most urgent (smallest) threshold first so 2 days left reports the
  // 3-day alert, not the 14-day one.
  const ascending = [...RENEWAL_ALERT_DAYS].sort((a, b) => a - b);
  for (const threshold of ascending) {
    if (daysLeft <= threshold) return threshold as RenewalAlertDay;
  }
  return null;
}
