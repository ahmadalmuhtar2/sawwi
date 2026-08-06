import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, ArrowLeft, Globe, CheckCircle2 } from "lucide-react";
import { getSessionClaims } from "@/lib/auth";
import { listSites } from "@/server/sites/sites.service";
import { displayStatus, daysUntil } from "@/server/billing/billing.rules";
import { getTemplate } from "@/templates/registry";
import { formatArabicDate } from "@/lib/expiry-format";
import { siteHost } from "@/lib/site-url";
import { Button } from "@/components/ui/button";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import {
  PageHeader,
  StatGrid,
  StatCell,
  Panel,
  SiteThumb,
  toArabicDigits,
} from "@/components/dashboard/ui";

export default async function DashboardHome() {
  const claims = await getSessionClaims();
  const sites = claims ? await listSites(claims) : [];

  // Persona routing: only resellers & admins get the portfolio landing. A
  // business owner (site-scoped) or a direct owner is dropped straight into
  // their single site — they never see a portfolio.
  if (claims && claims.platformRole !== "admin") {
    const isReseller = claims.workspace?.kind === "reseller";
    if (!isReseller) {
      if (sites.length === 1) redirect(`/dashboard/sites/${sites[0].id}`);
      if (sites.length === 0 && claims.workspace?.kind === "direct") {
        redirect("/dashboard/sites/new"); // direct owner builds their one site
      }
    }
  }

  const canCreate = claims?.workspace?.kind === "reseller" || claims?.platformRole === "admin";
  const now = new Date();

  // Real expiry per site (only reseller-tier sites carry a subscription).
  const rows = sites.map((s) => {
    const exp = s.subscription
      ? {
          status: displayStatus(s.subscription.expiry, now),
          daysLeft: daysUntil(s.subscription.expiry, now),
          expiry: s.subscription.expiry,
        }
      : null;
    return { site: s, exp };
  });

  const published = sites.filter((s) => s.status === "published").length;
  const drafts = sites.length - published;
  const attention = rows.filter((r) => r.exp && r.exp.status !== "active");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="لوحة التحكم" subtitle="نظرة عامة على مواقعك.">
        {canCreate && (
          <Link href="/dashboard/sites/new">
            <Button className="gap-2">
              <PlusCircle className="size-4" /> موقع جديد
            </Button>
          </Link>
        )}
      </PageHeader>

      <div className="mb-5">
        <StatGrid>
          <StatCell label="مواقع منشورة" value={toArabicDigits(published)} href="/dashboard/sites?filter=published" />
          <StatCell label="قيد التصميم" value={toArabicDigits(drafts)} hint="لم تُنشر بعد" href="/dashboard/sites?filter=draft" />
          <StatCell
            label="تنتهي قريبًا"
            value={toArabicDigits(attention.length)}
            valueTone={attention.length ? "warn" : undefined}
            hint={attention.length ? "تحتاج تجديدًا" : "كل الاشتراكات فعّالة"}
            hintTone={attention.length ? "warn" : "up"}
            href="/dashboard/sites?filter=expiring"
          />
          <StatCell label="إجمالي المواقع" value={toArabicDigits(sites.length)} href="/dashboard/sites" />
        </StatGrid>
      </div>

      <div className="grid gap-4.5 lg:grid-cols-[1.55fr_1fr]">
        {/* Recent sites */}
        <Panel
          title="أحدث المواقع"
          action={
            <Link href="/dashboard/sites" className="text-accent-300 hover:underline">
              عرض الكل ←
            </Link>
          }
        >
          {sites.length === 0 ? (
            <EmptyState
              icon={<Globe className="size-6" />}
              title="لا مواقع بعد"
              body="أنشئ أول موقع من قالب جاهز وابدأ التخصيص."
              action={
                canCreate ? (
                  <Link href="/dashboard/sites/new">
                    <Button className="gap-2">
                      أنشئ موقعك الأول <ArrowLeft className="size-4" />
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>الموقع</Th>
                  <Th>القالب</Th>
                  <Th>الحالة</Th>
                  <Th>ينتهي</Th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 6).map(({ site, exp }) => (
                  <tr
                    key={site.id}
                    className="border-b border-line transition-colors last:border-0 hover:bg-black/2 dark:hover:bg-white/3"
                  >
                    <Td>
                      <Link href={`/dashboard/sites/${site.id}`} className="flex items-center gap-3">
                        <SiteThumb name={site.businessName} logoUrl={site.logoUrl} />
                        <span className="min-w-0">
                          <span className="block truncate text-[13.5px] text-ink">{site.businessName}</span>
                          <span className="block truncate font-mono text-[11.5px] text-faint" dir="ltr">
                            {siteHost(site.slug)}
                          </span>
                        </span>
                      </Link>
                    </Td>
                    <Td className="text-muted">{getTemplate(site.templateKey)?.label ?? site.verticalKey}</Td>
                    <Td>
                      <StatusBadge status={site.status} />
                    </Td>
                    <Td className="text-muted">{exp ? formatArabicDate(exp.expiry) : "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        {/* Needs attention — real expiring/expired subscriptions */}
        <Panel title="تحتاج انتباهك">
          {attention.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <CheckCircle2 className="size-7 text-accent-300" />
              <p className="text-[13.5px] text-muted">كل الاشتراكات فعّالة — لا شيء يحتاج انتباهك.</p>
            </div>
          ) : (
            <ul>
              {attention.slice(0, 6).map(({ site, exp }) => {
                const expired = exp!.status === "expired";
                return (
                  <li
                    key={site.id}
                    className="flex items-center gap-3 border-b border-line px-4.5 py-3.25 last:border-0"
                  >
                    <SiteThumb name={site.businessName} logoUrl={site.logoUrl} />
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/sites/${site.id}`}
                        className="block truncate text-[13.5px] text-ink hover:underline"
                      >
                        {site.businessName}
                      </Link>
                      <p className="mt-0.5 text-[11.5px] text-faint">
                        {expired ? "انتهى الاشتراك — يحتاج تجديدًا" : `ينتهي خلال ${toArabicDigits(exp!.daysLeft)} يوم`}
                      </p>
                    </div>
                    <span className="ms-auto shrink-0">
                      <Badge tone={expired ? "danger" : "warn"}>
                        {expired ? "منتهٍ" : `${toArabicDigits(exp!.daysLeft)} يوم`}
                      </Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-line px-4.5 py-2.75 text-start text-[11px] font-normal tracking-wide whitespace-nowrap text-faint">
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4.5 py-3.25 text-[13.5px] align-middle ${className ?? ""}`}>{children}</td>;
}
