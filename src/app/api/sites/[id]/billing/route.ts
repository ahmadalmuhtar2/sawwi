import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { RecordPaymentInput } from "@/server/billing/billing.schema";
import { getSiteBilling, recordPayment } from "@/server/billing/billing.service";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/sites/:id/billing — subscription + payment history (reseller/admin).
export const GET = withRoute(async (_req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  return getSiteBilling(claims, id);
});

// POST /api/sites/:id/billing — record a payment (optionally extends expiry).
export const POST = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const input = RecordPaymentInput.parse(await req.json());
  return recordPayment(claims, id, input);
});
