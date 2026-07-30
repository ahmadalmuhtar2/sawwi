import { z } from "zod";
import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { setPaymentStatus } from "@/server/admin/admin.service";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  status: z.enum(["pending", "paid", "checked", "stopped", "refunded"]),
});

// PATCH /api/admin/payments/:id — admin-controlled payment lifecycle.
export const PATCH = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const { status } = schema.parse(await req.json());
  return setPaymentStatus(claims, id, status);
});
