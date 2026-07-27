import { cookies } from "next/headers";
import { withRoute } from "@/lib/http";
import { requireSessionClaims, ACTIVE_WORKSPACE_COOKIE } from "@/lib/auth";
import { getMyWorkspace, updateWorkspace, deleteWorkspace } from "@/server/workspaces/workspaces.service";
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

// DELETE /api/workspaces/me — delete the caller's active workspace (owner only,
// must be empty). Clears the now-dangling active cookie so the next request
// falls back to another membership (or none).
export const DELETE = withRoute(async () => {
  const claims = await requireSessionClaims();
  const result = await deleteWorkspace(claims);
  (await cookies()).delete(ACTIVE_WORKSPACE_COOKIE);
  return result;
});
