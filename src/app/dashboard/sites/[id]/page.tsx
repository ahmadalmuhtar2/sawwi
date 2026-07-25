import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { getSite } from "@/server/sites/sites.service";
import { getPrisma } from "@/lib/db";
import { getSiteRenderData } from "@/server/sites/site-data";
import { asPageSeo } from "@/shared/seo";
import { Configurator } from "@/components/configurator/configurator";

export default async function SiteConfiguratorPage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  // The builder (configurator) requires builder access. Settings-only
  // collaborators are sent to the settings page they CAN edit.
  if (!resolveSiteAccess(claims, site).canEditBuilder) {
    redirect(`/dashboard/sites/${id}/settings`);
  }

  const pageRows = await getPrisma().page.findMany({
    where: { siteId: id },
    orderBy: { order: "asc" },
    select: { id: true, title: true, path: true, pageType: true, seo: true },
  });
  const pages = pageRows.map((p) => ({
    id: p.id,
    title: p.title,
    path: p.path,
    pageType: p.pageType,
    seo: asPageSeo(p.seo),
  }));
  const siteData = await getSiteRenderData(id);
  if (!siteData) notFound();

  const theme = await getPrisma().siteTheme.findUnique({
    where: { siteId: id },
    select: {
      paletteKey: true, primaryColor: true, secondaryColor: true, fontKey: true,
      headerVariant: true, headerScheme: true,
      footerVariant: true, footerScheme: true,
    },
  });

  return (
    <Configurator
      site={{
        id: site.id,
        businessName: site.businessName,
        slug: site.slug,
        status: site.status,
        verticalKey: site.verticalKey,
      }}
      pages={pages}
      siteData={siteData}
      theme={{
        paletteKey: theme?.paletteKey ?? null,
        primaryColor: theme?.primaryColor ?? null,
        secondaryColor: theme?.secondaryColor ?? null,
        fontKey: theme?.fontKey ?? null,
        headerVariant: theme?.headerVariant ?? null,
        headerScheme: theme?.headerScheme ?? null,
        footerVariant: theme?.footerVariant ?? null,
        footerScheme: theme?.footerScheme ?? null,
      }}
    />
  );
}
