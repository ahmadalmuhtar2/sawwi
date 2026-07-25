import Link from "next/link";
import { Globe, ExternalLink } from "lucide-react";
import { getSessionClaims } from "@/lib/auth";
import { listSites } from "@/server/sites/sites.service";
import { canManageWorkspace } from "@/server/access/access.rules";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { CreateSiteButton } from "@/components/dashboard/create-site";
import { SiteActionsMenu } from "@/components/dashboard/site-actions-menu";

export default async function SitesPage() {
  const claims = await getSessionClaims();
  const sites = claims ? await listSites(claims) : [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">المواقع</h1>
          <p className="mt-1 text-sm text-muted">أنشئ وأدر مواقع عملائك.</p>
        </div>
        {claims?.workspace && <CreateSiteButton />}
      </div>

      {sites.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Globe className="size-6" />}
            title="لا مواقع بعد"
            body="ابدأ بإنشاء موقع من قالب جاهز لمجالك."
            action={claims?.workspace ? <CreateSiteButton /> : undefined}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((s) => (
            <Card key={s.id} className="flex flex-col p-5 transition hover:shadow-md">
              <div className="flex items-start justify-between">
                {s.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL
                  <img
                    src={s.logoUrl}
                    alt={s.businessName}
                    className="size-11 rounded-lg border border-line object-cover"
                  />
                ) : (
                  <div className="flex size-11 items-center justify-center rounded-lg bg-accent-100 text-accent">
                    <Globe className="size-5" />
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <StatusBadge status={s.status} />
                  <SiteActionsMenu
                    site={{ id: s.id, slug: s.slug, businessName: s.businessName, status: s.status }}
                    canDelete={claims ? canManageWorkspace(claims, s.workspaceId) : false}
                  />
                </div>
              </div>
              <h3 className="mt-4 font-bold text-ink">{s.businessName}</h3>
              <p className="font-label text-[11px] text-faint">{s.slug}.SAWWI.COM</p>
              <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
                <Link
                  href={`/dashboard/sites/${s.id}`}
                  className="flex-1 rounded-md bg-accent-100 py-2 text-center text-sm font-medium text-accent-900 transition hover:bg-accent-200"
                >
                  تحرير
                </Link>
                {s.status === "published" && (
                  <a
                    href={`http://${s.slug}.localhost:3000`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-line p-2 text-muted transition hover:text-ink"
                    title="فتح الموقع"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
