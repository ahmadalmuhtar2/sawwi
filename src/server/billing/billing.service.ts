// Billing business logic. The reseller (workspace owner) owns billing: set/extend
// the paid-through date and record payments collected from the client. Each
// payment logs the workspace commission from commission_pct at record time.
// Site-scoped collaborators never reach these (canManageBilling is false).

import type { SessionClaims } from "@/server/access/access.rules";
import { requireSiteBilling, getSite } from "@/server/sites/sites.service";
import { sitesRepository } from "@/server/sites/sites.repository";
import { errors } from "@/shared/errors";
import {
  computeCommission,
  computeSubscriptionStatus,
  daysUntil,
  displayStatus,
} from "./billing.rules";
import type { RecordPaymentInput, SetExpiryInput } from "./billing.schema";
import { billingRepository } from "./billing.repository";

/** Set/extend the paid-through date without a payment (owner/admin). */
export async function setExpiry(
  claims: SessionClaims,
  siteId: string,
  input: SetExpiryInput,
) {
  await requireSiteBilling(claims, siteId);
  const sub = await billingRepository.setExpiry(siteId, input.expiry);
  return { expiry: sub.expiry, status: displayStatus(sub.expiry, new Date()) };
}

export async function recordPayment(
  claims: SessionClaims,
  siteId: string,
  input: RecordPaymentInput,
) {
  const site = await requireSiteBilling(claims, siteId);
  const workspace = await billingRepository.getWorkspace(site.workspaceId);
  if (!workspace) throw errors.notFound("مساحة العمل غير موجودة");

  const existing = await billingRepository.getSubscription(siteId);
  if (!existing && !input.newExpiry) {
    throw errors.validation("حدّد تاريخ انتهاء الاشتراك عند أول دفعة", {
      newExpiry: "اختر تاريخ انتهاء",
    });
  }
  // Keep the current paid-through date unless the reseller extends it.
  const newExpiry = input.newExpiry ?? existing!.expiry;
  const commissionAmount = computeCommission(input.amount, workspace.commissionPct);

  const result = await billingRepository.recordPayment({
    siteId,
    subscriptionId: existing?.id ?? null,
    newExpiry,
    amount: input.amount,
    currency: input.currency,
    method: input.method,
    payerName: input.payerName ?? null,
    note: input.note ?? null,
    collectedBy: claims.userId,
    workspaceId: site.workspaceId,
    pct: workspace.commissionPct,
    commissionAmount,
  });

  return {
    subscriptionId: result.subscription.id,
    expiry: result.subscription.expiry,
    paymentId: result.payment.id,
    commissionAmount,
  };
}

/** Full billing view for one site: subscription + payment history (owner/admin). */
export async function getSiteBilling(claims: SessionClaims, siteId: string) {
  await requireSiteBilling(claims, siteId);
  const [subscription, payments] = await Promise.all([
    billingRepository.getSubscription(siteId),
    billingRepository.listPayments(siteId),
  ]);
  const now = new Date();
  return {
    subscription: subscription
      ? {
          expiry: subscription.expiry,
          status: displayStatus(subscription.expiry, now),
          daysLeft: daysUntil(subscription.expiry, now),
          currency: subscription.currency,
        }
      : null,
    payments: payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      method: p.method,
      payerName: p.payerName,
      note: p.note,
      createdAt: p.createdAt,
    })),
  };
}

/** Subscription status only (view) — used by the publish flow / renew prompts. */
export async function getBillingStatus(claims: SessionClaims, siteId: string) {
  await getSite(claims, siteId);
  const subscription = await billingRepository.getSubscription(siteId);
  if (!subscription) return { hasSubscription: false as const };
  return {
    hasSubscription: true as const,
    expiry: subscription.expiry,
    status: computeSubscriptionStatus(subscription.expiry, new Date()),
  };
}

/**
 * The reseller's billing dashboard for their ACTIVE workspace: every site with
 * its paid-through date, days left, display status, and payment totals.
 */
export async function getWorkspaceBilling(claims: SessionClaims) {
  if (!claims.workspace) throw errors.forbidden("لا توجد مساحة عمل نشطة");
  const sites = await sitesRepository.listByWorkspace(claims.workspace.id);
  const siteIds = sites.map((s) => s.id);
  const subs = await billingRepository.listSubscriptionsForSites(siteIds);
  const bySite = new Map(subs.map((s) => [s.siteId, s]));
  const agg = await billingRepository.paymentAggregates(subs.map((s) => s.id));
  const aggBySub = new Map(agg.map((a) => [a.subscriptionId, a]));
  const now = new Date();

  const rows = sites.map((site) => {
    const sub = bySite.get(site.id);
    const a = sub ? aggBySub.get(sub.id) : undefined;
    return {
      id: site.id,
      businessName: site.businessName,
      slug: site.slug,
      siteStatus: site.status,
      subscription: sub
        ? {
            expiry: sub.expiry,
            status: displayStatus(sub.expiry, now),
            daysLeft: daysUntil(sub.expiry, now),
            currency: sub.currency,
          }
        : null,
      totalCollected: a?._sum.amount ?? 0,
      paymentsCount: a?._count._all ?? 0,
      lastPaymentAt: a?._max.createdAt ?? null,
    };
  });

  return {
    summary: {
      total: rows.length,
      active: rows.filter((r) => r.subscription?.status === "active").length,
      expiring: rows.filter((r) => r.subscription?.status === "expiring").length,
      expired: rows.filter(
        (r) => !r.subscription || r.subscription.status === "expired",
      ).length,
    },
    sites: rows,
  };
}
