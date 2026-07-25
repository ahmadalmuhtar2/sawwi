import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { errors } from "@/shared/errors";
import { isContentType, parseContentUpdate } from "@/server/content/content.schema";
import { deleteContent, updateContent } from "@/server/content/content.service";

type Ctx = { params: Promise<{ id: string; type: string; itemId: string }> };

async function resolve(params: Ctx["params"]) {
  const { id, type, itemId } = await params;
  if (!isContentType(type)) throw errors.notFound("نوع محتوى غير معروف");
  return { siteId: id, type, itemId };
}

// PUT /api/sites/:id/content/:type/:itemId — update an item.
export const PUT = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { siteId, type, itemId } = await resolve(params);
  const data = parseContentUpdate(type, await req.json());
  return updateContent(claims, siteId, type, itemId, data);
});

// DELETE /api/sites/:id/content/:type/:itemId — remove an item.
export const DELETE = withRoute(async (_req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { siteId, type, itemId } = await resolve(params);
  return deleteContent(claims, siteId, type, itemId);
});
