"use client";

import { useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SeoImageUploader } from "@/components/dashboard/seo-image-uploader";
import type { SiteSeo } from "@/shared/seo";

export function SiteSeoEditor({ siteId, initial }: { siteId: string; initial: SiteSeo }) {
  const toast = useToast();
  const [title, setTitle] = useState(initial.title ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [keywords, setKeywords] = useState((initial.keywords ?? []).join("، "));
  const [ogImageUrl, setOgImageUrl] = useState(initial.ogImageUrl ?? "");
  const [faviconUrl, setFaviconUrl] = useState(initial.faviconUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api.put(`/api/sites/${siteId}/seo`, {
        title: title || undefined,
        description: description || undefined,
        keywords: keywords
          ? keywords.split(/[,،]/).map((k) => k.trim()).filter(Boolean)
          : undefined,
        ogImageUrl: ogImageUrl || "",
        faviconUrl: faviconUrl || "",
      });
      toast("تم حفظ إعدادات محركات البحث ✓");
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      else toast("تعذّر الحفظ", "error");
    }
    setSaving(false);
  }

  return (
    <Card className="p-6">
      <h2 className="font-bold text-ink">تحسين محركات البحث (SEO)</h2>
      <p className="mt-1 text-sm text-muted">
        الإعدادات الافتراضية لكامل الموقع. يمكن تخصيص كل صفحة على حدة من المُنشئ.
      </p>
      <form onSubmit={save} className="mt-4 space-y-4">
        <Field label="عنوان الموقع" hint="يظهر في تبويب المتصفح ونتائج البحث" error={errors.title}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: صالون الديوان للحلاقة" />
        </Field>
        <Field label="الوصف" hint="١٦٠ حرفًا كحد أقصى" error={errors.description}>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف مختصر يظهر أسفل العنوان في نتائج البحث."
          />
        </Field>
        <Field label="الكلمات المفتاحية" hint="افصل بينها بفاصلة" error={errors.keywords}>
          <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="حلاقة، صالون، دمشق" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="صورة المشاركة (OG)" hint="تظهر عند مشاركة الموقع" error={errors.ogImageUrl}>
            <SeoImageUploader siteId={siteId} assetKey="og" value={ogImageUrl} onChange={setOgImageUrl} />
          </Field>
          <Field label="أيقونة الموقع (Favicon)" error={errors.faviconUrl}>
            <SeoImageUploader siteId={siteId} assetKey="favicon" value={faviconUrl} onChange={setFaviconUrl} />
          </Field>
        </div>
        <p className="text-xs text-faint">بعد الرفع اضغط «حفظ» لتثبيت الصورة على الموقع.</p>
        <Button type="submit" loading={saving}>حفظ</Button>
      </form>
    </Card>
  );
}
