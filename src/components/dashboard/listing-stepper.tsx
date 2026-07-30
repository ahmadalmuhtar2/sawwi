"use client";

// The owner's create/edit flow for a marketplace listing — a stepper driven by
// the SAME schema that powers the public filters/detail (build spec §6/§7):
// required steps → Review → Boost (optional, with a listing-strength meter).
// Every field the owner fills becomes a visitor filter, which the UI says out loud.

import * as React from "react";
import { Check, AlertTriangle, ImagePlus, X, Filter, Loader2 } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { MenuSelect } from "@/components/ui/dropdown";
import { PhoneInput } from "@/components/ui/phone-input";
import { uploadStaging } from "@/components/templates/fields";
import {
  STEPS, BOOST, cardSpecLine, formToListing,
  type Vertical, type FieldDef, type MarketplaceListing,
} from "@/templates/marketplace/schema";

type FormVal = string | string[];
type Form = Record<string, FormVal>;

const AR = "٠١٢٣٤٥٦٧٨٩";
const toAr = (v: unknown) => String(v ?? "").replace(/[0-9]/g, (d) => AR[+d]);

function hasValue(v: FormVal | undefined): boolean {
  if (Array.isArray(v)) return v.length > 0;
  return typeof v === "string" && v.trim().length > 0;
}

/** Build the initial form map from an existing listing (edit), else empty. */
function formFromListing(l: MarketplaceListing | null): Form {
  if (!l) return {};
  const f: Form = {};
  if (l.title) f.title = l.title;
  if (l.price != null) f.price = String(l.price);
  if (l.offer) f.offer = l.offer;
  if (l.place) f.place = l.place;
  if (l.description) f.desc = l.description;
  if (l.images?.length) f.photos = l.images;
  if (l.features?.length) f.features = l.features;
  for (const [k, v] of Object.entries(l.specs ?? {})) f[k] = String(v);
  return f;
}

export function ListingStepper({
  siteId,
  vertical,
  currency,
  initial,
  onDone,
  onCancel,
}: {
  siteId: string;
  vertical: Vertical;
  currency: string;
  initial: MarketplaceListing | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const steps = STEPS[vertical];
  const boost = BOOST[vertical];
  const [form, setForm] = React.useState<Form>(() => formFromListing(initial));
  const [step, setStep] = React.useState(0); // 0..steps.length-1 = forms, then Review, then Boost
  const [touched, setTouched] = React.useState(false);
  const [published, setPublished] = React.useState<boolean>(initial ? true : false);
  const [saving, setSaving] = React.useState(false);
  const [listingId, setListingId] = React.useState<string | null>(initial?.id ?? null);

  const REVIEW = steps.length;
  const BOOSTI = steps.length + 1;

  const set = (k: string, v: FormVal | null) =>
    setForm((s) => {
      const n = { ...s };
      if (v === null || v === "") delete n[k];
      else n[k] = v;
      return n;
    });
  const toggleMulti = (k: string, v: string) =>
    setForm((s) => {
      const list = Array.isArray(s[k]) ? (s[k] as string[]) : [];
      const nl = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
      const n = { ...s };
      if (nl.length) n[k] = nl;
      else delete n[k];
      return n;
    });

  const missingInStep = (i: number) => steps[i].fields.filter((fd) => fd.req && !hasValue(form[fd.k]));
  const allMissing = steps.flatMap((s, i) => missingInStep(i).map((fd) => ({ ...fd, stepIdx: i })));

  function goStep(n: number) {
    setStep(n);
    setTouched(false);
  }
  function next() {
    if (step < REVIEW) {
      const miss = missingInStep(step);
      if (miss.length) {
        setTouched(true);
        return;
      }
      goStep(step + 1);
    }
  }

  async function persist(pub: boolean): Promise<boolean> {
    setSaving(true);
    try {
      const payload = { ...formToListing(vertical, form), published: pub };
      if (listingId) {
        await api.put(`/api/sites/${siteId}/listings/${listingId}`, payload);
      } else {
        const created = await api.post<{ id: string }>(`/api/sites/${siteId}/listings`, payload);
        setListingId(created.id);
      }
      return true;
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر الحفظ", "error");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (allMissing.length) {
      setStep(REVIEW);
      return;
    }
    if (await persist(true)) {
      setPublished(true);
      toast("تم نشر الإعلان ✓");
      goStep(BOOSTI);
    }
  }

  async function saveBoost(done: boolean) {
    if (await persist(true) && done) {
      toast("تم الحفظ ✓");
      onDone();
    } else if (done) {
      onDone();
    }
  }

  // listing strength: 55% for the required set, up to 100% as optional fill.
  const boostFilled = boost.filter((fd) => hasValue(form[fd.k])).length;
  const strength = published ? Math.round(55 + 45 * (boost.length ? boostFilled / boost.length : 0)) : 0;
  const filterCount = [...steps.flatMap((s) => s.fields), ...boost].filter((fd) => fd.filter && hasValue(form[fd.k])).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      {/* rail */}
      <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {steps.map((s, i) => {
          const miss = missingInStep(i).length;
          const active = step === i;
          return (
            <button
              key={s.id}
              onClick={() => goStep(i)}
              className={"flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-start transition " + (active ? "bg-accent-100" : "hover:bg-black/[0.03] dark:hover:bg-white/5")}
            >
              <span className={"flex size-6 items-center justify-center rounded-full text-[12px] font-bold " + (miss === 0 ? "bg-accent text-white" : active ? "border border-accent text-accent" : "border border-line text-muted")}>
                {miss === 0 ? <Check className="size-3.5" /> : toAr(i + 1)}
              </span>
              <span className="hidden flex-col lg:flex">
                <span className={"text-sm font-medium " + (active ? "text-ink" : "text-muted")}>{s.label}</span>
                <span className="text-[11px] text-faint">{miss === 0 ? "مكتمل" : `${toAr(miss)} ناقص`}</span>
              </span>
            </button>
          );
        })}
        <button onClick={() => goStep(REVIEW)} className={"flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 " + (step === REVIEW ? "bg-accent-100" : "hover:bg-black/[0.03] dark:hover:bg-white/5")}>
          <span className="flex size-6 items-center justify-center rounded-full border border-line text-[12px] text-muted">★</span>
          <span className="hidden text-sm font-medium text-muted lg:block">المراجعة والنشر</span>
        </button>
      </div>

      {/* body */}
      <div className="flex flex-col gap-5">
        {step < REVIEW && (
          <StepBody
            step={steps[step]}
            form={form}
            set={set}
            toggleMulti={toggleMulti}
            touched={touched}
            currency={currency}
            counter={`الخطوة ${toAr(step + 1)} من ${toAr(steps.length)}`}
          />
        )}

        {step === REVIEW && (
          <ReviewBody
            vertical={vertical}
            form={form}
            currency={currency}
            missing={allMissing}
            onGo={(i) => goStep(i)}
          />
        )}

        {step === BOOSTI && (
          <BoostBody
            fields={boost}
            form={form}
            set={set}
            toggleMulti={toggleMulti}
            strength={strength}
            filterCount={filterCount}
            currency={currency}
          />
        )}

        {/* footer */}
        <div className="flex flex-wrap items-center gap-2.5">
          {step > 0 && step <= REVIEW && (
            <Button variant="ghost" onClick={() => goStep(step - 1)} disabled={saving}>رجوع</Button>
          )}
          <Button variant="ghost" onClick={onCancel} disabled={saving}>إلغاء</Button>

          <div className="ms-auto flex items-center gap-2.5">
            {step < REVIEW && <Button onClick={next}>متابعة</Button>}
            {step === REVIEW && (
              <Button onClick={publish} loading={saving} variant={allMissing.length ? "secondary" : "primary"}>
                {allMissing.length ? "أكمل الحقول المطلوبة" : "انشر الإعلان"}
              </Button>
            )}
            {step === BOOSTI && (
              <>
                <Button variant="ghost" onClick={() => saveBoost(true)} disabled={saving}>لاحقًا</Button>
                <Button onClick={() => saveBoost(true)} loading={saving}>حفظ وإنهاء</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── step body ──────────────────────────── */

function StepBody({ step, form, set, toggleMulti, touched, currency, counter }: {
  step: (typeof STEPS)[Vertical][number];
  form: Form;
  set: (k: string, v: FormVal | null) => void;
  toggleMulti: (k: string, v: string) => void;
  touched: boolean;
  currency: string;
  counter: string;
}) {
  const miss = step.fields.filter((f) => f.req && !hasValue(form[f.k]));
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-ink">{step.title}</h3>
          <span className="ms-auto text-[11px] text-faint">{counter}</span>
        </div>
        <p className="text-sm text-muted">{step.hint}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {step.fields.map((fd) => (
          <FieldControl key={fd.k} fd={fd} form={form} set={set} toggleMulti={toggleMulti} touched={touched} currency={currency} />
        ))}
      </div>
      {touched && miss.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger-100 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
          <span className="text-sm text-danger">أكمل الحقول المطلوبة للمتابعة: {miss.map((f) => f.label).join("، ")}</span>
        </div>
      )}
    </div>
  );
}

function FieldControl({ fd, form, set, toggleMulti, touched, currency }: {
  fd: FieldDef;
  form: Form;
  set: (k: string, v: FormVal | null) => void;
  toggleMulti: (k: string, v: string) => void;
  touched: boolean;
  currency: string;
}) {
  const v = form[fd.k];
  const invalid = touched && fd.req && !hasValue(v);
  const unit = fd.unit === "" ? currency : fd.unit;
  return (
    <div className={"flex flex-col gap-2 " + (fd.full ? "sm:col-span-2" : "")}>
      <span className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-ink">{fd.label}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-faint">{fd.req ? "مطلوب" : "اختياري"}</span>
        {fd.filter && (
          <span className="ms-auto inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-accent">
            <Filter className="size-3" /> فلتر
          </span>
        )}
      </span>

      {(fd.type === "text" || fd.type === "number") && (
        <span className="flex items-center gap-2">
          <Input
            type={fd.type === "number" ? "number" : "text"}
            inputMode={fd.type === "number" ? "decimal" : undefined}
            value={(v as string) ?? ""}
            onChange={(e) => set(fd.k, e.target.value)}
            placeholder={fd.placeholder}
            className={invalid ? "border-danger" : ""}
          />
          {unit && <span className="whitespace-nowrap text-xs font-medium text-faint">{unit}</span>}
        </span>
      )}
      {fd.type === "select" && (
        <MenuSelect
          value={(v as string) ?? ""}
          options={(fd.opts ?? []).map((o) => ({ value: o, label: o }))}
          onChange={(val) => set(fd.k, val)}
          placeholder={fd.placeholder ?? "اختر"}
          ariaLabel={fd.label}
        />
      )}
      {fd.type === "phone" && (
        <PhoneInput value={(v as string) ?? ""} onChange={(val) => set(fd.k, val || null)} placeholder={fd.placeholder} />
      )}
      {fd.type === "area" && (
        <Textarea value={(v as string) ?? ""} onChange={(e) => set(fd.k, e.target.value)} placeholder={fd.placeholder} rows={3} className={invalid ? "border-danger" : ""} />
      )}
      {fd.type === "chips" && (
        <span className="flex flex-wrap gap-1.5">
          {fd.opts?.map((o) => {
            const on = v === o;
            return (
              <button key={o} type="button" onClick={() => set(fd.k, on ? null : o)} className={"h-9 rounded-full px-3.5 text-[13.5px] font-medium transition " + (on ? "bg-accent-100 text-accent-900 ring-1 ring-accent/30" : "border border-line text-muted hover:text-ink")}>
                {o}
              </button>
            );
          })}
        </span>
      )}
      {fd.type === "multi" && (
        <span className="flex flex-wrap gap-1.5">
          {fd.opts?.map((o) => {
            const on = Array.isArray(v) && v.includes(o);
            return (
              <button key={o} type="button" onClick={() => toggleMulti(fd.k, o)} className={"h-9 rounded-full px-3.5 text-[13.5px] font-medium transition " + (on ? "bg-accent-100 text-accent-900 ring-1 ring-accent/30" : "border border-line text-muted hover:text-ink")}>
                {o}
              </button>
            );
          })}
        </span>
      )}
      {fd.type === "photos" && (
        <PhotoField value={Array.isArray(v) ? v : []} onChange={(urls) => set(fd.k, urls.length ? urls : null)} invalid={invalid} />
      )}

      {fd.hint && <span className={"text-xs " + (invalid ? "text-danger" : "text-faint")}>{invalid ? "هذا الحقل مطلوب للنشر" : fd.hint}</span>}
    </div>
  );
}

function PhotoField({ value, onChange, invalid }: { value: string[]; onChange: (urls: string[]) => void; invalid?: boolean }) {
  const toast = useToast();
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of files.slice(0, 12 - value.length)) urls.push(await uploadStaging(f));
      onChange([...value, ...urls]);
    } catch (err) {
      toast(err instanceof Error ? err.message : "تعذّر رفع الصورة", "error");
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {value.map((url, i) => (
        <span key={i} className="group relative size-[92px] overflow-hidden rounded-lg border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element -- staged upload preview */}
          <img src={url} alt="" className="size-full object-cover" />
          {i === 0 && <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[10px] text-white">الغلاف</span>}
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute end-1 top-1 inline-flex size-5 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100">
            <X className="size-3" />
          </button>
        </span>
      ))}
      {value.length < 12 && (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className={"flex size-[92px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-faint transition hover:text-ink " + (invalid ? "border-danger" : "border-line")}>
          {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
          <span className="text-[11px]">أضف صورة</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
    </div>
  );
}

/* ──────────────────────────────── review ────────────────────────────── */

function ReviewBody({ vertical, form, currency, missing, onGo }: {
  vertical: Vertical;
  form: Form;
  currency: string;
  missing: (FieldDef & { stepIdx: number })[];
  onGo: (i: number) => void;
}) {
  const preview: MarketplaceListing = { id: "preview", ...formToListing(vertical, form) };
  const chips = [...STEPS[vertical].flatMap((s) => s.fields), ...BOOST[vertical]]
    .filter((fd) => fd.filter && hasValue(form[fd.k]))
    .map((fd) => (Array.isArray(form[fd.k]) ? (form[fd.k] as string[]).join("، ") : String(form[fd.k])));

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-xl font-bold text-ink">راجِع إعلانك ثم انشره</h3>

      <div className="max-w-sm overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <div className="flex h-40 items-center justify-center bg-black/[0.04] text-faint dark:bg-white/5">
          {preview.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element -- staged preview
            <img src={preview.images[0]} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-sm">صورتك الأولى</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5 p-4">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-ink">{preview.title || "عنوان الإعلان"}</span>
            <span className="ms-auto font-bold text-ink">{preview.price != null ? `${toAr(preview.price)} ${currency}` : "—"}</span>
          </div>
          <span className="text-xs text-muted">{cardSpecLine(preview) || "التفاصيل تظهر هنا"}</span>
          <span className="text-xs text-faint">{preview.place}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-faint">سيظهر إعلانك ضمن الفلاتر</span>
        <span className="flex flex-wrap gap-1.5">
          {chips.length ? chips.map((c, i) => (
            <span key={i} className="inline-flex h-7 items-center rounded-full bg-accent-100 px-3 text-[12.5px] text-accent-900">{c}</span>
          )) : <span className="text-sm text-faint">أضف تفاصيل لتظهر ضمن الفلاتر.</span>}
        </span>
      </div>

      {missing.length > 0 && (
        <div className="flex flex-col gap-2.5 rounded-lg border border-danger/20 bg-danger-100 p-4">
          <span className="text-[11px] font-medium uppercase tracking-wide text-danger">ما زال ناقصًا</span>
          {missing.map((m) => (
            <button key={m.k} onClick={() => onGo(m.stepIdx)} className="flex items-center gap-2.5 text-start">
              <span className="text-sm text-danger">{m.label}</span>
              <span className="ms-auto text-[13px] font-medium text-accent">تعديل</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────── boost ─────────────────────────────── */

function BoostBody({ fields, form, set, toggleMulti, strength, filterCount, currency }: {
  fields: FieldDef[];
  form: Form;
  set: (k: string, v: FormVal | null) => void;
  toggleMulti: (k: string, v: string) => void;
  strength: number;
  filterCount: number;
  currency: string;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold text-ink">عزّز إعلانك</h3>
        <span className="inline-flex h-6 items-center rounded-full bg-black/[0.05] px-2.5 text-[12px] font-medium text-muted dark:bg-white/6">اختياري</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] font-medium uppercase tracking-wide text-faint">قوة الإعلان</span>
          <span className="ms-auto text-2xl font-extrabold text-ink">{toAr(strength)}%</span>
        </div>
        <span className="block h-1.5 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/8">
          <span className="block h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${strength}%` }} />
        </span>
        <span className="text-sm text-muted">يظهر إعلانك الآن ضمن {toAr(filterCount)} فلترًا. كل حقل تضيفه يرفع القوة ويضعك أمام من يبحث عن مواصفاتك بالضبط.</span>
      </div>

      <div className="h-px bg-line" />

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((fd) => (
          <FieldControl key={fd.k} fd={fd} form={form} set={set} toggleMulti={toggleMulti} touched={false} currency={currency} />
        ))}
      </div>
    </div>
  );
}
