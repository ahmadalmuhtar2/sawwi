import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { listMembers } from "@/server/workspaces/workspaces.service";

// GET /api/workspaces/members — members of the caller's workspace (owner only).
export const GET = withRoute(async () => {
  const claims = await requireSessionClaims();
  return { items: await listMembers(claims) };
});
