// PUBLIC (site-session authorized): a MANAGER resets a user's password to a
// freshly generated temporary one, returned once. Guardrails in the service.

import { cookies } from "next/headers";
import { withRoute } from "@/lib/http";
import { adminResetPassword } from "@/server/site-auth/site-admin.service";
import { SITE_SESSION_COOKIE } from "@/lib/site-host";

type Ctx = { params: Promise<{ userId: string }> };

export const POST = withRoute(async (request, { params }: Ctx) => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  const { userId } = await params;
  return adminResetPassword(request.headers.get("host"), token, userId);
});
