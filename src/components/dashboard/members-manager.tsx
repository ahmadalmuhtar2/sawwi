"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, Wrench, Mail, Clock, Check } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { SiteCombobox, type SiteOption } from "@/components/dashboard/site-combobox";
import { cn } from "@/lib/cn";

interface Grant {
  id: string;
  siteId: string;
  invitedEmail: string;
  businessName: string;
  builderAccess: boolean;
  accepted: boolean;
}

export function MembersManager({ hasSites, grants }: { hasSites: boolean; grants: Grant[] }) {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState<SiteOption[]>([]);
  const [builder, setBuilder] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Group grants by email.
  const byEmail = new Map<string, Grant[]>();
  for (const g of grants) {
    const arr = byEmail.get(g.invitedEmail) ?? [];
    arr.push(g);
    byEmail.set(g.invitedEmail, arr);
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (!picked.length) {
      setErrors({ siteIds: "اختر موقعًا واحدًا على الأقل" });
      return;
    }
    setInviting(true);
    try {
      await api.post("/api/members", {
        email,
        siteIds: picked.map((p) => p.id),
        builderAccess: builder,
      });
      toast("تم إرسال الدعوة ✓");
      setEmail("");
      setPicked([]);
      setBuilder(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      else toast(err instanceof ApiClientError ? err.message : "تعذّر الإرسال", "error");
    } finally {
      setInviting(false);
    }
  }

  async function toggleBuilder(g: Grant) {
    try {
      await api.patch(`/api/members/${g.id}`, { builderAccess: !g.builderAccess });
      router.refresh();
    } catch {
      toast("تعذّر التحديث", "error");
    }
  }

  async function revoke(g: Grant) {
    try {
      await api.del(`/api/members/${g.id}`);
      toast("تمت إزالة الوصول");
      router.refresh();
    } catch {
      toast("تعذّرت الإزالة", "error");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Invite */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 font-bold text-ink">
          <UserPlus className="size-4 text-accent" /> دعوة متعاون
        </h2>
        {!hasSites ? (
          <p className="mt-3 text-sm text-faint">أنشئ موقعًا أولًا لتتمكن من دعوة متعاونين.</p>
        ) : (
          <form onSubmit={invite} className="mt-4 space-y-4">
            <Field label="البريد الإلكتروني" error={errors.email} className="max-w-md">
              <Input
                dir="ltr"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </Field>

            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">المواقع</p>
              <SiteCombobox value={picked} onChange={setPicked} />
              {errors.siteIds && <p className="mt-1 text-xs text-danger">{errors.siteIds}</p>}
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={builder}
                onChange={(e) => setBuilder(e.target.checked)}
                className="size-4 accent-accent"
              />
              منح صلاحية المُنشئ (تعديل المظهر والنشر) — بدونها يعدّل المحتوى فقط
            </label>

            <Button type="submit" loading={inviting} className="gap-2">
              <Mail className="size-4" /> إرسال الدعوة
            </Button>
          </form>
        )}
      </Card>

      {/* Collaborators */}
      <div>
        <h2 className="mb-3 font-bold text-ink">المتعاونون</h2>
        {byEmail.size === 0 ? (
          <Card className="p-8 text-center text-sm text-faint">لا متعاونين بعد.</Card>
        ) : (
          <div className="space-y-3">
            {[...byEmail.entries()].map(([mail, gs]) => (
              <Card key={mail} className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink" dir="ltr">{mail}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs">
                      {gs.some((g) => g.accepted) ? (
                        <span className="flex items-center gap-1 text-accent">
                          <Check className="size-3.5" /> نشط
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-warn">
                          <Clock className="size-3.5" /> بانتظار القبول
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <ul className="mt-3 divide-y divide-line border-t border-line">
                  {gs.map((g) => (
                    <li key={g.id} className="flex items-center justify-between py-2.5">
                      <span className="text-sm text-ink">{g.businessName}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleBuilder(g)}
                          title="صلاحية المُنشئ"
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition cursor-pointer",
                            g.builderAccess
                              ? "border-accent bg-accent-50 text-accent-900"
                              : "border-line text-muted hover:text-ink",
                          )}
                        >
                          <Wrench className="size-3.5" />
                          {g.builderAccess ? "المُنشئ مُفعّل" : "إعدادات فقط"}
                        </button>
                        <button
                          onClick={() => revoke(g)}
                          title="إزالة الوصول"
                          className="rounded-md p-1.5 text-faint transition hover:bg-danger-100 hover:text-danger cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
