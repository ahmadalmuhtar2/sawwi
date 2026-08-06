"use client";

// Admin-only inbox of landing-page "free preview" leads, as a management table.
// Search, filter and sort are ALL server-side and reflected in the URL (shareable,
// SSR'd, back/forward works). Rows are READ-ONLY by default (status as a badge);
// the pencil flips a row into edit mode with save/cancel. Reads go through the
// server component (via URL params); writes go through /api/admin/leads then
// router.refresh() to re-pull.

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Loader2,
  MessageCircle,
  Trash2,
  Mail,
  Search,
  ArrowUp,
  ArrowDown,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { MenuSelect } from "@/components/ui/dropdown";
import { Badge } from "@/components/ui/badge";
import { FilterChips } from "@/components/dashboard/ui";
import { EmptyState } from "@/components/ui/feedback";
import { formatArabicDate } from "@/lib/expiry-format";
import { cn } from "@/lib/cn";

type Status = "new" | "contacted" | "converted" | "archived";
type Sort = "created" | "business" | "status";
type Dir = "asc" | "desc";

export interface LeadRow {
  id: string;
  businessName: string;
  whatsapp: string;
  email: string | null;
  status: Status;
  note: string | null;
  createdAt: string;
}

const STATUS: Record<Status, { label: string; tone: "warn" | "accent" | "neutral" }> = {
  new: { label: "جديد", tone: "warn" },
  contacted: { label: "تم التواصل", tone: "accent" },
  converted: { label: "تحوّل لعميل", tone: "accent" },
  archived: { label: "مؤرشف", tone: "neutral" },
};

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "new", label: "جديد" },
  { key: "contacted", label: "تم التواصل" },
  { key: "converted", label: "تحوّل" },
  { key: "archived", label: "مؤرشف" },
];

const waHref = (n: string) => `https://wa.me/${n}`;

export function LeadsAdmin({
  rows,
  counts,
  filter,
  q,
  sort,
  dir,
}: {
  rows: LeadRow[];
  counts: Record<Status, number>;
  filter: string;
  q: string;
  sort: Sort;
  dir: Dir;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const total = counts.new + counts.contacted + counts.converted + counts.archived;

  // Patch one or more URL params (null/"" removes) and navigate — the server
  // component re-runs with the new search/filter/sort.
  const setParams = React.useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  // Debounced search → ?q (only push when it actually changes).
  const [search, setSearch] = React.useState(q);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync input when the URL q changes (back/forward)
    setSearch(q);
  }, [q]);
  React.useEffect(() => {
    const id = setTimeout(() => {
      if (search.trim() !== q) setParams({ q: search.trim() || null });
    }, 350);
    return () => clearTimeout(id);
  }, [search, q, setParams]);

  const toggleSort = (key: Sort) => {
    const nextDir: Dir =
      sort !== key ? (key === "created" ? "desc" : "asc") : dir === "asc" ? "desc" : "asc";
    setParams({ sort: key, dir: nextDir });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">طلبات المعاينة</h1>
        <p className="mt-1 text-sm text-muted">
          الطلبات الواردة من صفحة الهبوط — {total} إجمالًا، {counts.new} جديدة.
        </p>
      </div>

      {/* search + filter chips */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips
          options={FILTERS.map((f) => ({ key: f.key, label: f.label }))}
          value={filter}
          onChange={(k) => setParams({ filter: k === "all" ? null : k })}
        />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الرقم أو البريد…"
            className="w-full rounded-md border border-line bg-surface py-2 pe-9 ps-3 text-sm text-ink outline-none placeholder:text-faint focus:border-accent"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-1">
          <EmptyState
            icon={<MessageCircle className="size-6" />}
            title={q || filter !== "all" ? "لا نتائج مطابقة" : "لا طلبات بعد"}
            body={
              q || filter !== "all"
                ? "جرّب تعديل البحث أو الفلتر."
                : "عند إرسال زائر لنموذج المعاينة من صفحة الهبوط، سيظهر هنا وستصلك إشعار."
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-black/[0.02] text-xs font-medium text-muted dark:bg-white/5">
                <SortTh label="النشاط التجاري" col="business" sort={sort} dir={dir} onSort={toggleSort} />
                <Th>واتساب</Th>
                <Th>البريد</Th>
                <SortTh label="الحالة" col="status" sort={sort} dir={dir} onSort={toggleSort} className="w-40" />
                <SortTh label="التاريخ" col="created" sort={sort} dir={dir} onSort={toggleSort} className="w-28" />
                <Th>ملاحظة داخلية</Th>
                <Th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => (
                <LeadTr key={lead.id} lead={lead} onChanged={() => router.refresh()} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 text-start font-medium", className)}>{children}</th>;
}

function SortTh({
  label,
  col,
  sort,
  dir,
  onSort,
  className,
}: {
  label: string;
  col: Sort;
  sort: Sort;
  dir: Dir;
  onSort: (c: Sort) => void;
  className?: string;
}) {
  const active = sort === col;
  return (
    <th className={cn("px-4 py-3 text-start font-medium", className)}>
      <button
        onClick={() => onSort(col)}
        className={cn(
          "inline-flex items-center gap-1 transition hover:text-ink cursor-pointer",
          active && "text-ink",
        )}
      >
        {label}
        {active &&
          (dir === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />)}
      </button>
    </th>
  );
}

const editInput =
  "w-full min-w-32 rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-ink outline-none placeholder:text-faint focus:border-accent";

function LeadTr({ lead, onChanged }: { lead: LeadRow; onChanged: () => void }) {
  const toast = useToast();
  const [editing, setEditing] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  // Edit-mode draft, seeded from the lead; re-seeded whenever the row data
  // changes (after a save + refresh) while not actively editing.
  const [name, setName] = React.useState(lead.businessName);
  const [wa, setWa] = React.useState(lead.whatsapp);
  const [email, setEmail] = React.useState(lead.email ?? "");
  const [note, setNote] = React.useState(lead.note ?? "");
  const [status, setStatus] = React.useState<Status>(lead.status);
  React.useEffect(() => {
    if (editing) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resync draft after server refresh
    setName(lead.businessName);
    setWa(lead.whatsapp);
    setEmail(lead.email ?? "");
    setNote(lead.note ?? "");
    setStatus(lead.status);
  }, [lead, editing]);

  function startEdit() {
    setName(lead.businessName);
    setWa(lead.whatsapp);
    setEmail(lead.email ?? "");
    setNote(lead.note ?? "");
    setStatus(lead.status);
    setEditing(true);
  }

  async function save() {
    const body: Record<string, unknown> = {};
    if (name.trim() !== lead.businessName) body.businessName = name.trim();
    if (email.trim() !== (lead.email ?? "")) body.email = email.trim();
    if (note.trim() !== (lead.note ?? "")) body.note = note.trim();
    if (status !== lead.status) body.status = status;
    if (wa.replace(/\D/g, "") !== lead.whatsapp) body.whatsapp = wa;
    if (Object.keys(body).length === 0) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/api/admin/leads/${lead.id}`, body);
      toast("تم حفظ التعديلات");
      setEditing(false);
      onChanged();
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر الحفظ", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api.del(`/api/admin/leads/${lead.id}`);
      toast("تم حذف الطلب");
      onChanged();
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر الحذف", "error");
      setBusy(false);
    }
  }

  return (
    <tr className="border-b border-line align-middle last:border-0 hover:bg-black/[0.015] dark:hover:bg-white/4">
      {/* business name */}
      <td className="px-4 py-3 font-medium text-ink">
        {editing ? (
          <input value={name} onChange={(e) => setName(e.target.value)} className={editInput} />
        ) : (
          lead.businessName
        )}
      </td>

      {/* whatsapp */}
      <td className="px-4 py-3">
        {editing ? (
          <input
            value={wa}
            onChange={(e) => setWa(e.target.value)}
            dir="ltr"
            className={editInput}
          />
        ) : (
          <a
            href={waHref(lead.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
          >
            <MessageCircle className="size-4" /> +{lead.whatsapp}
          </a>
        )}
      </td>

      {/* email */}
      <td className="px-4 py-3">
        {editing ? (
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
            placeholder="—"
            className={editInput}
          />
        ) : lead.email ? (
          <a
            href={`mailto:${lead.email}`}
            dir="ltr"
            className="inline-flex items-center gap-1.5 text-muted hover:text-ink"
          >
            <Mail className="size-4" /> {lead.email}
          </a>
        ) : (
          <span className="text-faint">—</span>
        )}
      </td>

      {/* status */}
      <td className="px-4 py-3">
        {editing ? (
          <MenuSelect
            value={status}
            ariaLabel="حالة الطلب"
            options={(Object.keys(STATUS) as Status[]).map((s) => ({
              value: s,
              label: STATUS[s].label,
            }))}
            onChange={(v) => setStatus(v as Status)}
          />
        ) : (
          <Badge tone={STATUS[lead.status].tone} dot>
            {STATUS[lead.status].label}
          </Badge>
        )}
      </td>

      {/* date */}
      <td className="whitespace-nowrap px-4 py-3 text-xs text-faint">
        {formatArabicDate(lead.createdAt)}
      </td>

      {/* note */}
      <td className="px-4 py-3 text-muted">
        {editing ? (
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="أضف ملاحظة…"
            className={editInput}
          />
        ) : lead.note ? (
          <span className="line-clamp-2">{lead.note}</span>
        ) : (
          <span className="text-faint">—</span>
        )}
      </td>

      {/* actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1.5">
          {editing ? (
            <>
              <button
                onClick={save}
                disabled={busy}
                aria-label="حفظ"
                className="inline-flex size-8 items-center justify-center rounded-md bg-accent text-white transition hover:bg-accent-700 disabled:opacity-60 cursor-pointer"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={busy}
                aria-label="إلغاء"
                className="inline-flex size-8 items-center justify-center rounded-md border border-line text-muted transition hover:text-ink disabled:opacity-60 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </>
          ) : confirming ? (
            <>
              <button
                onClick={remove}
                disabled={busy}
                className="inline-flex h-8 items-center gap-1 rounded-md bg-danger px-2.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-60 cursor-pointer"
              >
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : "تأكيد"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={busy}
                aria-label="إلغاء"
                className="inline-flex size-8 items-center justify-center rounded-md border border-line text-muted transition hover:text-ink disabled:opacity-60 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEdit}
                aria-label="تعديل"
                className="inline-flex size-8 items-center justify-center rounded-md border border-line text-muted transition hover:border-accent hover:text-accent cursor-pointer"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => setConfirming(true)}
                aria-label="حذف الطلب"
                className="inline-flex size-8 items-center justify-center rounded-md border border-line text-muted transition hover:border-danger hover:text-danger cursor-pointer"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
