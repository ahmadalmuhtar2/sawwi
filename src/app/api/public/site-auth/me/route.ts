// PUBLIC: the current site-user for this tenant (or null), plus the site's role
// labels. Validated against the Host's site so a token can't cross sites.
// PATCH lets a signed-in user edit their OWN profile (name/phone/password).

import { cookies } from "next/headers";
import { withRoute } from "@/lib/http";
import { currentUser, updateOwnProfile } from "@/server/site-auth/site-auth.service";
import { UpdateProfileInput } from "@/server/site-auth/site-auth.schema";
import { SITE_SESSION_COOKIE } from "@/lib/site-host";

export const GET = withRoute(async (request) => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  return currentUser(request.headers.get("host"), token);
});

export const PATCH = withRoute(async (request) => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  const input = UpdateProfileInput.parse(await request.json());
  const user = await updateOwnProfile(request.headers.get("host"), token, input);
  return { user };
});
