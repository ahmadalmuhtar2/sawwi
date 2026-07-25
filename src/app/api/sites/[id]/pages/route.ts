import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { CreatePageInput } from "@/server/pages/pages.schema";
import { createPage, listPages } from "@/server/pages/pages.service";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/sites/:id/pages
export const GET = withRoute(async (_req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  return { items: await listPages(claims, id) };
});

// POST /api/sites/:id/pages
export const POST = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const input = CreatePageInput.parse(await req.json());
  return createPage(claims, id, input);
});
