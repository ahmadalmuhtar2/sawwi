import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { listMyWorkspaces } from "@/server/workspaces/workspaces.service";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");

  // Workspace users need a workspace; brand-new users go to onboarding.
  // Site-scoped users (editors/viewers) skip onboarding entirely.
  if (!claims.workspace && claims.siteAccess.length === 0) {
    redirect("/onboarding");
  }

  const [user, workspaces] = await Promise.all([
    getPrisma().user.findUnique({
      where: { id: claims.userId },
      select: { name: true, email: true, image: true },
    }),
    listMyWorkspaces(claims),
  ]);

  return (
    <DashboardShell
      user={{ name: user?.name ?? "", email: user?.email ?? "", image: user?.image }}
      workspaces={workspaces}
      activeWorkspaceId={claims.workspace?.id ?? null}
      isOwner={claims.workspace?.role === "owner"}
      isAdmin={claims.platformRole === "admin"}
    >
      {children}
    </DashboardShell>
  );
}
