import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { getSite } from "@/server/sites/sites.service";
import { getPrisma } from "@/lib/db";
import { symbolOf } from "@/shared/currency";
import { defaultCurrencyOf } from "@/templates/registry";
import { ContentEditor } from "@/components/templates/content-editor";

export default async function SiteEditorPage({
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

  const perms = resolveSiteAccess(claims, site);
  // Editing content requires settings edit. Read-only viewers can't reach here.
  if (!perms.canEditSettings) {
    redirect(`/dashboard/sites/${id}/settings`);
  }

  const [theme, settings] = await Promise.all([
    getPrisma().siteTheme.findUnique({
      where: { siteId: id },
      select: { primaryColor: true, secondaryColor: true, bgColor: true, fontKey: true },
    }),
    getPrisma().siteSettings.findUnique({
      where: { siteId: id },
      select: { currency: true },
    }),
  ]);
  // Same source as the public/preview render: the site's chosen currency symbol.
  const currency = symbolOf(settings?.currency ?? defaultCurrencyOf(site.templateKey));

  return (
    <ContentEditor
      siteId={site.id}
      templateKey={site.templateKey ?? ""}
      slug={site.slug}
      status={site.status}
      currency={currency}
      canManageBilling={perms.canManageBilling}
      canEditBuilder={perms.canEditBuilder}
      canPublish={perms.canPublish}
      initialMaintenance={site.maintenanceMode}
      initialContent={(site.content as Record<string, unknown>) ?? {}}
      initialTheme={{
        accent: theme?.primaryColor ?? null,
        ground: theme?.bgColor ?? null,
        ink: theme?.secondaryColor ?? null,
        fontKey: theme?.fontKey ?? null,
      }}
    />
  );
}
