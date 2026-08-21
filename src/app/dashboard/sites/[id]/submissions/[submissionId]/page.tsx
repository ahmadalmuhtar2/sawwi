import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getSite } from "@/server/sites/sites.service";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { getSubmission } from "@/server/submissions/submissions.service";
import { getProviderForSubmission } from "@/server/providers/providers.service";
import { getCustomerForSubmission } from "@/server/customers/customers.service";
import { templateCollectsSubmissions } from "@/templates/registry";
import { SubmissionDetail, type Detail } from "@/components/dashboard/submission-detail";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = await params;
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
  let row;
  try {
    row = await getSubmission(claims, id, submissionId);
  } catch {
    notFound();
  }

  const detail: Detail = {
    id: row.id,
    kind: row.kind,
    status: row.status,
    name: row.name,
    phone: row.phone,
    phoneRaw: row.phoneRaw,
    category: row.category,
    area: row.area,
    details: row.details,
    images: row.images,
    adminNote: row.adminNote,
    source: row.source,
    utmSource: row.utmSource,
    createdAt: row.createdAt.toISOString(),
    statusAt: row.statusAt ? row.statusAt.toISOString() : null,
  };

  // A lead that's already been promoted → link straight to its list page.
  const linkedProvider = row.kind === "PROVIDER" ? await getProviderForSubmission(claims, id, submissionId) : null;
  const linkedCustomer = row.kind === "CUSTOMER" ? await getCustomerForSubmission(claims, id, submissionId) : null;

  return (
    <SubmissionDetail
      siteId={id}
      businessName={site.businessName}
      canManage={perms.canEditSettings}
      submission={detail}
      linkedProviderId={linkedProvider?.id ?? null}
      linkedCustomerId={linkedCustomer?.id ?? null}
    />
  );
}
