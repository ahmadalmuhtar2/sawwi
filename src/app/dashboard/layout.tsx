import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { listMyWorkspaces } from "@/server/workspaces/workspaces.service";
import { DashboardShell } from "@/components/dashboard/shell";
import { ThemeInit } from "@/components/dashboard/theme-toggle";

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
    // display:contents wrapper carries data-theme for the dark-mode scope.
    // <ThemeInit> applies the saved/OS theme to this element before paint.
    // suppressHydrationWarning: the theme attribute is added client-side.
    <div id="sw-app" style={{ display: "contents" }} suppressHydrationWarning>
      <ThemeInit />
      <DashboardShell
        user={{ name: user?.name ?? "", email: user?.email ?? "", image: user?.image }}
        workspaces={workspaces}
        activeWorkspaceId={claims.workspace?.id ?? null}
        isOwner={claims.workspace?.role === "owner"}
        isAdmin={claims.platformRole === "admin"}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
