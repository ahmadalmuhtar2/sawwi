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
  const [settings, siteRow, theme, services, team, testimonials, faq] = await Promise.all([
    p.siteSettings.findUnique({ where: { siteId: id } }),
    p.site.findUnique({ where: { id }, select: { seo: true } }),
    p.siteTheme.findUnique({
      where: { siteId: id },
      select: {
        paletteKey: true, primaryColor: true, secondaryColor: true, fontKey: true,
        headerVariant: true, headerScheme: true,
        footerVariant: true, footerScheme: true,
      },
    }),
    p.service.findMany({
      where: { siteId: id },
      orderBy: { order: "asc" },
      select: { id: true, name: true, price: true, duration: true, description: true },
    }),
    p.teamMember.findMany({
      where: { siteId: id },
      orderBy: { order: "asc" },
      select: { id: true, name: true, roleTitle: true },
    }),
    p.testimonial.findMany({
      where: { siteId: id },
      orderBy: { order: "asc" },
      select: { id: true, author: true, text: true },
    }),
    p.faqItem.findMany({
      where: { siteId: id },
      orderBy: { order: "asc" },
      select: { id: true, question: true, answer: true },
    }),
  ]);

  return (
    <SettingsTabs
      siteId={id}
      businessName={site.businessName}
      slug={site.slug}
      siteUrl={publicOrigin(site.slug)}
      initialLogoUrl={site.logoUrl ?? null}
      initialBasics={{
        businessName: site.businessName,
        slug: site.slug,
        language: site.language === "en" ? "en" : "ar",
      }}
      initialTheme={{
        paletteKey: theme?.paletteKey ?? null,
        primaryColor: theme?.primaryColor ?? null,
        secondaryColor: theme?.secondaryColor ?? null,
        fontKey: theme?.fontKey ?? null,
        headerVariant: theme?.headerVariant ?? null,
        headerScheme: theme?.headerScheme ?? null,
        footerVariant: theme?.footerVariant ?? null,
        footerScheme: theme?.footerScheme ?? null,
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
      }}
      initialSeo={asSiteSeo(siteRow?.seo)}
      lists={{ services, team, testimonials, faq }}
    />
  );
}
