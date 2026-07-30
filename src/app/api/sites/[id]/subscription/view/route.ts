import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { getSiteExpiryView } from "@/server/billing/billing.service";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/sites/:id/subscription/view — read-only expiry + provider contact for
// the invited business owner (canViewBilling). No payment history or controls.
export const GET = withRoute(async (_req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  return getSiteExpiryView(claims, id);
});
