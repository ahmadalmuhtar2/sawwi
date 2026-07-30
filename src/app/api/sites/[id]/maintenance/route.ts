import { z } from "zod";
import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { setMaintenance } from "@/server/sites/sites.service";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ on: z.boolean() });

// PATCH /api/sites/:id/maintenance — pause/resume public serving (admin/reseller).
export const PATCH = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const { on } = schema.parse(await req.json());
  return setMaintenance(claims, id, on);
});
