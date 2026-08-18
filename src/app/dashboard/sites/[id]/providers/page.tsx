import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getSite } from "@/server/sites/sites.service";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { ProviderListQuery } from "@/server/providers/providers.schema";
import { listProviders } from "@/server/providers/providers.service";
import { templateCollectsSubmissions } from "@/templates/registry";
import { ProvidersList, type ProviderRow } from "@/components/dashboard/providers-list";

// The site's provider directory — «المزوّدين». Scoped + authorized by site access
// (getSite → NOT_FOUND for non-collaborators, so a wrong siteId 404s, never 403).
// Only sites whose template brokers services (collects submissions) have it.
export default async function SiteProvidersPage({
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
  const q = ProviderListQuery.parse({ status: sp.status, category: sp.category, q: sp.q, page: sp.page });
  const data = await listProviders(claims, id, q);

  const rows: ProviderRow[] = data.rows.map((p) => ({
    id: p.id,
    name: p.name,
    displayName: p.displayName,
    status: p.status,
    categories: p.categories,
    areas: p.areas,
    verified: p.verifiedAt !== null,
    profilePublic: p.profilePublic,
    jobsCompleted: p.jobsCompleted,
    ratingCount: p.ratingCount,
    ratingAvg: p.ratingAvg === null ? null : Number(p.ratingAvg),
  }));

  return (
    <ProvidersList
      siteId={id}
      businessName={site.businessName}
      rows={rows}
      total={data.total}
      page={data.page}
      pageSize={50}
      categories={data.categories}
      filters={{ status: q.status, category: q.category ?? "", q: q.q ?? "" }}
      canManage={perms.canEditSettings}
    />
  );
}
