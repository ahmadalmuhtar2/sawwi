"use client";

import { useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import type { PageType } from "@/shared/domain";

export interface NewPage {
  id: string;
  title: string;
  path: string;
  pageType: PageType;
  seo: Record<string, never>;
}

// Landing is reserved for the auto home page ("/"), so it's not offered here.
const TYPES: { value: PageType; label: string; path: string }[] = [
  { value: "about", label: "من نحن", path: "/about" },
  { value: "services", label: "الخدمات", path: "/services" },
  { value: "contact", label: "تواصل معنا", path: "/contact" },
  { value: "custom", label: "صفحة مخصّصة", path: "/new-page" },
];

export function PageCreateModal({
  siteId,
  onClose,
  onCreated,
}: {
  siteId: string;
  onClose: () => void;
  onCreated: (page: NewPage) => void;
}) {
  const [pageType, setPageType] = useState<PageType>("about");
  const [title, setTitle] = useState("من نحن");
  const [path, setPath] = useState("/about");
  const [pathTouched, setPathTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function selectType(next: PageType) {
    setPageType(next);
    const preset = TYPES.find((t) => t.value === next)!;
    if (!pathTouched) setPath(preset.path);
    if (!title || TYPES.some((t) => t.label === title)) setTitle(preset.label);
  }

  async function create() {
    setSaving(true);
    setErrors({});
    try {
      const page = await api.post<NewPage>(`/api/sites/${siteId}/pages`, {
        title: title.trim(),
        path: path.trim(),
        pageType,
      });
      onCreated(page);
      onClose();
    } catch (e) {
      if (e instanceof ApiClientError && e.fields) setErrors(e.fields);
      else setErrors({ _: e instanceof ApiClientError ? e.message : "تعذّرت الإضافة" });
    }
    setSaving(false);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="إضافة صفحة"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button onClick={create} loading={saving} disabled={!title.trim() || !path.trim()}>
            إضافة
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="نوع الصفحة">
          <Select value={pageType} onChange={(e) => selectType(e.target.value as PageType)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="اسم الصفحة" hint="يظهر في قائمة التنقل" error={errors.title}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field
          label="المسار (الرابط)"
          hint="أحرف إنجليزية صغيرة وأرقام وشرطات، يبدأ بـ /"
          error={errors.path}
        >
          <Input
            dir="ltr"
            value={path}
            onChange={(e) => { setPath(e.target.value); setPathTouched(true); }}
            placeholder="/about"
          />
        </Field>
        {errors._ && <p className="text-sm text-danger">{errors._}</p>}
      </div>
    </Modal>
  );
}
