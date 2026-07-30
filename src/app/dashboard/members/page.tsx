import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { listCollaborators } from "@/server/members/members.service";
import { MembersManager } from "@/components/dashboard/members-manager";

export default async function MembersPage() {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");
  if (!claims.workspace) redirect("/dashboard");

  const { hasSites, grants } = await listCollaborators(claims);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold text-ink">الأعضاء والمتعاونون</h1>
      <p className="mt-1 text-sm text-muted">
        ادعُ متعاونين لإدارة إعدادات مواقع مساحة العمل الحالية. المتعاون يعدّل
        الإعدادات فقط، ولا يرى الفوترة ولا ينشئ مواقع — إلا إن منحته صلاحية المُنشئ.
      </p>

      <MembersManager
        hasSites={hasSites}
        grants={grants.map((g) => ({
          id: g.id,
          siteId: g.siteId,
          invitedEmail: g.invitedEmail,
          businessName: g.site.businessName,
          builderAccess: g.builderAccess,
          accepted: Boolean(g.acceptedAt),
        }))}
      />
    </div>
  );
}
