import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, CalendarClock, MessageCircle } from "lucide-react";
import { getSessionClaims } from "@/lib/auth";
import { getSiteExpiryView } from "@/server/billing/billing.service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { whatsappLink } from "@/lib/whatsapp";
import { expiryLabel, formatArabicDate } from "@/lib/expiry-format";
import { toArabicDigits } from "@/components/templates/inline-edit";

// Read-only الاشتراك tab for the business owner: paid-through date, status, and
// how to renew (contact the reseller). No payment history, no controls.
export default async function SubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");

  let view;
  try {
    view = await getSiteExpiryView(claims, id);
  } catch {
    notFound();
  }

  const sub = view.subscription;
  const badge = sub ? expiryLabel(sub.status) : null;
  const wa = view.provider.whatsapp;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/dashboard/sites/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowRight className="size-4" /> رجوع إلى الموقع
      </Link>

      <h1 className="text-2xl font-extrabold text-ink">الاشتراك</h1>
      <p className="mt-1 text-sm text-muted">{view.businessName}</p>

      <Card className="mt-6 p-6">
        {sub ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">الحالة</span>
              {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
            </div>
            <div className="flex items-center justify-between border-t border-line pt-4">
              <span className="inline-flex items-center gap-2 text-sm text-muted">
                <CalendarClock className="size-4" /> ينتهي في
              </span>
              <span className="font-semibold text-ink">{formatArabicDate(sub.expiry)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-4">
              <span className="text-sm text-muted">الأيام المتبقية</span>
              <span className="font-semibold text-ink">
                {sub.daysLeft >= 0
                  ? `${toArabicDigits(String(sub.daysLeft))} يوم`
                  : "منتهٍ"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">لا يوجد اشتراك مسجّل لهذا الموقع بعد.</p>
        )}

        {(sub?.status === "expiring" || sub?.status === "expired" || !sub) && (
          <div className="mt-6 rounded-lg border border-line bg-bg/40 p-4">
            <p className="text-sm text-ink">
              لتجديد الاشتراك، تواصل مع مزوّد الخدمة
              {view.provider.name ? ` (${view.provider.name})` : ""}.
            </p>
            {wa && (
              <a
                href={whatsappLink(wa, "مرحبًا، أريد تجديد اشتراك موقعي.")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
              >
                <MessageCircle className="size-4" /> تواصل عبر واتساب
              </a>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
