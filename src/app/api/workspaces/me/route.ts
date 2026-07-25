import { withRoute } from "@/lib/http";
import { requireSessionClaims } from "@/lib/auth";
import { getMyWorkspace, updateWorkspace } from "@/server/workspaces/workspaces.service";
import { UpdateWorkspaceInput } from "@/server/workspaces/workspaces.schema";

// GET /api/workspaces/me — the caller's workspace.
export const GET = withRoute(async () => {
  const claims = await requireSessionClaims();
  return getMyWorkspace(claims);
});

// PUT /api/workspaces/me — update the caller's workspace (owner only).
export const PUT = withRoute(async (req) => {
  const claims = await requireSessionClaims();
  const input = UpdateWorkspaceInput.parse(await req.json());
  return updateWorkspace(claims, input);
});
