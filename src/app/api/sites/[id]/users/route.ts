// Owner: list a site's end-user accounts. Gated on canEditSettings in the service.

import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { listSiteUsers } from "@/server/site-auth/site-auth.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withRoute(async (_request, { params }: Ctx) => {
  const claims = await requireSessionClaims();
  const { id } = await params;
  return listSiteUsers(claims, id);
});
