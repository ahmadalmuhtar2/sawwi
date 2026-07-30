import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import {
  adminOverview,
  listUsers,
  listWorkspaces,
  listSitesAdmin,
  listPaymentsAdmin,
  type AdminQuery,
} from "@/server/admin/admin.service";
import { AdminCRM, type AdminData } from "@/components/dashboard/admin-crm";

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const TABS = ["users", "workspaces", "sites", "payments"] as const;
type Tab = (typeof TABS)[number];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");
  if (claims.platformRole !== "admin") redirect("/dashboard");

  const sp = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(first(sp.tab)) ? (first(sp.tab) as Tab) : "users";
  const query: AdminQuery = {
    q: first(sp.q),
    sort: first(sp.sort),
    dir: first(sp.dir) === "asc" ? "asc" : "desc",
    role: first(sp.role),
    kind: first(sp.kind),
    status: first(sp.status),
    served: first(sp.served),
    currency: first(sp.currency),
    method: first(sp.method),
    commission: first(sp.commission),
  };

  // Fetch the overview always; only the ACTIVE tab's rows (filtered in the DB).
  const [overview, users, workspaces, sites, payments] = await Promise.all([
    adminOverview(claims),
    tab === "users" ? listUsers(claims, query) : Promise.resolve([]),
    tab === "workspaces" ? listWorkspaces(claims, query) : Promise.resolve([]),
    tab === "sites" ? listSitesAdmin(claims, query) : Promise.resolve([]),
    tab === "payments" ? listPaymentsAdmin(claims, query) : Promise.resolve([]),
  ]);

  const data: AdminData = {
    overview,
    users: users.map((u) => ({ ...u, endDate: iso(u.endDate), createdAt: iso(u.createdAt)! })),
    workspaces: workspaces.map((w) => ({ ...w, createdAt: iso(w.createdAt)! })),
    sites: sites.map((s) => ({
      ...s,
      createdAt: iso(s.createdAt)!,
      subscription: s.subscription ? { expiry: iso(s.subscription.expiry)! } : null,
    })),
    payments: payments.map((p) => ({ ...p, createdAt: iso(p.createdAt)! })),
  };

  return <AdminCRM data={data} tab={tab} query={query} />;
}
