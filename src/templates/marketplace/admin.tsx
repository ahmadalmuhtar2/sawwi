"use client";

// The marketplace `/admin` area — a MANAGER (site-user with role `manager`)
// manages the site's USERS and LISTINGS from inside the served template. All data
// is authorized server-side by the site session (adminApi → public admin API);
// the gate here is UX only. Authoring reuses the shared progress-bar stepper (the
// same one sellers use), and the form controls come from fields.tsx.

import * as React from "react";
import { useSiteAuth } from "@/components/public/site-auth";
import { formatArabicAmount } from "@/shared/currency";
import { VERTICAL_LABEL, STATUS_LABEL, type ListingStatus } from "./schema";
import { adminApi, type AdminUserRow, type AdminListingRow } from "./admin-client";
import { ListingStepper, type ListingSubmit } from "./listing-stepper";
import { DISPLAY, MONO, btnPrimary, btnGhost, MkModal } from "./fields";
import { MkSelect } from "./mk-select";
import { usePaged, LoadMore } from "./paging";

/* ────────────────────────────── shell + gate ────────────────────────────── */

export function AdminView({ currency, onExit }: { currency: string; onExit: () => void }) {
  const auth = useSiteAuth();
  const [tab, setTab] = React.useState<"users" | "listings">("users");

  let body: React.ReactNode;
  if (auth.loading) {
    body = <Center>جارٍ التحقق…</Center>;
  } else if (!auth.user) {
    body = (
      <Center>
        <p className="text-[15px] text-mk-muted">هذه الصفحة للمديرين. سجّل الدخول للمتابعة.</p>
        <button onClick={() => auth.open("signin")} className={btnPrimary}>تسجيل الدخول</button>
      </Center>
    );
  } else if (auth.user.role !== "manager") {
    body = (
      <Center>
        <p className="text-[15px] text-mk-muted">ليست لديك صلاحية الوصول إلى لوحة الإدارة.</p>
        <button onClick={onExit} className={btnGhost}>العودة إلى الموقع</button>
      </Center>
    );
  } else {
    body = tab === "users" ? <UsersPanel labels={auth.labels} /> : <ListingsPanel currency={currency} />;
  }

  const isManager = auth.user?.role === "manager";
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-5 pb-16 pt-6 md:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onExit} className="inline-flex h-9 items-center gap-2 rounded-[10px] px-3 text-[13.5px] font-medium text-mk-muted hover:bg-mk-track hover:text-mk-ink">→ العودة إلى الموقع</button>
        <h1 className="text-[26px]" style={{ fontFamily: DISPLAY }}>لوحة الإدارة</h1>
      </div>

      {isManager && (
        <span className="inline-flex gap-1 self-start rounded-[10px] border border-mk-line-soft bg-mk-track p-[3px]">
          {(["users", "listings"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={"rounded-[7px] px-4 py-[7px] text-[13.5px] font-medium transition " + (t === tab ? "bg-mk-surface text-mk-ink shadow-sm" : "text-mk-muted hover:text-mk-ink")}>
              {t === "users" ? "المستخدمون" : "الإعلانات"}
            </button>
          ))}
        </span>
      )}

      {body}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-mk-line-soft bg-mk-surface px-6 py-16 text-center">{children}</div>;
}

/* ─────────────────────────────── users panel ────────────────────────────── */

const ROLE_SELECTABLE: AdminUserRow["role"][] = ["contributor", "member"];

function UsersPanel({ labels }: { labels: Record<string, string> }) {
  const [users, setUsers] = React.useState<AdminUserRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<{ kind: "reset" | "delete"; id: string; email: string } | null>(null);
  const [temp, setTemp] = React.useState<{ email: string; password: string } | null>(null);
  const paged = usePaged(users ?? [], 10);

  const load = React.useCallback(async () => {
    try { setUsers(await adminApi.users.list()); }
    catch (e) { setError(e instanceof Error ? e.message : "تعذّر التحميل"); }
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- state is set after an await, not synchronously
  React.useEffect(() => { void load(); }, [load]);

  async function changeRole(id: string, role: AdminUserRow["role"]) {
    setBusy(id);
    setUsers((prev) => prev?.map((u) => (u.id === id ? { ...u, role } : u)) ?? prev);
    try { await adminApi.users.setRole(id, role); }
    catch (e) { alert(e instanceof Error ? e.message : "تعذّر التحديث"); await load(); }
    setBusy(null);
  }

  async function confirmPending() {
    if (!pending) return;
    const { kind, id, email } = pending;
    setPending(null);
    setBusy(id);
    try {
      if (kind === "reset") {
        const { tempPassword } = await adminApi.users.resetPassword(id);
        setTemp({ email, password: tempPassword });
      } else {
        await adminApi.users.remove(id);
        setUsers((prev) => prev?.filter((u) => u.id !== id) ?? prev);
      }
    } catch (e) { alert(e instanceof Error ? e.message : "تعذّر تنفيذ الإجراء"); }
    setBusy(null);
  }

  if (error) return <Center><p className="text-[14px] text-mk-danger">{error}</p></Center>;
  if (!users) return <Center>جارٍ التحميل…</Center>;
  if (users.length === 0) return <Center><p className="text-[15px] text-mk-muted">لا مستخدمين مسجّلين بعد.</p></Center>;

  return (
    <>
      <ul className="flex flex-col gap-2.5">
        {paged.visible.map((u) => {
          const locked = u.role === "manager"; // managers (incl. self) are owner-managed
          return (
            <li key={u.id}>
              <div className="flex items-center gap-4 rounded-2xl border border-mk-line-soft bg-mk-surface p-3.5 shadow-mk">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mk-soft text-[14px] font-semibold text-mk-strong">{(u.name || u.email)[0]?.toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-mk-ink">{u.name || "—"}</p>
                  <p className="truncate text-[12px] text-mk-faint" dir="ltr">{u.email}</p>
                </div>
                {locked ? (
                  <span className="shrink-0 rounded-full border border-mk-line px-3 py-1 text-[12px] text-mk-muted">{labels[u.role] ?? u.role}</span>
                ) : (
                  <>
                    <div className="w-32 shrink-0">
                      <MkSelect
                        value={u.role}
                        onChange={(v) => v && changeRole(u.id, v as AdminUserRow["role"])}
                        options={ROLE_SELECTABLE.map((r) => ({ value: r, label: labels[r] ?? r }))}
                        disabled={busy === u.id}
                        triggerClass="h-9 w-full rounded-[10px] border border-mk-line bg-mk-surface px-2.5 text-[13px] text-mk-ink outline-none"
                      />
                    </div>
                    <button onClick={() => setPending({ kind: "reset", id: u.id, email: u.email })} disabled={busy === u.id} title="إعادة تعيين كلمة المرور" className="shrink-0 rounded-md p-2 text-mk-muted transition hover:bg-mk-soft hover:text-mk-strong disabled:opacity-40">🔑</button>
                    <button onClick={() => setPending({ kind: "delete", id: u.id, email: u.email })} disabled={busy === u.id} title="حذف" className="shrink-0 rounded-md p-2 text-mk-muted transition hover:bg-mk-danger-soft hover:text-mk-danger disabled:opacity-40">🗑</button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {paged.hasMore && <div className="mt-3 flex"><LoadMore remaining={paged.remaining} onClick={paged.showMore} /></div>}

      {pending && (
        <MkModal
          title={pending.kind === "reset" ? "إعادة تعيين كلمة المرور" : "حذف الحساب"}
          onClose={() => setPending(null)}
          footer={<><button onClick={() => setPending(null)} className={btnGhost}>إلغاء</button><button onClick={confirmPending} className={btnPrimary}>{pending.kind === "reset" ? "إعادة التعيين" : "حذف نهائي"}</button></>}
        >
          <p className="text-[14px] leading-relaxed text-mk-muted">
            {pending.kind === "reset"
              ? <>سيتم إنشاء كلمة مرور مؤقتة للحساب <span className="font-semibold text-mk-ink" dir="ltr">{pending.email}</span> وإنهاء جلساته الحالية.</>
              : <>سيتم حذف الحساب <span className="font-semibold text-mk-ink" dir="ltr">{pending.email}</span> نهائيًا.</>}
          </p>
        </MkModal>
      )}

      {temp && (
        <MkModal title="كلمة مرور مؤقتة" onClose={() => setTemp(null)} footer={<button onClick={() => setTemp(null)} className={btnPrimary}>تم</button>}>
          <p className="text-[14px] leading-relaxed text-mk-muted">
            كلمة مرور مؤقتة للحساب <span className="font-semibold text-mk-ink" dir="ltr">{temp.email}</span> — انسخها وأرسلها للمستخدم، <span className="font-semibold text-mk-ink">لن تظهر مجددًا</span>.
          </p>
          <code className="mt-3 block select-all rounded-[10px] border border-mk-line bg-mk-track px-3 py-2.5 text-center text-[18px] font-bold tracking-wider text-mk-ink" dir="ltr">{temp.password}</code>
        </MkModal>
      )}
    </>
  );
}

/* ────────────────────────────── listings panel ──────────────────────────── */

const STATUS_CYCLE: ListingStatus[] = ["available", "reserved", "sold"];

function ListingsPanel({ currency }: { currency: string }) {
  const [rows, setRows] = React.useState<AdminListingRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<AdminListingRow | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<AdminListingRow | null>(null);
  const paged = usePaged(rows ?? [], 10);

  const load = React.useCallback(async () => {
    try { setRows(await adminApi.listings.list()); }
    catch (e) { setError(e instanceof Error ? e.message : "تعذّر التحميل"); }
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- state is set after an await, not synchronously
  React.useEffect(() => { void load(); }, [load]);

  async function patch(id: string, body: Parameters<typeof adminApi.listings.update>[1]) {
    setBusy(id);
    try {
      const updated = await adminApi.listings.update(id, body);
      setRows((prev) => prev?.map((r) => (r.id === id ? updated : r)) ?? prev);
    } catch (e) { alert(e instanceof Error ? e.message : "تعذّر التحديث"); }
    setBusy(null);
  }

  async function confirmDelete() {
    const l = pendingDelete;
    if (!l) return;
    setPendingDelete(null);
    setBusy(l.id);
    try { await adminApi.listings.remove(l.id); setRows((prev) => prev?.filter((r) => r.id !== l.id) ?? prev); }
    catch (e) { alert(e instanceof Error ? e.message : "تعذّر الحذف"); }
    setBusy(null);
  }

  if (editing) {
    const submit: ListingSubmit = async (payload) => {
      if (editing !== "new") await adminApi.listings.update(editing.id, payload);
      else await adminApi.listings.create(payload);
    };
    return <ListingStepper currency={currency} initial={editing === "new" ? null : editing} onSubmit={submit} onDone={() => { setEditing(null); void load(); }} onCancel={() => setEditing(null)} />;
  }
  if (error) return <Center><p className="text-[14px] text-mk-danger">{error}</p></Center>;
  if (!rows) return <Center>جارٍ التحميل…</Center>;

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => setEditing("new")} className={btnPrimary + " self-start"}>+ إضافة إعلان</button>
      {rows.length === 0 ? (
        <Center><p className="text-[15px] text-mk-muted">لا إعلانات بعد. أضِف أول إعلان.</p></Center>
      ) : (
        <>
          <ul className="flex flex-col gap-2.5">
            {paged.visible.map((l) => (
              <li key={l.id}>
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-mk-line-soft bg-mk-surface p-3.5 shadow-mk">
                  <span className="inline-flex h-6 items-center rounded-full bg-mk-track px-2.5 text-[11px] text-mk-muted" style={{ fontFamily: MONO }}>{VERTICAL_LABEL[l.vertical]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-mk-ink">{l.title}</p>
                    <p className="truncate text-[12px] text-mk-faint">{l.price != null ? `${formatArabicAmount(l.price)} ${currency}` : "حسب الطلب"} · {STATUS_LABEL[l.status]}{l.featured ? " · مميّز" : ""}</p>
                  </div>
                  <button onClick={() => patch(l.id, { published: !l.published })} disabled={busy === l.id} className={btnGhost}>{l.published ? "منشور" : "مخفي"}</button>
                  <button onClick={() => patch(l.id, { featured: !l.featured })} disabled={busy === l.id} className={btnGhost}>{l.featured ? "★ مميّز" : "☆ تمييز"}</button>
                  <button onClick={() => patch(l.id, { status: STATUS_CYCLE[(STATUS_CYCLE.indexOf(l.status) + 1) % STATUS_CYCLE.length] })} disabled={busy === l.id} className={btnGhost}>{STATUS_LABEL[l.status]}</button>
                  <button onClick={() => setEditing(l)} disabled={busy === l.id} className={btnGhost}>تحرير</button>
                  <button onClick={() => setPendingDelete(l)} disabled={busy === l.id} title="حذف" className="rounded-md p-2 text-mk-muted transition hover:bg-mk-danger-soft hover:text-mk-danger disabled:opacity-40">🗑</button>
                </div>
              </li>
            ))}
          </ul>
          {paged.hasMore && <div className="flex"><LoadMore remaining={paged.remaining} onClick={paged.showMore} /></div>}
        </>
      )}

      {pendingDelete && (
        <MkModal
          title="حذف الإعلان"
          onClose={() => setPendingDelete(null)}
          footer={<><button onClick={() => setPendingDelete(null)} className={btnGhost}>إلغاء</button><button onClick={confirmDelete} className={btnPrimary}>حذف نهائي</button></>}
        >
          <p className="text-[14px] leading-relaxed text-mk-muted">سيتم حذف الإعلان <span className="font-semibold text-mk-ink">{pendingDelete.title}</span> نهائيًا. لا يمكن التراجع.</p>
        </MkModal>
      )}
    </div>
  );
}
