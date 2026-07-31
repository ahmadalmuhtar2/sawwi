// Owner: reset a site-user's password to a freshly generated temporary one,
// returned once in the response. Scoped to the owning site; gated on
// canEditSettings in the service. Revokes the user's existing sessions.

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { resetSiteUserPassword } from "@/server/site-auth/site-auth.service";

type Ctx = { params: Promise<{ id: string; userId: string }> };

export const POST = withRoute(async (_request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id, userId } = await params;
  return resetSiteUserPassword(claims, id, userId);
});
