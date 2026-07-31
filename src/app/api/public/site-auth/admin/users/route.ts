// PUBLIC (site-session authorized): a signed-in MANAGER lists the site's users.
// Site + caller are resolved from the Host + session cookie in the service.

import { cookies } from "next/headers";
import { withRoute } from "@/lib/http";
import { adminListUsers } from "@/server/site-auth/site-admin.service";
import { SITE_SESSION_COOKIE } from "@/lib/site-host";

export const GET = withRoute(async (request) => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  return adminListUsers(request.headers.get("host"), token);
});
