import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { AddSectionInput } from "@/server/pages/pages.schema";
import { addSection, listSections } from "@/server/pages/pages.service";

type Ctx = { params: Promise<{ id: string; pageId: string }> };

// GET /api/sites/:id/pages/:pageId/sections
export const GET = withRoute(async (_req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, pageId } = await params;
  return { items: await listSections(claims, id, pageId) };
});

// POST /api/sites/:id/pages/:pageId/sections — add a section (allow-list checked).
export const POST = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, pageId } = await params;
  const input = AddSectionInput.parse(await req.json());
  return addSection(claims, id, pageId, input);
});
