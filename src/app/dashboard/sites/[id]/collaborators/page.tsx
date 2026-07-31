import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getSite } from "@/server/sites/sites.service";
import { listSiteCollaborators } from "@/server/members/members.service";
import { SiteCollaboratorsManager, type CollaboratorRow } from "@/components/dashboard/site-collaborators-manager";

export default async function SiteCollaboratorsPage({
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

  const { canManage, grants } = await listSiteCollaborators(claims, id);
  const initial: CollaboratorRow[] = grants.map((g) => ({
    id: g.id,
    email: g.invitedEmail,
    builderAccess: g.builderAccess,
    accepted: g.acceptedAt != null,
  }));

  return (
    <SiteCollaboratorsManager
      siteId={id}
      businessName={site.businessName}
      canManage={canManage}
      initial={initial}
    />
  );
}
