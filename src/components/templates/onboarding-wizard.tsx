"use client";

// The shared "create" screen for EVERY template — just enough to spin up the
// site: a name (seeds the dashboard title + the on-site name), an optional logo,
// and the subdomain. EVERYTHING else — contact, hours, menu/services, and all
// copy — is edited INSIDE the builder, mostly inline (double-click text on the
// live preview) with the rest in the side panel. See ./inline-edit.tsx.

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ImageUp, Loader2, Trash2 } from "lucide-react";
import { getTemplate } from "@/templates/registry";
import { api, ApiClientError } from "@/lib/api-client";
import { Field, Input } from "@/components/ui/field";
import { uploadStaging } from "@/components/templates/fields";
import { ROOT_DOMAIN } from "@/lib/site-url";

const AR = "٠١٢٣٤٥٦٧٨٩";
const arNum = (n: number | string) => String(n).replace(/\d/g, (d) => AR[Number(d)]);
const SLUG_RE = /^[a-z0-9-]{3,40}$/;
const slugify = (v: string) =>
  v.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 40);

export function OnboardingWizard({ templateKey }: { templateKey: string }) {
  const tpl = getTemplate(templateKey);
  const router = useRouter();
  const storageKey = `sawwi_onb_${templateKey}`;

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [logo, setLogo] = React.useState("");
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [restored, setRestored] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const logoInputRef = React.useRef<HTMLInputElement>(null);
  async function pickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingLogo(true);
    try {
      setLogo(await uploadStaging(file));
    } catch {
      setError("تعذّر رفع الشعار");
    } finally {
      setUploadingLogo(false);
    }
  }

  // restore saved draft (once)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const s = JSON.parse(raw) as { name?: string; slug?: string; logo?: string };
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore on mount
        if (s.name) setName(s.name);
        if (s.slug) setSlug(s.slug);
        if (s.logo) setLogo(s.logo);
      }
    } catch { /* corrupt draft — start clean */ }
    setRestored(true);
  }, [storageKey]);

  // debounced autosave
  React.useEffect(() => {
    if (!restored) return;
    const id = setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify({ name, slug, logo })); } catch { /* quota */ }
    }, 400);
    return () => clearTimeout(id);
  }, [name, slug, logo, restored, storageKey]);

  if (!tpl) return <p className="p-6 text-center text-muted">قالب غير معروف.</p>;

  const shopDef = (tpl.defaults as { shop?: Record<string, string> }).shop ?? {};
  const slugOk = SLUG_RE.test(slug);

  async function submit() {
    if (!slugOk || !tpl) return;
    setCreating(true);
    setError(null);
    try {
      const shop: Record<string, string> = {};
      if (name.trim()) shop.name = name.trim();
      if (logo) shop.logo = logo;
      const content = Object.keys(shop).length ? { shop } : {};
      const res = await api.post<{ id: string }>("/api/sites", {
        templateKey,
        slug,
        verticalKey: tpl.vertical,
        businessName: name.trim() || slug,
        content,
      });
      localStorage.removeItem(storageKey);
      router.push(`/dashboard/sites/${res.id}`);
    } catch (e) {
      setError(e instanceof ApiClientError ? (e.fields?.slug ?? e.message) : "تعذّر إنشاء الموقع");
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-140 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-accent">قالب {tpl.label}</span>
        <h2 className="font-display text-2xl font-extrabold text-ink">أنشئ موقعك</h2>
        <p className="text-[13.5px] leading-relaxed text-muted">
          نحتاج الاسم والعنوان فقط. كل شيء آخر — النصوص والصور والأقسام والأوقات —
          تعدّله مباشرةً على الموقع بعد الإنشاء (انقر مرتين على أي نص).
        </p>
      </div>

      <Field label="اسم النشاط">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={shopDef.name} />
      </Field>

      <Field label="الشعار (اختياري)" hint="يظهر في ترويسة الموقع. يمكنك تغييره لاحقًا.">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo}
            className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-neutral-100 text-faint transition hover:border-accent disabled:opacity-60 cursor-pointer"
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="الشعار" className="size-full object-contain" />
            ) : uploadingLogo ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ImageUp className="size-5" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="rounded-md border border-line px-3 py-1.5 text-sm text-ink transition hover:border-accent disabled:opacity-60 cursor-pointer"
            >
              {logo ? "تغيير الشعار" : "رفع شعار"}
            </button>
            {logo && (
              <button
                type="button"
                onClick={() => setLogo("")}
                aria-label="إزالة الشعار"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted transition hover:text-danger cursor-pointer"
              >
                <Trash2 className="size-4" /> إزالة
              </button>
            )}
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={pickLogo} />
        </div>
      </Field>

      <Field
        label="عنوان الموقع *"
        error={touched && slug && !slugOk ? "ثلاثة أحرف على الأقل، بالإنجليزية وأرقام وشرطات." : error ?? undefined}
        hint={slugOk ? "العنوان جاهز" : "بالإنجليزية — هذا رابط موقعك"}
      >
        <div dir="ltr" className="flex items-stretch overflow-hidden rounded-md border border-line bg-surface focus-within:border-accent">
          <input value={slug} placeholder="my-site" dir="ltr"
            onChange={(e) => { setSlug(slugify(e.target.value)); setTouched(true); }}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-sm text-ink outline-none placeholder:text-faint" />
          <span className="flex items-center border-s border-line bg-neutral-100 px-3 font-mono text-xs text-muted">.{ROOT_DOMAIN}</span>
        </div>
      </Field>

      <div className="flex items-center gap-3 border-t border-line pt-5">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-faint">
          <Check className="size-3" /> يُحفظ تلقائيًا في هذا المتصفّح
        </span>
        <button type="button" onClick={submit} disabled={!slugOk || creating}
          className="ms-auto inline-flex min-w-[132px] items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:opacity-50 cursor-pointer">
          {creating && <Loader2 className="size-4 animate-spin" />}
          {creating ? "جارٍ الإنشاء…" : "أنشئ الموقع وابدأ التحرير"}
        </button>
      </div>

      <p className="text-[12.5px] leading-relaxed text-faint">
        نصيحة: بعد الإنشاء، مرّر فوق أي نص على الموقع ثم انقر مرتين لتعديله. الأرقام والصور والأقسام
        كلها من داخل أداة التحرير. الخطوة {arNum(1)} من {arNum(1)}.
      </p>
    </div>
  );
}
