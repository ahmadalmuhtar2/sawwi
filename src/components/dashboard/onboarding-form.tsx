"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { AvatarUploader } from "@/components/dashboard/avatar-uploader";

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/workspaces", { name });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? (err.fields?.name ?? err.message)
          : "تعذّر إنشاء مساحة العمل",
      );
      setLoading(false);
    }
  }

  return (
    <Card className="p-7">
      <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-accent-100 text-accent">
        <Store className="size-6" />
      </div>
      <h1 className="text-xl font-extrabold text-ink">أنشئ مساحة عملك</h1>
      <p className="mt-1 text-sm text-muted">
        مساحة العمل هي حسابك الذي يجمع كل مواقعك وأعضاء فريقك. بيانات التواصل تُضاف
        لاحقًا داخل إعدادات كل موقع.
      </p>

      {/* Optional avatar */}
      <div className="mt-6">
        <AvatarUploader />
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="اسم مساحة العمل" htmlFor="name">
          <Input
            id="name"
            required
            placeholder="مثال: وكالة النور"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" size="lg" loading={loading} className="w-full">
          إنشاء والمتابعة
        </Button>
      </form>
    </Card>
  );
}
