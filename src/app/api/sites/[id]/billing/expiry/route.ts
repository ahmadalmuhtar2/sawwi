import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { SetExpiryInput } from "@/server/billing/billing.schema";
import { setExpiry } from "@/server/billing/billing.service";

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/sites/:id/billing/expiry — set/extend the paid-through date.
export const PUT = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const input = SetExpiryInput.parse(await req.json());
  return setExpiry(claims, id, input);
});
