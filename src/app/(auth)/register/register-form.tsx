"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { signUp } from "@/lib/auth-client";
import { api } from "@/lib/api-client";
import { useForm, FormError } from "@/hooks/use-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const schema = z.object({
  name: z.string().trim().min(2, "أدخل اسمك الكامل"),
  email: z.email("أدخل بريدًا إلكترونيًا صحيحًا"),
  password: z.string().min(8, "٨ أحرف على الأقل"),
});

export function RegisterForm() {
  const router = useRouter();
  const { register, errors, formError, submitting, handleSubmit } = useForm({
    initial: { name: "", email: "", password: "" },
    schema,
    onSubmit: async ({ name, email, password }) => {
      // Better Auth hides duplicates (returns a generic success), so we check
      // availability first to show an explicit, inline "already registered".
      const { available } = await api.post<{ available: boolean }>(
        "/api/auth/email-available",
        { email },
      );
      if (!available) {
        throw new FormError("هذا البريد مسجّل بالفعل", {
          email: "هذا البريد مسجّل بالفعل — سجّل الدخول بدلًا من ذلك.",
        });
      }
      const { error } = await signUp.email({
        name,
        email,
        password,
        // Where Better Auth redirects after the emailed verification link is
        // clicked (auto-signed-in). Lands on our "verified" confirmation page.
        callbackURL: "/verified",
      });
      if (error) {
        throw new FormError("تعذّر إنشاء الحساب، تحقق من البيانات وحاول مجددًا.");
      }
    },
    onSuccess: ({ email }) =>
      router.push(`/verify-email?email=${encodeURIComponent(email)}`),
  });

  return (
    <Card className="p-7">
      <h1 className="text-xl font-extrabold text-ink">إنشاء حساب</h1>
      <p className="mt-1 text-sm text-muted">
        ابدأ ببناء موقع عملك خلال دقائق.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <Field label="الاسم" htmlFor="name" error={errors.name}>
          <Input {...register("name")} placeholder="اسمك الكامل" autoComplete="name" />
        </Field>
        <Field label="البريد الإلكتروني" htmlFor="email" error={errors.email}>
          <Input
            {...register("email")}
            type="email"
            dir="ltr"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>
        <Field
          label="كلمة المرور"
          htmlFor="password"
          hint="٨ أحرف على الأقل"
          error={errors.password}
        >
          <Input
            {...register("password")}
            type="password"
            dir="ltr"
            autoComplete="new-password"
          />
        </Field>

        {formError && (
          <p className="rounded-md bg-danger-100/50 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          إنشاء الحساب
        </Button>
      </form>

      <p className="mt-4 text-sm text-muted text-center">
        لديك حساب؟{" "}
        <Link href="/login" className="text-accent hover:underline">
          سجّل الدخول
        </Link>
      </p>
    </Card>
  );
}
