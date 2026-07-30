import { z } from "zod";
import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { setCommissionStatus } from "@/server/admin/admin.service";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ status: z.enum(["owed", "settled"]) });

// PATCH /api/admin/commissions/:id — mark Sawwi's commission owed/settled.
export const PATCH = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const { status } = schema.parse(await req.json());
  return setCommissionStatus(claims, id, status);
});
