import { cookies } from "next/headers";
import { withRoute } from "@/lib/http";
import { requireSessionClaims, ACTIVE_WORKSPACE_COOKIE } from "@/lib/auth";
import { CreateWorkspaceInput } from "@/server/workspaces/workspaces.schema";
import { createWorkspace } from "@/server/workspaces/workspaces.service";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

// POST /api/workspaces — create a workspace, become its owner, make it active.
export const POST = withRoute(async (request) => {
  const claims = await requireSessionClaims();
  const input = CreateWorkspaceInput.parse(await request.json());
  const workspace = await createWorkspace(claims, input);
  (await cookies()).set(ACTIVE_WORKSPACE_COOKIE, workspace.id, COOKIE_OPTS);
  return { id: workspace.id, name: workspace.name };
});
