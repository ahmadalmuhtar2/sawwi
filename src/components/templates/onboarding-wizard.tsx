"use client";

// Onboarding wizard — adapted from the Sawwi design (OnboardingWizard.tsx):
// its structure, copy, stats-field UX, hours grid, and readiness summary, rebuilt
// with OUR field components + Tailwind tokens, wired to the real backend. The
// flat draft is mapped onto the template's content shape on create. (No live
// preview here — the template is previewable as a real site on its own page.)
//
// Empty-field semantics: an emptied field falls back to the template's own copy
// (the placeholder shows that default) — so we only send fields the user filled,
// and the published site keeps the template default for the rest.

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { getTemplate } from "@/templates/registry";
import { uploadStaging } from "./fields";
import { api, ApiClientError } from "@/lib/api-client";
import { Field, Input, Textarea } from "@/components/ui/field";
import { PhoneInput } from "@/components/ui/phone-input";
import { ROOT_DOMAIN } from "@/lib/site-url";
import { cn } from "@/lib/cn";

/* ── numerals + constants ── */
const AR = "٠١٢٣٤٥٦٧٨٩";
const arNum = (n: number | string) => String(n).replace(/\d/g, (d) => AR[Number(d)]);
const STEPS = ["معلومات المحل", "الخدمات", "الحلاقون", "أوقات العمل", "الإنشاء"];
const DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const MAX_STATS = 4;
const SLUG_RE = /^[a-z0-9-]{3,40}$/;

/* ── draft shape (flat, form-shaped) ── */
interface StatRow { value: string; label: string }
interface ServiceRow { name: string; price: string; duration: string; desc: string }
interface BarberRow { name: string; role: string; years: string; photoUrl?: string }
interface HourRow { open: boolean; from: string; to: string }
interface WizardDraft {
  name: string; latin: string; hero: string; blurb: string; whatsapp: string;
  address: string; slug: string; coverUrl?: string;
  stats: StatRow[]; services: ServiceRow[]; barbers: BarberRow[]; hours: HourRow[];
}

const emptyDraft = (): WizardDraft => ({
  name: "", latin: "", hero: "", blurb: "", whatsapp: "", address: "", slug: "",
  stats: [{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }],
  services: Array.from({ length: 3 }, () => ({ name: "", price: "", duration: "", desc: "" })),
  barbers: Array.from({ length: 2 }, () => ({ name: "", role: "", years: "" })),
  hours: DAYS.map((_, i) => ({ open: i !== 6, from: "", to: "" })),
});

const slugify = (v: string) =>
  v.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 40);

/* Merge consecutive open days sharing the same from–to into one "السبت – الخميس"
 * row (the template renders {days, time} rows). */
function aggregateHours(hours: HourRow[]): { days: string; time: string; primary: boolean }[] {
  const rows: { days: string; time: string; primary: boolean }[] = [];
  let i = 0;
  while (i < hours.length) {
    const h = hours[i];
    if (!h.open || !h.from) { i++; continue; }
    let j = i;
    while (j + 1 < hours.length && hours[j + 1].open && hours[j + 1].from === h.from && hours[j + 1].to === h.to) j++;
    rows.push({
      days: i === j ? DAYS[i] : `${DAYS[i]} – ${DAYS[j]}`,
      time: h.to ? `${h.from} – ${h.to}` : h.from,
      primary: rows.length === 0,
    });
    i = j + 1;
  }
  return rows;
}

/* Map the flat draft onto the barbershop template's content shape — only the
 * fields the user actually filled, so untouched parts keep the template default. */
function draftToContent(draft: WizardDraft): Record<string, unknown> {
  const shop: Record<string, unknown> = {};
  if (draft.name) shop.name = draft.name;
  if (draft.latin) shop.latinName = draft.latin;
  if (draft.hero) shop.heroLine = draft.hero;
  if (draft.blurb) shop.heroBlurb = draft.blurb;
  if (draft.coverUrl) shop.heroPhoto = draft.coverUrl;
  if (draft.whatsapp) shop.whatsapp = draft.whatsapp;
  if (draft.address) shop.address = draft.address;
  const stats = draft.stats.filter((s) => s.value.trim());
  if (stats.length) shop.stats = stats;

  const content: Record<string, unknown> = {};
  if (Object.keys(shop).length) content.shop = shop;

  const services = draft.services.filter((s) => s.name.trim());
  if (services.length) {
    // The design collects a flat service list, so put them all in one category.
    content.groups = [{ id: "svc", label: "خدماتنا" }];
    content.services = services.map((s) => ({
      group: "svc", name: s.name, price: s.price, duration: s.duration, desc: s.desc,
    }));
  }

  const barbers = draft.barbers.filter((b) => b.name.trim());
  if (barbers.length) {
    content.barbers = barbers.map((b) => ({
      name: b.name, role: b.role, years: Number(b.years.replace(/\D/g, "")) || 0,
      photo: b.photoUrl ?? "", availableToday: true,
    }));
  }

  const hours = aggregateHours(draft.hours);
  if (hours.length) content.hours = hours;

  return content;
}

/* ── row controls (up/down/delete) ── */
function RowControls({ i, len, move, remove }: {
  i: number; len: number; move: (i: number, d: -1 | 1) => void; remove: (i: number) => void;
}) {
  return (
    <span className="ms-auto flex items-center gap-0.5">
      <button type="button" title="أعلى" disabled={i === 0} onClick={() => move(i, -1)}
        className="p-1 text-faint hover:text-ink disabled:opacity-30 cursor-pointer"><ChevronUp className="size-4" /></button>
      <button type="button" title="أسفل" disabled={i === len - 1} onClick={() => move(i, 1)}
        className="p-1 text-faint hover:text-ink disabled:opacity-30 cursor-pointer"><ChevronDown className="size-4" /></button>
      <button type="button" title="حذف" onClick={() => remove(i)}
        className="p-1 text-faint hover:text-danger cursor-pointer"><Trash2 className="size-3.5" /></button>
    </span>
  );
}

/* ── image input (staging upload) ── */
function CoverInput({ url, busy, onPick, onRemove }: {
  url?: string; busy: boolean; onPick: (f: File) => void; onRemove: () => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <Field label="صورة الغلاف">
      <div className="flex items-center gap-3.5 rounded-lg border border-line bg-surface p-3.5">
        <span className="relative grid h-[68px] w-[92px] shrink-0 place-items-center overflow-hidden rounded-md bg-neutral-100 text-faint">
          {busy ? <Loader2 className="size-4 animate-spin text-accent" />
            : url ? // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="size-full object-cover" />
            : <ImageIcon className="size-5" />}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-xs leading-relaxed text-muted">
            {url ? "تم الرفع · الأفضل صورة أفقية" : "صورة أفقية للصالون — حتى ١٠ ميغابايت"}
          </span>
          <span className="flex flex-wrap gap-2">
            <button type="button" onClick={() => ref.current?.click()}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:border-accent cursor-pointer">
              {url ? "استبدال" : "رفع صورة"}
            </button>
            {url && (
              <button type="button" onClick={onRemove}
                className="px-2 py-1.5 text-xs text-faint hover:text-danger cursor-pointer">إزالة</button>
            )}
          </span>
        </div>
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
      </div>
    </Field>
  );
}

/* ── أرقام لافتة (headline stats) — value + caption, with a live on-site chip preview ── */
function StatsField({ rows, ph, set, move, remove, add }: {
  rows: StatRow[]; ph: StatRow[];
  set: (i: number, f: keyof StatRow, v: string) => void;
  move: (i: number, d: -1 | 1) => void; remove: (i: number) => void; add: () => void;
}) {
  const chips = rows.filter((r) => r.value.trim());
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-neutral-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="flex flex-col gap-1">
          <span className="text-[13.5px] font-semibold text-ink">أرقام لافتة</span>
          <span className="max-w-[46ch] text-xs leading-relaxed text-muted">
            ثلاثة أرقام تُبرز تميّزك — تظهر في أعلى الصفحة (مثال: ٤٫٩ تقييم الزبائن).
          </span>
        </span>
        <span className="shrink-0 font-mono text-[11px] text-faint">{arNum(rows.length)} / {arNum(MAX_STATS)}</span>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={row.value} onChange={(e) => set(i, "value", e.target.value)}
              placeholder={ph[i % ph.length]?.value} aria-label={`القيمة ${arNum(i + 1)}`}
              className="w-20 shrink-0 text-center font-serif text-lg tabular-nums" />
            <Input value={row.label} onChange={(e) => set(i, "label", e.target.value)}
              placeholder={ph[i % ph.length]?.label} aria-label={`الوصف ${arNum(i + 1)}`}
              className="min-w-0 flex-1" />
            <button type="button" title="أعلى" disabled={i === 0} onClick={() => move(i, -1)}
              className="p-1 text-faint hover:text-ink disabled:opacity-30 cursor-pointer"><ChevronUp className="size-4" /></button>
            <button type="button" title="أسفل" disabled={i === rows.length - 1} onClick={() => move(i, 1)}
              className="p-1 text-faint hover:text-ink disabled:opacity-30 cursor-pointer"><ChevronDown className="size-4" /></button>
            <button type="button" title="حذف" onClick={() => remove(i)}
              className="p-1 text-faint hover:text-danger cursor-pointer"><Trash2 className="size-3.5" /></button>
          </div>
        ))}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">كما تظهر على الموقع</span>
          {/* the TEMPLATE's dark ground — previews the SITE, not the dashboard */}
          <div className="flex flex-wrap gap-5 rounded-lg px-4 py-3" style={{ background: "oklch(0.16 0.008 45)" }}>
            {chips.map((c, i) => (
              <span key={i} className="flex flex-col gap-1">
                <span className="font-serif text-[23px] leading-none tabular-nums" style={{ color: "oklch(0.82 0.1 30)" }}>{c.value}</span>
                <span className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: "oklch(0.72 0.008 55)" }}>{c.label || "—"}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {rows.length === 0 && (
        <span className="py-2 text-xs leading-relaxed text-faint">لا أرقام الآن — سيختفي الشريط من الموقع. أضف ثلاثة ليظهر.</span>
      )}

      <button type="button" onClick={add} disabled={rows.length >= MAX_STATS}
        className="inline-flex w-fit items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-accent disabled:opacity-50 cursor-pointer">
        <Plus className="size-4" /> إضافة رقم
      </button>
    </div>
  );
}

/* ─────────────────────────── the wizard ─────────────────────────── */
export function OnboardingWizard({ templateKey }: { templateKey: string }) {
  const tpl = getTemplate(templateKey);
  const router = useRouter();
  const storageKey = `sawwi_onb_${templateKey}`;

  const [draft, setDraft] = React.useState<WizardDraft>(emptyDraft);
  const [restored, setRestored] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [busyCover, setBusyCover] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [touched, setTouched] = React.useState<{ wa?: boolean; slug?: boolean }>({});
  const [error, setError] = React.useState<string | null>(null);

  // restore saved draft (once)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<WizardDraft> & { step?: number };
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore on mount
        setDraft({ ...emptyDraft(), ...saved });
        if (typeof saved.step === "number") setStep(saved.step);
      }
    } catch { /* corrupt draft — start clean */ }
    setRestored(true);
  }, [storageKey]);

  // debounced autosave (text + image URLs + step)
  React.useEffect(() => {
    if (!restored) return;
    const id = setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify({ ...draft, step })); } catch { /* quota */ }
    }, 400);
    return () => clearTimeout(id);
  }, [draft, step, restored, storageKey]);

  const patch = <K extends keyof WizardDraft>(key: K, value: WizardDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // generic list ops over a draft array key
  function ops<K extends "stats" | "services" | "barbers" | "hours">(key: K) {
    const rows = draft[key];
    return {
      set: (i: number, field: string, value: unknown) =>
        patch(key, rows.map((r, n) => (n === i ? { ...r, [field]: value } : r)) as WizardDraft[K]),
      move: (i: number, dir: -1 | 1) => {
        const j = i + dir; if (j < 0 || j >= rows.length) return;
        const next = rows.slice(); [next[i], next[j]] = [next[j], next[i]];
        patch(key, next as WizardDraft[K]);
      },
      remove: (i: number) => patch(key, rows.filter((_, n) => n !== i) as WizardDraft[K]),
      add: (blank: unknown, cap?: number) => {
        if (cap && rows.length >= cap) return;
        patch(key, [...rows, blank] as WizardDraft[K]);
      },
    };
  }
  const stats = ops("stats"), services = ops("services"), barbers = ops("barbers"), hours = ops("hours");

  if (!tpl) return <p className="p-6 text-center text-muted">قالب غير معروف.</p>;

  const d = tpl.defaults as {
    shop: Record<string, string>;
    stats?: StatRow[];
    services?: { name: string; price: string; duration: string; desc: string }[];
    barbers?: { name: string; role: string }[];
  };
  const shopDef = d.shop ?? {};
  const statPh: StatRow[] = (d.shop?.stats as unknown as StatRow[]) ?? [];
  const svcPh = (d.services as ServiceRow[]) ?? [];
  const barberPh = (d.barbers as { name: string; role: string }[]) ?? [];

  const waDigits = draft.whatsapp.replace(/\D/g, "");
  const waOk = waDigits.replace(/^963/, "").length >= 8;
  const slugOk = SLUG_RE.test(draft.slug);
  const filled = {
    services: draft.services.filter((s) => s.name.trim()).length,
    barbers: draft.barbers.filter((b) => b.name.trim()).length,
    stats: draft.stats.filter((s) => s.value.trim()).length,
    openDays: draft.hours.filter((h) => h.open).length,
  };
  async function uploadCover(file: File) {
    setBusyCover(true);
    try { patch("coverUrl", await uploadStaging(file)); }
    catch { /* surfaced by the input spinner clearing */ }
    finally { setBusyCover(false); }
  }

  async function submit() {
    if (!slugOk || !waOk || !tpl) return;
    setCreating(true);
    setError(null);
    try {
      const res = await api.post<{ id: string }>("/api/sites", {
        templateKey,
        slug: draft.slug,
        verticalKey: tpl.vertical,
        businessName: draft.name.trim() || draft.slug,
        content: draftToContent(draft),
      });
      localStorage.removeItem(storageKey);
      router.push(`/dashboard/sites/${res.id}`);
    } catch (e) {
      setError(e instanceof ApiClientError ? (e.fields?.slug ?? e.message) : "تعذّر إنشاء الموقع");
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-140">
      {/* ── form column (no live preview — the template preview lives on its own page) ── */}
      <div className="flex flex-col gap-5">
        {/* progress — current step only, segmented bar (not clickable) */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13.5px] font-semibold text-ink">{STEPS[step]}</span>
            <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-faint">
              الخطوة {arNum(step + 1)} من {arNum(STEPS.length)}
            </span>
          </div>
          <div className="flex items-center gap-1.5" role="progressbar"
            aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
            {STEPS.map((label, i) => (
              <span key={label} className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                i <= step ? "bg-accent" : "bg-neutral-200",
              )} />
            ))}
          </div>
        </div>

        {/* STEP 0 — shop */}
        {step === 0 && (
          <div className="flex flex-col gap-5">
            <StepHead n={1} title="معلومات المحل" lede="هذه الأساسيات تظهر في أعلى كل صفحة. اترك أي حقل فارغًا لتستخدم النصّ المقترح في القالب." />
            <Field label="اسم المحل">
              <Input value={draft.name} onChange={(e) => patch("name", e.target.value)} placeholder={shopDef.name} />
            </Field>
            <Field label="الاسم بالإنجليزية (اختياري)">
              <Input dir="ltr" className="font-mono" value={draft.latin} onChange={(e) => patch("latin", e.target.value)} placeholder={shopDef.latinName} />
            </Field>
            <Field label="العنوان الرئيسي" hint="أكبر سطر في الصفحة — اجعله قصيرًا.">
              <Input value={draft.hero} onChange={(e) => patch("hero", e.target.value)} placeholder={shopDef.heroLine} />
            </Field>
            <Field label="نبذة قصيرة">
              <Textarea rows={3} value={draft.blurb} onChange={(e) => patch("blurb", e.target.value)} placeholder={shopDef.heroBlurb} />
            </Field>
            <Field
              label="رقم واتساب *"
              error={touched.wa && !waOk ? "أدخل رقم واتساب — هو الطريقة الوحيدة ليتواصل الزبون معك." : undefined}
              hint={waOk ? `wa.me/${waDigits}` : undefined}
            >
              <PhoneInput value={draft.whatsapp} onChange={(v) => { patch("whatsapp", v); setTouched((t) => ({ ...t, wa: true })); }} />
            </Field>
            <Field label="العنوان">
              <Input value={draft.address} onChange={(e) => patch("address", e.target.value)} placeholder={shopDef.address} />
            </Field>
            <CoverInput url={draft.coverUrl} busy={busyCover} onPick={uploadCover} onRemove={() => patch("coverUrl", undefined)} />
            <StatsField rows={draft.stats} ph={statPh}
              set={(i, f, v) => stats.set(i, f, v)} move={stats.move} remove={stats.remove}
              add={() => stats.add({ value: "", label: "" }, MAX_STATS)} />
          </div>
        )}

        {/* STEP 1 — services */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <StepHead n={2} title="الخدمات" lede="تُدخَل مرة واحدة وتظهر في القائمة وفي صفحة الحجز. الترتيب هنا هو الترتيب على الموقع." />
            <div className="flex flex-col gap-2.5">
              {draft.services.map((row, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">خدمة {arNum(i + 1)}</span>
                    <RowControls i={i} len={draft.services.length} move={services.move} remove={services.remove} />
                  </div>
                  <Input value={row.name} onChange={(e) => services.set(i, "name", e.target.value)} placeholder={svcPh[i % (svcPh.length || 1)]?.name} aria-label="اسم الخدمة" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <Input className="font-serif tabular-nums" value={row.price} onChange={(e) => services.set(i, "price", e.target.value)} placeholder="٧٥٬٠٠٠" aria-label="السعر" />
                    <Input value={row.duration} onChange={(e) => services.set(i, "duration", e.target.value)} placeholder="٤٥ دقيقة" aria-label="المدة" />
                  </div>
                  <Textarea rows={2} value={row.desc} onChange={(e) => services.set(i, "desc", e.target.value)} placeholder={svcPh[i % (svcPh.length || 1)]?.desc} aria-label="الوصف" />
                </div>
              ))}
            </div>
            {draft.services.length === 0 && (
              <span className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm leading-relaxed text-faint">
                لا خدمات بعد. أضف أول خدمة لتظهر القائمة على الموقع.
              </span>
            )}
            <button type="button" onClick={() => services.add({ name: "", price: "", duration: "", desc: "" })}
              className="inline-flex w-fit items-center gap-1.5 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-accent cursor-pointer">
              <Plus className="size-4" /> إضافة خدمة
            </button>
          </div>
        )}

        {/* STEP 2 — barbers */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <StepHead n={3} title="الحلاقون" lede="الزبون يحجز مع شخص، لا مع المحل. الصور اختيارية — تظهر أحرف الأسماء بدلًا منها." />
            <div className="flex flex-col gap-2.5">
              {draft.barbers.map((row, i) => {
                const shown = row.name || barberPh[i % (barberPh.length || 1)]?.name || "؟";
                return (
                  <div key={i} className="flex gap-3.5 rounded-xl border border-line bg-surface p-4">
                    <span aria-hidden className={cn(
                      "grid h-[76px] w-[62px] shrink-0 place-items-center rounded-md border border-dashed border-line font-display text-xl font-bold",
                      row.name ? "bg-accent-100 text-accent-900" : "bg-neutral-100 text-faint",
                    )}>
                      {shown.replace(/^(أبو|أم)\s/, "").charAt(0)}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">حلاق {arNum(i + 1)}</span>
                        <RowControls i={i} len={draft.barbers.length} move={barbers.move} remove={barbers.remove} />
                      </div>
                      <Input value={row.name} onChange={(e) => barbers.set(i, "name", e.target.value)} placeholder={barberPh[i % (barberPh.length || 1)]?.name} aria-label="الاسم" />
                      <div className="grid grid-cols-[1fr_92px] gap-2.5">
                        <Input value={row.role} onChange={(e) => barbers.set(i, "role", e.target.value)} placeholder={barberPh[i % (barberPh.length || 1)]?.role} aria-label="الدور" />
                        <Input className="text-center font-serif tabular-nums" value={row.years} onChange={(e) => barbers.set(i, "years", e.target.value)} placeholder="١٢" aria-label="سنوات الخبرة" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={() => barbers.add({ name: "", role: "", years: "" })}
              className="inline-flex w-fit items-center gap-1.5 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-accent cursor-pointer">
              <Plus className="size-4" /> إضافة حلاق
            </button>
          </div>
        )}

        {/* STEP 3 — hours */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <StepHead n={4} title="أوقات العمل" lede="يحسب الموقع «مفتوح الآن» تلقائيًا من هذه الأوقات." />
            <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
              {draft.hours.map((row, i) => (
                <div key={DAYS[i]} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  <span className={cn("min-w-[74px] text-[13.5px]", row.open ? "font-semibold text-ink" : "text-muted")}>{DAYS[i]}</span>
                  <label className="flex shrink-0 cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={row.open} onChange={() => hours.set(i, "open", !row.open)}
                      className="size-4 accent-accent cursor-pointer" />
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted">{row.open ? "مفتوح" : "مغلق"}</span>
                  </label>
                  {row.open ? (
                    <span className="ms-auto flex items-center gap-1.5">
                      <Input className="h-9 w-[74px] text-center font-serif tabular-nums" value={row.from} onChange={(e) => hours.set(i, "from", e.target.value)} placeholder="١٠:٠٠" aria-label={`${DAYS[i]} من`} />
                      <span className="text-faint">—</span>
                      <Input className="h-9 w-[74px] text-center font-serif tabular-nums" value={row.to} onChange={(e) => hours.set(i, "to", e.target.value)} placeholder="١٠:٠٠" aria-label={`${DAYS[i]} إلى`} />
                    </span>
                  ) : (
                    <span className="ms-auto font-mono text-[10.5px] uppercase tracking-wider text-faint">مغلق</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4 — create */}
        {step === 4 && (
          <div className="flex flex-col gap-5">
            <StepHead n={5} title="إنشاء الموقع" lede="اختر عنوان الموقع، وسنجهّزه فورًا. يمكنك تعديل كل شيء بعد الإنشاء." />
            <Field
              label="عنوان الموقع *"
              error={touched.slug && draft.slug && !slugOk ? "ثلاثة أحرف على الأقل، بالإنجليزية وأرقام وشرطات." : error ?? undefined}
              hint={slugOk ? "العنوان جاهز" : undefined}
            >
              <div dir="ltr" className="flex items-stretch overflow-hidden rounded-md border border-line bg-surface focus-within:border-accent">
                <input value={draft.slug} placeholder="silver-razor" dir="ltr"
                  onChange={(e) => { patch("slug", slugify(e.target.value)); setTouched((t) => ({ ...t, slug: true })); }}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-sm text-ink outline-none placeholder:text-faint" />
                <span className="flex items-center border-s border-line bg-neutral-100 px-3 font-mono text-xs text-muted">.{ROOT_DOMAIN}</span>
              </div>
            </Field>

            <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
              {[
                { ok: waOk, label: "رقم واتساب", value: waOk ? "جاهز" : "مطلوب" },
                { ok: filled.services > 0, label: "الخدمات", value: filled.services ? `${arNum(filled.services)} خدمة` : "لم تُضف" },
                { ok: filled.barbers > 0, label: "الحلاقون", value: filled.barbers ? `${arNum(filled.barbers)} حلاق` : "لم يُضف" },
                { ok: filled.openDays > 0, label: "أوقات العمل", value: `${arNum(filled.openDays)} أيام مفتوحة` },
                { ok: filled.stats > 0, label: "أرقام لافتة", value: filled.stats ? `${arNum(filled.stats)} أرقام` : "ستُخفى" },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  <span className={cn("grid size-[22px] shrink-0 place-items-center rounded-full",
                    r.ok ? "bg-accent text-white" : "bg-neutral-100 text-faint")}>
                    {r.ok ? <Check className="size-3" /> : <TriangleAlert className="size-3" />}
                  </span>
                  <span className="text-[13.5px] text-ink">{r.label}</span>
                  <span className="ms-auto text-[13px] text-muted">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* footer nav */}
        <div className="flex items-center gap-3 border-t border-line pt-4">
          <button type="button" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted transition hover:text-ink disabled:opacity-40 cursor-pointer">
            <ChevronRight className="size-4" /> السابق
          </button>
          <span className="mx-auto flex flex-col items-center gap-1 text-center">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">الخطوة {arNum(step + 1)} من {arNum(STEPS.length)}</span>
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-faint"><Check className="size-3" /> يُحفظ تلقائيًا في هذا المتصفّح</span>
          </span>
          <button type="button" onClick={() => (step < 4 ? setStep(step + 1) : submit())}
            disabled={step === 4 ? !slugOk || !waOk || creating : false}
            className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:opacity-50 cursor-pointer">
            {creating && <Loader2 className="size-4 animate-spin" />}
            {creating ? "جارٍ الإنشاء…" : step === 4 ? "أنشئ الموقع" : <>التالي <ChevronLeft className="size-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepHead({ n, title, lede }: { n: number; title: string; lede: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[11px] uppercase tracking-wider text-accent">الخطوة {arNum(n)}</span>
      <h2 className="font-display text-2xl font-extrabold text-ink">{title}</h2>
      <p className="text-[13.5px] leading-relaxed text-muted">{lede}</p>
    </div>
  );
}
