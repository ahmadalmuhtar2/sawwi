import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getSite } from "@/server/sites/sites.service";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { ListQuery } from "@/server/submissions/submissions.schema";
import { listSubmissions } from "@/server/submissions/submissions.service";
import { templateCollectsSubmissions } from "@/templates/registry";
import { SubmissionsInbox, type Row } from "@/components/dashboard/submissions-inbox";

// The site's own leads inbox — «الطلبات». Scoped + authorized by site access
// (getSite throws NOT_FOUND when the caller doesn't collaborate on this site, so
// editing the URL to another site 404s, never leaking its existence). Sites whose
// template collects no forms have no inbox at all.
export default async function SiteSubmissionsPage({
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
    site = await getSite(claims, id); // exists + canView, or throws → 404 below
  } catch {
    notFound();
  }
  if (!templateCollectsSubmissions(site.templateKey)) notFound();

  const perms = resolveSiteAccess(claims, site);
  const sp = await searchParams;
  const q = ListQuery.parse({ kind: sp.kind, status: sp.status, category: sp.category, q: sp.q, page: sp.page });
  const data = await listSubmissions(claims, id, q);

  const rows: Row[] = data.rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    status: r.status,
    name: r.name,
    phone: r.phone,
    category: r.category,
    area: r.area,
    source: r.source,
    hasImages: r.images.length > 0,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <SubmissionsInbox
      siteId={id}
      businessName={site.businessName}
      rows={rows}
      total={data.total}
      page={data.page}
      pageSize={data.pageSize}
      categories={data.categories}
      filters={{ kind: q.kind, status: q.status, category: q.category ?? "", q: q.q ?? "" }}
      canManage={perms.canEditSettings}
    />
  );
}
