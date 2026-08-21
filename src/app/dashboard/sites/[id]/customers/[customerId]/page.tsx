import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getSite } from "@/server/sites/sites.service";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { getCustomer } from "@/server/customers/customers.service";
import { templateCollectsSubmissions } from "@/templates/registry";
import { CustomerDetail, type Detail } from "@/components/dashboard/customer-detail";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string; customerId: string }>;
}) {
  const { id, customerId } = await params;
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
  let c;
  try {
    c = await getCustomer(claims, id, customerId);
  } catch {
    notFound();
  }

  const detail: Detail = {
    id: c.id,
    name: c.name,
    phone: c.phone,
    phoneRaw: c.phoneRaw,
    area: c.area,
    status: c.status,
    internalNote: c.internalNote,
    jobsCount: c._count.jobs,
    createdAt: c.createdAt.toISOString(),
  };

  return <CustomerDetail siteId={id} businessName={site.businessName} canManage={perms.canEditSettings} customer={detail} />;
}
