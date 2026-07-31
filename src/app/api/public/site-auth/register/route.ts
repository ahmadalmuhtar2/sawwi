// PUBLIC: a visitor of a published site creates an account. The site is derived
// from the Host header (tenant subdomain), never the body. On success we set the
// host-only session cookie so it's isolated to this exact site.

import { cookies } from "next/headers";
import { withRoute } from "@/lib/http";
import { RegisterInput } from "@/server/site-auth/site-auth.schema";
import { register } from "@/server/site-auth/site-auth.service";
import { clientIpFromHeaders } from "@/server/site-auth/site-auth.rules";
import { SITE_SESSION_COOKIE, useSecureCookies } from "@/lib/site-host";

const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const POST = withRoute(async (request) => {
  const input = RegisterInput.parse(await request.json());
  const { user, token } = await register(
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
