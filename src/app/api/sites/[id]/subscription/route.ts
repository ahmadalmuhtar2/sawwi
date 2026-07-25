import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { getBillingStatus } from "@/server/billing/billing.service";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/sites/:id/subscription — expiry + computed status (view).
export const GET = withRoute(async (_req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  return getBillingStatus(claims, id);
});
