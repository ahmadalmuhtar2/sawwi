"use client";

// Admin CRM. One client surface over admin-fetched data: KPI tiles, a tabbed
// browser (users / workspaces / sites / payments) with search, an account
// provisioning form, and inline status controls (payment lifecycle, commission
// settle, direct-tier end date, resend set-password). All writes go through the
// admin API routes and then router.refresh() to re-pull server data.

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { UserPlus, Search, Send, Loader2, Wallet, X, Trash2 } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PhoneInput } from "@/components/ui/phone-input";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column, type Filter } from "@/components/dashboard/data-table";
import { formatArabicAmount, symbolOf, CURRENCIES } from "@/shared/currency";
import { formatArabicDate } from "@/lib/expiry-format";
import { cn } from "@/lib/cn";

type Kind = "reseller" | "direct";
type PaymentStatus = "pending" | "paid" | "checked" | "stopped" | "refunded";

export interface AdminData {
  overview: {
    users: number;
    workspaces: number;
    sites: number;
    activeSubs: number;
    expiredSubs: number;
    commissionsOwed: number;
  };
  users: {
    id: string;
    email: string;
    name: string | null;
    platformRole: string;
    endDate: string | null;
    createdAt: string;
    memberships: { role: string; workspace: { id: string; name: string; kind: Kind } }[];
  }[];
  workspaces: {
    id: string;
    name: string;
    kind: Kind;
    commissionPct: number;
    contactName: string | null;
    contactWhatsapp: string | null;
    createdAt: string;
    _count: { sites: number; members: number };
  }[];
  sites: {
    id: string;
    businessName: string;
    slug: string;
    status: string;
    createdAt: string;
    workspace: { name: string; kind: Kind };
    subscription: { expiry: string } | null;
    served: boolean;
  }[];
  payments: {
    id: string;
    amount: number;
    currency: string;
    method: string;
    status: PaymentStatus;
    payerName: string | null;
    createdAt: string;
    businessName: string;
    workspaceName: string;
    commission: { id: string; amount: number; status: string } | null;
  }[];
}

type UserRow = AdminData["users"][number];
type WsRow = AdminData["workspaces"][number];
type SiteRow = AdminData["sites"][number];
type PayRow = AdminData["payments"][number];

// The server-side query state, mirrored in the URL (kept local so this client
// file never imports the server admin module).
export interface AdminQueryLite {
  q?: string;
  sort?: string;
  dir?: "asc" | "desc";
  role?: string;
  kind?: string;
  status?: string;
  served?: string;
  currency?: string;
  method?: string;
  commission?: string;
}

const TABS = [
  { key: "users", label: "المستخدمون" },
  { key: "workspaces", label: "مساحات العمل" },
  { key: "sites", label: "المواقع" },
  { key: "payments", label: "المدفوعات" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "checked", "stopped", "refunded"];
const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: "قيد الانتظار",
  paid: "مدفوع",
  checked: "مدقّق",
  stopped: "موقوف",
  refunded: "مسترجع",
};
const KIND_LABEL: Record<Kind, string> = { reseller: "موزّع", direct: "مباشر" };

const METHOD_LABEL: Record<string, string> = {
  cash: "نقدًا",
  mobile_money: "محفظة إلكترونية",
  bank_transfer: "حوالة بنكية",
  other: "أخرى",
};

export function AdminCRM({ data, tab, query }: { data: AdminData; tab: TabKey; query: AdminQueryLite }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();

  // All of tab / search / sort / filters live in the URL → the server queries the
  // DB. This just writes params; the page re-renders with fresh, DB-filtered rows.
  const setParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const setTab = (t: TabKey) =>
    setParams({ tab: t, q: undefined, sort: undefined, dir: undefined, role: undefined, kind: undefined, status: undefined, served: undefined, currency: undefined, method: undefined, commission: undefined });

  // Search: a local, debounced input that writes ?q= (server-side search).
  const [search, setSearch] = React.useState(query.q ?? "");
  React.useEffect(() => {
    const t = setTimeout(() => {
      if ((query.q ?? "") !== search) setParams({ q: search || undefined });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const sort = query.sort ? { key: query.sort, dir: (query.dir ?? "asc") as "asc" | "desc" } : null;
  const onSort = (key: string) => {
    if (query.sort !== key) setParams({ sort: key, dir: "asc" });
    else if (query.dir === "asc") setParams({ sort: key, dir: "desc" });
    else setParams({ sort: undefined, dir: undefined });
  };
  const onFilter = (key: string, value: string) => setParams({ [key]: value || undefined });
  const filterValues: Record<string, string> = {
    role: query.role ?? "", kind: query.kind ?? "", status: query.status ?? "", served: query.served ?? "",
    currency: query.currency ?? "", method: query.method ?? "", commission: query.commission ?? "",
  };

  const [showProvision, setShowProvision] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  // Site currently having a payment recorded (admin can do this for ANY site —
  // direct or reseller — to keep every payment tracked in the system).
  const [payFor, setPayFor] = React.useState<{ id: string; name: string } | null>(null);
  // User pending permanent deletion (confirmation modal).
  const [delUser, setDelUser] = React.useState<{ id: string; label: string } | null>(null);

  async function mutate(id: string, fn: () => Promise<unknown>, ok: string) {
    setBusyId(id);
    try {
      await fn();
      toast(ok);
      router.refresh();
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر تنفيذ العملية", "error");
    } finally {
      setBusyId(null);
    }
  }

  // Columns: `sortable` keys match the server sort mapper (admin.service).
  const userCols: Column<UserRow>[] = [
    { key: "name", label: "الاسم", sortable: true, render: (u) => u.name || "—" },
    { key: "email", label: "البريد", sortable: true, render: (u) => <span dir="ltr">{u.email}</span> },
    { key: "role", label: "الدور", render: (u) => (u.platformRole === "admin" ? <Badge tone="accent">مشرف</Badge> : "مستخدم") },
    { key: "ws", label: "مساحات العمل", render: (u) => (u.memberships.length ? u.memberships.map((m) => `${m.workspace.name} (${KIND_LABEL[m.workspace.kind]})`).join("، ") : "—") },
    {
      key: "endDate", label: "ينتهي (مباشر)", sortable: true,
      render: (u) =>
        u.memberships.some((m) => m.workspace.kind === "direct") ? (
          <input type="date" defaultValue={u.endDate ? u.endDate.slice(0, 10) : ""}
            onChange={(e) => mutate(u.id, () => api.patch(`/api/admin/users/${u.id}`, { endDate: e.target.value || null }), "تم تحديث تاريخ الانتهاء")}
            className="rounded-md border border-line bg-surface px-2 py-1 text-xs" />
        ) : "—",
    },
    {
      key: "actions", label: "", render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => mutate(u.id, () => api.post(`/api/admin/users/${u.id}/resend`), "تم إرسال الرابط")} disabled={busyId === u.id}
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline disabled:opacity-50">
            {busyId === u.id ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />} إرسال رابط الدخول
          </button>
          <button onClick={() => setDelUser({ id: u.id, label: u.name || u.email })} disabled={busyId === u.id} title="حذف الحساب"
            className="rounded-md p-1.5 text-muted transition hover:bg-danger-100/60 hover:text-danger disabled:opacity-40 cursor-pointer">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];
  const userFilters: Filter[] = [
    { key: "role", label: "الدور", options: [{ value: "admin", label: "مشرف" }, { value: "user", label: "مستخدم" }] },
    { key: "kind", label: "النوع", options: [{ value: "reseller", label: "موزّع" }, { value: "direct", label: "مباشر" }] },
  ];

  const wsCols: Column<WsRow>[] = [
    { key: "name", label: "الاسم", sortable: true, render: (w) => w.name },
    { key: "kind", label: "النوع", render: (w) => <Badge tone={w.kind === "reseller" ? "accent" : "neutral"}>{KIND_LABEL[w.kind]}</Badge> },
    { key: "pct", label: "العمولة %", sortable: true, render: (w) => (w.kind === "reseller" ? `${w.commissionPct}%` : "—") },
    { key: "sites", label: "المواقع", sortable: true, render: (w) => w._count.sites },
    {
      key: "contact", label: "التواصل",
      render: (w) => (
        <>
          {w.contactName && <span className="me-2">{w.contactName}</span>}
          {w.contactWhatsapp ? <span dir="ltr" className="font-label">{w.contactWhatsapp}</span> : !w.contactName && "—"}
        </>
      ),
    },
    { key: "createdAt", label: "أُنشئت", sortable: true, render: (w) => formatArabicDate(w.createdAt) },
  ];
  const wsFilters: Filter[] = [
    { key: "kind", label: "النوع", options: [{ value: "reseller", label: "موزّع" }, { value: "direct", label: "مباشر" }] },
  ];

  const siteCols: Column<SiteRow>[] = [
    { key: "biz", label: "النشاط", sortable: true, render: (s) => s.businessName },
    { key: "slug", label: "الرابط", sortable: true, render: (s) => <span dir="ltr">{s.slug}</span> },
    { key: "ws", label: "مساحة العمل", render: (s) => `${s.workspace.name} (${KIND_LABEL[s.workspace.kind]})` },
    { key: "status", label: "الحالة", sortable: true, render: (s) => s.status },
    { key: "expiry", label: "ينتهي", sortable: true, render: (s) => (s.subscription ? formatArabicDate(s.subscription.expiry) : "—") },
    { key: "served", label: "يُخدَم؟", render: (s) => (s.served ? <Badge tone="accent">نعم</Badge> : <Badge tone="danger">لا</Badge>) },
    {
      key: "pay", label: "", render: (s) => (
        <button
          onClick={() => setPayFor({ id: s.id, name: s.businessName })}
          className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-xs text-accent transition hover:bg-accent-50 cursor-pointer"
        >
          <Wallet className="size-3.5" /> تسجيل دفعة
        </button>
      ),
    },
  ];
  const siteFilters: Filter[] = [
    { key: "status", label: "الحالة", options: [{ value: "draft", label: "مسودة" }, { value: "published", label: "منشور" }, { value: "suspended", label: "موقوف" }] },
    { key: "served", label: "يُخدَم", options: [{ value: "yes", label: "نعم" }, { value: "no", label: "لا" }] },
  ];

  const payCols: Column<PayRow>[] = [
    { key: "biz", label: "النشاط", render: (p) => p.businessName },
    { key: "amount", label: "المبلغ", sortable: true, render: (p) => `${formatArabicAmount(p.amount)} ${symbolOf(p.currency)}` },
    { key: "method", label: "الطريقة", sortable: true, render: (p) => p.method },
    {
      key: "status", label: "الحالة",
      render: (p) => (
        <select value={p.status} disabled={busyId === p.id}
          onChange={(e) => mutate(p.id, () => api.patch(`/api/admin/payments/${p.id}`, { status: e.target.value }), "تم تحديث حالة الدفعة")}
          className="rounded-md border border-line bg-surface px-2 py-1 text-xs cursor-pointer">
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{PAYMENT_LABEL[s]}</option>)}
        </select>
      ),
    },
    {
      key: "commission", label: "العمولة",
      render: (p) =>
        p.commission ? (
          p.commission.status === "settled" ? <Badge tone="accent">مُسوّاة</Badge> : (
            <button onClick={() => mutate(p.commission!.id, () => api.patch(`/api/admin/commissions/${p.commission!.id}`, { status: "settled" }), "تمت تسوية العمولة")}
              disabled={busyId === p.commission.id} className="text-xs text-accent hover:underline disabled:opacity-50">
              تسوية ({formatArabicAmount(p.commission.amount)})
            </button>
          )
        ) : "—",
    },
    { key: "createdAt", label: "التاريخ", sortable: true, render: (p) => formatArabicDate(p.createdAt) },
  ];
  const payFilters: Filter[] = [
    { key: "status", label: "الحالة", options: PAYMENT_STATUSES.map((s) => ({ value: s, label: PAYMENT_LABEL[s] })) },
    { key: "currency", label: "العملة", options: CURRENCIES.map((c) => ({ value: c.key, label: c.label })) },
    { key: "method", label: "الطريقة", options: Object.entries(METHOD_LABEL).map(([v, l]) => ({ value: v, label: l })) },
    { key: "commission", label: "العمولة", options: [{ value: "settled", label: "مُسوّاة" }, { value: "owed", label: "غير مُسوّاة" }] },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">الإدارة</h1>
          <p className="mt-1 text-sm text-muted">إدارة المستخدمين ومساحات العمل والمدفوعات.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowProvision((v) => !v)}>
          <UserPlus className="size-4" /> إنشاء حساب
        </Button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="المستخدمون" value={data.overview.users} />
        <Kpi label="مساحات العمل" value={data.overview.workspaces} />
        <Kpi label="المواقع" value={data.overview.sites} />
        <Kpi label="اشتراكات فعّالة" value={data.overview.activeSubs} />
        <Kpi label="اشتراكات منتهية" value={data.overview.expiredSubs} />
        <Kpi label="عمولات مستحقّة" value={formatArabicAmount(data.overview.commissionsOwed)} />
      </div>

      {showProvision && (
        <ProvisionForm
          onDone={() => {
            setShowProvision(false);
            router.refresh();
          }}
        />
      )}

      {/* tabs + search */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition cursor-pointer",
                tab === t.key ? "bg-accent-100 text-accent-900" : "text-muted hover:bg-neutral-200 hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-faint" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث…"
            className="w-56 pe-9"
          />
        </div>
      </div>

      <Card className="mt-3 p-0">
        {tab === "users" && <DataTable rows={data.users} columns={userCols} filters={userFilters} sort={sort} onSort={onSort} filterValues={filterValues} onFilter={onFilter} />}
        {tab === "workspaces" && <DataTable rows={data.workspaces} columns={wsCols} filters={wsFilters} sort={sort} onSort={onSort} filterValues={filterValues} onFilter={onFilter} />}
        {tab === "sites" && <DataTable rows={data.sites} columns={siteCols} filters={siteFilters} sort={sort} onSort={onSort} filterValues={filterValues} onFilter={onFilter} />}
        {tab === "payments" && <DataTable rows={data.payments} columns={payCols} filters={payFilters} sort={sort} onSort={onSort} filterValues={filterValues} onFilter={onFilter} />}
      </Card>

      {payFor && (
        <RecordPaymentModal
          site={payFor}
          onClose={() => setPayFor(null)}
          onDone={() => {
            setPayFor(null);
            router.refresh();
          }}
        />
      )}

      {delUser && (
        <ConfirmDeleteUser
          label={delUser.label}
          busy={busyId === delUser.id}
          onCancel={() => setDelUser(null)}
          onConfirm={async () => {
            const id = delUser.id;
            await mutate(id, () => api.del(`/api/admin/users/${id}`), "تم حذف الحساب");
            setDelUser(null);
          }}
        />
      )}
    </div>
  );
}

/* ───────────────────────── confirm delete user ───────────────────────── */

function ConfirmDeleteUser({
  label,
  busy,
  onCancel,
  onConfirm,
}: {
  label: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <Card className="relative z-10 w-full max-w-sm rounded-b-none p-6 sm:rounded-2xl">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger-100 text-danger">
            <Trash2 className="size-[18px]" />
          </span>
          <h2 className="font-bold text-ink">حذف الحساب</h2>
        </div>
        <p className="text-sm leading-relaxed text-muted">
          سيتم حذف حساب <span className="font-semibold text-ink" dir="ltr">{label}</span> نهائيًا، مع جلساته وإشعاراته وصلاحياته على المواقع. لا يمكن التراجع عن هذا الإجراء.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>إلغاء</Button>
          <Button type="button" variant="danger" onClick={onConfirm} loading={busy}>حذف نهائي</Button>
        </div>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <div className="text-lg font-extrabold text-ink">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted">{label}</div>
    </div>
  );
}

/* ───────────────────────── record payment ───────────────────────── */

function RecordPaymentModal({
  site,
  onClose,
  onDone,
}: {
  site: { id: string; name: string };
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = React.useState({
    amount: "",
    currency: "SYP",
    method: "cash",
    newExpiry: "",
    payerName: "",
    note: "",
  });
  const [saving, setSaving] = React.useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      toast("أدخل مبلغًا صحيحًا", "error");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/api/sites/${site.id}/billing`, {
        amount,
        currency: form.currency,
        method: form.method,
        payerName: form.payerName || undefined,
        note: form.note || undefined,
        newExpiry: form.newExpiry || undefined,
      });
      toast("تم تسجيل الدفعة وتحديث تاريخ الاشتراك");
      onDone();
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "تعذّر تسجيل الدفعة", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md rounded-b-none p-6 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-ink">تسجيل دفعة — {site.name}</h2>
          <button onClick={onClose} aria-label="إغلاق" className="rounded-md p-1 text-muted hover:text-ink cursor-pointer">
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="المبلغ" htmlFor="pm-amount">
              <Input id="pm-amount" type="number" dir="ltr" min={0} step="any" value={form.amount} onChange={set("amount")} required />
            </Field>
            <Field label="العملة" htmlFor="pm-cur">
              <select id="pm-cur" value={form.currency} onChange={set("currency")}
                className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink cursor-pointer">
                {CURRENCIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="طريقة الدفع" htmlFor="pm-method">
              <select id="pm-method" value={form.method} onChange={set("method")}
                className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink cursor-pointer">
                {Object.entries(METHOD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="تاريخ الاشتراك الجديد" htmlFor="pm-exp">
              <Input id="pm-exp" type="date" dir="ltr" value={form.newExpiry} onChange={set("newExpiry")} />
            </Field>
            <Field label="اسم الدافع (اختياري)" htmlFor="pm-payer">
              <Input id="pm-payer" value={form.payerName} onChange={set("payerName")} />
            </Field>
            <Field label="ملاحظة (اختياري)" htmlFor="pm-note">
              <Input id="pm-note" value={form.note} onChange={set("note")} />
            </Field>
          </div>
          <p className="text-xs text-faint">
            يُسجَّل هذا المبلغ في النظام ويمدّد تاريخ انتهاء الموقع. تُحتسب عمولة سوّي تلقائيًا حسب نسبة مساحة العمل (٠٪ للحسابات المباشرة).
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
            <Button type="submit" loading={saving}>تسجيل الدفعة</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ───────────────────────── provisioning form ───────────────────────── */

function ProvisionForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const [kind, setKind] = React.useState<Kind>("reseller");
  const [form, setForm] = React.useState({
    email: "",
    name: "",
    workspaceName: "",
    commissionPct: "",
    contactName: "",
    contactWhatsapp: "",
    endDate: "",
  });
  const [saving, setSaving] = React.useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/admin/provision", {
        email: form.email,
        name: form.name,
        kind,
        workspaceName: form.workspaceName || undefined,
        commissionPct: kind === "reseller" && form.commissionPct ? Number(form.commissionPct) : undefined,
        contactName: form.contactName || undefined,
        contactWhatsapp: form.contactWhatsapp || undefined,
        endDate: kind === "direct" && form.endDate ? form.endDate : null,
      });
      toast("تم إنشاء الحساب وإرسال رابط تعيين كلمة المرور");
      onDone();
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "تعذّر إنشاء الحساب", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mt-4 p-5">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex gap-2">
          {(["reseller", "direct"] as Kind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition cursor-pointer",
                kind === k ? "border-accent bg-accent-100 text-accent-900" : "border-line text-muted hover:text-ink",
              )}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="البريد الإلكتروني" htmlFor="p-email">
            <Input id="p-email" type="email" dir="ltr" value={form.email} onChange={set("email")} required />
          </Field>
          <Field label="اسم المالك" htmlFor="p-name">
            <Input id="p-name" value={form.name} onChange={set("name")} required />
          </Field>
          <Field label="اسم مساحة العمل (اختياري)" htmlFor="p-ws">
            <Input id="p-ws" value={form.workspaceName} onChange={set("workspaceName")} />
          </Field>
          {kind === "reseller" ? (
            <Field label="نسبة العمولة %" htmlFor="p-pct">
              <Input id="p-pct" type="number" dir="ltr" min={0} max={100} value={form.commissionPct} onChange={set("commissionPct")} />
            </Field>
          ) : (
            <Field label="تاريخ انتهاء الحساب (اختياري)" htmlFor="p-end">
              <Input id="p-end" type="date" dir="ltr" value={form.endDate} onChange={set("endDate")} />
            </Field>
          )}
          <Field label="اسم جهة التواصل (للعميل)" htmlFor="p-cn">
            <Input id="p-cn" value={form.contactName} onChange={set("contactName")} />
          </Field>
          <Field label="واتساب جهة التواصل">
            <PhoneInput
              value={form.contactWhatsapp}
              onChange={(v) => setForm((f) => ({ ...f, contactWhatsapp: v }))}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>إلغاء</Button>
          <Button type="submit" loading={saving}>إنشاء الحساب</Button>
        </div>
      </form>
    </Card>
  );
}
