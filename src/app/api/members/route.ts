import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { InviteCollaboratorInput } from "@/server/members/members.schema";
import { inviteCollaborator, listCollaborators } from "@/server/members/members.service";

// GET /api/members — collaborators + sites for the active workspace.
export const GET = withRoute(async () => {
  const claims = await requireSessionClaims();
  return listCollaborators(claims);
});

// POST /api/members — invite an email to 1+ sites.
export const POST = withRoute(async (request) => {
  const claims = await requireSessionClaims();
  const input = InviteCollaboratorInput.parse(await request.json());
  return inviteCollaborator(claims, input);
});
