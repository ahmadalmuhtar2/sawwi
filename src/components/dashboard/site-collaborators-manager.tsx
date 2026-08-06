"use client";

// Per-site Collaborators tab: lists every platform user with access to THIS site,
// and — for the site owner only — lets them invite, toggle builder access, and
// revoke. Non-owners (workspace members, invited collaborators) see a read-only
// list. Management is gated server-side too (owner-only); `canManage` just hides
// the controls. Distinct from the "المستخدمون" tab (that's the public site's
// end-user accounts).

import * as React from "react";
import Link from "next/link";
import { ArrowRight, UserPlus, Trash2, Wrench, Mail, Clock, Check, Users } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

export interface CollaboratorRow {
  id: string;
  email: string;
  builderAccess: boolean;
  accepted: boolean;
}

export function SiteCollaboratorsManager({
  siteId,
  businessName,
  canManage,
  initial,
}: {
  siteId: string;
  businessName: string;
  canManage: boolean;
  initial: CollaboratorRow[];
}) {
  const toast = useToast();
  const [rows, setRows] = React.useState<CollaboratorRow[]>(initial);
  const [email, setEmail] = React.useState("");
  const [builder, setBuilder] = React.useState(false);
  const [inviting, setInviting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  async function reload() {
    try {
      const { grants } = await api.get<{ grants: { id: string; invitedEmail: string; builderAccess: boolean; acceptedAt: string | null }[] }>(
        `/api/sites/${siteId}/collaborators`,
      );
      setRows(grants.map((g) => ({ id: g.id, email: g.invitedEmail, builderAccess: g.builderAccess, accepted: g.acceptedAt != null })));
    } catch {
      toast("تعذّر تحديث القائمة", "error");
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setInviting(true);
    try {
      await api.post(`/api/sites/${siteId}/collaborators`, { email, builderAccess: builder });
      toast("تم إرسال الدعوة ✓");
      setEmail("");
      setBuilder(false);
      await reload();
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      else toast(err instanceof ApiClientError ? err.message : "تعذّر الإرسال", "error");
    } finally {
      setInviting(false);
    }
  }

  async function toggleBuilder(g: CollaboratorRow) {
    setRows((prev) => prev.map((r) => (r.id === g.id ? { ...r, builderAccess: !r.builderAccess } : r)));
    try {
      await api.patch(`/api/sites/${siteId}/collaborators/${g.id}`, { builderAccess: !g.builderAccess });
    } catch {
      toast("تعذّر التحديث", "error");
      await reload();
    }
  }

  async function revoke(g: CollaboratorRow) {
    setRows((prev) => prev.filter((r) => r.id !== g.id));
    try {
      await api.del(`/api/sites/${siteId}/collaborators/${g.id}`);
      toast("تمت إزالة الوصول");
    } catch {
      toast("تعذّرت الإزالة", "error");
      await reload();
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start gap-3">
        <Link href={`/dashboard/sites/${siteId}`} className="rounded-md p-1.5 text-muted transition hover:bg-black/[0.04] hover:text-ink dark:hover:bg-white/6" aria-label="رجوع">
          <ArrowRight className="size-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-ink">المتعاونون</h1>
          <p className="mt-0.5 text-sm text-muted">من يملك صلاحية الوصول إلى <span className="font-medium text-ink">{businessName}</span> — {rows.length.toLocaleString("ar-EG")} متعاون.</p>
        </div>
      </div>

      {canManage ? (
        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            <UserPlus className="size-4 text-accent" /> دعوة متعاون
          </h2>
          <form onSubmit={invite} className="mt-4 space-y-4">
            <Field label="البريد الإلكتروني" error={errors.email} className="max-w-md">
              <Input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />
            </Field>
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={builder} onChange={(e) => setBuilder(e.target.checked)} className="size-4 accent-accent" />
              السماح بالتعديل والنشر — بدونها يمكنه الاطلاع فقط دون أي تعديل
            </label>
            <Button type="submit" loading={inviting} className="gap-2">
              <Mail className="size-4" /> إرسال الدعوة
            </Button>
          </form>
        </Card>
      ) : (
        <div className="mb-4 rounded-lg border border-line bg-black/[0.02] px-4 py-3 text-sm text-muted dark:bg-white/[0.03]">
          إدارة المتعاونين متاحة لمالك الموقع فقط.
        </div>
      )}

      <div className={canManage ? "mt-6" : ""}>
        {rows.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users className="size-6" />}
              title="لا متعاونين بعد"
              body={canManage ? "ادعُ زميلًا بالبريد الإلكتروني ليصل إلى هذا الموقع." : "لم يُضف أي متعاون إلى هذا الموقع بعد."}
            />
          </Card>
        ) : (
          <ul className="space-y-3">
            {rows.map((g) => (
              <li key={g.id}>
                <Card className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink" dir="ltr">{g.email}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs">
                      {g.accepted ? (
                        <span className="flex items-center gap-1 text-accent"><Check className="size-3.5" /> نشط</span>
                      ) : (
                        <span className="flex items-center gap-1 text-warn"><Clock className="size-3.5" /> بانتظار القبول</span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {canManage ? (
                      <Tooltip label="صلاحية التعديل والنشر">
                        <button
                          onClick={() => toggleBuilder(g)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition cursor-pointer",
                            g.builderAccess ? "border-accent bg-accent-50 text-accent-900" : "border-line text-muted hover:text-ink",
                          )}
                        >
                          <Wrench className="size-3.5" />
                          {g.builderAccess ? "تعديل ونشر" : "عرض فقط"}
                        </button>
                      </Tooltip>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-muted">
                        <Wrench className="size-3.5" />
                        {g.builderAccess ? "تعديل ونشر" : "عرض فقط"}
                      </span>
                    )}
                    {canManage && (
                      <Tooltip label="إزالة الوصول">
                        <button
                          onClick={() => revoke(g)}
                          aria-label="إزالة الوصول"
                          className="rounded-md p-1.5 text-faint transition hover:bg-danger-100 hover:text-danger cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
