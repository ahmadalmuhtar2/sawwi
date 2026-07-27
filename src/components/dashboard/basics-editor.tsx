"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { ROOT_DOMAIN } from "@/lib/site-url";

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
  const [language, setLanguage] = useState<"ar" | "en">(initial.language);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      // The slug is FIXED after creation — it's the public address; changing it
      // would break existing links. Only the name and language are editable here.
      await api.patch(`/api/sites/${siteId}`, {
        businessName: businessName.trim(),
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

      <Field label="الرابط (النطاق الفرعي)" hint="ثابت بعد الإنشاء — هذا عنوان موقعك.">
        <div
          dir="ltr"
          className="flex items-center gap-2 rounded-md border border-line bg-neutral-100 px-3 py-2 text-sm text-muted"
        >
          <Lock className="size-3.5 shrink-0 text-faint" />
          <span className="font-label" dir="ltr">{initial.slug}.{ROOT_DOMAIN}</span>
        </div>
      </Field>

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
