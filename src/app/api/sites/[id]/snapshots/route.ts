import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { listSnapshots } from "@/server/publishing/publishing.service";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/sites/:id/snapshots — publish history.
export const GET = withRoute(async (_req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  return { items: await listSnapshots(claims, id) };
});
