import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { getWorkspaceBilling } from "@/server/billing/billing.service";

// GET /api/billing/overview — the active workspace's billing dashboard data.
export const GET = withRoute(async () => {
  const claims = await requireSessionClaims();
  return getWorkspaceBilling(claims);
});
