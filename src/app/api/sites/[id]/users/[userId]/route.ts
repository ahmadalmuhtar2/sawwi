// Owner: change a site-user's role (PATCH) or remove them (DELETE). Scoped to the
// owning site; gated on canEditSettings in the service.

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { SetRoleInput } from "@/server/site-auth/site-auth.schema";
import { deleteSiteUser, setSiteUserRole } from "@/server/site-auth/site-auth.service";

type Ctx = { params: Promise<{ id: string; userId: string }> };

export const PATCH = withRoute(async (request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, userId } = await params;
  const { role } = SetRoleInput.parse(await request.json());
  return setSiteUserRole(claims, id, userId, role);
});

export const DELETE = withRoute(async (_request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, userId } = await params;
  return deleteSiteUser(claims, id, userId);
});
