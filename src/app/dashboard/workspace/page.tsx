import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { WorkspaceEditor } from "@/components/dashboard/workspace-editor";

export default async function WorkspacePage() {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");

  const workspace = claims.workspace
    ? await getPrisma().workspace.findUnique({
        where: { id: claims.workspace.id },
        select: { name: true },
      })
    : null;

  return (
    <WorkspaceEditor
      workspace={workspace}
      canEdit={claims.workspace?.role === "owner"}
    />
  );
}
