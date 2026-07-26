import Link from "next/link";
import { Globe, CheckCircle2, PlusCircle, ArrowLeft } from "lucide-react";
import { getSessionClaims } from "@/lib/auth";
import { listSites } from "@/server/sites/sites.service";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { siteHost } from "@/lib/site-url";

export default async function DashboardHome() {
  const claims = await getSessionClaims();
  const sites = claims ? await listSites(claims) : [];
  const published = sites.filter((s) => s.status === "published").length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">لوحة التحكم</h1>
          <p className="mt-1 text-sm text-muted">نظرة عامة على مواقعك.</p>
        </div>
        <Link href="/dashboard/sites/new">
          <Button className="gap-2">
            <PlusCircle className="size-4" /> موقع جديد
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={<Globe className="size-5" />} kicker="إجمالي المواقع" value={sites.length} />
        <StatTile icon={<CheckCircle2 className="size-5" />} kicker="منشورة" value={published} />
        <StatTile icon={<Globe className="size-5" />} kicker="مسودات" value={sites.length - published} />
      </div>

      <Card className="mt-6 p-1">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-bold text-ink">أحدث المواقع</h2>
          <Link href="/dashboard/sites" className="text-sm text-accent hover:underline">
            عرض الكل
          </Link>
        </div>
        {sites.length === 0 ? (
          <EmptyState
            icon={<Globe className="size-6" />}
            title="لا مواقع بعد"
            body="أنشئ أول موقع من قالب جاهز وابدأ التخصيص."
            action={
              <Link href="/dashboard/sites/new">
                <Button className="gap-2">
                  أنشئ موقعك الأول <ArrowLeft className="size-4" />
                </Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {sites.slice(0, 6).map((s) => (
              <li key={s.id}>
                <Link
                  href={`/dashboard/sites/${s.id}`}
                  className="flex items-center justify-between px-5 py-3.5 transition hover:bg-black/[0.02] dark:hover:bg-white/4"
                >
                  <div>
                    <p className="font-medium text-ink">{s.businessName}</p>
                    <p className="font-label text-[11px] text-faint">
                      {siteHost(s.slug)}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatTile({
  icon,
  kicker,
  value,
}: {
  icon: React.ReactNode;
  kicker: string;
  value: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-muted">
        <span className="text-accent">{icon}</span>
        <span className="text-sm">{kicker}</span>
      </div>
      <p className="mt-2 text-3xl font-extrabold text-ink">{value}</p>
    </Card>
  );
}
