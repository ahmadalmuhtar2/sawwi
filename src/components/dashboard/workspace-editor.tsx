"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Trash2 } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useForm } from "@/hooks/use-form";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input } from "@/components/ui/field";

const schema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جدًا").max(120, "الاسم طويل جدًا"),
});

const AR = "٠١٢٣٤٥٦٧٨٩";
const arNum = (n: number) => String(n).replace(/\d/g, (d) => AR[Number(d)]);

export function WorkspaceEditor({
  workspace,
  canEdit,
  siteCount,
}: {
  workspace: { name: string } | null;
  canEdit: boolean;
  /** sites the workspace owns — deletion is blocked until this is zero. */
  siteCount: number;
}) {
  const toast = useToast();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { register, errors, formError, submitting, handleSubmit } = useForm({
    initial: { name: workspace?.name ?? "" },
    schema,
    onSubmit: async (values) => {
      await api.put("/api/workspaces/me", values);
    },
    onSuccess: () => toast("تم حفظ مساحة العمل ✓"),
  });

  async function doDelete() {
    setDeleting(true);
    try {
      await api.del("/api/workspaces/me");
      toast("تم حذف مساحة العمل");
      setConfirmOpen(false);
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر الحذف", "error");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold text-ink">مساحة العمل</h1>
      <p className="mt-1 text-sm text-muted">
        مساحة العمل هي حسابك الذي يضم مواقعك وفريقك. بيانات التواصل (الهاتف،
        العنوان…) تخصّ كل موقع وتُدار من إعدادات الموقع.
      </p>

      {workspace ? (
        <>
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

          {canEdit && (
            <Card className="mt-6 border-danger/30 p-6">
              <h2 className="text-sm font-bold text-danger">حذف مساحة العمل</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                يحذف مساحة العمل وفريقها ودعواتها نهائيًا. لا يمكن التراجع عن هذا الإجراء.
              </p>
              {siteCount > 0 ? (
                <p className="mt-4 rounded-md bg-neutral-100 px-3 py-2.5 text-sm leading-relaxed text-muted">
                  تحتوي مساحة العمل على {arNum(siteCount)} موقعًا. احذف كل المواقع أولًا لتتمكّن من حذف مساحة العمل.
                </p>
              ) : (
                <Button variant="danger" className="mt-4 gap-2" onClick={() => setConfirmOpen(true)}>
                  <Trash2 className="size-4" /> حذف مساحة العمل
                </Button>
              )}
            </Card>
          )}
        </>
      ) : (
        <Card className="mt-6 p-6">
          <p className="text-sm text-muted">
            لا ترتبط بمساحة عمل. الوصول ممنوح لك على مستوى المواقع فقط.
          </p>
        </Card>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        title="حذف مساحة العمل"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              إلغاء
            </Button>
            <Button variant="danger" onClick={doDelete} loading={deleting}>
              حذف نهائي
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink">
          سيتم حذف <span className="font-bold">{workspace?.name}</span> نهائيًا مع فريقها
          ودعواتها. لا يمكن التراجع عن هذا الإجراء.
        </p>
      </Modal>
    </div>
  );
}
