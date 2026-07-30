// PUBLIC: the current site-user for this tenant (or null), plus the site's role
// labels. Validated against the Host's site so a token can't cross sites.

import { cookies } from "next/headers";
import { withRoute } from "@/lib/http";
import { currentUser } from "@/server/site-auth/site-auth.service";
import { SITE_SESSION_COOKIE } from "@/lib/site-host";

export const GET = withRoute(async (request) => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  return currentUser(request.headers.get("host"), token);
});
