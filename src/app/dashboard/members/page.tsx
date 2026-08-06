import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { listMembers } from "@/server/workspaces/workspaces.service";
import { formatArabicDate } from "@/lib/expiry-format";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Panel, SiteThumb } from "@/components/dashboard/ui";

// Workspace → الأعضاء. Read-only roster of the workspace's members (owner-only
// view). There's no self-serve invite/remove yet — members are provisioned by
// Sawwi — so this lists who's on the team without mutation controls.
export default async function MembersPage() {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");
  if (!claims.workspace || claims.workspace.role !== "owner") redirect("/dashboard");

  const members = await listMembers(claims);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="الأعضاء" subtitle="فريق مساحة العمل ومن يمكنه الوصول إليها." />

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>العضو</Th>
                <Th>البريد</Th>
                <Th>الدور</Th>
                <Th>انضمّ</Th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const name = m.user.name || m.user.email;
                const isOwner = m.role === "owner";
                return (
                  <tr key={m.user.id} className="border-b border-line last:border-0">
                    <Td>
                      <div className="flex items-center gap-3">
                        <SiteThumb name={name} />
                        <span className="truncate text-[13.5px] text-ink">{m.user.name || "—"}</span>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <span className="font-mono text-[12px] text-muted" dir="ltr">{m.user.email}</span>
                    </Td>
                    <Td>
                      <Badge tone={isOwner ? "accent" : "neutral"} dot>
                        {isOwner ? "مالك" : "عضو"}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{formatArabicDate(m.joinedAt)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-line px-4.5 py-2.75 text-start text-[11px] font-normal tracking-wide whitespace-nowrap text-faint">
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4.5 py-3.25 text-[13.5px] align-middle ${className ?? ""}`}>{children}</td>;
}
