import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getSite } from "@/server/sites/sites.service";
import { getPrisma } from "@/lib/db";
import { asSiteSeo } from "@/shared/seo";
import { publicOrigin } from "@/server/seo/metadata";
import { SettingsTabs } from "@/components/dashboard/settings-tabs";

export default async function SiteSettingsPage({
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

  const p = getPrisma();
  // Template model: business content lives in Site.content (edited inline). The
  // settings page only needs the site's settings row (currency + carried-through
  // contact) and its SEO.
  const [settings, siteRow] = await Promise.all([
    p.siteSettings.findUnique({ where: { siteId: id } }),
    p.site.findUnique({ where: { id }, select: { seo: true, content: true } }),
  ]);

  const shop = ((siteRow?.content as Record<string, unknown> | null)?.shop ?? {}) as Record<string, unknown>;
  const initialLogo = typeof shop.logo === "string" ? shop.logo : "";

  return (
    <SettingsTabs
      siteId={id}
      businessName={site.businessName}
      slug={site.slug}
      siteUrl={publicOrigin(site.slug)}
      initialLogoUrl={site.logoUrl ?? null}
      initialLogo={initialLogo}
      initialBasics={{
        businessName: site.businessName,
        slug: site.slug,
        language: site.language === "en" ? "en" : "ar",
      }}
      initialSettings={{
        whatsappNumber: settings?.whatsappNumber ?? "",
        phone: settings?.phone ?? "",
        address: settings?.address ?? "",
        googleMapsUrl: settings?.googleMapsUrl ?? "",
        socials: (settings?.socials as Record<string, string>) ?? {},
        openingHours: (settings?.openingHours as Record<string, unknown>) ?? {},
        currency: settings?.currency ?? "SYP",
        logoMediaId: settings?.logoMediaId ?? null,
        loadingIconId: settings?.loadingIconId ?? null,
        authEnabled: settings?.authEnabled ?? false,
        roleLabels: (settings?.roleLabels as Record<string, string>) ?? {},
      }}
      initialSeo={asSiteSeo(siteRow?.seo)}
    />
  );
}
