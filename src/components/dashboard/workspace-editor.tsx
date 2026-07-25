"use client";

import { z } from "zod";
import { api } from "@/lib/api-client";
import { useForm } from "@/hooks/use-form";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const schema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جدًا").max(120, "الاسم طويل جدًا"),
});

export function WorkspaceEditor({
  workspace,
  canEdit,
}: {
  workspace: { name: string } | null;
  canEdit: boolean;
}) {
  const toast = useToast();
  const { register, errors, formError, submitting, handleSubmit } = useForm({
    initial: { name: workspace?.name ?? "" },
    schema,
    onSubmit: async (values) => {
      await api.put("/api/workspaces/me", values);
    },
    onSuccess: () => toast("تم حفظ مساحة العمل ✓"),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold text-ink">مساحة العمل</h1>
      <p className="mt-1 text-sm text-muted">
        مساحة العمل هي حسابك الذي يضم مواقعك وفريقك. بيانات التواصل (الهاتف،
        العنوان…) تخصّ كل موقع وتُدار من إعدادات الموقع.
      </p>

      {workspace ? (
        <Card className="mt-6 p-6">
          {!canEdit && (
            <p className="mb-4 text-xs text-faint">
              العرض فقط — التعديل متاح لمالك مساحة العمل.
            </p>
          )}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field label="اسم مساحة العمل" htmlFor="name" error={errors.name}>
              <Input {...register("name")} disabled={!canEdit} placeholder="مثال: وكالة النور" />
            </Field>

            {formError && (
              <p className="rounded-md bg-danger-100/50 px-3 py-2 text-sm text-danger">{formError}</p>
            )}

            {canEdit && <Button type="submit" loading={submitting}>حفظ التغييرات</Button>}
          </form>
        </Card>
      ) : (
        <Card className="mt-6 p-6">
          <p className="text-sm text-muted">
            لا ترتبط بمساحة عمل. الوصول ممنوح لك على مستوى المواقع فقط.
          </p>
        </Card>
      )}
    </div>
  );
}
