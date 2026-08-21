import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getSite } from "@/server/sites/sites.service";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { CustomerListQuery } from "@/server/customers/customers.schema";
import { listCustomers } from "@/server/customers/customers.service";
import { templateCollectsSubmissions } from "@/templates/registry";
import { CustomersList, type CustomerRow } from "@/components/dashboard/customers-list";

// The site's customer list — «الزبائن». Scoped + authorized by site access (getSite
// → NOT_FOUND for non-collaborators, so a wrong siteId 404s, never 403). Only sites
// whose template brokers services (collects submissions) have it.
export default async function SiteCustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");

  let site;
  try {
    site = await getSite(claims, id);
  } catch {
    notFound();
  }
  if (!templateCollectsSubmissions(site.templateKey)) notFound();

  const perms = resolveSiteAccess(claims, site);
  const sp = await searchParams;
  const q = CustomerListQuery.parse({ status: sp.status, q: sp.q, page: sp.page });
  const data = await listCustomers(claims, id, q);

  const rows: CustomerRow[] = data.rows.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    area: c.area,
    status: c.status,
    jobsCount: c._count.jobs,
  }));

  return (
    <CustomersList
      siteId={id}
      businessName={site.businessName}
      rows={rows}
      total={data.total}
      page={data.page}
      pageSize={50}
      filters={{ status: q.status, q: q.q ?? "" }}
      canManage={perms.canEditSettings}
    />
  );
}
