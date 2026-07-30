import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getSite } from "@/server/sites/sites.service";
import { listSiteUsers } from "@/server/site-auth/site-auth.service";
import { roleLabelsOf } from "@/server/site-auth/site-auth.rules";
import { getPrisma } from "@/lib/db";
import { SiteUsersManager, type SiteUserRow } from "@/components/dashboard/site-users-manager";

export default async function SiteUsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");

  let site;
  try {
    site = await getSite(claims, id); // exists + canView, or throws
  } catch {
    notFound();
  }

  const [users, settings] = await Promise.all([
    listSiteUsers(claims, id),
    getPrisma().siteSettings.findUnique({
      where: { siteId: id },
      select: { authEnabled: true, roleLabels: true },
    }),
  ]);

  const initial: SiteUserRow[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <SiteUsersManager
      siteId={id}
      businessName={site.businessName}
      authEnabled={settings?.authEnabled ?? false}
      labels={roleLabelsOf(settings?.roleLabels)}
      initial={initial}
    />
  );
}
