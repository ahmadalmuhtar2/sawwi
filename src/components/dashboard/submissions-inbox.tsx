"use client";

// The site's leads inbox — «الطلبات». All strings here are TEMPLATE-level (not
// شغلة-specific): any submission-collecting template reuses this screen. Filters
// are URL-driven + server-side; status edits, manual entry, and CSV export are
// authorized exactly like the table (site access, enforced server-side).

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Download, Search, MessageCircle, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { formatArabicDate } from "@/lib/expiry-format";
import { KIND_LABEL, STATUS_LABEL, STATUS_ORDER, SOURCE_LABEL, SERVICE_CATEGORY_OTHER, SERVICE_OPTIONS, type SubmissionStatus } from "@/shared/submissions";
import { SYRIAN_REGIONS, REGION_OTHER } from "@/shared/syria";
import { PageHeader, Panel, FilterChips, toArabicDigits } from "@/components/dashboard/ui";
import { MenuSelect } from "@/components/ui/dropdown";
import { PhoneInput } from "@/components/ui/phone-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export interface Row {
  id: string;
  kind: "PROVIDER" | "CUSTOMER";
  status: SubmissionStatus;
  name: string;
  phone: string;
  category: string;
  area: string;
  source: string;
  hasImages: boolean;
  createdAt: string;
}

const STATUS_TONE: Record<SubmissionStatus, "neutral" | "accent" | "warn" | "danger"> = {
  NEW: "warn",
  REVIEWING: "neutral",
  ACCEPTED: "accent",
  REJECTED: "danger",
  CONTACTED: "accent",
};

const waHref = (phone: string, greeting: string) => {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(greeting)}`;
};

export function SubmissionsInbox({
  siteId, businessName, rows, total, page, pageSize, categories, filters, canManage,
}: {
  siteId: string;
  businessName: string;
  rows: Row[];
  total: number;
  page: number;
  pageSize: number;
  categories: string[];
  filters: { kind: string; status: string; category: string; q: string };
  canManage: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();
  const [manual, setManual] = React.useState(false);
  const [term, setTerm] = React.useState(filters.q);

  const setParams = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("page" in patch)) next.delete("page"); // any filter change resets to page 1
    router.push(`?${next.toString()}`, { scroll: false });
  };

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const exportHref = `/api/sites/${siteId}/submissions/export?${new URLSearchParams(sp.toString()).toString()}`;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="الطلبات" subtitle={businessName}>
        <a href={exportHref} className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-[13px] text-muted transition hover:text-ink">
          <Download className="size-4" /> تصدير CSV
        </a>
        {canManage && (
          <Button className="gap-2" onClick={() => setManual(true)}>
            <Plus className="size-4" /> إضافة يدوي
          </Button>
        )}
      </PageHeader>

      {/* tabs (kind) */}
      <FilterChips
        className="mb-3"
        options={[
          { key: "all", label: "الكل" },
          { key: "PROVIDER", label: "مزوّدين" },
          { key: "CUSTOMER", label: "زبائن" },
        ]}
        value={filters.kind}
        onChange={(k) => setParams({ kind: k })}
      />

      {/* filters + search */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <MenuSelect
          value={filters.status}
          onChange={(v) => setParams({ status: v })}
          options={[{ value: "all", label: "كل الحالات" }, ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABEL[s] }))]}
        />
        <MenuSelect
          value={filters.category || "all"}
          onChange={(v) => setParams({ category: v === "all" ? "" : v })}
          options={[{ value: "all", label: "كل الخدمات" }, ...categories.map((c) => ({ value: c, label: c }))]}
        />
        <form
          onSubmit={(e) => { e.preventDefault(); setParams({ q: term.trim() }); }}
          className="flex min-w-52 flex-1 items-center gap-2 rounded-md border border-line px-3 py-2"
        >
          <Search className="size-4 text-faint" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="ابحث بالاسم أو الرقم"
            className="w-full bg-transparent text-[13.5px] outline-none"
          />
        </form>
      </div>

      <Panel>
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center text-[14px] text-muted">لسا ما إجا ولا طلب.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["التاريخ", "النوع", "الاسم", "رقم الواتساب", "الخدمة", "المنطقة", "المصدر", "الحالة"].map((h) => (
                    <th key={h} className="border-b border-line px-3.5 py-2.75 text-start text-[11px] font-normal whitespace-nowrap text-faint">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line transition-colors last:border-0 hover:bg-black/2 dark:hover:bg-white/3">
                    <Td className="whitespace-nowrap text-muted">{formatArabicDate(new Date(r.createdAt))}</Td>
                    <Td><Badge tone={r.kind === "PROVIDER" ? "accent" : "neutral"}>{KIND_LABEL[r.kind]}</Badge></Td>
                    <Td>
                      <Link href={`/dashboard/sites/${siteId}/submissions/${r.id}`} className="inline-flex items-center gap-1.5 font-medium text-ink hover:underline">
                        {r.name}
                        {r.hasImages && <Camera className="size-3.5 text-faint" aria-label="فيه صور" />}
                      </Link>
                    </Td>
                    <Td>
                      <a href={waHref(r.phone, `مرحبا ${r.name}، معك «${businessName}».`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-accent-300 hover:underline" dir="ltr">
                        <MessageCircle className="size-3.5" /> {r.phone}
                      </a>
                    </Td>
                    <Td className="text-muted">{r.category}</Td>
                    <Td className="text-muted">{r.area}</Td>
                    <Td className="text-faint">{SOURCE_LABEL[r.source] ?? r.source}</Td>
                    <Td>
                      {/* Read-only here — status is changed only from the submission's
                          detail page (approving a provider there auto-adds it to the directory). */}
                      <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* pagination */}
      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-[13px] text-muted">
          <button disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) })} className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 disabled:opacity-40">
            <ChevronRight className="size-4" /> السابق
          </button>
          <span>صفحة {toArabicDigits(page)} من {toArabicDigits(pageCount)}</span>
          <button disabled={page >= pageCount} onClick={() => setParams({ page: String(page + 1) })} className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 disabled:opacity-40">
            التالي <ChevronLeft className="size-4" />
          </button>
        </div>
      )}

      {manual && (
        <ManualModal
          siteId={siteId}
          onClose={() => setManual(false)}
          onDone={() => { setManual(false); toast("تمت الإضافة ✓"); router.refresh(); }}
        />
      )}
    </div>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3.5 py-3 text-[13.5px] align-middle ${className ?? ""}`}>{children}</td>;
}

/* ─────────────────── manual entry (source = manual) ─────────────────── */
function ManualModal({ siteId, onClose, onDone }: { siteId: string; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = React.useState({ kind: "PROVIDER", name: "", phone: "", category: "", area: "", details: "" });
  const [busy, setBusy] = React.useState(false);
  const [fields, setFields] = React.useState<Record<string, string>>({});
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setFields({});
    try {
      const res = await fetch(`/api/sites/${siteId}/submissions/manual`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(f),
      });
      const json = (await res.json()) as { ok: boolean; error?: { message?: string; fields?: Record<string, string> } };
      if (json.ok) onDone();
      else { setFields(json.error?.fields ?? {}); toast(json.error?.message ?? "تعذّرت الإضافة", "error"); }
    } catch {
      toast("تعذّر الاتصال", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-3 text-[16px] font-semibold text-ink">إضافة طلب يدوي</h2>
        <FilterChips
          className="mb-4"
          options={[{ key: "PROVIDER", label: "مزوّد" }, { key: "CUSTOMER", label: "زبون" }]}
          value={f.kind}
          onChange={(k) => set("kind", k)}
        />
        <div className="space-y-3">
          <MField label="الاسم" error={fields.name}><input value={f.name} onChange={(e) => set("name", e.target.value)} className={mInput} /></MField>
          <MField label="رقم الواتساب" error={fields.phone}><PhoneInput value={f.phone} onChange={(v) => set("phone", v)} /></MField>
          <MField label="الخدمة" error={fields.category}>
            <input list="mcats" value={f.category} onChange={(e) => set("category", e.target.value)} className={mInput} />
            <datalist id="mcats">{[...SERVICE_OPTIONS, SERVICE_CATEGORY_OTHER].map((c) => <option key={c} value={c} />)}</datalist>
          </MField>
          <MField label="المنطقة" error={fields.area}>
            <MenuSelect
              value={f.area || ""}
              onChange={(v) => set("area", v)}
              options={[{ value: "", label: "اختر المنطقة" }, ...SYRIAN_REGIONS.map((r) => ({ value: r, label: r })), { value: REGION_OTHER, label: REGION_OTHER }]}
            />
          </MField>
          <MField label="تفاصيل (اختياري)" error={fields.details}><textarea value={f.details} onChange={(e) => set("details", e.target.value)} rows={2} className={mInput} /></MField>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-line px-4 py-2 text-[13.5px] text-muted">إلغاء</button>
          <Button type="submit" disabled={busy}>{busy ? "…" : "إضافة"}</Button>
        </div>
      </form>
    </div>
  );
}

const mInput = "w-full rounded-md border border-line bg-bg px-3 py-2 text-[14px] outline-none focus:border-accent";
function MField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12.5px] text-muted">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[12px] text-danger">{error}</span>}
    </label>
  );
}
