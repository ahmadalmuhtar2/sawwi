import { z } from "zod";
import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { setUserEndDate } from "@/server/admin/admin.service";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ endDate: z.string().nullable() });

// PATCH /api/admin/users/:id — set/clear a direct account's hard expiry date.
export const PATCH = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const { endDate } = schema.parse(await req.json());
  return setUserEndDate(claims, id, endDate);
});
