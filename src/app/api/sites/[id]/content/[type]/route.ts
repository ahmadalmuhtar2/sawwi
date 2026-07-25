import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { errors } from "@/shared/errors";
import { isContentType, parseContentCreate } from "@/server/content/content.schema";
import { createContent, listContent } from "@/server/content/content.service";

type Ctx = { params: Promise<{ id: string; type: string }> };

async function resolve(params: Ctx["params"]) {
  const { id, type } = await params;
  if (!isContentType(type)) throw errors.notFound("نوع محتوى غير معروف");
  return { siteId: id, type };
}

// GET /api/sites/:id/content/:type — list one content type.
export const GET = withRoute(async (_req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { siteId, type } = await resolve(params);
  return { items: await listContent(claims, siteId, type) };
});

// POST /api/sites/:id/content/:type — create an item.
export const POST = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { siteId, type } = await resolve(params);
  const data = parseContentCreate(type, await req.json());
  return createContent(claims, siteId, type, data);
});
