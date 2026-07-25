// Renewal reminders: email the reseller (workspace owner) at 7 / 3 / 1 days
// before each site's expiry. Idempotent per threshold via Subscription.
// lastReminderDay (reset whenever the expiry is extended). Runs from the BullMQ
// billing worker (daily) and from POST /api/cron/renewal-alerts.

import { sendMail } from "@/lib/mailer";
import { buildEmail } from "@/constants/emails";
import { logger } from "@/lib/logger";
import { daysUntil, dueRenewalAlert } from "./billing.rules";
import { billingRepository } from "./billing.repository";

const DAY = 24 * 60 * 60 * 1000;

function formatDate(d: Date): string {
  try {
    return new Intl.DateTimeFormat("ar-SY", { dateStyle: "long" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/**
 * Scan due subscriptions and email the owner for any threshold not yet sent for
 * the current expiry. Returns how many were scanned / emailed.
 */
export async function runRenewalAlerts(): Promise<{ scanned: number; sent: number }> {
  const now = new Date();
  const until = new Date(now.getTime() + Math.max(...[7, 3, 1]) * DAY);
  const subs = await billingRepository.listDueForReminder(now, until);
  const base = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

  let sent = 0;
  for (const sub of subs) {
    const threshold = dueRenewalAlert(sub.expiry, now);
    if (!threshold) continue;
    // Only fire a MORE urgent threshold than the last one already sent.
    if (sub.lastReminderDay != null && threshold >= sub.lastReminderDay) continue;

    const owner = sub.site.workspace.members[0]?.user;
    if (!owner?.email) continue; // no owner to notify — retry next run

    try {
      await sendMail({
        to: owner.email,
        ...buildEmail("expiryReminder", {
          businessName: sub.site.businessName,
          daysLeft: Math.max(0, daysUntil(sub.expiry, now)),
          stopDate: formatDate(sub.expiry),
          url: `${base}/dashboard/billing`,
        }),
      });
      await billingRepository.markReminder(sub.id, threshold);
      sent++;
    } catch (err) {
      logger.error(
        { subId: sub.id, err: err instanceof Error ? err.message : String(err) },
        "renewal reminder failed",
      );
    }
  }

  logger.info({ scanned: subs.length, sent }, "renewal alerts run");
  return { scanned: subs.length, sent };
}
