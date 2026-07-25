import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { UpdateCollaboratorInput } from "@/server/members/members.schema";
import { revokeCollaborator, updateCollaborator } from "@/server/members/members.service";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/members/:id — toggle a collaborator's builder access.
export const PATCH = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const input = UpdateCollaboratorInput.parse(await request.json());
  return updateCollaborator(claims, id, input);
});

// DELETE /api/members/:id — revoke a collaborator's access.
export const DELETE = withRoute(async (_request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  return revokeCollaborator(claims, id);
});
