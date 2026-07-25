"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check, ArrowRight, ArrowLeft, Scissors, UtensilsCrossed, Wrench, Store,
  Rocket, Eye, LayoutGrid, Pipette,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { PhoneInput } from "@/components/ui/phone-input";
import { WhatsAppInput } from "@/components/ui/whatsapp-input";
import { LogoUploader } from "@/components/dashboard/logo-uploader";
import { SeoImageUploader } from "@/components/dashboard/seo-image-uploader";
import { HoursEditor } from "@/components/dashboard/hours-editor";
import { ContentListEditor } from "@/components/dashboard/content-list-editor";
import { PALETTES, FONTS, themeStyle, DEFAULT_PALETTE, DEFAULT_FONT, CUSTOM_PALETTE } from "@/sections/palette";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/shared/currency";
import { cn } from "@/lib/cn";

// Starting hex values for the custom pickers (native <input type=color> needs hex).
const DEFAULT_PRIMARY = "#3f7350";
const DEFAULT_SECONDARY = "#b07b3c";

interface TemplateOption {
  key: string;
  label: string;
  vertical: string;
  description: string;
}

const ICONS: Record<string, React.ReactNode> = {
  barbershop: <Scissors className="size-5" />,
  restaurant: <UtensilsCrossed className="size-5" />,
  services: <Wrench className="size-5" />,
};

const STEPS = [
  { id: "basics", title: "الأساسيات", skippable: false },
  { id: "appearance", title: "المظهر", skippable: true },
  { id: "info", title: "معلومات النشاط", skippable: true },
  { id: "services", title: "الخدمات", skippable: true },
  { id: "hours", title: "ساعات العمل", skippable: true },
  { id: "seo", title: "محركات البحث", skippable: true },
] as const;
const TOTAL = STEPS.length;

function slugify(v: string): string {
  return v.toLowerCase().trim()
    .replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

export function SiteWizard() {
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const done = step >= TOTAL;

  // Basics
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [template, setTemplate] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [language, setLanguage] = useState<"ar" | "en">("ar");

  // Appearance
  const [paletteKey, setPaletteKey] = useState<string>(DEFAULT_PALETTE);
  const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_PRIMARY);
  const [secondaryColor, setSecondaryColor] = useState<string>(DEFAULT_SECONDARY);
  const [fontKey, setFontKey] = useState<string>(DEFAULT_FONT);

  // Business info (settings — PUT replaces the whole row, so we always send all)
  const [whatsappNumber, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [googleMapsUrl, setMaps] = useState("");
  const [openingHours, setOpeningHours] = useState<Record<string, unknown>>({});
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [seoOg, setSeoOg] = useState("");
  const [seoFavicon, setSeoFavicon] = useState("");

  useEffect(() => {
    api.get<{ items: TemplateOption[] }>("/api/templates")
      .then((d) => { setTemplates(d.items); setTemplate((t) => t || d.items[0]?.key || ""); })
      .catch(() => setErrors({ template: "تعذّر تحميل القوالب" }));
  }, []);

  const settingsBody = () => ({
    whatsappNumber: whatsappNumber || null,
    phone: phone || null,
    address: address || null,
    googleMapsUrl: googleMapsUrl || null,
    socials: {},
    openingHours,
    currency,
  });

  async function saveCurrent(): Promise<boolean> {
    const id = siteId;
    setErrors({});
    try {
      if (step === 0) {
        const chosen = templates.find((t) => t.key === template);
        const created = await api.post<{ id: string }>("/api/sites", {
          businessName, slug, language,
          verticalKey: chosen?.vertical ?? "services",
          templateKey: template,
        });
        setSiteId(created.id);
        return true;
      }
      if (!id) return true;
      if (step === 1)
        await api.put(`/api/sites/${id}/theme`, {
          paletteKey,
          primaryColor: paletteKey === CUSTOM_PALETTE ? primaryColor : null,
          secondaryColor: paletteKey === CUSTOM_PALETTE ? secondaryColor : null,
          fontKey,
        });
      else if (step === 2) await api.put(`/api/sites/${id}/settings`, settingsBody());
      else if (step === 3) await api.put(`/api/sites/${id}/settings`, settingsBody()); // persist currency
      else if (step === 4) await api.put(`/api/sites/${id}/settings`, settingsBody());
      else if (step === 5) {
        await api.put(`/api/sites/${id}/seo`, {
          title: seoTitle || undefined,
          description: seoDesc || undefined,
          keywords: seoKeywords ? seoKeywords.split(/[,،]/).map((k) => k.trim()).filter(Boolean) : undefined,
          ogImageUrl: seoOg || "",
          faviconUrl: seoFavicon || "",
        });
      }
      return true;
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      else toast(err instanceof ApiClientError ? err.message : "تعذّر الحفظ", "error");
      return false;
    }
  }

  async function next() {
    setBusy(true);
    const ok = await saveCurrent();
    setBusy(false);
    if (ok) setStep((s) => s + 1);
  }

  function skip() {
    setErrors({});
    setStep((s) => s + 1);
  }

  const canCreate = businessName.trim().length >= 2 && slug.length >= 3 && !!template;

  if (done) return <DoneScreen siteId={siteId!} businessName={businessName} />;

  const meta = STEPS[step];
  const progress = ((step + 1) / TOTAL) * 100;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-ink">{meta.title}</span>
          <span className="text-muted">الخطوة {step + 1} من {TOTAL}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black/[0.06]">
          <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Card className="p-6">
        {step === 0 && (
          <div className="space-y-5">
            <StepHead title="لنبدأ بموقعك" desc="اختر قالبًا حسب مجال النشاط، ثم اسم النشاط ورابطه." />
            <div>
              <p className="mb-2 text-sm font-medium text-ink">القالب</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {templates.map((t) => (
                  <button key={t.key} type="button" onClick={() => setTemplate(t.key)}
                    className={cn("rounded-md border p-3 text-start transition cursor-pointer",
                      template === t.key ? "border-accent bg-accent-50 ring-2 ring-accent-100" : "border-line hover:border-accent-200")}>
                    <div className="flex size-9 items-center justify-center rounded-md bg-accent text-white">
                      {ICONS[t.vertical] ?? <Store className="size-5" />}
                    </div>
                    <p className="mt-2 text-sm font-bold text-ink">{t.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{t.description}</p>
                  </button>
                ))}
              </div>
              {errors.template && <p className="mt-1 text-xs text-danger">{errors.template}</p>}
            </div>
            <Field label="اسم النشاط التجاري" error={errors.businessName}>
              <Input value={businessName} placeholder="مثال: صالون أبو علي"
                onChange={(e) => { setBusinessName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} />
            </Field>
            <Field label="الرابط" hint={slug ? `${slug}.sawwi.com` : "أحرف إنجليزية صغيرة وأرقام وشرطات"} error={errors.slug}>
              <Input dir="ltr" value={slug} placeholder="abu-ali"
                onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} />
            </Field>
            <Field label="لغة الموقع" className="max-w-xs">
              <Select value={language} onChange={(e) => setLanguage(e.target.value as "ar" | "en")}>
                <option value="ar">العربية</option><option value="en">الإنجليزية</option>
              </Select>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <StepHead title="المظهر" desc="اختر لون موقعك وخطه — يمكنك تغييرهما لاحقًا." />
            <div>
              <p className="mb-2 text-sm font-medium text-ink">اللون</p>
              <div className="flex flex-wrap gap-3">
                {PALETTES.map((p) => (
                  <button key={p.key} type="button" onClick={() => setPaletteKey(p.key)} title={p.label} aria-label={p.label}
                    className={cn("flex size-11 items-center justify-center rounded-full transition cursor-pointer",
                      paletteKey === p.key ? "ring-2 ring-ink ring-offset-2" : "hover:scale-105")}
                    style={{ backgroundColor: p.swatch }}>
                    {paletteKey === p.key && <Check className="size-5 text-white" />}
                  </button>
                ))}
                {/* Custom: pick your own primary + secondary colors */}
                <button type="button" onClick={() => setPaletteKey(CUSTOM_PALETTE)} title="ألوان مخصّصة" aria-label="ألوان مخصّصة"
                  className={cn("flex size-11 items-center justify-center rounded-full text-white transition cursor-pointer",
                    paletteKey === CUSTOM_PALETTE ? "ring-2 ring-ink ring-offset-2" : "hover:scale-105")}
                  style={{ background: "conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)" }}>
                  {paletteKey === CUSTOM_PALETTE ? <Check className="size-5" /> : <Pipette className="size-4" />}
                </button>
              </div>
            </div>

            {paletteKey === CUSTOM_PALETTE && (
              <div className="flex flex-wrap gap-5 rounded-lg border border-line bg-neutral-100/60 p-4">
                <ColorPicker label="اللون الأساسي" value={primaryColor} onChange={setPrimaryColor} />
                <ColorPicker label="اللون الثانوي" value={secondaryColor} onChange={setSecondaryColor} />
              </div>
            )}

            <Field label="الخط" className="max-w-xs">
              <Select value={fontKey} onChange={(e) => setFontKey(e.target.value)}>
                {FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </Select>
            </Field>
            <div style={themeStyle(paletteKey, fontKey, { primaryColor, secondaryColor })} className="rounded-lg border border-line bg-surface p-4">
              <p className="font-bold text-ink">معاينة العنوان</p>
              <div className="mt-2 flex gap-2">
                <span className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white">زر رئيسي</span>
                <span className="rounded-md bg-secondary-100 px-3 py-1.5 text-sm font-medium text-secondary-900">ثانوي</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && siteId && (
          <div className="space-y-5">
            <StepHead title="معلومات النشاط" desc="بيانات التواصل والشعار — تظهر في الموقع تلقائيًا." />
            <LogoUploader siteId={siteId} />
            <Field label="واتساب"><WhatsAppInput value={whatsappNumber} onChange={setWhatsapp} /></Field>
            <Field label="الهاتف"><PhoneInput value={phone} onChange={setPhone} /></Field>
            <Field label="العنوان"><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="مثال: دمشق، شارع الحمرا" /></Field>
            <Field label="رابط خرائط جوجل (اختياري)"><Input dir="ltr" value={googleMapsUrl} onChange={(e) => setMaps(e.target.value)} placeholder="https://maps.google.com/…" /></Field>
          </div>
        )}

        {step === 3 && siteId && (
          <div className="space-y-4">
            <StepHead title="الخدمات والأسعار" desc="أضف خدماتك — تُحفظ فورًا. يمكنك تعديلها لاحقًا." />
            <Field label="عملة الأسعار" className="max-w-xs">
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </Select>
              <p className="mt-1.5 text-xs text-muted">تُطبَّق على كل الأسعار. أدخل الأرقام فقط — تتحوّل إلى أرقام عربية وتُضاف العملة تلقائيًا.</p>
            </Field>
            <ContentListEditor siteId={siteId} type="services" itemNoun="خدمات" addLabel="إضافة خدمة" initial={[]}
              fields={[
                { key: "name", label: "اسم الخدمة", required: true, placeholder: "مثال: قص شعر" },
                { key: "price", label: "السعر", placeholder: "مثال: ٥٠٠٠٠" },
                { key: "duration", label: "المدة", placeholder: "مثال: ٣٠ دقيقة" },
              ]} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <StepHead title="ساعات العمل" desc="حدّد مواعيد كل يوم — مفتوح أو مغلق." />
            <HoursEditor value={openingHours} onChange={setOpeningHours} hideSave />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <StepHead title="تحسين محركات البحث" desc="كيف يظهر موقعك في نتائج البحث ومشاركات التواصل." />
            <Field label="عنوان الموقع" error={errors.title}><Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="مثال: صالون أبو علي للحلاقة" /></Field>
            <Field label="الوصف" hint="١٦٠ حرفًا كحد أقصى" error={errors.description}><Textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} /></Field>
            <Field label="الكلمات المفتاحية" hint="افصل بينها بفاصلة"><Input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} placeholder="حلاقة، صالون، دمشق" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="صورة المشاركة (OG)" hint="تظهر عند مشاركة الموقع على مواقع التواصل">
                {siteId
                  ? <SeoImageUploader siteId={siteId} assetKey="og" value={seoOg} onChange={setSeoOg} />
                  : <p className="text-xs text-muted">أنشئ الموقع أولًا لرفع الصور.</p>}
              </Field>
              <Field label="أيقونة الموقع" hint="الأيقونة الصغيرة في تبويب المتصفح">
                {siteId
                  ? <SeoImageUploader siteId={siteId} assetKey="favicon" value={seoFavicon} onChange={setSeoFavicon} />
                  : <p className="text-xs text-muted">أنشئ الموقع أولًا لرفع الصور.</p>}
              </Field>
            </div>
          </div>
        )}
      </Card>

      {/* Footer nav */}
      <div className="mt-5 flex items-center justify-between">
        <div>
          {step > 1 && (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={busy} className="gap-1.5">
              <ArrowRight className="size-4" /> السابق
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {meta.skippable && (
            <Button variant="ghost" onClick={skip} disabled={busy}>تخطّي</Button>
          )}
          {step === 0 ? (
            <Button onClick={next} loading={busy} disabled={!canCreate} className="gap-1.5">
              إنشاء الموقع <ArrowLeft className="size-4" />
            </Button>
          ) : step === 3 ? (
            <Button onClick={next} loading={busy} className="gap-1.5">متابعة <ArrowLeft className="size-4" /></Button>
          ) : (
            <Button onClick={next} loading={busy} className="gap-1.5">حفظ ومتابعة <ArrowLeft className="size-4" /></Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-lg font-extrabold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-muted">{desc}</p>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-11 cursor-pointer rounded-lg border border-line bg-surface p-0.5"
        aria-label={label}
      />
      <span className="flex flex-col">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="font-mono text-xs uppercase text-faint" dir="ltr">{value}</span>
      </span>
    </label>
  );
}

function DoneScreen({ siteId, businessName }: { siteId: string; businessName: string }) {
  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent-100 text-accent">
        <Check className="size-8" />
      </div>
      <h1 className="mt-5 text-2xl font-extrabold text-ink">تم إنشاء {businessName} 🎉</h1>
      <p className="mt-2 text-sm text-muted">
        موقعك جاهز. افتح المُنشئ لترتيب الأقسام والنشر، أو عايِن الموقع أولًا.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <Link href={`/dashboard/sites/${siteId}`} className="inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-accent px-6 font-medium text-white transition hover:bg-accent-600">
          <Rocket className="size-4" /> افتح المُنشئ
        </Link>
        <div className="flex gap-3">
          <Link href={`/preview/${siteId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-line px-4 py-2 text-sm text-muted transition hover:text-ink">
            <Eye className="size-4" /> معاينة
          </Link>
          <Link href="/dashboard/sites" className="inline-flex items-center gap-1.5 rounded-md border border-line px-4 py-2 text-sm text-muted transition hover:text-ink">
            <LayoutGrid className="size-4" /> كل المواقع
          </Link>
        </div>
      </div>
    </div>
  );
}
