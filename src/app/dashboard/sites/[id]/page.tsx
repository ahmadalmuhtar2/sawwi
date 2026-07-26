import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { getSite } from "@/server/sites/sites.service";
import { getPrisma } from "@/lib/db";
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

  // Editing content requires settings edit. Read-only viewers can't reach here.
  if (!resolveSiteAccess(claims, site).canEditSettings) {
    redirect(`/dashboard/sites/${id}/settings`);
  }

  const theme = await getPrisma().siteTheme.findUnique({
    where: { siteId: id },
    select: { primaryColor: true, secondaryColor: true, bgColor: true, fontKey: true },
  });

  return (
    <ContentEditor
      siteId={site.id}
      templateKey={site.templateKey ?? ""}
      slug={site.slug}
      status={site.status}
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
