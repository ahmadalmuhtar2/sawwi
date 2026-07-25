import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { deleteSite, getSite, updateSiteBasics } from "@/server/sites/sites.service";
import { UpdateSiteBasicsInput } from "@/server/sites/sites.schema";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/sites/:id — a site the caller may view.
export const GET = withRoute(async (_request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  return getSite(claims, id);
});

// PATCH /api/sites/:id — update site identity (name, slug, language).
export const PATCH = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const input = UpdateSiteBasicsInput.parse(await request.json());
  return updateSiteBasics(claims, id, input);
});

// DELETE /api/sites/:id — permanently delete a site and all its content.
export const DELETE = withRoute(async (_request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  return deleteSite(claims, id);
});
