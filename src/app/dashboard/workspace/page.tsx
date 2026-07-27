import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { WorkspaceEditor } from "@/components/dashboard/workspace-editor";

export default async function WorkspacePage() {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");

  const active = claims.workspace;
  const [workspace, siteCount] = active
    ? await Promise.all([
        getPrisma().workspace.findUnique({ where: { id: active.id }, select: { name: true } }),
        getPrisma().site.count({ where: { workspaceId: active.id } }),
      ])
    : [null, 0];

  return (
    <WorkspaceEditor
      workspace={workspace}
      canEdit={active?.role === "owner"}
      siteCount={siteCount}
    />
  );
}
