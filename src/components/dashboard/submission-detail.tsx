"use client";

// A single submission — all fields, the raw phone beside the normalized one, an
// admin note that saves on blur, the status control, and a confirmed delete.
// Template-level (reused by any submission-collecting template).

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircle, Trash2, UserPlus } from "lucide-react";
import { formatArabicDate } from "@/lib/expiry-format";
import { KIND_LABEL, STATUS_LABEL, STATUS_ORDER, SOURCE_LABEL, type SubmissionStatus } from "@/shared/submissions";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { MenuSelect } from "@/components/ui/dropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export interface Detail {
  id: string;
  kind: "PROVIDER" | "CUSTOMER";
  status: SubmissionStatus;
  name: string;
  phone: string;
  phoneRaw: string;
  category: string;
  area: string;
  details: string | null;
  images: string[];
  adminNote: string | null;
  source: string;
  utmSource: string | null;
  createdAt: string;
  statusAt: string | null;
}

const waHref = (phone: string, greeting: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(greeting)}`;

export function SubmissionDetail({ siteId, businessName, canManage, submission, linkedProviderId, linkedCustomerId }: { siteId: string; businessName: string; canManage: boolean; submission: Detail; linkedProviderId: string | null; linkedCustomerId: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = React.useState(submission.status);
  const [note, setNote] = React.useState(submission.adminNote ?? "");
  const [confirm, setConfirm] = React.useState(false);
  const [converting, setConverting] = React.useState(false);
  const base = `/dashboard/sites/${siteId}/submissions`; // dashboard page (navigation)
  const api = `/api/sites/${siteId}/submissions`; // REST endpoint (mutations)

  // Promote an ACCEPTED lead into its list: PROVIDER → the directory, CUSTOMER → the
  // customer list. Links this submission; idempotent server-side. Navigates to the row.
  const convert = async (kind: "providers" | "customers") => {
    setConverting(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/${kind}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submissionId: submission.id }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message);
      toast(kind === "providers" ? "تم التحويل لمزوّد ✓" : "تم التحويل لزبون ✓");
      router.push(`/dashboard/sites/${siteId}/${kind}/${json.data.id}`);
    } catch (e) {
      toast(e instanceof Error && e.message ? e.message : "تعذّر التحويل", "error");
      setConverting(false);
    }
  };
  // Accepting a lead auto-adds it to its list (server-side). So the usual state is
  // "already linked" → offer a jump to its page. The manual convert only appears as a
  // fallback: an accepted lead whose auto-convert didn't land.
  const isProvider = canManage && submission.kind === "PROVIDER";
  const isCustomer = canManage && submission.kind === "CUSTOMER";
  const canConvert = isProvider && submission.status === "ACCEPTED" && !linkedProviderId;
  const canConvertCustomer = isCustomer && submission.status === "ACCEPTED" && !linkedCustomerId;

  const patch = async (body: Record<string, unknown>, okMsg: string) => {
    try {
      const res = await fetch(`${api}/${submission.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!(await res.json()).ok) throw new Error();
      toast(okMsg);
      router.refresh();
    } catch {
      toast("تعذّر الحفظ", "error");
    }
  };

  const del = async () => {
    try {
      const res = await fetch(`${api}/${submission.id}`, { method: "DELETE" });
      if (!(await res.json()).ok) throw new Error();
      toast("تم الحذف ✓");
      router.push(base);
    } catch {
      toast("تعذّر الحذف", "error");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={base} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowRight className="size-4" /> رجوع إلى الطلبات
      </Link>
      <PageHeader title={submission.name} subtitle={`${KIND_LABEL[submission.kind]} · ${submission.category}`}>
        {canManage && (
          <MenuSelect
            value={status}
            onChange={(v) => { setStatus(v as SubmissionStatus); patch({ status: v }, "تم تحديث الحالة ✓"); }}
            options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
          />
        )}
        {!canManage && <Badge>{STATUS_LABEL[status]}</Badge>}
      </PageHeader>

      {isProvider && linkedProviderId && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent-200 bg-accent-50 px-4 py-3">
          <span className="text-[13.5px] text-accent-400">هذا المزوّد مُضاف إلى الدليل.</span>
          <Link href={`/dashboard/sites/${siteId}/providers/${linkedProviderId}`} className="inline-flex items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-[13.5px] font-medium text-white transition hover:opacity-90">
            <UserPlus className="size-4" /> فتح صفحة المزوّد
          </Link>
        </div>
      )}

      {canConvert && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent-200 bg-accent-50 px-4 py-3">
          <span className="text-[13.5px] text-accent-400">هذا الطلب مقبول — حوّله إلى مزوّد لإضافته إلى الدليل.</span>
          <Button onClick={() => convert("providers")} loading={converting} className="gap-2">
            <UserPlus className="size-4" /> تحويل لمزوّد
          </Button>
        </div>
      )}

      {isCustomer && linkedCustomerId && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent-200 bg-accent-50 px-4 py-3">
          <span className="text-[13.5px] text-accent-400">هذا الزبون مُضاف إلى قائمة الزبائن.</span>
          <Link href={`/dashboard/sites/${siteId}/customers/${linkedCustomerId}`} className="inline-flex items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-[13.5px] font-medium text-white transition hover:opacity-90">
            <UserPlus className="size-4" /> فتح صفحة الزبون
          </Link>
        </div>
      )}

      {canConvertCustomer && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent-200 bg-accent-50 px-4 py-3">
          <span className="text-[13.5px] text-accent-400">هذا الطلب مقبول — حوّله إلى زبون لإضافته إلى قائمة الزبائن.</span>
          <Button onClick={() => convert("customers")} loading={converting} className="gap-2">
            <UserPlus className="size-4" /> تحويل لزبون
          </Button>
        </div>
      )}

      <Panel className="p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Item label="رقم الواتساب">
            <a href={waHref(submission.phone, `مرحبا ${submission.name}، معك «${businessName}».`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono text-accent-300 hover:underline" dir="ltr">
              <MessageCircle className="size-4" /> {submission.phone}
            </a>
          </Item>
          <Item label="الرقم كما كُتب"><span className="font-mono text-muted" dir="ltr">{submission.phoneRaw}</span></Item>
          <Item label="الخدمة">{submission.category}</Item>
          <Item label="المنطقة">{submission.area}</Item>
          <Item label="المصدر">{SOURCE_LABEL[submission.source] ?? submission.source}{submission.utmSource ? ` · ${submission.utmSource}` : ""}</Item>
          <Item label="التاريخ">{formatArabicDate(new Date(submission.createdAt))}</Item>
          {submission.details && <Item label="التفاصيل" full><span className="whitespace-pre-wrap">{submission.details}</span></Item>}
          {submission.statusAt && <Item label="آخر تغيير للحالة">{formatArabicDate(new Date(submission.statusAt))}</Item>}
          {submission.images.length > 0 && (
            <Item label="الصور" full>
              <div className="flex flex-wrap gap-2.5">
                {submission.images.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block size-24 overflow-hidden rounded-lg border border-line transition hover:opacity-90">
                    {/* eslint-disable-next-line @next/next/no-img-element -- storage URL */}
                    <img src={url} alt="" className="size-full object-cover" />
                  </a>
                ))}
              </div>
            </Item>
          )}
        </dl>
      </Panel>

      {canManage && (
        <Panel className="mt-4 p-5" title="ملاحظة داخلية">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => { if (note !== (submission.adminNote ?? "")) patch({ adminNote: note }, "تم حفظ الملاحظة ✓"); }}
            rows={3}
            placeholder="ملاحظة للفريق — تُحفظ تلقائيًا"
            className="w-full rounded-md border border-line bg-bg px-3 py-2 text-[14px] outline-none focus:border-accent"
          />
        </Panel>
      )}

      {canManage && (
        <div className="mt-4">
          <button onClick={() => setConfirm(true)} className="inline-flex items-center gap-1.5 rounded-md border border-danger/40 px-3 py-2 text-[13px] text-danger transition hover:bg-danger/5">
            <Trash2 className="size-4" /> حذف الطلب
          </button>
        </div>
      )}

      <Modal open={confirm} onClose={() => setConfirm(false)} title="حذف الطلب؟">
        <p className="text-[14px] text-muted">لا يمكن التراجع عن هذا الإجراء.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setConfirm(false)} className="rounded-md border border-line px-4 py-2 text-[13.5px] text-muted">إلغاء</button>
          <Button variant="danger" onClick={del}>حذف</Button>
        </div>
      </Modal>
    </div>
  );
}

function Item({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="mb-1 text-[12px] text-faint">{label}</dt>
      <dd className="text-[14px] text-ink">{children}</dd>
    </div>
  );
}
