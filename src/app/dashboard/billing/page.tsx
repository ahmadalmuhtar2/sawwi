import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getWorkspaceBilling } from "@/server/billing/billing.service";
import { BillingView, type BillingRow, type BillingStatusFilter } from "@/components/dashboard/billing-view";

const STATUSES: BillingStatusFilter[] = ["active", "expiring", "expired"];
function parseStatus(raw: string | undefined): BillingStatusFilter | null {
  return STATUSES.includes(raw as BillingStatusFilter) ? (raw as BillingStatusFilter) : null;
}
// Table filter predicate — mirrors the summary buckets (expired includes
// no-subscription sites, matching "منتهية").
function matches(status: BillingStatusFilter, r: BillingRow): boolean {
  if (status === "expired") return !r.subscription || r.subscription.status === "expired";
  return r.subscription?.status === status;
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");
  // Billing belongs to RESELLERS. Direct owners (free) and site-scoped business
  // owners never manage billing. Requires an active reseller workspace.
  if (!claims.workspace || claims.workspace.kind !== "reseller") {
    redirect("/dashboard");
  }

  const data = await getWorkspaceBilling(claims);
  const all: BillingRow[] = data.sites.map((s) => ({
    id: s.id,
    businessName: s.businessName,
    slug: s.slug,
    subscription: s.subscription
      ? {
          status: s.subscription.status,
          expiry: s.subscription.expiry.toISOString(),
          daysLeft: s.subscription.daysLeft,
          currency: s.subscription.currency,
        }
      : null,
    totalCollected: s.totalCollected,
    paymentsCount: s.paymentsCount,
    lastPaymentAt: s.lastPaymentAt ? s.lastPaymentAt.toISOString() : null,
  }));

  // URL-driven, server-side filtering of the subscriptions table. The stat cards
  // link here with ?status=…; the summary counts + renewals stay on the full set.
  const activeStatus = parseStatus((await searchParams).status);
  const tableSites = activeStatus ? all.filter((r) => matches(activeStatus, r)) : all;
  const upcoming = all
    .filter((r) => r.subscription)
    .sort((a, b) => a.subscription!.daysLeft - b.subscription!.daysLeft)
    .slice(0, 6);

  return (
    <BillingView
      summary={data.summary}
      sites={tableSites}
      upcoming={upcoming}
      activeStatus={activeStatus}
    />
  );
}
