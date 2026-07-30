// Pure helpers for visitor messages — no DB, no clock. The stateful rate-limit
// itself lives in the service (it needs DB counts); these are the deterministic
// bits it composes.

import { createHash } from "node:crypto";

/** Anti-abuse window + caps for the public submit endpoint. */
export const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
export const MAX_PER_IP = 5; // per (site, IP) within the window
export const MAX_PER_SITE = 20; // per site within the window (flood guard)

/**
 * Coarse, non-reversible IP fingerprint. Stored only as an abuse signal (rate
 * limiting) — never the raw IP, so it isn't retained PII. Returns null when the
 * IP is unknown (rate limiting then falls back to the per-site cap).
 */
export function hashIp(ip: string | null | undefined): string | null {
  const trimmed = ip?.trim();
  if (!trimmed) return null;
  return createHash("sha256").update(trimmed).digest("hex").slice(0, 16);
}

/** The hidden honeypot field was filled → almost certainly a bot. */
export function isHoneypotTripped(value: string | undefined | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * First client IP from an `x-forwarded-for` chain (Caddy sets it in prod). The
 * left-most entry is the original client; the rest are proxies.
 */
export function clientIpFromHeaders(headers: Headers): string | null {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || null;
  return headers.get("x-real-ip");
}
