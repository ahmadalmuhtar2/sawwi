"use client";

// The on-site listing authoring stepper (mk-styled), driven by the shared schema
// (STEPS → Review, with an optional Boost section + strength meter). A progress bar
// tracks required steps. Submit is injected by the caller so the SAME stepper backs
// both the seller flow (POST/PATCH /my/listings) and the manager admin. Mirrors the
// dashboard listing-stepper's UX with the mk field controls.

import * as React from "react";
import {
  STEPS, BOOST, formToListing, listingToForm, type Vertical, type FieldDef, type ListingPayload,
} from "./schema";
import type { AdminListingRow } from "./admin-client";
import { Field, DISPLAY, MONO, btnPrimary, btnGhost, type FormMap } from "./fields";

const AR = "٠١٢٣٤٥٦٧٨٩";
const toAr = (v: unknown) => String(v ?? "").replace(/[0-9]/g, (d) => AR[+d]);
const has = (v: string | string[] | undefined) => (Array.isArray(v) ? v.length > 0 : !!(v && v.trim()));

export type ListingSubmit = (payload: ListingPayload & { published: boolean }) => Promise<unknown>;

export function ListingStepper({ currency, initial, onSubmit, onDone, onCancel }: {
  currency: string;
  initial: AdminListingRow | null;
  onSubmit: ListingSubmit;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [vertical, setVertical] = React.useState<Vertical>(initial?.vertical ?? "car");
  const [form, setForm] = React.useState<FormMap>(initial ? listingToForm(initial) : {});
  const [step, setStep] = React.useState(0);
  const [touched, setTouched] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const steps = STEPS[vertical];
  const boost = BOOST[vertical];
  const REVIEW = steps.length; // the last index = review/publish
  const total = steps.length + 1;

  const set = (k: string, v: string | string[] | null) =>
    setForm((f) => {
      const n = { ...f };
      if (v == null || v === "" || (Array.isArray(v) && !v.length)) delete n[k]; else n[k] = v;
      if (k === "make") delete n.model; // model options depend on make → reset it
      return n;
    });

  const missingIn = (i: number) => steps[i].fields.filter((fd) => fd.req && !has(form[fd.k]));
  const allMissing = steps.flatMap((_, i) => missingIn(i).map((fd) => ({ ...fd, stepIdx: i })));

  function next() {
    if (step < REVIEW) {
      if (missingIn(step).length) { setTouched(true); return; }
      setStep(step + 1); setTouched(false);
    }
  }

  async function publish() {
    if (allMissing.length) { setStep(REVIEW); setTouched(true); return; }
    setSaving(true); setError(null);
    try {
      await onSubmit({ ...formToListing(vertical, form), published: true });
      onDone();
    } catch (e) { setError(e instanceof Error ? e.message : "تعذّر الحفظ"); setSaving(false); }
  }

  const pct = Math.round((Math.min(step, REVIEW) / REVIEW) * 100);
  const boostFilled = boost.filter((fd) => has(form[fd.k])).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <h2 className="text-[22px]" style={{ fontFamily: DISPLAY }}>{initial ? "تحرير الإعلان" : "إعلان جديد"}</h2>
        <button onClick={onCancel} className={btnGhost + " ms-auto"}>إلغاء</button>
      </div>

      {/* progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>
            {step < REVIEW ? `الخطوة ${toAr(step + 1)} من ${toAr(total)} · ${steps[step].label}` : "المراجعة والنشر"}
          </span>
          <span className="text-[12px] text-mk-muted" style={{ fontFamily: MONO }}>{toAr(pct)}%</span>
        </div>
        <span className="block h-1.5 overflow-hidden rounded-full bg-mk-track">
          <span className="block h-full rounded-full bg-mk-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </span>
        {/* step dots */}
        <div className="mt-1 flex flex-wrap gap-1.5">
          {steps.map((s, i) => {
            const done = missingIn(i).length === 0;
            const active = i === step;
            return (
              <button key={s.id} onClick={() => { setStep(i); setTouched(false); }} className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] transition " + (active ? "bg-mk-soft text-mk-strong" : "text-mk-muted hover:text-mk-ink")}>
                <span className={"flex size-4 items-center justify-center rounded-full text-[10px] font-bold " + (done ? "bg-mk-accent text-white" : "border border-mk-line")}>{done ? "✓" : toAr(i + 1)}</span>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* vertical picker (create only, first step) */}
      {!initial && step === 0 && (
        <span className="inline-flex gap-1 self-start rounded-[10px] border border-mk-line-soft bg-mk-track p-[3px]">
          {(["car", "home"] as Vertical[]).map((v) => (
            <button key={v} onClick={() => { setVertical(v); setForm({}); setStep(0); }} className={"rounded-[7px] px-4 py-[7px] text-[13.5px] font-medium transition " + (v === vertical ? "bg-mk-surface text-mk-ink shadow-sm" : "text-mk-muted hover:text-mk-ink")}>
              {v === "car" ? "سيارة" : "عقار"}
            </button>
          ))}
        </span>
      )}

      {/* body */}
      {step < REVIEW ? (
        <div className="flex flex-col gap-5 rounded-2xl border border-mk-line-soft bg-mk-surface p-5 shadow-mk">
          <div className="flex flex-col gap-1">
            <h3 className="text-[18px]" style={{ fontFamily: DISPLAY }}>{steps[step].title}</h3>
            <p className="text-[13px] text-mk-muted">{steps[step].hint}</p>
          </div>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            {steps[step].fields.map((fd) => (
              <div key={fd.k} className={fd.full || fd.type === "photos" || fd.type === "area" || fd.type === "multi" ? "sm:col-span-2" : ""}>
                <Field fd={fd} value={form[fd.k]} onChange={(v) => set(fd.k, v)} currency={currency} form={form} invalid={touched && fd.req && !has(form[fd.k])} />
              </div>
            ))}
          </div>
          {touched && missingIn(step).length > 0 && (
            <p className="text-[13px] font-medium text-mk-danger">أكمل الحقول المطلوبة للمتابعة: {missingIn(step).map((f) => f.label).join("، ")}</p>
          )}
        </div>
      ) : (
        <ReviewStep form={form} set={set} boost={boost} boostFilled={boostFilled} currency={currency} missing={allMissing} onGo={(i) => setStep(i)} />
      )}

      {error && <p className="text-[13px] font-medium text-mk-danger">{error}</p>}

      {/* footer */}
      <div className="flex items-center gap-2.5">
        {step > 0 && <button onClick={() => { setStep(step - 1); setTouched(false); }} disabled={saving} className={btnGhost}>رجوع</button>}
        <div className="ms-auto flex items-center gap-2.5">
          {step < REVIEW && <button onClick={next} className={btnPrimary}>متابعة</button>}
          {step === REVIEW && (
            <button onClick={publish} disabled={saving} className={btnPrimary}>{saving ? "جارٍ النشر…" : allMissing.length ? "أكمل الحقول المطلوبة" : initial ? "حفظ" : "نشر الإعلان"}</button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ form, set, boost, boostFilled, currency, missing, onGo }: {
  form: FormMap;
  set: (k: string, v: string | string[] | null) => void;
  boost: FieldDef[];
  boostFilled: number;
  currency: string;
  missing: (FieldDef & { stepIdx: number })[];
  onGo: (i: number) => void;
}) {
  const strength = Math.round(55 + 45 * (boost.length ? boostFilled / boost.length : 0));
  return (
    <div className="flex flex-col gap-5">
      {missing.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-mk-danger/25 bg-mk-danger-soft p-4">
          <span className="text-[12px] font-medium text-mk-danger">ما زال ناقصًا قبل النشر</span>
          {missing.map((m) => (
            <button key={m.k} onClick={() => onGo(m.stepIdx)} className="flex items-center gap-2 text-start text-[13.5px] text-mk-danger">
              {m.label} <span className="ms-auto text-mk-accent">تعديل</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-mk-line-soft bg-mk-surface p-5 shadow-mk">
        <div className="flex items-center gap-3">
          <h3 className="text-[18px]" style={{ fontFamily: DISPLAY }}>عزّز إعلانك</h3>
          <span className="rounded-full bg-mk-track px-2.5 py-0.5 text-[11px] text-mk-muted">اختياري</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>قوة الإعلان</span>
            <span className="text-[20px] font-extrabold text-mk-ink">{toAr(strength)}%</span>
          </div>
          <span className="block h-1.5 overflow-hidden rounded-full bg-mk-track"><span className="block h-full rounded-full bg-mk-accent transition-[width] duration-500" style={{ width: `${strength}%` }} /></span>
          <span className="text-[13px] text-mk-muted">كل حقل تضيفه يضعك أمام من يبحث عن مواصفاتك بالضبط.</span>
        </div>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          {boost.map((fd) => (
            <div key={fd.k} className={fd.full || fd.type === "multi" ? "sm:col-span-2" : ""}>
              <Field fd={fd} value={form[fd.k]} onChange={(v) => set(fd.k, v)} currency={currency} form={form} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
