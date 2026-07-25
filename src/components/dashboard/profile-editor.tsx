"use client";

import { useState } from "react";
import { z } from "zod";
import { api } from "@/lib/api-client";
import { useForm } from "@/hooks/use-form";
import { useToast } from "@/components/ui/toast";
import { AvatarUploader } from "@/components/dashboard/avatar-uploader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const schema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جدًا").max(120, "الاسم طويل جدًا"),
});

export function ProfileEditor({
  account,
}: {
  account: { name: string; email: string; image: string | null };
}) {
  const toast = useToast();
  const [name, setName] = useState(account.name);
  const { register, errors, formError, submitting, handleSubmit } = useForm({
    initial: { name: account.name },
    schema,
    onSubmit: async (values) => {
      await api.put("/api/account/profile", values);
      setName(values.name);
    },
    onSuccess: () => toast("تم حفظ ملفك الشخصي ✓"),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold text-ink">الملف الشخصي</h1>
      <p className="mt-1 text-sm text-muted">صورتك واسمك كما يظهران في لوحة التحكم.</p>

      <Card className="mt-6 p-6">
        <div className="flex flex-col items-center gap-4">
          <AvatarUploader initialUrl={account.image} name={name || account.email} />
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <Field label="الاسم" htmlFor="name" error={errors.name}>
            <Input {...register("name")} placeholder="اسمك الكامل" autoComplete="name" />
          </Field>
          <Field label="البريد الإلكتروني" htmlFor="email" hint="لا يمكن تغييره">
            <Input id="email" value={account.email} dir="ltr" disabled />
          </Field>

          {formError && (
            <p className="rounded-md bg-danger-100/50 px-3 py-2 text-sm text-danger">{formError}</p>
          )}

          <Button type="submit" loading={submitting}>حفظ</Button>
        </form>
      </Card>
    </div>
  );
}
