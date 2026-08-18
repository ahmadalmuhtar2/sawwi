import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { getSite } from "@/server/sites/sites.service";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { getProvider } from "@/server/providers/providers.service";
import { isProfilePublic } from "@/server/providers/visibility";
import { templateCollectsSubmissions } from "@/templates/registry";
import { publicUrl } from "@/lib/storage";
import { siteUrl } from "@/lib/site-url";
import { ProviderDetail, type Detail } from "@/components/dashboard/provider-detail";

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string; providerId: string }>;
}) {
  const { id, providerId } = await params;
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
  let p;
  try {
    p = await getProvider(claims, id, providerId);
  } catch {
    notFound();
  }

  const settings = await getPrisma().siteSettings.findUnique({
    where: { siteId: id },
    select: { publicProfilesEnabled: true },
  });
  const publicProfilesEnabled = settings?.publicProfilesEnabled ?? false;
  const live = isProfilePublic(
    { publicProfilesEnabled },
    { profilePublic: p.profilePublic, status: p.status, verifiedAt: p.verifiedAt, ratingCount: p.ratingCount },
  );

  const detail: Detail = {
    id: p.id,
    name: p.name,
    displayName: p.displayName,
    phone: p.phone,
    phoneRaw: p.phoneRaw,
    slug: p.slug,
    categories: p.categories,
    areas: p.areas,
    bio: p.bio,
    status: p.status,
    verified: p.verifiedAt !== null,
    profilePublic: p.profilePublic,
    internalNote: p.internalNote,
    jobsCompleted: p.jobsCompleted,
    ratingCount: p.ratingCount,
    ratingAvg: p.ratingAvg === null ? null : Number(p.ratingAvg),
    photos: p.photos.map((ph) => ({ id: ph.id, url: publicUrl(ph.key), caption: ph.caption, sortOrder: ph.sortOrder })),
  };

  return (
    <ProviderDetail
      siteId={id}
      businessName={site.businessName}
      canManage={perms.canEditSettings}
      provider={detail}
      publicProfilesEnabled={publicProfilesEnabled}
      live={live}
      profileUrl={`${siteUrl(site.slug)}/p/${p.slug}`}
    />
  );
}
