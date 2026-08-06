import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { listLeads } from "@/server/leads/leads.service";
import { LeadFilter, LeadSort, LeadDir } from "@/server/leads/leads.schema";
import { LeadsAdmin, type LeadRow } from "@/components/dashboard/leads-admin";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

// Admin-only inbox of landing-page "free preview" leads. Search/filter/sort are
// all URL params, resolved server-side.
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");
  if (claims.platformRole !== "admin") redirect("/dashboard");

  const sp = await searchParams;
  const filter = LeadFilter.catch("all").parse(first(sp.filter) || "all");
  const sort = LeadSort.catch("created").parse(first(sp.sort) || "created");
  const dir = LeadDir.catch("desc").parse(first(sp.dir) || "desc");
  const q = first(sp.q).trim() || undefined;
  const { items, counts } = await listLeads(claims, { filter, q, sort, dir });

  const rows: LeadRow[] = items.map((l) => ({
    id: l.id,
    businessName: l.businessName,
    whatsapp: l.whatsapp,
    email: l.email,
    status: l.status,
    note: l.note,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <LeadsAdmin rows={rows} counts={counts} filter={filter} q={q ?? ""} sort={sort} dir={dir} />
  );
}
