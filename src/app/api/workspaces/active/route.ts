import { cookies } from "next/headers";
import { z } from "zod";
import { withRoute } from "@/lib/http";
import { requireSessionClaims, ACTIVE_WORKSPACE_COOKIE } from "@/lib/auth";
import { canAccessWorkspace } from "@/server/access/access.rules";
import { errors } from "@/shared/errors";

const Body = z.object({ workspaceId: z.string().min(1) });

// POST /api/workspaces/active — switch the active workspace (switcher cookie).
export const POST = withRoute(async (request) => {
  const claims = await requireSessionClaims();
  const { workspaceId } = Body.parse(await request.json());
  if (!canAccessWorkspace(claims, workspaceId)) {
    throw errors.forbidden("لست عضوًا في مساحة العمل هذه");
  }
  (await cookies()).set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return { activeWorkspaceId: workspaceId };
});
