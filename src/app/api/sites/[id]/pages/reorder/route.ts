import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { ReorderInput } from "@/server/pages/pages.schema";
import { reorderPages } from "@/server/pages/pages.service";

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/sites/:id/pages/reorder
export const PUT = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const { orderedIds } = ReorderInput.parse(await req.json());
  return reorderPages(claims, id, orderedIds);
});
