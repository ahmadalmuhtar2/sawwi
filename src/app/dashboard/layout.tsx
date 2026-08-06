import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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

  // In the provisioned model everyone arrives with a workspace (reseller/direct)
  // or a site grant (business owner). A user with neither AND not an admin is
  // an unprovisioned account → the onboarding page explains to contact support.
  if (
    !claims.workspace &&
    claims.siteAccess.length === 0 &&
    claims.platformRole !== "admin"
  ) {
    redirect("/onboarding");
  }

  const [user, workspaces] = await Promise.all([
    getPrisma().user.findUnique({
      where: { id: claims.userId },
      select: { name: true, email: true, image: true },
    }),
    listMyWorkspaces(claims),
  ]);

  // Apply the saved theme during SSR from the cookie — reliable persistence,
  // no post-paint flash. ThemeInit only fills in the OS default on first visit.
  // Dark is the platform default: only an explicit `light` cookie opts out.
  const savedTheme = (await cookies()).get("sawwi_theme")?.value;
  const theme = savedTheme === "light" ? "light" : "dark";

  return (
    // display:contents wrapper carries data-theme for the dark-mode scope.
    // <ThemeInit> applies the saved/OS theme to this element before paint.
    // suppressHydrationWarning: the theme attribute is added client-side.
    <div id="sw-app" data-theme={theme} style={{ display: "contents" }} suppressHydrationWarning>
      <ThemeInit />
      <DashboardShell
        user={{ name: user?.name ?? "", email: user?.email ?? "", image: user?.image }}
        workspaces={workspaces}
        activeWorkspaceId={claims.workspace?.id ?? null}
        isOwner={claims.workspace?.role === "owner"}
        isAdmin={claims.platformRole === "admin"}
        // Only a reseller workspace gets the full chrome (billing, members,
        // switcher, create-site). Direct owners & business owners are stripped.
        isReseller={claims.workspace?.kind === "reseller"}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
