import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getSite } from "@/server/sites/sites.service";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { listProviderOptions } from "@/server/providers/providers.service";
import { getSubmission } from "@/server/submissions/submissions.service";
import { templateCollectsSubmissions } from "@/templates/registry";
import { JobNew, type ProviderOption } from "@/components/dashboard/job-new";

export default async function NewJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submissionId?: string }>;
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
  if (!perms.canEditSettings) redirect(`/dashboard/sites/${id}/jobs`);

  const options = (await listProviderOptions(claims, id)) as ProviderOption[];

  // Optionally prefill the customer from a CUSTOMER submission (?submissionId=…).
  let prefill: { customerName: string; customerPhone: string; category: string; area: string; customerSubmissionId: string } | null = null;
  const { submissionId } = await searchParams;
  if (submissionId) {
    try {
      const sub = await getSubmission(claims, id, submissionId);
      if (sub.kind === "CUSTOMER") {
        prefill = { customerName: sub.name, customerPhone: sub.phone, category: sub.category, area: sub.area, customerSubmissionId: sub.id };
      }
    } catch {
      /* ignore a bad submissionId — just show an empty form */
    }
  }

  return <JobNew siteId={id} businessName={site.businessName} providers={options} prefill={prefill} />;
}
