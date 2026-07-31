import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { InviteSiteCollaboratorInput } from "@/server/members/members.schema";
import { listSiteCollaborators, inviteSiteCollaborator } from "@/server/members/members.service";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/sites/:id/collaborators — collaborators on this site (+ canManage).
export const GET = withRoute(async (_request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  return listSiteCollaborators(claims, id);
});

// POST /api/sites/:id/collaborators — invite an email to this site (owner only).
export const POST = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  const input = InviteSiteCollaboratorInput.parse(await request.json());
  return inviteSiteCollaborator(claims, id, input);
});
