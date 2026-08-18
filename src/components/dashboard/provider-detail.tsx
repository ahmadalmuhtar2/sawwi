"use client";

// Edit a provider: public display fields, verification + public opt-in, status,
// internal note, and work photos. `name`/`phone` are internal (shown to the
// collaborator, never made public). The public profile only goes live once the
// site flag is on AND this provider is ACTIVE + verified + opted-in.

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircle, BadgeCheck, Upload, Loader2, X, ExternalLink, Star } from "lucide-react";
import { PROVIDER_STATUS_LABEL, PROVIDER_STATUS_ORDER, PROVIDER_BIO_MAX, type ProviderStatus } from "@/shared/providers";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { MenuSelect } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { MAX_IMAGE_BYTES, maxSizeLabel } from "@/shared/uploads";

export interface Detail {
  id: string;
  name: string;
  displayName: string | null;
  phone: string;
  phoneRaw: string;
  slug: string;
  categories: string[];
  areas: string[];
  bio: string | null;
  status: ProviderStatus;
  verified: boolean;
  profilePublic: boolean;
  internalNote: string | null;
  jobsCompleted: number;
  ratingCount: number;
  ratingAvg: number | null;
  photos: { id: string; url: string; caption: string | null; sortOrder: number }[];
}

const waHref = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

export function ProviderDetail({
  siteId, businessName, canManage, provider, publicProfilesEnabled, live, profileUrl,
}: {
  siteId: string;
  businessName: string;
  canManage: boolean;
  provider: Detail;
  publicProfilesEnabled: boolean;
  live: boolean;
  profileUrl: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const base = `/dashboard/sites/${siteId}/providers/${provider.id}`;

  const [displayName, setDisplayName] = React.useState(provider.displayName ?? "");
  const [bio, setBio] = React.useState(provider.bio ?? "");
  const [categories, setCategories] = React.useState<string[]>(provider.categories);
  const [areas, setAreas] = React.useState<string[]>(provider.areas);
  const [note, setNote] = React.useState(provider.internalNote ?? "");
  const [saving, setSaving] = React.useState(false);

  const patch = async (body: Record<string, unknown>, okMsg = "تم الحفظ ✓") => {
    try {
      const res = await fetch(base, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message);
      toast(okMsg);
      router.refresh();
      return true;
    } catch (e) {
      toast(e instanceof Error && e.message ? e.message : "تعذّر الحفظ", "error");
      return false;
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    await patch({ displayName, bio, categories, areas });
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/dashboard/sites/${siteId}/providers`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowRight className="size-4" /> رجوع إلى المزوّدين
      </Link>
      <PageHeader
        title={provider.displayName?.trim() || provider.name}
        subtitle={`${businessName} · شغلات منجزة: ${provider.jobsCompleted.toLocaleString("ar-EG")}`}
      >
        {canManage && (
          <MenuSelect
            value={provider.status}
            onChange={(v) => patch({ status: v }, "تم تحديث الحالة ✓")}
            options={PROVIDER_STATUS_ORDER.map((s) => ({ value: s, label: PROVIDER_STATUS_LABEL[s] }))}
          />
        )}
      </PageHeader>

      {/* live / dark banner */}
      <div className={`mb-4 rounded-lg border px-4 py-3 text-[13px] ${live ? "border-accent-200 bg-accent-50 text-accent-400" : "border-line bg-surface text-muted"}`}>
        {live ? (
          <span className="inline-flex items-center gap-2">
            الملف العام ظاهر الآن.
            <a href={profileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold underline"><ExternalLink className="size-3.5" /> عرض</a>
          </span>
        ) : (
          <>
            الملف العام مخفي.{" "}
            {!publicProfilesEnabled
              ? "الملفات العامة مُعطّلة لهذا الموقع."
              : "يظهر عندما يكون المزوّد نشِطًا وموثّقًا ومفعّلًا للعرض العام."}
          </>
        )}
      </div>

      {/* internal contact */}
      <Panel className="p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Item label="الاسم الحقيقي (داخلي)">{provider.name}</Item>
          <Item label="رقم الواتساب (داخلي)">
            <a href={waHref(provider.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-mono text-accent-300 hover:underline" dir="ltr">
              <MessageCircle className="size-4" /> {provider.phone}
            </a>
          </Item>
          <Item label="التقييم (داخلي)">
            {provider.ratingCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {provider.ratingAvg?.toLocaleString("ar-EG", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) ?? "—"}
                <span className="text-faint">({provider.ratingCount.toLocaleString("ar-EG")} تقييم)</span>
              </span>
            ) : <span className="text-faint">لا تقييمات بعد</span>}
          </Item>
          <Item label="رابط الملف العام"><span className="font-mono text-[12px] text-faint" dir="ltr">/p/{provider.slug}</span></Item>
        </dl>
      </Panel>

      {/* public profile fields */}
      <Panel className="mt-4 p-5" title="الملف العام">
        <div className="space-y-4">
          <Field label="الاسم المعروض" hint="اسم يظهر للعموم، مثلاً «أبو محمد». إذا تُرك فارغًا يُستخدم الاسم الحقيقي.">
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={!canManage} className={inputCls} placeholder={provider.name} />
          </Field>
          <Field label="نبذة" hint={`حتى ${PROVIDER_BIO_MAX} حرف.`}>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} disabled={!canManage} rows={3} maxLength={PROVIDER_BIO_MAX} className={inputCls} placeholder="خبرة، تخصص، مناطق العمل…" />
          </Field>
          <Field label="الخدمات">
            <TagInput tags={categories} onChange={setCategories} disabled={!canManage} placeholder="أضف خدمة ثم Enter" />
          </Field>
          <Field label="المناطق">
            <TagInput tags={areas} onChange={setAreas} disabled={!canManage} placeholder="أضف منطقة ثم Enter" />
          </Field>
          {canManage && (
            <div className="flex flex-wrap items-center gap-4">
              <Button onClick={saveProfile} loading={saving}>حفظ الملف</Button>
              <Toggle label="موثّق" icon={<BadgeCheck className="size-4" />} checked={provider.verified} onChange={(v) => patch({ verified: v }, v ? "تم التوثيق ✓" : "أُلغي التوثيق")} />
              <Toggle label="ظاهر للعموم" checked={provider.profilePublic} onChange={(v) => patch({ profilePublic: v }, v ? "مفعّل للعرض ✓" : "أُخفي")} />
            </div>
          )}
        </div>
      </Panel>

      {/* photos */}
      <Panel className="mt-4 p-5" title="صور الشغل">
        <PhotoManager siteId={siteId} providerId={provider.id} photos={provider.photos} canManage={canManage} onChange={() => router.refresh()} />
      </Panel>

      {/* internal note */}
      {canManage && (
        <Panel className="mt-4 p-5" title="ملاحظة داخلية">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => { if (note !== (provider.internalNote ?? "")) patch({ internalNote: note }, "تم حفظ الملاحظة ✓"); }}
            rows={3}
            placeholder="ملاحظات جودة خاصة — لا تظهر للعموم أبدًا"
            className="w-full rounded-md border border-line bg-bg px-3 py-2 text-[14px] outline-none focus:border-accent"
          />
        </Panel>
      )}
    </div>
  );
}

/* ── photos ── */
function PhotoManager({ siteId, providerId, photos, canManage, onChange }: {
  siteId: string;
  providerId: string;
  photos: Detail["photos"];
  canManage: boolean;
  onChange: () => void;
}) {
  const toast = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const base = `/dashboard/sites/${siteId}/providers/${providerId}/photos`;

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    for (const file of files) {
      if (file.size > MAX_IMAGE_BYTES) { toast(`أقصى حجم للصورة ${maxSizeLabel(MAX_IMAGE_BYTES)}`, "error"); continue; }
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(base, { method: "POST", body: fd });
        if (!(await res.json()).ok) throw new Error();
      } catch { toast("تعذّر رفع الصورة", "error"); }
    }
    setBusy(false);
    onChange();
  };

  const remove = async (photoId: string) => {
    try {
      const res = await fetch(`${base}/${photoId}`, { method: "DELETE" });
      if (!(await res.json()).ok) throw new Error();
      onChange();
    } catch { toast("تعذّر الحذف", "error"); }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {photos.map((ph) => (
          <div key={ph.id} className="relative size-28 overflow-hidden rounded-lg border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element -- storage URL */}
            <img src={ph.url} alt={ph.caption ?? ""} className="size-full object-cover" />
            {canManage && (
              <button onClick={() => remove(ph.id)} className="absolute end-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white" aria-label="حذف">
                <X className="size-3.5" />
              </button>
            )}
          </div>
        ))}
        {canManage && (
          <button onClick={() => inputRef.current?.click()} disabled={busy} className="grid size-28 place-items-center rounded-lg border-2 border-dashed border-line text-muted disabled:opacity-60" aria-label="أضف صورة">
            {busy ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
          </button>
        )}
      </div>
      {photos.length === 0 && !canManage && <p className="text-[13px] text-muted">لا صور.</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={upload} />
    </div>
  );
}

/* ── small controls ── */
function TagInput({ tags, onChange, disabled, placeholder }: { tags: string[]; onChange: (t: string[]) => void; disabled?: boolean; placeholder?: string }) {
  const [draft, setDraft] = React.useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setDraft("");
  };
  return (
    <div className={`flex flex-wrap items-center gap-1.5 rounded-md border border-line bg-bg px-2 py-1.5 ${disabled ? "opacity-60" : ""}`}>
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-[12.5px] text-ink">
          {t}
          {!disabled && <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label="إزالة"><X className="size-3" /></button>}
        </span>
      ))}
      {!disabled && (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          onBlur={add}
          placeholder={placeholder}
          className="min-w-32 flex-1 bg-transparent px-1 py-1 text-[13.5px] outline-none"
        />
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange, icon }: { label: string; checked: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="inline-flex items-center gap-2 text-[13.5px] text-ink">
      <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${checked ? "bg-accent" : "bg-line"}`}>
        <span className={`inline-block size-4 rounded-full bg-white transition ${checked ? "-translate-x-0.5" : "-translate-x-4"}`} />
      </span>
      <span className="inline-flex items-center gap-1">{icon}{label}</span>
    </button>
  );
}

const inputCls = "w-full rounded-md border border-line bg-bg px-3 py-2 text-[14px] outline-none focus:border-accent";

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1 text-[12px] text-faint">{label}</dt>
      <dd className="text-[14px] text-ink">{children}</dd>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-medium text-ink">{label}</span>
      {hint && <span className="mb-1.5 block text-[12px] text-faint">{hint}</span>}
      {children}
    </label>
  );
}
