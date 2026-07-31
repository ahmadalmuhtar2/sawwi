import Link from "next/link";
import { Globe, ExternalLink, MessageSquare } from "lucide-react";
import { getSessionClaims } from "@/lib/auth";
import { listSites } from "@/server/sites/sites.service";
import { unreadCountsForSites } from "@/server/messages/messages.service";
import { canManageWorkspace } from "@/server/access/access.rules";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { CreateSiteButton } from "@/components/dashboard/create-site";
import { SiteActionsMenu } from "@/components/dashboard/site-actions-menu";
import { siteHost, siteUrl } from "@/lib/site-url";

export default async function SitesPage() {
  const claims = await getSessionClaims();
  const sites = claims ? await listSites(claims) : [];
  // Unread visitor-message counts, for the badge on each site card + its menu.
  const unreadBySite = sites.length ? await unreadCountsForSites(sites.map((s) => s.id)) : {};
  // Resellers create freely; a direct owner may create only their first site;
  // business owners (no workspace) never create.
  const canCreate =
    claims?.workspace?.kind === "reseller" ||
    (claims?.workspace?.kind === "direct" && sites.length === 0);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">المواقع</h1>
          <p className="mt-1 text-sm text-muted">أنشئ وأدر مواقع عملائك.</p>
        </div>
        {canCreate && <CreateSiteButton />}
      </div>

      {sites.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Globe className="size-6" />}
            title="لا مواقع بعد"
            body="ابدأ بإنشاء موقع من قالب جاهز لمجالك."
            action={canCreate ? <CreateSiteButton /> : undefined}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sites.map((s) => (
            <Card key={s.id} className="flex items-center gap-4 p-4 transition hover:shadow-md">
              {s.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL
                <img
                  src={s.logoUrl}
                  alt={s.businessName}
                  className="size-11 shrink-0 rounded-lg border border-line object-cover"
                />
              ) : (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent">
                  <Globe className="size-5" />
                </div>
              )}

              {/* Name + host — the whole block links to the editor */}
              <Link href={`/dashboard/sites/${s.id}`} className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-ink">{s.businessName}</h3>
                <p className="truncate font-label text-[11px] text-faint">{siteHost(s.slug)}</p>
              </Link>

              <div className="flex shrink-0 items-center gap-2">
                {(unreadBySite[s.id] ?? 0) > 0 && (
                  <Link
                    href={`/dashboard/sites/${s.id}/messages`}
                    className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 text-[11px] font-bold text-accent-900 transition hover:bg-accent-200"
                    title="رسائل غير مقروءة"
                  >
                    <MessageSquare className="size-3" />
                    {unreadBySite[s.id]!.toLocaleString("ar-EG")}
                  </Link>
                )}
                <StatusBadge status={s.status} />
                <Link
                  href={`/dashboard/sites/${s.id}`}
                  className="hidden rounded-md bg-accent-100 px-4 py-1.5 text-sm font-medium text-accent-900 transition hover:bg-accent-200 sm:inline-block"
                >
                  تحرير
                </Link>
                {s.status === "published" && (
                  <a
                    href={siteUrl(s.slug)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-line p-2 text-muted transition hover:text-ink"
                    title="فتح الموقع"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
                <SiteActionsMenu
                  site={{ id: s.id, slug: s.slug, businessName: s.businessName, status: s.status }}
                  canDelete={claims ? canManageWorkspace(claims, s.workspaceId) : false}
                  unread={unreadBySite[s.id] ?? 0}
                  templateKey={s.templateKey}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
