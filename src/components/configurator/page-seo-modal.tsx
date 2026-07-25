"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import type { PageSeo } from "@/shared/seo";

interface Page {
  id: string;
  title: string;
  seo: PageSeo;
}

export function PageSeoModal({
  siteId,
  page,
  onClose,
  onSaved,
}: {
  siteId: string;
  page: Page;
  onClose: () => void;
  onSaved: (next: { title: string; seo: PageSeo }) => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState(page.title);
  const [seoTitle, setSeoTitle] = useState(page.seo.title ?? "");
  const [description, setDescription] = useState(page.seo.description ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(page.seo.ogImageUrl ?? "");
  const [noindex, setNoindex] = useState(Boolean(page.seo.noindex));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setErr(null);
    const seo: PageSeo = {
      title: seoTitle || undefined,
      description: description || undefined,
      ogImageUrl: ogImageUrl || "",
      noindex,
    };
    try {
      await api.put(`/api/sites/${siteId}/pages/${page.id}`, { title, seo });
      toast("تم حفظ إعدادات الصفحة ✓");
      onSaved({ title, seo });
      onClose();
    } catch {
      setErr("تعذّر الحفظ، تحقق من الروابط");
    }
    setSaving(false);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="إعدادات الصفحة وSEO"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button onClick={save} loading={saving}>حفظ</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="اسم الصفحة" hint="يظهر في قائمة التنقل">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="عنوان SEO" hint="يتجاوز عنوان الموقع لهذه الصفحة">
          <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="اتركه فارغًا لاستخدام الافتراضي" />
        </Field>
        <Field label="وصف الصفحة" hint="١٦٠ حرفًا كحد أقصى">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="صورة المشاركة (OG)">
          <Input dir="ltr" value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} placeholder="https://…/og.jpg" />
        </Field>
        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={noindex}
            onChange={(e) => setNoindex(e.target.checked)}
            className="size-4 accent-accent"
          />
          إخفاء هذه الصفحة عن محركات البحث (noindex)
        </label>
        {err && <p className="text-sm text-danger">{err}</p>}
      </div>
    </Modal>
  );
}
