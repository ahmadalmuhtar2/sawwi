import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getSite } from "@/server/sites/sites.service";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { JobListQuery } from "@/server/jobs/jobs.schema";
import { listJobs } from "@/server/jobs/jobs.service";
import { templateCollectsSubmissions } from "@/templates/registry";
import { JobsList, type JobRow } from "@/components/dashboard/jobs-list";

// The site's brokered jobs — «الشغلات». Same access model as the leads inbox.
export default async function SiteJobsPage({
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
  const q = JobListQuery.parse({ status: sp.status, page: sp.page });
  const data = await listJobs(claims, id, q);

  const rows: JobRow[] = data.rows.map((j) => ({
    id: j.id,
    providerName: j.provider.displayName?.trim() || j.provider.name,
    customerName: j.customerName,
    category: j.category,
    area: j.area,
    status: j.status,
    matchedAt: j.matchedAt.toISOString(),
    ratingScore: j.rating?.score ?? null,
  }));

  return (
    <JobsList
      siteId={id}
      businessName={site.businessName}
      rows={rows}
      total={data.total}
      page={data.page}
      pageSize={50}
      filters={{ status: q.status }}
      canManage={perms.canEditSettings}
    />
  );
}
