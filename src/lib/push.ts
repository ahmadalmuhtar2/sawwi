// Web Push transport (server-only). Configures web-push with the VAPID keypair
// from env and exposes a guarded sender. Push is OPTIONAL: when the VAPID vars
// aren't set, isPushConfigured() is false and callers skip sending — the app runs
// fine without it (same pattern as R2 storage).

import webpush from "web-push";
import { getEnv } from "./env";

export interface PushKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
}

let configured: boolean | null = null;

export function isPushConfigured(): boolean {
  if (configured !== null) return configured;
  const env = getEnv();
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT || "mailto:info@sawwi.online",
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
    );
    configured = true;
  } else {
    configured = false;
  }
  return configured;
}

/** The public VAPID key the client needs to subscribe (server-read fallback). */
export function vapidPublicKey(): string | undefined {
  return getEnv().VAPID_PUBLIC_KEY;
}

export type PushSendResult = "sent" | "expired" | "error" | "skipped";

/**
 * Send one push message. Returns "expired" for a 404/410 (the subscription is
 * dead and the caller should delete it), "sent" on success, "error" otherwise,
 * "skipped" when push isn't configured. Never throws.
 */
export async function sendPush(sub: PushKeys, payload: PushPayload): Promise<PushSendResult> {
  if (!isPushConfigured()) return "skipped";
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 3600 },
    );
    return "sent";
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    return status === 404 || status === 410 ? "expired" : "error";
  }
}
