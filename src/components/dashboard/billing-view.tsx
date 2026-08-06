"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Plus, History } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { PageHeader, StatGrid, StatCell, Panel, SiteThumb, toArabicDigits } from "@/components/dashboard/ui";
import { siteHost } from "@/lib/site-url";
import { CURRENCIES, symbolOf } from "@/shared/currency";
import { cn } from "@/lib/cn";

type Status = "active" | "expiring" | "expired";
/** The billing-table filter, reflected in the URL as ?status=. */
export type BillingStatusFilter = Status;
interface Sub {
  status: Status;
  expiry: string;
  daysLeft: number;
  currency: string;
}
interface Row {
  id: string;
  businessName: string;
  slug: string;
  subscription: Sub | null;
  totalCollected: number;
  paymentsCount: number;
  lastPaymentAt: string | null;
}
export type BillingRow = Row;
interface Summary {
  total: number;
  active: number;
  expiring: number;
  expired: number;
}

const dateFmt = new Intl.DateTimeFormat("ar-SY", { dateStyle: "medium" });
const fmtDate = (iso: string) => dateFmt.format(new Date(iso));
const fmtMoney = (n: number, c: string) =>
  `${n.toLocaleString("ar-SY")} ${symbolOf(c)}`;
const toInput = (iso: string) => iso.slice(0, 10);

/** Default new paid-through date: one year from the later of expiry/today. */
function plusYearInput(iso?: string | null): string {
  const base = iso ? new Date(iso) : new Date();
  const now = new Date();
  const from = base.getTime() > now.getTime() ? base : now;
  from.setFullYear(from.getFullYear() + 1);
  return from.toISOString().slice(0, 10);
}

function StatusChip({ sub }: { sub: Sub | null }) {
  if (!sub) return <Badge tone="neutral" dot>بدون اشتراك</Badge>;
  if (sub.status === "active") return <Badge tone="accent" dot>نشط</Badge>;
  if (sub.status === "expiring") return <Badge tone="warn" dot>ينتهي قريبًا</Badge>;
  return <Badge tone="danger" dot>منتهٍ</Badge>;
}

interface HistoryItem {
  id: string;
  amount: number;
  currency: string;
  method: string;
  payerName: string | null;
  note: string | null;
  createdAt: string;
}
const METHOD_LABEL: Record<string, string> = {
  cash: "نقدًا",
  mobile_money: "محفظة إلكترونية",
  bank_transfer: "تحويل بنكي",
  other: "أخرى",
};

export function BillingView({
  summary,
  sites,
  upcoming,
  activeStatus = null,
}: {
  summary: Summary;
  /** Already filtered server-side to `activeStatus` (the subscriptions table). */
  sites: Row[];
  /** Soonest-expiring sites from the FULL set (renewals panel). */
  upcoming: Row[];
  activeStatus?: BillingStatusFilter | null;
}) {
  const router = useRouter();
  const toast = useToast();

  const [pay, setPay] = useState<Row | null>(null);
  const [expiryRow, setExpiryRow] = useState<Row | null>(null);
  const [historyRow, setHistoryRow] = useState<Row | null>(null);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="الفوترة والاشتراكات"
        subtitle="حدّد تاريخ انتهاء كل موقع وسجّل الدفعات المحصّلة — يتوقّف الموقع تلقائيًا عند الانتهاء ما لم يُجدَّد."
      />

      <div className="mb-5">
        <StatGrid>
          <StatCell
            label="المواقع"
            value={toArabicDigits(summary.total)}
            href="/dashboard/billing"
            active={activeStatus === null}
          />
          <StatCell
            label="نشطة"
            value={toArabicDigits(summary.active)}
            hint="اشتراكات فعّالة"
            hintTone="up"
            href="/dashboard/billing?status=active"
            active={activeStatus === "active"}
          />
          <StatCell
            label="تنتهي قريبًا"
            value={toArabicDigits(summary.expiring)}
            valueTone={summary.expiring ? "warn" : undefined}
            hint="خلال ٧ أيام"
            hintTone={summary.expiring ? "warn" : "muted"}
            href="/dashboard/billing?status=expiring"
            active={activeStatus === "expiring"}
          />
          <StatCell
            label="منتهية"
            value={toArabicDigits(summary.expired)}
            valueTone={summary.expired ? "down" : undefined}
            hint="تحتاج تجديدًا"
            hintTone={summary.expired ? "down" : "muted"}
            href="/dashboard/billing?status=expired"
            active={activeStatus === "expired"}
          />
        </StatGrid>
      </div>

      {summary.total === 0 ? (
        <Panel>
          <p className="px-6 py-12 text-center text-[13.5px] text-muted">لا مواقع بعد. أنشئ موقعًا لتظهر فوترته هنا.</p>
        </Panel>
      ) : (
        <div className="grid gap-4.5 lg:grid-cols-[1.6fr_1fr]">
          {/* Subscriptions */}
          <Panel
            title="الاشتراكات"
            action={
              activeStatus ? (
                <Link href="/dashboard/billing" className="text-accent-300 hover:underline">
                  عرض الكل ←
                </Link>
              ) : undefined
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>الموقع</Th>
                    <Th>الحالة</Th>
                    <Th>ينتهي</Th>
                    <Th>المحصّل</Th>
                    <Th className="w-0" />
                  </tr>
                </thead>
                <tbody>
                  {sites.map((s) => {
                    const sub = s.subscription;
                    return (
                      <tr key={s.id} className="border-b border-line last:border-0">
                        <Td>
                          <div className="flex items-center gap-3">
                            <SiteThumb name={s.businessName} />
                            <span className="min-w-0">
                              <span className="block truncate text-[13.5px] text-ink">{s.businessName}</span>
                              <span className="block truncate font-mono text-[11.5px] text-faint" dir="ltr">
                                {siteHost(s.slug)}
                              </span>
                            </span>
                          </div>
                        </Td>
                        <Td>
                          <StatusChip sub={sub} />
                        </Td>
                        <Td className="whitespace-nowrap">
                          {sub ? (
                            <span
                              dir="ltr"
                              className={cn(
                                "inline-block tabular-nums text-[12.5px]",
                                sub.status === "expired" ? "text-danger" : sub.status === "expiring" ? "text-warn" : "text-muted",
                              )}
                            >
                              {fmtDate(sub.expiry)}
                            </span>
                          ) : (
                            <span className="text-faint">لم يُحدَّد</span>
                          )}
                        </Td>
                        <Td className="whitespace-nowrap">
                          {s.paymentsCount > 0 ? (
                            <Tooltip label={`${toArabicDigits(s.paymentsCount)} دفعات`}>
                              <span dir="ltr" className="inline-block tabular-nums text-ink">
                                {fmtMoney(s.totalCollected, sub?.currency ?? "SYP")}
                              </span>
                            </Tooltip>
                          ) : (
                            <span className="text-faint">—</span>
                          )}
                        </Td>
                        <Td className="text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            <Tooltip label="تسجيل دفعة">
                              <button
                                type="button"
                                aria-label="تسجيل دفعة"
                                onClick={() => setPay(s)}
                                className="grid size-8 place-items-center rounded-md bg-accent text-white transition hover:bg-accent-600 cursor-pointer"
                              >
                                <Plus className="size-4" />
                              </button>
                            </Tooltip>
                            <IconBtn title="تعديل تاريخ الانتهاء" onClick={() => setExpiryRow(s)}>
                              <CalendarClock className="size-4" />
                            </IconBtn>
                            <IconBtn title="سجل الدفعات" onClick={() => setHistoryRow(s)}>
                              <History className="size-4" />
                            </IconBtn>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {sites.length === 0 && (
              <p className="px-6 py-10 text-center text-[13.5px] text-muted">لا اشتراكات بهذا التصنيف.</p>
            )}
          </Panel>

          {/* Upcoming renewals */}
          <Panel title="تجديدات قادمة">
            {upcoming.length === 0 ? (
              <p className="px-6 py-12 text-center text-[13.5px] text-muted">لا اشتراكات لعرضها.</p>
            ) : (
              <ul>
                {upcoming.map((s) => {
                  const sub = s.subscription!;
                  const pct = Math.max(4, Math.min(100, Math.round((sub.daysLeft / 365) * 100)));
                  const bar =
                    sub.status === "expired" ? "bg-danger" : sub.status === "expiring" ? "bg-warn" : "bg-accent-300";
                  return (
                    <li key={s.id} className="border-b border-line px-4.5 py-3.5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] text-ink">{s.businessName}</p>
                          <p className="mt-0.5 text-[11.5px] text-faint">
                            {sub.status === "expired" ? "انتهى — يحتاج تجديدًا" : `يُجدَّد ${fmtDate(sub.expiry)}`}
                          </p>
                        </div>
                        <Badge tone={sub.status === "expired" ? "danger" : sub.status === "expiring" ? "warn" : "accent"}>
                          {sub.daysLeft < 0 ? "منتهٍ" : `${toArabicDigits(sub.daysLeft)} يوم`}
                        </Badge>
                      </div>
                      <span className="mt-2 block h-1.25 overflow-hidden rounded-full bg-neutral-100">
                        <span className={cn("block h-full rounded-full", bar)} style={{ width: `${sub.status === "expired" ? 6 : pct}%` }} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      )}

      {pay && <PaymentModal row={pay} onClose={() => setPay(null)} onDone={() => { setPay(null); router.refresh(); }} toast={toast} />}
      {expiryRow && <ExpiryModal row={expiryRow} onClose={() => setExpiryRow(null)} onDone={() => { setExpiryRow(null); router.refresh(); }} toast={toast} />}
      {historyRow && <HistoryModal row={historyRow} onClose={() => setHistoryRow(null)} />}
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "border-b border-line px-4.5 py-2.75 text-start text-[11px] font-normal tracking-wide whitespace-nowrap text-faint",
        className,
      )}
    >
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4.5 py-3.25 align-middle", className)}>{children}</td>;
}
function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip label={title}>
      <button
        type="button"
        aria-label={title}
        onClick={onClick}
        className="rounded-md border border-line p-1.5 text-muted transition hover:border-neutral-300 hover:text-ink cursor-pointer"
      >
        {children}
      </button>
    </Tooltip>
  );
}

type ToastFn = ReturnType<typeof useToast>;

function PaymentModal({ row, onClose, onDone, toast }: { row: Row; onClose: () => void; onDone: () => void; toast: ToastFn }) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(row.subscription?.currency ?? "SYP");
  const [method, setMethod] = useState("cash");
  const [payerName, setPayerName] = useState("");
  const [note, setNote] = useState("");
  const [newExpiry, setNewExpiry] = useState(plusYearInput(row.subscription?.expiry));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit() {
    const amt = Number(amount);
    if (!amt || amt <= 0) { setErrors({ amount: "أدخل مبلغًا صحيحًا" }); return; }
    setSaving(true);
    setErrors({});
    try {
      await api.post(`/api/sites/${row.id}/billing`, {
        amount: amt, currency, method,
        payerName: payerName || undefined,
        note: note || undefined,
        newExpiry: newExpiry || undefined,
      });
      toast("تم تسجيل الدفعة ✓");
      onDone();
    } catch (e) {
      if (e instanceof ApiClientError && e.fields) setErrors(e.fields);
      else toast(e instanceof ApiClientError ? e.message : "تعذّر التسجيل", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`تسجيل دفعة — ${row.businessName}`}
      footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button onClick={submit} loading={saving}>تسجيل</Button></>}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="المبلغ" error={errors.amount}>
            <Input type="number" min={1} dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" />
          </Field>
          <Field label="العملة">
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="طريقة الدفع">
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="cash">نقدًا</option><option value="mobile_money">محفظة إلكترونية</option>
              <option value="bank_transfer">تحويل بنكي</option><option value="other">أخرى</option>
            </Select>
          </Field>
          <Field label="مَن دفع (اختياري)">
            <Input value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder="اسم العميل" />
          </Field>
        </div>
        <Field label="تمديد الاشتراك حتى" hint="التاريخ الجديد لانتهاء الموقع" error={errors.newExpiry}>
          <Input type="date" dir="ltr" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} />
        </Field>
        <Field label="ملاحظة (اختياري)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: دفعة السنة الأولى" />
        </Field>
      </div>
    </Modal>
  );
}

function ExpiryModal({ row, onClose, onDone, toast }: { row: Row; onClose: () => void; onDone: () => void; toast: ToastFn }) {
  const [expiry, setExpiry] = useState(row.subscription ? toInput(row.subscription.expiry) : plusYearInput());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!expiry) { setError("اختر تاريخًا"); return; }
    setSaving(true);
    setError(null);
    try {
      await api.put(`/api/sites/${row.id}/billing/expiry`, { expiry });
      toast("تم تحديث التاريخ ✓");
      onDone();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "تعذّر التحديث");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`تاريخ الانتهاء — ${row.businessName}`} size="sm"
      footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button onClick={submit} loading={saving}>حفظ</Button></>}>
      <div className="space-y-3">
        <p className="text-sm text-muted">حدّد تاريخ توقّف الموقع إن لم يُجدَّد الاشتراك.</p>
        <Field label="ينتهي في" error={error ?? undefined}>
          <Input type="date" dir="ltr" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

function HistoryModal({ row, onClose }: { row: Row; onClose: () => void }) {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.get<{ payments: HistoryItem[] }>(`/api/sites/${row.id}/billing`)
      .then((d) => alive && setItems(d.payments))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [row.id]);

  return (
    <Modal open onClose={onClose} title={`سجل الدفعات — ${row.businessName}`}>
      {loading ? (
        <p className="py-6 text-center text-sm text-faint">جارٍ التحميل…</p>
      ) : !items || items.length === 0 ? (
        <p className="py-6 text-center text-sm text-faint">لا دفعات مسجّلة بعد.</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium text-ink">{fmtMoney(p.amount, p.currency)}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {METHOD_LABEL[p.method] ?? p.method}
                  {p.payerName ? ` · ${p.payerName}` : ""}
                  {p.note ? ` · ${p.note}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-xs text-faint">{fmtDate(p.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
