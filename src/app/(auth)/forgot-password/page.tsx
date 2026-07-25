"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api-client";
import { useForm, FormError } from "@/hooks/use-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const schema = z.object({
  email: z.email("أدخل بريدًا إلكترونيًا صحيحًا"),
});

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, errors, formError, submitting, handleSubmit } = useForm({
    initial: { email: "" },
    schema,
    onSubmit: async ({ email }) => {
      // Explicit: tell the user directly when the email isn't registered
      // (available === true means no account exists) instead of proceeding.
      const { available } = await api.post<{ available: boolean }>(
        "/api/auth/email-available",
        { email },
      );
      if (available) {
        throw new FormError("هذا البريد غير مسجّل لدينا.", {
          email: "هذا البريد غير مسجّل لدينا — تحقّق منه أو أنشئ حسابًا جديدًا.",
        });
      }
      await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    },
    onSuccess: () => setSent(true),
  });

  return (
    <Card className="p-7">
      <h1 className="text-xl font-extrabold text-ink">استعادة كلمة المرور</h1>
      {sent ? (
        <p className="mt-3 text-sm text-muted leading-relaxed">
          إن كان البريد مسجّلًا لدينا، فقد أرسلنا إليه رابط إعادة التعيين. تفقّد
          صندوق الوارد.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <p className="text-sm text-muted">
            أدخل بريدك وسنرسل لك رابطًا لتعيين كلمة مرور جديدة.
          </p>
          <Field label="البريد الإلكتروني" htmlFor="email" error={errors.email}>
            <Input
              {...register("email")}
              type="email"
              dir="ltr"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>

          {formError && (
            <p className="rounded-md bg-danger-100/50 px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}

          <Button type="submit" size="lg" loading={submitting} className="w-full">
            إرسال الرابط
          </Button>
        </form>
      )}
      <Link
        href="/login"
        className="mt-4 block text-sm text-accent hover:underline"
      >
        العودة لتسجيل الدخول
      </Link>
    </Card>
  );
}
