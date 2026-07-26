"use client";

// Foul & Fatteh onboarding wizard — same architecture as the restaurant wizard
// (flat draft, per-template localStorage autosave, staging cover upload, a
// segmented progress bar, footer nav, NO live preview), but foul-fatteh-shaped.
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
const STEPS = ["معلومات المطعم", "القائمة", "الزيارة", "الإنشاء"];
const SLUG_RE = /^[a-z0-9-]{3,40}$/;
const GROUP_OPTS = [
  { id: "foul", label: "الفول" },
  { id: "fatteh", label: "الفتّة" },
  { id: "side", label: "مقبّلات وإضافات" },
  { id: "drink", label: "مشروبات" },
];

/* ── draft shape (flat, form-shaped) ── */
interface ItemRow { name: string; price: string; desc: string; group: string }
interface GroupRow { id: string; label: string }
interface HourRow { days: string; time: string }
interface FoulFattehDraft {
  name: string; latin: string; tagline: string; hoursNote: string;
  phone: string; address: string; slug: string; coverUrl?: string;
  groups: GroupRow[]; items: ItemRow[]; hours: HourRow[];
}

/** Stable id for a new category (items reference categories by id, so it must
 *  not change when the label is edited). */
const newGroupId = () => "g" + Math.random().toString(36).slice(2, 7);

const emptyDraft = (): FoulFattehDraft => ({
  name: "", latin: "", tagline: "", hoursNote: "",
  phone: "", address: "", slug: "",
  groups: GROUP_OPTS.map((g) => ({ ...g })),
  items: Array.from({ length: 3 }, () => ({ name: "", price: "", desc: "", group: "foul" })),
  hours: [
    { days: "السبت – الخميس", time: "" },
    { days: "الجمعة", time: "" },
    { days: "العطل", time: "حسب الإعلان" },
  ],
});

const slugify = (v: string) =>
  v.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 40);

/* Map the flat draft onto the foul-fatteh template's content shape — only the
 * fields the user actually filled, so untouched parts keep the template default. */
function draftToContent(draft: FoulFattehDraft): Record<string, unknown> {
  const shop: Record<string, unknown> = {};
  if (draft.name) shop.name = draft.name;
  if (draft.latin) shop.latinName = draft.latin;
  if (draft.tagline) shop.tagline = draft.tagline;
  if (draft.coverUrl) shop.heroPhoto = draft.coverUrl;
  if (draft.hoursNote) shop.hoursNote = draft.hoursNote;
  if (draft.phone) {
    // The template calls (not messages); store the number on both keys so the
    // "اتصل" CTA and any contact link resolve to the same phone.
    shop.phone = draft.phone;
    shop.whatsapp = draft.phone.replace(/\D/g, "");
  }
  if (draft.address) shop.address = draft.address;

  const content: Record<string, unknown> = {};
  if (Object.keys(shop).length) content.shop = shop;

  // User-controlled categories (kept if they have a label). Items reference
  // these by id; the template renders a filter chip per category.
  const groups = draft.groups.filter((g) => g.label.trim());
  const validId = (id: string) =>
    groups.some((g) => g.id === id) ? id : (groups[0]?.id ?? id);
  if (groups.length) content.groups = groups.map((g) => ({ id: g.id, label: g.label.trim() }));

  const items = draft.items.filter((it) => it.name.trim());
  if (items.length) {
    content.items = items.map((it) => ({
      group: validId(it.group),
      name: it.name,
      price: it.price,
      desc: it.desc,
      photo: "",
    }));
  }

  const hours = draft.hours.filter((h) => h.days.trim() && h.time.trim());
  if (hours.length) content.hours = hours;

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
            {url ? "تم الرفع · الأفضل صورة أفقية" : "صورة أفقية للجدار العجمي أو طبق الفول — حتى ١٠ ميغابايت"}
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
export function FoulFattehOnboardingWizard({ templateKey }: { templateKey: string }) {
  const tpl = getTemplate(templateKey);
  const router = useRouter();
  const storageKey = `sawwi_onb_${templateKey}`;

  const [draft, setDraft] = React.useState<FoulFattehDraft>(emptyDraft);
  const [restored, setRestored] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [busyCover, setBusyCover] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [touched, setTouched] = React.useState<{ phone?: boolean; slug?: boolean }>({});
  const [error, setError] = React.useState<string | null>(null);

  // restore saved draft (once)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<FoulFattehDraft> & { step?: number };
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

  const patch = <K extends keyof FoulFattehDraft>(key: K, value: FoulFattehDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // generic list ops over a draft array key
  function ops<K extends "items" | "hours">(key: K) {
    const rows = draft[key];
    return {
      set: (i: number, field: string, value: unknown) =>
        patch(key, rows.map((r, n) => (n === i ? { ...r, [field]: value } : r)) as FoulFattehDraft[K]),
      remove: (i: number) => patch(key, rows.filter((_, n) => n !== i) as FoulFattehDraft[K]),
      add: (blank: unknown) => patch(key, [...rows, blank] as FoulFattehDraft[K]),
    };
  }
  const items = ops("items"), hours = ops("hours");

  // Categories need their own ops: renaming keeps the id (so items stay linked),
  // and deleting a category reassigns its items to the first remaining one.
  const groupOps = {
    setLabel: (i: number, label: string) =>
      patch("groups", draft.groups.map((g, n) => (n === i ? { ...g, label } : g))),
    add: () => patch("groups", [...draft.groups, { id: newGroupId(), label: "" }]),
    remove: (i: number) =>
      setDraft((dr) => {
        const removed = dr.groups[i];
        const next = dr.groups.filter((_, n) => n !== i);
        const fallback = next[0]?.id ?? "";
        return {
          ...dr,
          groups: next,
          items: dr.items.map((it) => (it.group === removed.id ? { ...it, group: fallback } : it)),
        };
      }),
  };

  if (!tpl) return <p className="p-6 text-center text-muted">قالب غير معروف.</p>;

  const d = tpl.defaults as {
    shop?: Record<string, string>;
    items?: { name: string; price: string; desc: string }[];
  };
  const shopDef = d.shop ?? {};
  const itemPh = (d.items as { name: string; price: string; desc: string }[]) ?? [];

  const phoneDigits = draft.phone.replace(/\D/g, "");
  const phoneOk = phoneDigits.replace(/^963/, "").length >= 8;
  const slugOk = SLUG_RE.test(draft.slug);
  const filled = {
    items: draft.items.filter((it) => it.name.trim()).length,
    groups: draft.groups.filter((g) => g.label.trim()).length,
    hours: draft.hours.filter((h) => h.days.trim() && h.time.trim()).length,
  };

  async function uploadCover(file: File) {
    setBusyCover(true);
    try { patch("coverUrl", await uploadStaging(file)); }
    catch { /* surfaced by the input spinner clearing */ }
    finally { setBusyCover(false); }
  }

  async function submit() {
    if (!slugOk || !phoneOk || !tpl) return;
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
            <StepHead n={1} title="معلومات المطعم" lede="هذه الأساسيات تظهر في أعلى كل صفحة وعلى الغلاف. اترك أي حقل فارغًا لتستخدم النصّ المقترح في القالب." />
            <Field label="اسم المطعم">
              <Input value={draft.name} onChange={(e) => patch("name", e.target.value)} placeholder={shopDef.name} />
            </Field>
            <Field label="الاسم بالإنجليزية (اختياري)">
              <Input dir="ltr" className="font-mono" value={draft.latin} onChange={(e) => patch("latin", e.target.value)} placeholder={shopDef.latinName} />
            </Field>
            <Field label="الشعار (اختياري)" hint="سطر قصير تحت الاسم — مثل: فول · فتّة · حمّص">
              <Input value={draft.tagline} onChange={(e) => patch("tagline", e.target.value)} placeholder={shopDef.tagline} />
            </Field>
            <CoverInput url={draft.coverUrl} busy={busyCover} onPick={uploadCover} onRemove={() => patch("coverUrl", undefined)} />
            <Field
              label="الهاتف *"
              error={touched.phone && !phoneOk ? "أدخل رقم الهاتف — عليه يتّصل الزبون ويطلب." : undefined}
              hint={phoneOk ? "الرقم جاهز" : undefined}
            >
              <PhoneInput value={draft.phone} onChange={(v) => { patch("phone", v); setTouched((t) => ({ ...t, phone: true })); }} />
            </Field>
            <Field label="العنوان">
              <Input value={draft.address} onChange={(e) => patch("address", e.target.value)} placeholder={shopDef.address} />
            </Field>
            <Field label="ملاحظة الدوام (اختياري)" hint="تظهر في الترويسة والغلاف — مثل: ٦:٠٠ ص – ١:٠٠ م">
              <Input value={draft.hoursNote} onChange={(e) => patch("hoursNote", e.target.value)} placeholder={shopDef.hoursNote} />
            </Field>
          </div>
        )}

        {/* STEP 1 — menu */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <StepHead n={2} title="القائمة" lede="أضف أبرز أطباقك — تظهر في صفحة القائمة تحت قسمها. الباقي يبقى من القالب حتى تعدّله لاحقًا." />

            {/* categories (groups) — the user controls these */}
            <div className="flex flex-col gap-3 rounded-xl border border-line bg-neutral-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13.5px] font-semibold text-ink">أقسام القائمة</span>
                <span className="font-mono text-[11px] text-faint">{arNum(draft.groups.length)}</span>
              </div>
              <span className="text-xs leading-relaxed text-muted">
                تُقسَّم القائمة إلى أقسام (فول، فتّة، مقبّلات، مشروبات…). عدّل الأسماء أو أضف أقسامك، ثم أسند كل طبق إلى قسمه بالأسفل.
              </span>
              <div className="flex flex-col gap-2">
                {draft.groups.map((g, i) => (
                  <div key={g.id} className="flex items-center gap-2">
                    <Input value={g.label} onChange={(e) => groupOps.setLabel(i, e.target.value)}
                      placeholder="اسم القسم" aria-label={`قسم ${arNum(i + 1)}`} />
                    <button type="button" title="حذف القسم" disabled={draft.groups.length <= 1}
                      onClick={() => groupOps.remove(i)}
                      className="p-1 text-faint hover:text-danger disabled:opacity-30 cursor-pointer">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={groupOps.add}
                className="inline-flex w-fit items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-accent cursor-pointer">
                <Plus className="size-4" /> إضافة قسم
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {draft.items.map((row, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">طبق {arNum(i + 1)}</span>
                    <span className="ms-auto"><RowDelete onRemove={() => items.remove(i)} /></span>
                  </div>
                  <Input value={row.name} onChange={(e) => items.set(i, "name", e.target.value)} placeholder={itemPh[i % (itemPh.length || 1)]?.name} aria-label="اسم الطبق" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <Input className="font-serif tabular-nums" value={row.price} onChange={(e) => items.set(i, "price", e.target.value)} placeholder="٢٥٬٠٠٠" aria-label="السعر" />
                    <Select value={row.group} onChange={(e) => items.set(i, "group", e.target.value)} aria-label="القسم">
                      {draft.groups.map((g) => <option key={g.id} value={g.id}>{g.label || "قسم"}</option>)}
                    </Select>
                  </div>
                  <Textarea rows={2} value={row.desc} onChange={(e) => items.set(i, "desc", e.target.value)} placeholder={itemPh[i % (itemPh.length || 1)]?.desc} aria-label="الوصف" />
                </div>
              ))}
            </div>
            {draft.items.length === 0 && (
              <span className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm leading-relaxed text-faint">
                لا أطباق بعد. أضف أول طبق لتظهر القائمة على الموقع.
              </span>
            )}
            <button type="button" onClick={() => items.add({ name: "", price: "", desc: "", group: draft.groups[0]?.id ?? "foul" })}
              className="inline-flex w-fit items-center gap-1.5 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-accent cursor-pointer">
              <Plus className="size-4" /> إضافة طبق
            </button>
          </div>
        )}

        {/* STEP 2 — visit */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <StepHead n={3} title="الزيارة" lede="أوقات العمل تظهر في صفحة الزيارة وتذييل الموقع." />
            <div className="flex flex-col gap-2.5">
              <span className="text-[13.5px] font-semibold text-ink">أوقات العمل</span>
              {draft.hours.map((row, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-3">
                  <Input className="min-w-0 flex-1" value={row.days} onChange={(e) => hours.set(i, "days", e.target.value)} placeholder="السبت – الخميس" aria-label="الأيام" />
                  <Input className="w-[132px] shrink-0 text-center font-serif tabular-nums" value={row.time} onChange={(e) => hours.set(i, "time", e.target.value)} placeholder="٦:٠٠ – ١:٠٠" aria-label="الوقت" />
                  <RowDelete onRemove={() => hours.remove(i)} />
                </div>
              ))}
              <button type="button" onClick={() => hours.add({ days: "", time: "" })}
                className="inline-flex w-fit items-center gap-1.5 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-accent cursor-pointer">
                <Plus className="size-4" /> إضافة صف
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — create */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <StepHead n={4} title="إنشاء الموقع" lede="اختر عنوان الموقع، وسنجهّزه فورًا. يمكنك تعديل كل شيء بعد الإنشاء." />
            <Field
              label="عنوان الموقع *"
              error={touched.slug && draft.slug && !slugOk ? "ثلاثة أحرف على الأقل، بالإنجليزية وأرقام وشرطات." : error ?? undefined}
              hint={slugOk ? "العنوان جاهز" : undefined}
            >
              <div dir="ltr" className="flex items-stretch overflow-hidden rounded-md border border-line bg-surface focus-within:border-accent">
                <input value={draft.slug} placeholder="abu-shadi-foul" dir="ltr"
                  onChange={(e) => { patch("slug", slugify(e.target.value)); setTouched((t) => ({ ...t, slug: true })); }}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-sm text-ink outline-none placeholder:text-faint" />
                <span className="flex items-center border-s border-line bg-neutral-100 px-3 font-mono text-xs text-muted">.{ROOT_DOMAIN}</span>
              </div>
            </Field>

            <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
              {[
                { ok: phoneOk, label: "الهاتف", value: phoneOk ? "جاهز" : "مطلوب" },
                { ok: filled.items > 0, label: "الأطباق", value: filled.items ? `${arNum(filled.items)} طبق` : "من القالب" },
                { ok: filled.groups > 0, label: "أقسام القائمة", value: filled.groups ? `${arNum(filled.groups)} قسم` : "من القالب" },
                { ok: filled.hours > 0, label: "أوقات العمل", value: filled.hours ? `${arNum(filled.hours)} صفوف` : "من القالب" },
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
          <button type="button" onClick={() => (step < 3 ? setStep(step + 1) : submit())}
            disabled={step === 3 ? !slugOk || !phoneOk || creating : false}
            className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:opacity-50 cursor-pointer">
            {creating && <Loader2 className="size-4 animate-spin" />}
            {creating ? "جارٍ الإنشاء…" : step === 3 ? "أنشئ الموقع" : <>التالي <ChevronLeft className="size-4" /></>}
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
