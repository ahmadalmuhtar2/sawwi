"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { api } from "@/lib/api-client";
import { useForm } from "@/hooks/use-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const schema = z.object({
  password: z.string().min(8, "٨ أحرف على الأقل"),
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read URL param client-side once
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  const { register, errors, formError, submitting, handleSubmit } = useForm({
    initial: { password: "" },
    schema,
    onSubmit: async ({ password }) => {
      // Reset AND sign in atomically, then land the user in the dashboard.
      // An ApiClientError (e.g. expired token) is mapped to the form by useForm.
      const { signedIn } = await api.post<{ signedIn: boolean }>(
        "/api/auth/reset-and-login",
        { token, password },
      );
      router.replace(signedIn ? "/dashboard" : "/login");
      router.refresh();
    },
  });

  return (
    <Card className="p-7">
      <h1 className="text-xl font-extrabold text-ink">كلمة مرور جديدة</h1>
      {!token ? (
        <p className="mt-3 text-sm text-danger">
          رابط غير صالح. اطلب رابطًا جديدًا من صفحة استعادة كلمة المرور.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <Field
            label="كلمة المرور الجديدة"
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
            حفظ كلمة المرور
          </Button>
        </form>
      )}
      <Link href="/login" className="mt-4 block text-sm text-accent hover:underline">
        العودة لتسجيل الدخول
      </Link>
    </Card>
  );
}
