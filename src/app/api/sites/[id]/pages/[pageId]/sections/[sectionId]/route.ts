import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { UpdateSectionInput } from "@/server/pages/pages.schema";
import { deleteSection, updateSection } from "@/server/pages/pages.service";

type Ctx = { params: Promise<{ id: string; pageId: string; sectionId: string }> };

// PUT /api/sites/:id/pages/:pageId/sections/:sectionId — variant/scheme/fields.
export const PUT = withRoute(async (req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, pageId, sectionId } = await params;
  const input = UpdateSectionInput.parse(await req.json());
  return updateSection(claims, id, pageId, sectionId, input);
});

// DELETE /api/sites/:id/pages/:pageId/sections/:sectionId
export const DELETE = withRoute(async (_req, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, pageId, sectionId } = await params;
  return deleteSection(claims, id, pageId, sectionId);
});
