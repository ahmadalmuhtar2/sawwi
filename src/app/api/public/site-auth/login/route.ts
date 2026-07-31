// PUBLIC: sign in to a published site. Site from Host; sets the host-only cookie.

import { cookies } from "next/headers";
import { withRoute } from "@/lib/http";
import { LoginInput } from "@/server/site-auth/site-auth.schema";
import { login } from "@/server/site-auth/site-auth.service";
import { clientIpFromHeaders } from "@/server/site-auth/site-auth.rules";
import { SITE_SESSION_COOKIE, useSecureCookies } from "@/lib/site-host";

const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const POST = withRoute(async (request) => {
  const input = LoginInput.parse(await request.json());
  const { user, token } = await login(
    request.headers.get("host"),
    input,
    clientIpFromHeaders(request.headers),
  );
  if (token) {
    (await cookies()).set(SITE_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: useSecureCookies(),
      path: "/",
      maxAge: MAX_AGE,
    });
  }
  return { user };
});
