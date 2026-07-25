import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getWorkspaceBilling } from "@/server/billing/billing.service";
import { BillingView } from "@/components/dashboard/billing-view";

export default async function BillingPage() {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");
  // Billing belongs to the reseller (workspace). Pure collaborators have none.
  if (!claims.workspace) redirect("/dashboard");

  const data = await getWorkspaceBilling(claims);

  return (
    <BillingView
      summary={data.summary}
      sites={data.sites.map((s) => ({
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
      }))}
    />
  );
}
