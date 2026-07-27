"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { signIn } from "@/lib/auth-client";
import { useForm, FormError } from "@/hooks/use-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const schema = z.object({
  email: z.email("أدخل بريدًا إلكترونيًا صحيحًا"),
  password: z.string().min(1, "أدخل كلمة المرور"),
});

export function LoginForm({ next, expired }: { next?: string; expired?: boolean }) {
  const router = useRouter();
  const { register, errors, formError, submitting, handleSubmit } = useForm({
    initial: { email: "", password: "" },
    schema,
    onSubmit: async ({ email, password }) => {
      const { error } = await signIn.email({ email, password });
      if (error) {
        // Auth failures are form-level (never reveal which field was wrong).
        throw new FormError(
          error.status === 403
            ? "يجب تأكيد بريدك الإلكتروني أولًا"
            : "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        );
      }
    },
    onSuccess: () => {
      // Return the user to where they were headed (validated same-site path).
      router.push(next ?? "/dashboard");
      router.refresh();
    },
  });

  return (
    <Card className="p-7">
      <h1 className="text-xl font-extrabold text-ink">تسجيل الدخول</h1>
      <p className="mt-1 text-sm text-muted">أهلًا بعودتك إلى سوّي.</p>

      {expired && (
        <p className="mt-4 rounded-md bg-amber-100/60 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          انتهت جلستك. الرجاء تسجيل الدخول من جديد للمتابعة.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <Field label="البريد الإلكتروني" htmlFor="email" error={errors.email}>
          <Input
            {...register("email")}
            type="email"
            dir="ltr"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>
        <Field label="كلمة المرور" htmlFor="password" error={errors.password}>
          <Input
            {...register("password")}
            type="password"
            dir="ltr"
            autoComplete="current-password"
          />
        </Field>

        {formError && (
          <p className="rounded-md bg-danger-100/50 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          دخول
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-accent hover:underline">
          نسيت كلمة المرور؟
        </Link>
        <Link href="/register" className="text-muted hover:text-ink">
          إنشاء حساب جديد
        </Link>
      </div>
    </Card>
  );
}
