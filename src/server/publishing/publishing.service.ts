// Publishing business logic (AGENT_GUIDE §7). Publish requires publish
// permission AND an active subscription. Snapshots are append-only; rollback is
// a NEW snapshot copying an old payload.

import type { SessionClaims } from "@/server/access/access.rules";
import { requireSitePublish } from "@/server/sites/sites.service";
import { computeSubscriptionStatus } from "@/server/billing/billing.rules";
import { canPublish, nextSnapshotVersion } from "./publishing.rules";
import { errors } from "@/shared/errors";
import { publishingRepository } from "./publishing.repository";

function subscriptionStatusNow(
  subscription: { expiry: Date } | null,
): "active" | "grace" | "suspended" | null {
  if (!subscription) return null;
  return computeSubscriptionStatus(subscription.expiry, new Date());
}

export async function publishSite(claims: SessionClaims, siteId: string) {
  await requireSitePublish(claims, siteId);

  const subscription = await publishingRepository.getSubscription(siteId);
  const gate = canPublish(
    { canPublish: true }, // permission already checked by requireSitePublish
    subscriptionStatusNow(subscription),
  );
  if (!gate.ok) {
    if (gate.reason === "no_active_subscription") {
      throw errors.subscriptionRequired("النشر يتطلب اشتراكًا نشطًا");
    }
    throw errors.forbidden("لا تملك صلاحية النشر");
  }

  const payload = await publishingRepository.buildPayload(siteId);
  if (!payload) throw errors.notFound("الموقع غير موجود");

  const version = nextSnapshotVersion(
    await publishingRepository.latestVersion(siteId),
  );
  const snapshot = await publishingRepository.createSnapshot(
    siteId,
    version,
    payload,
    claims.userId,
  );
  await publishingRepository.markPublished(siteId);

  return { version: snapshot.version, snapshotId: snapshot.id };
}

export async function listSnapshots(claims: SessionClaims, siteId: string) {
  await requireSitePublish(claims, siteId);
  return publishingRepository.listSnapshots(siteId);
}

export async function rollback(
  claims: SessionClaims,
  siteId: string,
  snapshotId: string,
) {
  await requireSitePublish(claims, siteId);
  const old = await publishingRepository.getSnapshot(siteId, snapshotId);
  if (!old) throw errors.notFound("النسخة غير موجودة");

  // Rollback = a NEW, higher version copying the old payload (append-only).
  const version = nextSnapshotVersion(
    await publishingRepository.latestVersion(siteId),
  );
  const snapshot = await publishingRepository.createSnapshot(
    siteId,
    version,
    old.payload,
    claims.userId,
  );
  await publishingRepository.markPublished(siteId);
  return { version: snapshot.version, snapshotId: snapshot.id, rolledBackFrom: snapshotId };
}
