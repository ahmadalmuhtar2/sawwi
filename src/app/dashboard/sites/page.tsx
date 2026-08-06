import { Globe } from "lucide-react";
import { getSessionClaims } from "@/lib/auth";
import { listSites } from "@/server/sites/sites.service";
import { displayStatus, daysUntil } from "@/server/billing/billing.rules";
import { unreadCountsForSites } from "@/server/messages/messages.service";
import { visitCountsForSites } from "@/server/visits/visits.service";
import { canManageWorkspace } from "@/server/access/access.rules";
import { getTemplate } from "@/templates/registry";
import { formatArabicDate } from "@/lib/expiry-format";
import { siteHost, siteLogo } from "@/lib/site-url";
import { EmptyState } from "@/components/ui/feedback";
import { CreateSiteButton } from "@/components/dashboard/create-site";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { SitesTable } from "@/components/dashboard/sites-table";
import {
  type SiteRow,
  SITE_FILTERS,
  SITE_FILTER_MATCH,
  parseSiteFilter,
} from "@/components/dashboard/sites-filter";

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const claims = await getSessionClaims();
  const sites = claims ? await listSites(claims) : [];
  const siteIds = sites.map((s) => s.id);
  // Unread visitor-message counts (row menu) + counted visits (الزيارات column).
  const [unreadBySite, visitsBySite] = sites.length
    ? await Promise.all([unreadCountsForSites(siteIds), visitCountsForSites(siteIds)])
    : [{} as Record<string, number>, {} as Record<string, number>];
  // Resellers create freely; a direct owner may create only their first site;
  // business owners (no workspace) never create.
  const canCreate =
    claims?.workspace?.kind === "reseller" ||
    (claims?.workspace?.kind === "direct" && sites.length === 0);

  const now = new Date();
  const rows: SiteRow[] = sites.map((s) => ({
    id: s.id,
    businessName: s.businessName,
    slug: s.slug,
    host: siteHost(s.slug),
    status: s.status as SiteRow["status"],
    templateKey: s.templateKey,
    templateLabel: getTemplate(s.templateKey)?.label ?? s.verticalKey,
    logoUrl: siteLogo(s.logoUrl, s.content),
    unread: unreadBySite[s.id] ?? 0,
    visits: visitsBySite[s.id] ?? 0,
    canDelete: claims ? canManageWorkspace(claims, s.workspaceId) : false,
    expiry: s.subscription
      ? {
          status: displayStatus(s.subscription.expiry, now),
          dateLabel: formatArabicDate(s.subscription.expiry),
          daysLeft: daysUntil(s.subscription.expiry, now),
        }
      : null,
  }));

  // URL-driven, server-side filtering. Chips shown = "الكل" + any category that
  // exists in the FULL set; the active filter narrows the rows we hand the table.
  const active = parseSiteFilter((await searchParams).filter);
  const available = SITE_FILTERS.filter((k) => k === "all" || rows.some(SITE_FILTER_MATCH[k]));
  const visible = rows.filter(SITE_FILTER_MATCH[active]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="المواقع" subtitle="أنشئ وأدر مواقع عملائك.">
        {canCreate && <CreateSiteButton />}
      </PageHeader>

      {rows.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<Globe className="size-6" />}
            title="لا مواقع بعد"
            body="ابدأ بإنشاء موقع من قالب جاهز لمجالك."
            action={canCreate ? <CreateSiteButton /> : undefined}
          />
        </Panel>
      ) : (
        <SitesTable rows={visible} available={available} active={active} />
      )}
    </div>
  );
}
