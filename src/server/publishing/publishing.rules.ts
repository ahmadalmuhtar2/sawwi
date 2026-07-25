// Publishing gate & snapshot versioning (AGENT_GUIDE §7, PRD §4.4).
// Publish requires BOTH permission to publish the site AND an active
// subscription. Snapshots are append-only with an incrementing version.

import type { SitePermissions } from "@/server/access/access.rules";
import { canPublishWithSubscription } from "@/server/billing/billing.rules";
import type { SubscriptionStatus } from "@/shared/domain";

export type PublishBlockReason = "not_permitted" | "no_active_subscription";

/**
 * Decide whether a publish may proceed. `subscriptionStatus` is null when the
 * site has never had a subscription (drafts are free but cannot publish).
 */
export function canPublish(
  permissions: Pick<SitePermissions, "canPublish">,
  subscriptionStatus: SubscriptionStatus | null,
): { ok: true } | { ok: false; reason: PublishBlockReason } {
  if (!permissions.canPublish) return { ok: false, reason: "not_permitted" };
  if (
    subscriptionStatus === null ||
    !canPublishWithSubscription(subscriptionStatus)
  ) {
    return { ok: false, reason: "no_active_subscription" };
  }
  return { ok: true };
}

/**
 * Next snapshot version. Versions start at 1 and only ever increase — even a
 * rollback creates a NEW, higher version copying an old payload (PRD §4.4).
 */
export function nextSnapshotVersion(latestVersion: number | null): number {
  if (latestVersion === null) return 1;
  if (!Number.isInteger(latestVersion) || latestVersion < 0) {
    throw new RangeError("latestVersion must be a non-negative integer or null");
  }
  return latestVersion + 1;
}
