"use client";

// Owner view of a site's end-user accounts: list them, change role (with the
// site's custom labels), and remove. Gated server-side on canEditSettings.

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Users, Trash2, ShieldAlert, KeyRound, Copy, Check } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { MenuSelect } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type Role = "manager" | "contributor" | "member";

export interface SiteUserRow {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
}

const ROLE_ORDER: Role[] = ["manager", "contributor", "member"];

function joined(iso: string): string {
  return new Date(iso).toLocaleDateString("ar");
}

export function SiteUsersManager({
  siteId,
  businessName,
  authEnabled,
  labels,
  initial,
}: {
  siteId: string;
  businessName: string;
  authEnabled: boolean;
  labels: Record<Role, string>;
  initial: SiteUserRow[];
}) {
  const toast = useToast();
  const [users, setUsers] = React.useState<SiteUserRow[]>(initial);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [reset, setReset] = React.useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = React.useState(false);
  // A single in-app confirmation modal for the destructive actions (no browser confirm()).
  const [pending, setPending] = React.useState<
    { kind: "reset" | "delete"; id: string; email: string } | null
  >(null);

  async function reload() {
    try {
      const rows = await api.get<SiteUserRow[]>(`/api/sites/${siteId}/users`);
      setUsers(rows);
    } catch {
      toast("تعذّر تحديث القائمة", "error");
    }
  }

  async function changeRole(id: string, role: Role) {
    setBusy(id);
    // optimistic
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    try {
      await api.patch(`/api/sites/${siteId}/users/${id}`, { role });
      toast("تم تحديث الدور ✓");
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر التحديث", "error");
      await reload();
    }
    setBusy(null);
  }

  async function doReset(id: string, email: string) {
    setBusy(id);
    try {
      const { tempPassword } = await api.post<{ id: string; tempPassword: string }>(
        `/api/sites/${siteId}/users/${id}/reset-password`,
        {},
      );
      setCopied(false);
      setReset({ email, password: tempPassword });
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر إعادة التعيين", "error");
    }
    setBusy(null);
  }

  async function doRemove(id: string) {
    setBusy(id);
    try {
      await api.del(`/api/sites/${siteId}/users/${id}`);
      toast("تم حذف الحساب");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر الحذف", "error");
    }
    setBusy(null);
  }

  async function confirmPending() {
    if (!pending) return;
    const { kind, id, email } = pending;
    setPending(null);
    if (kind === "reset") await doReset(id, email);
    else await doRemove(id);
  }

  async function copyPassword() {
    if (!reset) return;
    try {
      await navigator.clipboard.writeText(reset.password);
      setCopied(true);
      toast("تم نسخ كلمة المرور ✓");
    } catch {
      toast("تعذّر النسخ", "error");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start gap-3">
        <Link href={`/dashboard/sites/${siteId}`} className="rounded-md p-1.5 text-muted transition hover:bg-black/[0.04] hover:text-ink dark:hover:bg-white/6" aria-label="رجوع">
          <ArrowRight className="size-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-ink">المستخدمون</h1>
          <p className="mt-0.5 text-sm text-muted">حسابات زوّار موقع <span className="font-medium text-ink">{businessName}</span> — {users.length.toLocaleString("ar-EG")} حساب.</p>
        </div>
      </div>

      {!authEnabled && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-300/40 bg-amber-50 px-4 py-3 dark:bg-amber-500/10">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <span className="text-sm text-amber-800 dark:text-amber-200">
            حسابات الزوّار غير مفعّلة. فعّلها من{" "}
            <Link href={`/dashboard/sites/${siteId}/settings`} className="font-semibold underline underline-offset-2">الإعدادات ← حسابات الزوّار</Link>{" "}
            ليتمكن الزوّار من التسجيل والدخول.
          </span>
        </div>
      )}

      {users.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="size-6" />}
            title="لا حسابات بعد"
            body={authEnabled ? "عندما يسجّل زائرٌ حسابًا على موقعك المنشور، سيظهر هنا." : "فعّل حسابات الزوّار أولًا حتى يتمكن الزوّار من التسجيل."}
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {users.map((u) => (
            <li key={u.id}>
              <Card className="flex items-center gap-4 p-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-100 text-sm font-bold text-accent-900">
                  {(u.name || u.email)[0]?.toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{u.name || "—"}</p>
                  <p className="truncate text-xs text-muted" dir="ltr">{u.email}</p>
                </div>
                <span className="hidden shrink-0 text-[11px] text-faint sm:block">انضم {joined(u.createdAt)}</span>
                <MenuSelect
                  value={u.role}
                  ariaLabel="الدور"
                  options={ROLE_ORDER.map((r) => ({ value: r, label: labels[r] }))}
                  onChange={(v) => changeRole(u.id, v as Role)}
                  className="w-32 shrink-0"
                />
                <button onClick={() => setPending({ kind: "reset", id: u.id, email: u.email })} disabled={busy === u.id} title="إعادة تعيين كلمة المرور" className="shrink-0 rounded-md p-2 text-muted transition hover:bg-accent-100 hover:text-accent-900 disabled:opacity-40">
                  <KeyRound className="size-4" />
                </button>
                <button onClick={() => setPending({ kind: "delete", id: u.id, email: u.email })} disabled={busy === u.id} title="حذف" className="shrink-0 rounded-md p-2 text-muted transition hover:bg-danger-100 hover:text-danger disabled:opacity-40">
                  <Trash2 className="size-4" />
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title={pending?.kind === "reset" ? "إعادة تعيين كلمة المرور" : "حذف الحساب"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>إلغاء</Button>
            <Button variant={pending?.kind === "delete" ? "danger" : "primary"} onClick={confirmPending}>
              {pending?.kind === "reset" ? "إعادة التعيين" : "حذف نهائي"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink">
          {pending?.kind === "reset" ? (
            <>
              سيتم إنشاء كلمة مرور مؤقتة جديدة للحساب{" "}
              <span className="font-semibold" dir="ltr">{pending?.email}</span> و<span className="font-semibold">إنهاء جميع جلساته الحالية</span> — سيحتاج لتسجيل الدخول من جديد بالكلمة الجديدة.
            </>
          ) : (
            <>
              سيتم حذف الحساب{" "}
              <span className="font-semibold" dir="ltr">{pending?.email}</span> نهائيًا. لا يمكن التراجع عن هذا الإجراء.
            </>
          )}
        </p>
      </Modal>

      <Modal
        open={!!reset}
        onClose={() => setReset(null)}
        title="كلمة مرور مؤقتة"
        size="sm"
        footer={<Button variant="ghost" onClick={() => setReset(null)}>تم</Button>}
      >
        <p className="text-sm text-ink">
          كلمة مرور مؤقتة جديدة للحساب{" "}
          <span className="font-semibold" dir="ltr">{reset?.email}</span>. انسخها وأرسلها للمستخدم —
          <span className="font-semibold"> لن تظهر مرة أخرى</span>، وننصح المستخدم بتغييرها بعد الدخول.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 select-all rounded-lg border border-line bg-black/[0.04] px-3 py-2.5 text-center text-lg font-bold tracking-wider text-ink dark:bg-white/6" dir="ltr">
            {reset?.password}
          </code>
          <button
            onClick={copyPassword}
            title="نسخ"
            className="shrink-0 rounded-lg border border-line p-2.5 text-muted transition hover:bg-black/[0.04] hover:text-ink dark:hover:bg-white/6"
          >
            {copied ? <Check className="size-5 text-emerald-600" /> : <Copy className="size-5" />}
          </button>
        </div>
      </Modal>
    </div>
  );
}
