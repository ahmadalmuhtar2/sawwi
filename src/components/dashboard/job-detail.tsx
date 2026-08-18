"use client";

// A single job: status, the follow-up marker, and the rating recorded inline. A
// rating can only be recorded once the job is COMPLETED and the follow-up has been
// marked (the server enforces this too). Public comments default to unapproved.

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircle, PhoneCall, Trash2, Star, Check } from "lucide-react";
import { formatArabicDate } from "@/lib/expiry-format";
import {
  JOB_STATUS_LABEL, JOB_STATUS_ORDER,
  RATING_SOURCE_LABEL, RATING_SOURCE_ORDER,
  RATING_COMMENT_MAX,
  type JobStatus, type RatingSource,
} from "@/shared/providers";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { MenuSelect } from "@/components/ui/dropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export interface JobDetailData {
  id: string;
  providerId: string;
  providerName: string;
  customerName: string;
  customerPhone: string;
  category: string;
  area: string;
  description: string | null;
  status: JobStatus;
  matchedAt: string;
  completedAt: string | null;
  followedUpAt: string | null;
  rating: {
    score: number;
    publicComment: string | null;
    commentApproved: boolean;
    privateNote: string | null;
    source: RatingSource;
    recordedAt: string;
  } | null;
}

const waHref = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

export function JobDetail({ siteId, businessName, canManage, job }: { siteId: string; businessName: string; canManage: boolean; job: JobDetailData }) {
  const router = useRouter();
  const toast = useToast();
  const base = `/dashboard/sites/${siteId}/jobs/${job.id}`;
  const [confirm, setConfirm] = React.useState(false);
  const eligibleToRate = job.status === "COMPLETED" && job.followedUpAt !== null;

  const patch = async (body: Record<string, unknown>, okMsg = "تم الحفظ ✓") => {
    try {
      const res = await fetch(base, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!(await res.json()).ok) throw new Error();
      toast(okMsg);
      router.refresh();
    } catch {
      toast("تعذّر الحفظ", "error");
    }
  };

  const del = async () => {
    try {
      const res = await fetch(base, { method: "DELETE" });
      if (!(await res.json()).ok) throw new Error();
      toast("تم الحذف ✓");
      router.push(`/dashboard/sites/${siteId}/jobs`);
    } catch {
      toast("تعذّر الحذف", "error");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/dashboard/sites/${siteId}/jobs`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowRight className="size-4" /> رجوع إلى الشغلات
      </Link>
      <PageHeader title={job.providerName} subtitle={`${businessName} · ${job.category}`}>
        {canManage ? (
          <MenuSelect
            value={job.status}
            onChange={(v) => patch({ status: v }, "تم تحديث الحالة ✓")}
            options={JOB_STATUS_ORDER.map((s) => ({ value: s, label: JOB_STATUS_LABEL[s] }))}
          />
        ) : (
          <Badge>{JOB_STATUS_LABEL[job.status]}</Badge>
        )}
      </PageHeader>

      <Panel className="p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Item label="المزوّد"><Link href={`/dashboard/sites/${siteId}/providers/${job.providerId}`} className="text-accent-300 hover:underline">{job.providerName}</Link></Item>
          <Item label="الزبون">{job.customerName}</Item>
          <Item label="رقم الزبون (داخلي)">
            <a href={waHref(job.customerPhone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-mono text-accent-300 hover:underline" dir="ltr">
              <MessageCircle className="size-4" /> {job.customerPhone}
            </a>
          </Item>
          <Item label="المنطقة">{job.area}</Item>
          <Item label="تاريخ المطابقة">{formatArabicDate(new Date(job.matchedAt))}</Item>
          {job.completedAt && <Item label="تاريخ الإكمال">{formatArabicDate(new Date(job.completedAt))}</Item>}
          <Item label="المتابعة">
            {job.followedUpAt ? (
              <span className="text-accent-400">تمّت — {formatArabicDate(new Date(job.followedUpAt))}</span>
            ) : (
              <span className="text-faint">لم تتم بعد</span>
            )}
          </Item>
          {job.description && <Item label="التفاصيل" full><span className="whitespace-pre-wrap">{job.description}</span></Item>}
        </dl>

        {canManage && !job.followedUpAt && (
          <div className="mt-4 border-t border-line pt-4">
            <Button variant="secondary" className="gap-2" onClick={() => patch({ markFollowedUp: true }, "تم تسجيل المتابعة ✓")}>
              <PhoneCall className="size-4" /> تسجيل أن المتابعة تمّت
            </Button>
          </div>
        )}
      </Panel>

      {/* rating */}
      <Panel className="mt-4 p-5" title="التقييم">
        {job.rating ? (
          <RatingView siteId={siteId} jobId={job.id} rating={job.rating} canManage={canManage} onChange={() => router.refresh()} />
        ) : eligibleToRate && canManage ? (
          <RatingForm siteId={siteId} jobId={job.id} onDone={() => router.refresh()} />
        ) : (
          <p className="text-[13.5px] text-muted">
            لتسجيل تقييم: اجعل الشغلة «مكتملة» وسجّل أن المتابعة تمّت أولًا.
          </p>
        )}
      </Panel>

      {canManage && (
        <div className="mt-4">
          <button onClick={() => setConfirm(true)} className="inline-flex items-center gap-1.5 rounded-md border border-danger/40 px-3 py-2 text-[13px] text-danger transition hover:bg-danger/5">
            <Trash2 className="size-4" /> حذف الشغلة
          </button>
        </div>
      )}

      <Modal open={confirm} onClose={() => setConfirm(false)} title="حذف الشغلة؟">
        <p className="text-[14px] text-muted">سيُحذف التقييم المرتبط بها أيضًا. لا يمكن التراجع.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setConfirm(false)} className="rounded-md border border-line px-4 py-2 text-[13.5px] text-muted">إلغاء</button>
          <Button variant="danger" onClick={del}>حذف</Button>
        </div>
      </Modal>
    </div>
  );
}

/* ── record a rating ── */
function RatingForm({ siteId, jobId, onDone }: { siteId: string; jobId: string; onDone: () => void }) {
  const toast = useToast();
  const [score, setScore] = React.useState(0);
  const [publicComment, setPublicComment] = React.useState("");
  const [privateNote, setPrivateNote] = React.useState("");
  const [source, setSource] = React.useState<RatingSource>("FOLLOW_UP_CALL");
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score < 1) { toast("اختر تقييمًا من ١ لـ ٥", "error"); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/jobs/${jobId}/rating`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ score, publicComment, privateNote, source }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message);
      toast("تم تسجيل التقييم ✓");
      onDone();
    } catch (e) {
      toast(e instanceof Error && e.message ? e.message : "تعذّر التسجيل", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <StarPicker score={score} onChange={setScore} />
      <label className="block">
        <span className="mb-1 block text-[12.5px] text-muted">المصدر</span>
        <MenuSelect value={source} onChange={(v) => setSource(v as RatingSource)} options={RATING_SOURCE_ORDER.map((s) => ({ value: s, label: RATING_SOURCE_LABEL[s] }))} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[12.5px] text-muted">تعليق عام (اختياري)</span>
        <textarea value={publicComment} onChange={(e) => setPublicComment(e.target.value)} rows={2} maxLength={RATING_COMMENT_MAX} className={mInput} placeholder="يظهر للعموم فقط بعد الموافقة عليه" />
      </label>
      <label className="block">
        <span className="mb-1 block text-[12.5px] text-muted">ملاحظة خاصة (اختياري)</span>
        <textarea value={privateNote} onChange={(e) => setPrivateNote(e.target.value)} rows={2} className={mInput} placeholder="لا تظهر للعموم أبدًا" />
      </label>
      <div className="flex justify-end"><Button type="submit" loading={busy}>تسجيل التقييم</Button></div>
    </form>
  );
}

/* ── view / moderate an existing rating ── */
function RatingView({ siteId, jobId, rating, canManage, onChange }: {
  siteId: string;
  jobId: string;
  rating: NonNullable<JobDetailData["rating"]>;
  canManage: boolean;
  onChange: () => void;
}) {
  const toast = useToast();
  const patch = async (body: Record<string, unknown>, okMsg: string) => {
    try {
      const res = await fetch(`/api/sites/${siteId}/jobs/${jobId}/rating`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!(await res.json()).ok) throw new Error();
      toast(okMsg);
      onChange();
    } catch {
      toast("تعذّر الحفظ", "error");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Stars value={rating.score} />
        <span className="text-[13px] text-muted">{RATING_SOURCE_LABEL[rating.source]} · {formatArabicDate(new Date(rating.recordedAt))}</span>
      </div>
      {rating.publicComment && (
        <div className="rounded-md border border-line bg-surface p-3">
          <p className="text-[13.5px] text-ink">“{rating.publicComment}”</p>
          <div className="mt-2 flex items-center gap-2">
            {rating.commentApproved ? (
              <span className="inline-flex items-center gap-1 text-[12px] text-accent-400"><Check className="size-3.5" /> موافَق عليه — يظهر للعموم</span>
            ) : (
              <span className="text-[12px] text-warn">بانتظار الموافقة — مخفي</span>
            )}
            {canManage && (
              <button onClick={() => patch({ commentApproved: !rating.commentApproved }, rating.commentApproved ? "أُلغيت الموافقة" : "تمت الموافقة ✓")} className="text-[12px] font-semibold text-accent-300 underline">
                {rating.commentApproved ? "إلغاء الموافقة" : "الموافقة على النشر"}
              </button>
            )}
          </div>
        </div>
      )}
      {rating.privateNote && (
        <div className="rounded-md border border-dashed border-line p-3">
          <p className="text-[12px] text-faint">ملاحظة خاصة (لا تظهر للعموم)</p>
          <p className="text-[13.5px] text-muted">{rating.privateNote}</p>
        </div>
      )}
    </div>
  );
}

function StarPicker({ score, onChange }: { score: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n}`} className="p-0.5">
          <Star className={`size-7 ${n <= score ? "fill-amber-400 text-amber-400" : "text-line"}`} />
        </button>
      ))}
    </div>
  );
}
function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`size-5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-line"}`} />)}
    </span>
  );
}

const mInput = "w-full rounded-md border border-line bg-bg px-3 py-2 text-[14px] outline-none focus:border-accent";

function Item({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="mb-1 text-[12px] text-faint">{label}</dt>
      <dd className="text-[14px] text-ink">{children}</dd>
    </div>
  );
}
