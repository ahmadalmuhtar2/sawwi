import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { rollback } from "@/server/publishing/publishing.service";

type Ctx = { params: Promise<{ id: string; snapshotId: string }> };

// POST /api/sites/:id/snapshots/:snapshotId/rollback — republish an old payload.
export const POST = withRoute(async (_req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, snapshotId } = await params;
  return rollback(claims, id, snapshotId);
});
