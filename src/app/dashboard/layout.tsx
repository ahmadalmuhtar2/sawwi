import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { listMyWorkspaces } from "@/server/workspaces/workspaces.service";
import { DashboardShell } from "@/components/dashboard/shell";
import { THEME_INIT_SCRIPT } from "@/components/dashboard/theme-toggle";

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
    // display:contents wrapper carries data-theme for the dark-mode scope. The
    // inline script applies the saved/OS theme before paint (no flash); it runs
    // as soon as the parser reaches it, when #sw-app already exists in the DOM.
    // suppressHydrationWarning: the script adds data-theme that the server didn't.
    <div id="sw-app" style={{ display: "contents" }} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
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
