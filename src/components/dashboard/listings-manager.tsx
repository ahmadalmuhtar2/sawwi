"use client";

// The owner's inventory dashboard for a marketplace site: list every listing
// (any status), publish/unpublish, feature (مميّز), set status (متاح/محجوز/مُباع),
// edit, and delete. "Add" opens the schema-driven stepper (create/edit).

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Plus, Star, Pencil, Trash2, Car, Home, PackageOpen } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { formatArabicAmount } from "@/shared/currency";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { MenuSelect } from "@/components/ui/dropdown";
import { ListingStepper } from "@/components/dashboard/listing-stepper";
import {
  STATUS_LABEL, VERTICAL_LABEL, cardSpecLine,
  type MarketplaceListing, type Vertical, type ListingStatus,
} from "@/templates/marketplace/schema";

const AR = "٠١٢٣٤٥٦٧٨٩";
const toAr = (v: unknown) => String(v ?? "").replace(/[0-9]/g, (d) => AR[+d]);

// The API returns raw rows; narrow them to the view shape.
type Row = Record<string, unknown>;
function toView(r: Row): MarketplaceListing {
  return {
    id: String(r.id),
    vertical: r.vertical as Vertical,
    title: String(r.title ?? ""),
    price: (r.price as number) ?? null,
    offer: (r.offer as string) ?? null,
    place: (r.place as string) ?? null,
    description: (r.description as string) ?? null,
    images: Array.isArray(r.images) ? (r.images as string[]) : [],
    features: Array.isArray(r.features) ? (r.features as string[]) : [],
    specs: (r.specs && typeof r.specs === "object" ? r.specs : {}) as Record<string, string | number>,
    featured: Boolean(r.featured),
    status: (r.status as ListingStatus) ?? "available",
    published: Boolean((r as { published?: boolean }).published),
  } as MarketplaceListing & { published: boolean };
}

type WithPub = MarketplaceListing & { published?: boolean };

export function ListingsManager({
  siteId,
  businessName,
  currency,
  initial,
}: {
  siteId: string;
  businessName: string;
  currency: string;
  initial: WithPub[];
}) {
  const toast = useToast();
  const [listings, setListings] = React.useState<WithPub[]>(initial);
  const [view, setView] = React.useState<{ mode: "list" } | { mode: "form"; vertical: Vertical; editing: MarketplaceListing | null }>({ mode: "list" });
  const [adding, setAdding] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    try {
      const rows = await api.get<Row[]>(`/api/sites/${siteId}/listings`);
      setListings(rows.map(toView));
    } catch {
      toast("تعذّر تحديث القائمة", "error");
    }
  }, [siteId, toast]);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(id);
    try {
      await api.put(`/api/sites/${siteId}/listings/${id}`, body);
      await reload();
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر التحديث", "error");
    }
    setBusy(null);
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا الإعلان نهائيًا؟")) return;
    setBusy(id);
    try {
      await api.del(`/api/sites/${siteId}/listings/${id}`);
      toast("تم حذف الإعلان");
      await reload();
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر الحذف", "error");
    }
    setBusy(null);
  }

  if (view.mode === "form") {
    return (
      <div className="mx-auto max-w-4xl">
        <button onClick={() => setView({ mode: "list" })} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink">
          <ArrowRight className="size-4" /> عودة إلى الإعلانات
        </button>
        <h1 className="mb-1 text-2xl font-extrabold text-ink">{view.editing ? "تعديل إعلان" : `إعلان جديد — ${VERTICAL_LABEL[view.vertical]}`}</h1>
        <p className="mb-6 text-sm text-muted">كل حقل تعبّئه يصبح فلترًا يجده الزائر. الحقول المطلوبة تنشئ الإعلان، والاختيارية ترفعه في البحث.</p>
        <ListingStepper
          siteId={siteId}
          vertical={view.vertical}
          currency={currency}
          initial={view.editing}
          onDone={() => { setView({ mode: "list" }); void reload(); }}
          onCancel={() => setView({ mode: "list" })}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start gap-3">
        <Link href={`/dashboard/sites/${siteId}`} className="rounded-md p-1.5 text-muted transition hover:bg-black/[0.04] hover:text-ink dark:hover:bg-white/6" aria-label="رجوع">
          <ArrowRight className="size-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-ink">الإعلانات</h1>
          <p className="mt-0.5 text-sm text-muted">إدارة إعلانات <span className="font-medium text-ink">{businessName}</span> — {toAr(listings.length)} إعلان.</p>
        </div>
        <div className="relative">
          <Button onClick={() => setAdding((a) => !a)}><Plus className="size-4" /> أضف إعلان</Button>
          {adding && (
            <div className="absolute end-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-line bg-surface p-1 shadow-lg">
              <button onClick={() => { setAdding(false); setView({ mode: "form", vertical: "car", editing: null }); }} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink hover:bg-black/[0.04] dark:hover:bg-white/6">
                <Car className="size-4 text-muted" /> سيارة
              </button>
              <button onClick={() => { setAdding(false); setView({ mode: "form", vertical: "home", editing: null }); }} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink hover:bg-black/[0.04] dark:hover:bg-white/6">
                <Home className="size-4 text-muted" /> عقار
              </button>
            </div>
          )}
        </div>
      </div>

      {listings.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PackageOpen className="size-6" />}
            title="لا إعلانات بعد"
            body="أضف أول سيارة أو عقار — سيظهر مباشرة في موقعك المنشور مع الفلاتر."
            action={<Button onClick={() => setView({ mode: "form", vertical: "car", editing: null })}><Plus className="size-4" /> أضف إعلان</Button>}
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {listings.map((l) => (
            <li key={l.id}>
              <Card className="flex items-center gap-4 p-3.5">
                <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/[0.04] text-faint dark:bg-white/5">
                  {l.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL
                    <img src={l.images[0]} alt="" className="size-full object-cover" />
                  ) : l.vertical === "car" ? <Car className="size-5" /> : <Home className="size-5" />}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-bold text-ink">{l.title || "—"}</span>
                    {l.featured && <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[11px] font-bold text-accent-900">مميّز</span>}
                    <span className={"rounded-full px-2 py-0.5 text-[11px] font-medium " + (l.published ? "bg-emerald-100 text-emerald-700" : "bg-black/[0.06] text-muted dark:bg-white/8")}>{l.published ? "منشور" : "مسودة"}</span>
                    {l.status && l.status !== "available" && <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] font-medium text-muted dark:bg-white/8">{STATUS_LABEL[l.status]}</span>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">{cardSpecLine(l)}</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{l.price != null ? `${formatArabicAmount(l.price)} ${currency}` : "حسب الطلب"}</p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <MenuSelect
                    value={l.status ?? "available"}
                    ariaLabel="الحالة"
                    options={(["available", "reserved", "sold"] as ListingStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
                    onChange={(v) => patch(l.id, { status: v })}
                    className="w-28"
                  />
                  <button onClick={() => patch(l.id, { featured: !l.featured })} disabled={busy === l.id} title={l.featured ? "إلغاء التمييز" : "تمييز"} className={"rounded-md p-2 transition disabled:opacity-40 " + (l.featured ? "text-accent" : "text-muted hover:text-ink")}>
                    <Star className={"size-4 " + (l.featured ? "fill-current" : "")} />
                  </button>
                  <button onClick={() => patch(l.id, { published: !l.published })} disabled={busy === l.id} className="rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition hover:bg-black/[0.04] disabled:opacity-40 dark:hover:bg-white/6">
                    {l.published ? "إخفاء" : "نشر"}
                  </button>
                  <button onClick={() => setView({ mode: "form", vertical: l.vertical, editing: l })} title="تعديل" className="rounded-md p-2 text-muted transition hover:text-ink">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => remove(l.id)} disabled={busy === l.id} title="حذف" className="rounded-md p-2 text-muted transition hover:bg-danger-100 hover:text-danger disabled:opacity-40">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
