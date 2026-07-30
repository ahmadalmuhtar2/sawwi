// PUBLIC: sign out — revoke the server-side session and clear the cookie.

import { cookies } from "next/headers";
import { withRoute } from "@/lib/http";
import { logout } from "@/server/site-auth/site-auth.service";
import { SITE_SESSION_COOKIE } from "@/lib/site-host";

export const POST = withRoute(async () => {
  const jar = await cookies();
  const token = jar.get(SITE_SESSION_COOKIE)?.value ?? null;
  await logout(token);
  jar.delete(SITE_SESSION_COOKIE);
  return { ok: true };
});
