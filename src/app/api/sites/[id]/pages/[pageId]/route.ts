import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { UpdatePageInput } from "@/server/pages/pages.schema";
import { deletePage, updatePage } from "@/server/pages/pages.service";

type Ctx = { params: Promise<{ id: string; pageId: string }> };

// PUT /api/sites/:id/pages/:pageId
export const PUT = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, pageId } = await params;
  const input = UpdatePageInput.parse(await req.json());
  return updatePage(claims, id, pageId, input);
});

// DELETE /api/sites/:id/pages/:pageId
export const DELETE = withRoute(async (_req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, pageId } = await params;
  return deletePage(claims, id, pageId);
});
