import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getSite } from "@/server/sites/sites.service";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { getJob } from "@/server/jobs/jobs.service";
import { templateCollectsSubmissions } from "@/templates/registry";
import { JobDetail, type JobDetailData } from "@/components/dashboard/job-detail";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string; jobId: string }>;
}) {
  const { id, jobId } = await params;
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
  let j;
  try {
    j = await getJob(claims, id, jobId);
  } catch {
    notFound();
  }

  const data: JobDetailData = {
    id: j.id,
    providerId: j.providerId,
    providerName: j.provider.displayName?.trim() || j.provider.name,
    customerName: j.customerName,
    customerPhone: j.customerPhone,
    category: j.category,
    area: j.area,
    description: j.description,
    status: j.status,
    matchedAt: j.matchedAt.toISOString(),
    completedAt: j.completedAt ? j.completedAt.toISOString() : null,
    followedUpAt: j.followedUpAt ? j.followedUpAt.toISOString() : null,
    rating: j.rating
      ? {
          score: j.rating.score,
          publicComment: j.rating.publicComment,
          commentApproved: j.rating.commentApproved,
          privateNote: j.rating.privateNote,
          source: j.rating.source,
          recordedAt: j.rating.recordedAt.toISOString(),
        }
      : null,
  };

  return <JobDetail siteId={id} businessName={site.businessName} canManage={perms.canEditSettings} job={data} />;
}
