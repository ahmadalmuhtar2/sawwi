import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { errors } from "@/shared/errors";
import { isContentType, ReorderInput } from "@/server/content/content.schema";
import { reorderContent } from "@/server/content/content.service";

type Ctx = { params: Promise<{ id: string; type: string }> };

// PUT /api/sites/:id/content/:type/reorder — persist a new item order.
export const PUT = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, type } = await params;
  if (!isContentType(type)) throw errors.notFound("نوع محتوى غير معروف");
  const { orderedIds } = ReorderInput.parse(await req.json());
  return reorderContent(claims, id, type, orderedIds);
});
