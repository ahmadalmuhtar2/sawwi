// Pure/infra rules for submissions: Syrian phone normalization to E.164, the
// honeypot check, and the Redis-backed per-IP rate limiter (5/hour, per the spec).

import { getRedis } from "@/lib/redis";
import { clientIpFromHeaders, hashIp } from "@/server/leads/leads.rules";

export { clientIpFromHeaders, hashIp };

export const MAX_PER_HOUR = 5;
/** Image uploads are cheaper per-request than a full submission but must still be
 *  bounded — a visitor may attach a handful of photos per submission. */
export const MAX_UPLOADS_PER_HOUR = 30;
const WINDOW_SECONDS = 3600;

/** Normalize a Syrian mobile to E.164 `+9639XXXXXXXX`. Accepts 09XXXXXXXX,
 *  9639XXXXXXXX, +9639XXXXXXXX with spaces/dashes. Returns null if it isn't a
 *  valid Syrian mobile (9 national digits, leading 9). */
export function normalizeSubmissionPhone(raw: string): string | null {
  const national = String(raw)
    .replace(/\D/g, "")
    .replace(/^00963/, "")
    .replace(/^963/, "")
    .replace(/^0+/, "");
  // Syrian mobiles are 9 digits and start with 9.
  return /^9\d{8}$/.test(national) ? `+963${national}` : null;
}

/** A hidden field real users never fill; any value = a bot. */
export function isHoneypotTripped(company: string | undefined): boolean {
  return typeof company === "string" && company.trim().length > 0;
}

/** Redis sliding-ish window: INCR a per-(site,ip) key, expire after an hour.
 *  Returns true when the submission is ALLOWED. Fails OPEN (allows) if Redis is
 *  unreachable — we never lose a real submission to an infra blip. */
export async function withinRateLimit(siteId: string, ipHash: string | null): Promise<boolean> {
  return underLimit(`sub:rl:${siteId}:${ipHash}`, MAX_PER_HOUR, ipHash);
}

/** Per-(site,ip) hourly cap on submission image uploads. Same fail-open semantics. */
export async function withinUploadRateLimit(siteId: string, ipHash: string | null): Promise<boolean> {
  return underLimit(`sub:ul:${siteId}:${ipHash}`, MAX_UPLOADS_PER_HOUR, ipHash);
}

async function underLimit(key: string, max: number, ipHash: string | null): Promise<boolean> {
  if (!ipHash) return true; // can't identify the caller → don't block
  try {
    const redis = getRedis();
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, WINDOW_SECONDS);
    return n <= max;
  } catch {
    return true; // fail open
  }
}
