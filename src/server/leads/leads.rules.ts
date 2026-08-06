// Pure helpers for landing-page leads — no DB, no clock. The stateful rate-limit
// lives in the service (it needs DB counts); these are the deterministic bits.
// Anti-abuse primitives (IP hashing, honeypot, x-forwarded-for) are shared with
// the visitor-messages feature — reused here rather than duplicated.

export { hashIp, isHoneypotTripped, clientIpFromHeaders } from "@/server/messages/messages.rules";

/** Anti-abuse window + caps for the public lead-submit endpoint. */
export const LEAD_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const MAX_LEADS_PER_IP = 5; // per IP within the window
export const MAX_LEADS_GLOBAL = 80; // across all IPs within the window (flood guard)

/**
 * Normalize a Syrian WhatsApp number to `963XXXXXXXXX` (963 + 9 national digits),
 * or null when it isn't a valid 9-digit Syrian mobile. Strips spaces/punctuation,
 * a leading 0, and a redundant 963/00963 prefix — matching the landing form's
 * own client check so server and client agree.
 */
export function normalizeSyrianWhatsapp(raw: string): string | null {
  const national = raw
    .replace(/\D/g, "")
    .replace(/^00963/, "")
    .replace(/^963/, "")
    .replace(/^0+/, "");
  return national.length === 9 ? `963${national}` : null;
}
