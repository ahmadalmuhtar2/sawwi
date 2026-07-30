"use client";

// A fixed bottom strip shown to a business owner INSIDE the site editor when
// their subscription is expiring soon or already expired. It fetches its own
// read-only view (canViewBilling) so it can be dropped anywhere with just a
// siteId. Renders nothing while the subscription is active (or absent), so it
// never disturbs the normal editing experience.

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";
import { toArabicDigits } from "@/components/templates/inline-edit";

interface ExpiryView {
  subscription: { expiry: string; status: "active" | "expiring" | "expired"; daysLeft: number } | null;
  provider: { name: string | null; whatsapp: string | null };
}

export function ExpiryBanner({ siteId }: { siteId: string }) {
  const [view, setView] = React.useState<ExpiryView | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    fetch(`/api/sites/${siteId}/subscription/view`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setView(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [siteId]);

  const sub = view?.subscription;
  if (dismissed || !sub || sub.status === "active") return null;

  const expired = sub.status === "expired";
  const msg = expired
    ? "انتهى اشتراك موقعك، ولم يعد ظاهرًا للزوّار."
    : `ينتهي اشتراك موقعك خلال ${toArabicDigits(String(sub.daysLeft))} يوم.`;
  const wa = view?.provider.whatsapp;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 py-2.5 text-sm text-white shadow-lg pb-[calc(env(safe-area-inset-bottom)+0.625rem)] ${
        expired ? "bg-red-600" : "bg-amber-600"
      }`}
    >
      <AlertTriangle className="size-4 shrink-0" />
      <span className="font-medium">{msg}</span>
      {wa ? (
        <a
          href={whatsappLink(wa, "مرحبًا، أريد تجديد اشتراك موقعي.")}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-white/20 px-2.5 py-1 text-xs font-semibold hover:bg-white/30"
        >
          تواصل مع مزوّد الخدمة{view?.provider.name ? ` (${view.provider.name})` : ""}
        </a>
      ) : (
        <Link
          href={`/dashboard/sites/${siteId}/subscription`}
          className="rounded-md bg-white/20 px-2.5 py-1 text-xs font-semibold hover:bg-white/30"
        >
          تفاصيل الاشتراك
        </Link>
      )}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="إخفاء"
        className="absolute end-2 rounded p-1 hover:bg-white/20"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
