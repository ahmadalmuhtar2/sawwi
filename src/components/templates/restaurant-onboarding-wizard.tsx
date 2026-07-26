"use client";

// Restaurant onboarding wizard — same architecture as the barbershop wizard
// (flat draft, per-template localStorage autosave, staging image upload, a
// segmented progress bar, footer nav, NO live preview), but restaurant-shaped.
// The flat draft is mapped onto the template's content shape on create, sending
// ONLY the fields the user filled — untouched parts keep the template default.

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { getTemplate } from "@/templates/registry";
import { uploadStaging } from "./fields";
import { api, ApiClientError } from "@/lib/api-client";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { PhoneInput } from "@/components/ui/phone-input";
import { ROOT_DOMAIN } from "@/lib/site-url";
import { cn } from "@/lib/cn";

/* ── numerals + constants ── */
const AR = "٠١٢٣٤٥٦٧٨٩";
const arNum = (n: number | string) => String(n).replace(/\d/g, (d) => AR[Number(d)]);
const STEPS = ["معلومات المطعم", "القائمة", "قصة المطعم", "الحجز والزيارة", "الإنشاء"];
const SLUG_RE = /^[a-z0-9-]{3,40}$/;
const COURSE_OPTS = [
  { id: "mezze", label: "مقبّلات" },
  { id: "mains", label: "أطباق رئيسية" },
  { id: "grill", label: "من الفحم" },
  { id: "sea", label: "بحريات" },
  { id: "sweet", label: "حلويات" },
];

/* ── draft shape (flat, form-shaped) ── */
interface DishRow { name: string; price: string; desc: string; course: string }
interface CourseRow { id: string; label: string }
interface PillarRow { title: string; body: string }
interface HourRow { days: string; time: string }
interface RestaurantDraft {
  name: string; latin: string; tagline: string; hero: string; blurb: string;
  whatsapp: string; phone: string; address: string; slug: string; coverUrl?: string;
  chefName: string; chefQuote: string;
  courses: CourseRow[]; dishes: DishRow[]; pillars: PillarRow[]; hours: HourRow[]; showGallery: boolean;
}

/** Stable id for a new category (dishes reference categories by id, so it must
 *  not change when the label is edited). */
const newCourseId = () => "c" + Math.random().toString(36).slice(2, 7);

const emptyDraft = (): RestaurantDraft => ({
  name: "", latin: "", tagline: "", hero: "", blurb: "",
  whatsapp: "", phone: "", address: "", slug: "",
  chefName: "", chefQuote: "",
  courses: COURSE_OPTS.map((c) => ({ ...c })),
  dishes: Array.from({ length: 3 }, () => ({ name: "", price: "", desc: "", course: "mezze" })),
  pillars: Array.from({ length: 2 }, () => ({ title: "", body: "" })),
  hours: [
    { days: "الثلاثاء – الخميس", time: "" },
    { days: "الجمعة – الأحد", time: "" },
    { days: "الاثنين", time: "مغلق" },
  ],
  showGallery: true,
});

const slugify = (v: string) =>
  v.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 40);

/* Map the flat draft onto the restaurant template's content shape — only the
 * fields the user actually filled, so untouched parts keep the template default. */
function draftToContent(draft: RestaurantDraft): Record<string, unknown> {
  const shop: Record<string, unknown> = {};
  if (draft.name) shop.name = draft.name;
  if (draft.latin) shop.latinName = draft.latin;
  if (draft.tagline) shop.tagline = draft.tagline;
  if (draft.hero) shop.heroLine = draft.hero;
  if (draft.blurb) shop.heroBlurb = draft.blurb;
  if (draft.coverUrl) shop.heroPhoto = draft.coverUrl;
  if (draft.whatsapp) shop.whatsapp = draft.whatsapp;
  if (draft.phone) shop.phone = draft.phone;
  if (draft.address) shop.address = draft.address;

  const content: Record<string, unknown> = {};
  if (Object.keys(shop).length) content.shop = shop;

  // User-controlled categories (kept if they have a label). Dishes reference
  // these by id; the template renders a tab per category and filters dishes.
  const courses = draft.courses.filter((c) => c.label.trim());
  const validId = (id: string) =>
    courses.some((c) => c.id === id) ? id : (courses[0]?.id ?? id);
  if (courses.length) content.courses = courses.map((c) => ({ id: c.id, label: c.label.trim() }));

  const dishes = draft.dishes.filter((d) => d.name.trim());
  if (dishes.length) {
    content.dishes = dishes.map((d) => ({
      course: validId(d.course),
      name: d.name,
      price: d.price,
      desc: d.desc,
      allergens: [],
      photo: "",
    }));
    // wizard collects no "featured" indices → clear the default flags so the
    // home page never points at dishes that were replaced.
    content.featured = [];
  }

  const chef: Record<string, unknown> = {};
  if (draft.chefName) chef.name = draft.chefName;
  if (draft.chefQuote) chef.quote = draft.chefQuote;
  if (Object.keys(chef).length) content.chef = chef;

  const pillars = draft.pillars.filter((p) => p.title.trim());
  if (pillars.length) content.pillars = pillars.map((p) => ({ title: p.title, body: p.body }));

  const hours = draft.hours.filter((h) => h.days.trim() && h.time.trim());
  if (hours.length) content.hours = hours;

  content.showGallery = draft.showGallery;

  return content;
}

/* ── row controls (delete) ── */
function RowDelete({ onRemove }: { onRemove: () => void }) {
  return (
    <button type="button" title="حذف" onClick={onRemove}
      className="p-1 text-faint hover:text-danger cursor-pointer"><Trash2 className="size-3.5" /></button>
  );
}

/* ── cover image input (staging upload) ── */
function CoverInput({ url, busy, onPick, onRemove }: {
  url?: string; busy: boolean; onPick: (f: File) => void; onRemove: () => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <Field label="صورة الواجهة">
      <div className="flex items-center gap-3.5 rounded-lg border border-line bg-surface p-3.5">
        <span className="relative grid h-[68px] w-[92px] shrink-0 place-items-center overflow-hidden rounded-md bg-neutral-100 text-faint">
          {busy ? <Loader2 className="size-4 animate-spin text-accent" />
            : url ? // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="size-full object-cover" />
            : <ImageIcon className="size-5" />}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-xs leading-relaxed text-muted">
            {url ? "تم الرفع · الأفضل صورة أفقية" : "صورة أفقية للصالة أو طبق مميّز — حتى ١٠ ميغابايت"}
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

/* ─────────────────────────── the wizard ─────────────────────────── */
export function RestaurantOnboardingWizard({ templateKey }: { templateKey: string }) {
  const tpl = getTemplate(templateKey);
  const router = useRouter();
  const storageKey = `sawwi_onb_${templateKey}`;

  const [draft, setDraft] = React.useState<RestaurantDraft>(emptyDraft);
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
        const saved = JSON.parse(raw) as Partial<RestaurantDraft> & { step?: number };
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

  const patch = <K extends keyof RestaurantDraft>(key: K, value: RestaurantDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // generic list ops over a draft array key
  function ops<K extends "dishes" | "pillars" | "hours">(key: K) {
    const rows = draft[key];
    return {
      set: (i: number, field: string, value: unknown) =>
        patch(key, rows.map((r, n) => (n === i ? { ...r, [field]: value } : r)) as RestaurantDraft[K]),
      remove: (i: number) => patch(key, rows.filter((_, n) => n !== i) as RestaurantDraft[K]),
      add: (blank: unknown) => patch(key, [...rows, blank] as RestaurantDraft[K]),
    };
  }
  const dishes = ops("dishes"), pillars = ops("pillars"), hours = ops("hours");

  // Categories need their own ops: renaming keeps the id (so dishes stay linked),
  // and deleting a category reassigns its dishes to the first remaining one.
  const courseOps = {
    setLabel: (i: number, label: string) =>
      patch("courses", draft.courses.map((c, n) => (n === i ? { ...c, label } : c))),
    add: () => patch("courses", [...draft.courses, { id: newCourseId(), label: "" }]),
    remove: (i: number) =>
      setDraft((dr) => {
        const removed = dr.courses[i];
        const next = dr.courses.filter((_, n) => n !== i);
        const fallback = next[0]?.id ?? "";
        return {
          ...dr,
          courses: next,
          dishes: dr.dishes.map((ds) => (ds.course === removed.id ? { ...ds, course: fallback } : ds)),
        };
      }),
  };

  if (!tpl) return <p className="p-6 text-center text-muted">قالب غير معروف.</p>;

  const d = tpl.defaults as {
    shop?: Record<string, string>;
    dishes?: { name: string; price: string; desc: string }[];
    pillars?: { title: string; body: string }[];
    chef?: { name?: string; quote?: string };
  };
  const shopDef = d.shop ?? {};
  const dishPh = (d.dishes as { name: string; price: string; desc: string }[]) ?? [];
  const pillarPh = (d.pillars as { title: string; body: string }[]) ?? [];
  const chefDef = d.chef ?? {};

  const waDigits = draft.whatsapp.replace(/\D/g, "");
  const waOk = waDigits.replace(/^963/, "").length >= 8;
  const slugOk = SLUG_RE.test(draft.slug);
  const filled = {
    dishes: draft.dishes.filter((s) => s.name.trim()).length,
    pillars: draft.pillars.filter((p) => p.title.trim()).length,
    hours: draft.hours.filter((h) => h.days.trim() && h.time.trim()).length,
    chef: draft.chefName.trim() || draft.chefQuote.trim() ? 1 : 0,
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

        {/* STEP 0 — restaurant info */}
        {step === 0 && (
          <div className="flex flex-col gap-5">
            <StepHead n={1} title="معلومات المطعم" lede="هذه الأساسيات تظهر في أعلى كل صفحة. اترك أي حقل فارغًا لتستخدم النصّ المقترح في القالب." />
            <Field label="اسم المطعم">
              <Input value={draft.name} onChange={(e) => patch("name", e.target.value)} placeholder={shopDef.name} />
            </Field>
            <Field label="الاسم بالإنجليزية (اختياري)">
              <Input dir="ltr" className="font-mono" value={draft.latin} onChange={(e) => patch("latin", e.target.value)} placeholder={shopDef.latinName} />
            </Field>
            <Field label="الشعار (اختياري)">
              <Input value={draft.tagline} onChange={(e) => patch("tagline", e.target.value)} placeholder={shopDef.tagline} />
            </Field>
            <Field label="العنوان الرئيسي" hint="أكبر سطر في الصفحة — اجعله قصيرًا.">
              <Input value={draft.hero} onChange={(e) => patch("hero", e.target.value)} placeholder={shopDef.heroLine} />
            </Field>
            <Field label="نبذة قصيرة">
              <Textarea rows={3} value={draft.blurb} onChange={(e) => patch("blurb", e.target.value)} placeholder={shopDef.heroBlurb} />
            </Field>
            <CoverInput url={draft.coverUrl} busy={busyCover} onPick={uploadCover} onRemove={() => patch("coverUrl", undefined)} />
            <Field
              label="رقم واتساب *"
              error={touched.wa && !waOk ? "أدخل رقم واتساب — عليه تصل طلبات الحجز." : undefined}
              hint={waOk ? `wa.me/${waDigits}` : undefined}
            >
              <PhoneInput value={draft.whatsapp} onChange={(v) => { patch("whatsapp", v); setTouched((t) => ({ ...t, wa: true })); }} />
            </Field>
            <Field label="الهاتف (اختياري)">
              <PhoneInput value={draft.phone} onChange={(v) => patch("phone", v)} />
            </Field>
            <Field label="العنوان">
              <Input value={draft.address} onChange={(e) => patch("address", e.target.value)} placeholder={shopDef.address} />
            </Field>
          </div>
        )}

        {/* STEP 1 — menu */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <StepHead n={2} title="القائمة" lede="أضف أبرز أطباقك — تظهر في صفحة القائمة تحت قسمها. الباقي يبقى من القالب حتى تعدّله لاحقًا." />

            {/* categories (courses) — the user controls these */}
            <div className="flex flex-col gap-3 rounded-xl border border-line bg-neutral-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13.5px] font-semibold text-ink">أقسام القائمة</span>
                <span className="font-mono text-[11px] text-faint">{arNum(draft.courses.length)}</span>
              </div>
              <span className="text-xs leading-relaxed text-muted">
                تُقسَّم القائمة إلى أقسام (مقبّلات، رئيسية، حلويات…). عدّل الأسماء أو أضف أقسامك، ثم أسند كل طبق إلى قسمه بالأسفل.
              </span>
              <div className="flex flex-col gap-2">
                {draft.courses.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Input value={c.label} onChange={(e) => courseOps.setLabel(i, e.target.value)}
                      placeholder="اسم القسم" aria-label={`قسم ${arNum(i + 1)}`} />
                    <button type="button" title="حذف القسم" disabled={draft.courses.length <= 1}
                      onClick={() => courseOps.remove(i)}
                      className="p-1 text-faint hover:text-danger disabled:opacity-30 cursor-pointer">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={courseOps.add}
                className="inline-flex w-fit items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-accent cursor-pointer">
                <Plus className="size-4" /> إضافة قسم
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {draft.dishes.map((row, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">طبق {arNum(i + 1)}</span>
                    <span className="ms-auto"><RowDelete onRemove={() => dishes.remove(i)} /></span>
                  </div>
                  <Input value={row.name} onChange={(e) => dishes.set(i, "name", e.target.value)} placeholder={dishPh[i % (dishPh.length || 1)]?.name} aria-label="اسم الطبق" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <Input className="font-serif tabular-nums" value={row.price} onChange={(e) => dishes.set(i, "price", e.target.value)} placeholder="٦٥٬٠٠٠" aria-label="السعر" />
                    <Select value={row.course} onChange={(e) => dishes.set(i, "course", e.target.value)} aria-label="القسم">
                      {draft.courses.map((c) => <option key={c.id} value={c.id}>{c.label || "قسم"}</option>)}
                    </Select>
                  </div>
                  <Textarea rows={2} value={row.desc} onChange={(e) => dishes.set(i, "desc", e.target.value)} placeholder={dishPh[i % (dishPh.length || 1)]?.desc} aria-label="الوصف" />
                </div>
              ))}
            </div>
            {draft.dishes.length === 0 && (
              <span className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm leading-relaxed text-faint">
                لا أطباق بعد. أضف أول طبق لتظهر القائمة على الموقع.
              </span>
            )}
            <button type="button" onClick={() => dishes.add({ name: "", price: "", desc: "", course: draft.courses[0]?.id ?? "mezze" })}
              className="inline-flex w-fit items-center gap-1.5 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-accent cursor-pointer">
              <Plus className="size-4" /> إضافة طبق
            </button>
          </div>
        )}

        {/* STEP 2 — story */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <StepHead n={3} title="قصة المطعم" lede="ما يميّز مطبخك. اترك أي حقل فارغًا لتُبقي نصّ القالب." />
            <Field label="اسم الشيف">
              <Input value={draft.chefName} onChange={(e) => patch("chefName", e.target.value)} placeholder={chefDef.name} />
            </Field>
            <Field label="اقتباس الشيف">
              <Textarea rows={3} value={draft.chefQuote} onChange={(e) => patch("chefQuote", e.target.value)} placeholder={chefDef.quote} />
            </Field>
            <div className="flex flex-col gap-2.5">
              <span className="text-[13.5px] font-semibold text-ink">لماذا هنا</span>
              <span className="text-xs leading-relaxed text-muted">ميزتان أو ثلاث تُبرز ما لا تتنازل عنه.</span>
              {draft.pillars.map((row, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">ميزة {arNum(i + 1)}</span>
                    <span className="ms-auto"><RowDelete onRemove={() => pillars.remove(i)} /></span>
                  </div>
                  <Input value={row.title} onChange={(e) => pillars.set(i, "title", e.target.value)} placeholder={pillarPh[i % (pillarPh.length || 1)]?.title} aria-label="العنوان" />
                  <Textarea rows={2} value={row.body} onChange={(e) => pillars.set(i, "body", e.target.value)} placeholder={pillarPh[i % (pillarPh.length || 1)]?.body} aria-label="الوصف" />
                </div>
              ))}
              <button type="button" onClick={() => pillars.add({ title: "", body: "" })}
                className="inline-flex w-fit items-center gap-1.5 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-accent cursor-pointer">
                <Plus className="size-4" /> إضافة ميزة
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — visit */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <StepHead n={4} title="الحجز والزيارة" lede="أوقات العمل تظهر في صفحة الزيارة وتذييل الموقع." />
            <div className="flex flex-col gap-2.5">
              <span className="text-[13.5px] font-semibold text-ink">أوقات العمل</span>
              {draft.hours.map((row, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-3">
                  <Input className="min-w-0 flex-1" value={row.days} onChange={(e) => hours.set(i, "days", e.target.value)} placeholder="الثلاثاء – الخميس" aria-label="الأيام" />
                  <Input className="w-[132px] shrink-0 text-center font-serif tabular-nums" value={row.time} onChange={(e) => hours.set(i, "time", e.target.value)} placeholder="١٢:٣٠ – ١١:٣٠" aria-label="الوقت" />
                  <RowDelete onRemove={() => hours.remove(i)} />
                </div>
              ))}
              <button type="button" onClick={() => hours.add({ days: "", time: "" })}
                className="inline-flex w-fit items-center gap-1.5 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-accent cursor-pointer">
                <Plus className="size-4" /> إضافة صف
              </button>
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface p-4">
              <input type="checkbox" checked={draft.showGallery} onChange={(e) => patch("showGallery", e.target.checked)}
                className="size-4 accent-accent cursor-pointer" />
              <span className="flex flex-col gap-0.5">
                <span className="text-[13.5px] font-semibold text-ink">إظهار شريط اللمحات</span>
                <span className="text-xs leading-relaxed text-muted">شريط صور متحرّك من المطبخ والصالة في الصفحة الرئيسية.</span>
              </span>
            </label>
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
                <input value={draft.slug} placeholder="dar-al-yasmine" dir="ltr"
                  onChange={(e) => { patch("slug", slugify(e.target.value)); setTouched((t) => ({ ...t, slug: true })); }}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-sm text-ink outline-none placeholder:text-faint" />
                <span className="flex items-center border-s border-line bg-neutral-100 px-3 font-mono text-xs text-muted">.{ROOT_DOMAIN}</span>
              </div>
            </Field>

            <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
              {[
                { ok: waOk, label: "رقم واتساب", value: waOk ? "جاهز" : "مطلوب" },
                { ok: filled.dishes > 0, label: "الأطباق", value: filled.dishes ? `${arNum(filled.dishes)} طبق` : "من القالب" },
                { ok: filled.chef > 0, label: "قصة المطعم", value: filled.chef ? "مُضافة" : "من القالب" },
                { ok: filled.pillars > 0, label: "لماذا هنا", value: filled.pillars ? `${arNum(filled.pillars)} ميزة` : "من القالب" },
                { ok: filled.hours > 0, label: "أوقات العمل", value: filled.hours ? `${arNum(filled.hours)} صفوف` : "من القالب" },
                { ok: draft.showGallery, label: "شريط اللمحات", value: draft.showGallery ? "ظاهر" : "مخفي" },
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
