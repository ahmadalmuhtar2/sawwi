"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

export function BasicsEditor({
  siteId,
  initial,
}: {
  siteId: string;
  initial: { businessName: string; slug: string; language: "ar" | "en" };
}) {
  const toast = useToast();
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [slug, setSlug] = useState(initial.slug);
  const [language, setLanguage] = useState<"ar" | "en">(initial.language);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const slugChanged = slug.trim() !== initial.slug;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api.patch(`/api/sites/${siteId}`, {
        businessName: businessName.trim(),
        slug: slug.trim(),
        language,
      });
      toast("تم حفظ الأساسيات ✓");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      else toast("تعذّر الحفظ", "error");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <Field label="اسم النشاط" error={errors.businessName}>
        <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
      </Field>

      <Field
        label="الرابط (النطاق الفرعي)"
        hint="أحرف إنجليزية صغيرة وأرقام وشرطات"
        error={errors.slug}
      >
        <div className="flex items-center gap-2" dir="ltr">
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="text-left" />
          <span className="shrink-0 font-label text-sm text-faint">.sawwi.com</span>
        </div>
      </Field>

      {slugChanged && (
        <div className="flex items-start gap-2 rounded-md border border-warn/40 bg-warn-100/50 p-3 text-sm text-ink">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
          <span>
            تغيير الرابط سيغيّر عنوان الموقع العام إلى
            <span className="font-label" dir="ltr"> {slug || "…"}.sawwi.com</span>.
            الروابط القديمة لن تعمل بعد الآن.
          </span>
        </div>
      )}

      <Field label="لغة الموقع" className="max-w-xs" error={errors.language}>
        <Select value={language} onChange={(e) => setLanguage(e.target.value as "ar" | "en")}>
          <option value="ar">العربية</option>
          <option value="en">الإنجليزية</option>
        </Select>
      </Field>

      <Button type="submit" loading={saving}>حفظ الأساسيات</Button>
    </form>
  );
}
