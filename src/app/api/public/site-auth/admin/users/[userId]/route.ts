// PUBLIC (site-session authorized): a MANAGER changes a user's role (PATCH) or
// removes a user (DELETE). Guardrails (not managers, not self, role limited to
// member|contributor) are enforced in the service.

import { cookies } from "next/headers";
import { withRoute } from "@/lib/http";
import { SetRoleInput } from "@/server/site-auth/site-auth.schema";
import { adminSetRole, adminDeleteUser } from "@/server/site-auth/site-admin.service";
import { SITE_SESSION_COOKIE } from "@/lib/site-host";

type Ctx = { params: Promise<{ userId: string }> };

export const PATCH = withRoute(async (request, { params }: Ctx) => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  const { userId } = await params;
  const { role } = SetRoleInput.parse(await request.json());
  return adminSetRole(request.headers.get("host"), token, userId, role);
});

export const DELETE = withRoute(async (request, { params }: Ctx) => {
  const token = (await cookies()).get(SITE_SESSION_COOKIE)?.value ?? null;
  const { userId } = await params;
  return adminDeleteUser(request.headers.get("host"), token, userId);
});
