"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet, CalendarClock, Plus, History, CircleCheck, TriangleAlert, CircleX,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

type Status = "active" | "expiring" | "expired";
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
interface Summary {
  total: number;
  active: number;
  expiring: number;
  expired: number;
}

const CUR: Record<string, string> = { SYP: "ل.س", USD: "$", EUR: "€" };
const dateFmt = new Intl.DateTimeFormat("ar-SY", { dateStyle: "medium" });
const fmtDate = (iso: string) => dateFmt.format(new Date(iso));
const fmtMoney = (n: number, c: string) =>
  `${n.toLocaleString("ar-SY")} ${CUR[c] ?? c}`;
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

export function BillingView({ summary, sites }: { summary: Summary; sites: Row[] }) {
  const router = useRouter();
  const toast = useToast();

  const [pay, setPay] = useState<Row | null>(null);
  const [expiryRow, setExpiryRow] = useState<Row | null>(null);
  const [historyRow, setHistoryRow] = useState<Row | null>(null);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold text-ink">الفوترة والاشتراكات</h1>
      <p className="mt-1 text-sm text-muted">
        حدّد تاريخ انتهاء كل موقع، وسجّل الدفعات التي تحصّلها من العملاء. الموقع
        يتوقّف تلقائيًا عند انتهاء التاريخ ما لم يُجدَّد.
      </p>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile icon={<Wallet className="size-4" />} label="المواقع" value={summary.total} tone="ink" />
        <Tile icon={<CircleCheck className="size-4" />} label="نشطة" value={summary.active} tone="accent" />
        <Tile icon={<TriangleAlert className="size-4" />} label="تنتهي قريبًا" value={summary.expiring} tone="warn" />
        <Tile icon={<CircleX className="size-4" />} label="منتهية" value={summary.expired} tone="danger" />
      </div>

      {sites.length === 0 ? (
        <Card className="mt-6 p-8 text-center text-sm text-muted">
          لا مواقع بعد. أنشئ موقعًا لتظهر فوترته هنا.
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {sites.map((s) => {
            const sub = s.subscription;
            return (
              <Card key={s.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold text-ink">{s.businessName}</span>
                      <StatusChip sub={sub} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                      {sub ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="size-3.5" />
                          ينتهي {fmtDate(sub.expiry)}
                          <span className={cn(
                            "font-medium",
                            sub.status === "expired" ? "text-danger"
                              : sub.status === "expiring" ? "text-warn" : "text-accent",
                          )}>
                            · {sub.daysLeft < 0 ? `متأخر ${Math.abs(sub.daysLeft)} يومًا` : `${sub.daysLeft} يومًا متبقية`}
                          </span>
                        </span>
                      ) : (
                        <span>لم يُحدَّد تاريخ انتهاء بعد</span>
                      )}
                      <span>المحصّل: {fmtMoney(s.totalCollected, sub?.currency ?? "SYP")} ({s.paymentsCount} دفعات)</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button size="sm" onClick={() => setPay(s)} className="gap-1.5">
                      <Plus className="size-4" /> دفعة
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setExpiryRow(s)} className="gap-1.5">
                      <CalendarClock className="size-4" /> التاريخ
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setHistoryRow(s)} className="gap-1.5">
                      <History className="size-4" /> السجل
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {pay && <PaymentModal row={pay} onClose={() => setPay(null)} onDone={() => { setPay(null); router.refresh(); }} toast={toast} />}
      {expiryRow && <ExpiryModal row={expiryRow} onClose={() => setExpiryRow(null)} onDone={() => { setExpiryRow(null); router.refresh(); }} toast={toast} />}
      {historyRow && <HistoryModal row={historyRow} onClose={() => setHistoryRow(null)} />}
    </div>
  );
}

function Tile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "ink" | "accent" | "warn" | "danger" }) {
  const c = {
    ink: "text-muted", accent: "text-accent", warn: "text-warn", danger: "text-danger",
  }[tone];
  return (
    <Card className="p-4">
      <div className={cn("flex items-center gap-1.5 text-sm", c)}>{icon}<span className="text-muted">{label}</span></div>
      <p className="mt-1.5 text-2xl font-extrabold text-ink">{value}</p>
    </Card>
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
              <option value="SYP">ل.س</option><option value="USD">USD</option><option value="EUR">EUR</option>
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
