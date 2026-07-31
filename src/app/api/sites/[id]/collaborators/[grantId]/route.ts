import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { UpdateCollaboratorInput } from "@/server/members/members.schema";
import { updateSiteCollaborator, revokeSiteCollaborator } from "@/server/members/members.service";

type Ctx = { params: Promise<{ id: string; grantId: string }> };

// PATCH /api/sites/:id/collaborators/:grantId — toggle builder access (owner only).
export const PATCH = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, grantId } = await params;
  const input = UpdateCollaboratorInput.parse(await request.json());
  return updateSiteCollaborator(claims, id, grantId, input);
});

// DELETE /api/sites/:id/collaborators/:grantId — revoke access (owner only).
export const DELETE = withRoute(async (_request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, grantId } = await params;
  return revokeSiteCollaborator(claims, id, grantId);
});
