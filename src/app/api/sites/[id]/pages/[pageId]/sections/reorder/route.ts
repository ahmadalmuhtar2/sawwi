import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { ReorderInput } from "@/server/pages/pages.schema";
import { reorderSections } from "@/server/pages/pages.service";

type Ctx = { params: Promise<{ id: string; pageId: string }> };

// PUT /api/sites/:id/pages/:pageId/sections/reorder
export const PUT = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, pageId } = await params;
  const { orderedIds } = ReorderInput.parse(await req.json());
  return reorderSections(claims, id, pageId, orderedIds);
});
