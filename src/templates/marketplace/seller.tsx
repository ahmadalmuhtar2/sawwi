"use client";

// The seller experience (role = contributor): manage MY OWN listings + post new
// ones through the shared progress-bar stepper. Data via sellerApi (/my/listings),
// scoped server-side to the caller as author.

import * as React from "react";
import { useSiteAuth } from "@/components/public/site-auth";
import { formatArabicAmount } from "@/shared/currency";
import { VERTICAL_LABEL, STATUS_LABEL } from "./schema";
import { sellerApi, type AdminListingRow } from "./admin-client";
import { ListingStepper, type ListingSubmit } from "./listing-stepper";
import { AccountModal } from "./account";
import { DISPLAY, MONO, btnPrimary, btnGhost, MkModal, ThemeToggle, type MkTheme } from "./fields";
import { usePaged, LoadMore } from "./paging";

export function SellerArea({ currency, theme, onToggleTheme }: { currency: string; theme: MkTheme; onToggleTheme: () => void }) {
  const auth = useSiteAuth();
  const [rows, setRows] = React.useState<AdminListingRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<AdminListingRow | "new" | null>(null);
  const [account, setAccount] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<AdminListingRow | null>(null);
  const paged = usePaged(rows ?? [], 10);

  const load = React.useCallback(async () => {
    try { setRows(await sellerApi.list()); }
    catch (e) { setError(e instanceof Error ? e.message : "تعذّر التحميل"); }
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- state is set after an await, not synchronously
  React.useEffect(() => { void load(); }, [load]);

  async function confirmDelete() {
    const l = pendingDelete;
    if (!l) return;
    setPendingDelete(null);
    setBusy(l.id);
    try { await sellerApi.remove(l.id); setRows((prev) => prev?.filter((r) => r.id !== l.id) ?? prev); }
    catch (e) { setError(e instanceof Error ? e.message : "تعذّر الحذف"); }
    setBusy(null);
  }

  const submit: ListingSubmit = async (payload) => {
    if (editing && editing !== "new") await sellerApi.update(editing.id, payload);
    else await sellerApi.create(payload);
  };

  if (editing) {
    return (
      <div className="px-5 pb-16 pt-6 md:px-8">
        <ListingStepper currency={currency} initial={editing === "new" ? null : editing} onSubmit={submit} onDone={() => { setEditing(null); void load(); }} onCancel={() => setEditing(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-5 pb-16 pt-6 md:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-[26px]" style={{ fontFamily: DISPLAY }}>إعلاناتي</h1>
          <p className="text-[13px] text-mk-muted">مرحبًا {auth.user?.name || auth.user?.email} — انشر وأدِر إعلاناتك.</p>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <button onClick={() => setEditing("new")} className={btnPrimary}>+ إعلان جديد</button>
      </div>

      {error ? (
        <Center><p className="text-[14px] text-mk-danger">{error}</p></Center>
      ) : !rows ? (
        <Center>جارٍ التحميل…</Center>
      ) : rows.length === 0 ? (
        <Center>
          <p className="text-[15px] text-mk-muted">لم تنشر أي إعلان بعد.</p>
          <button onClick={() => setEditing("new")} className={btnPrimary}>ابدأ بأول إعلان</button>
        </Center>
      ) : (
        <>
          <ul className="flex flex-col gap-2.5">
            {paged.visible.map((l) => (
              <li key={l.id}>
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-mk-line-soft bg-mk-surface p-3.5 shadow-mk">
                  <span className="inline-flex h-6 items-center rounded-full bg-mk-track px-2.5 text-[11px] text-mk-muted" style={{ fontFamily: MONO }}>{VERTICAL_LABEL[l.vertical]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-mk-ink">{l.title}</p>
                    <p className="truncate text-[12px] text-mk-faint">
                      {l.price != null ? `${formatArabicAmount(l.price)} ${currency}` : "حسب الطلب"} · {STATUS_LABEL[l.status]}
                      {l.published ? "" : " · غير منشور"}
                    </p>
                  </div>
                  <button onClick={() => setEditing(l)} disabled={busy === l.id} className={btnGhost}>تحرير</button>
                  <button onClick={() => setPendingDelete(l)} disabled={busy === l.id} title="حذف" className="rounded-md p-2 text-mk-muted transition hover:bg-mk-danger-soft hover:text-mk-danger disabled:opacity-40">🗑</button>
                </div>
              </li>
            ))}
          </ul>
          {paged.hasMore && <div className="flex"><LoadMore remaining={paged.remaining} onClick={paged.showMore} /></div>}
        </>
      )}

      <div className="flex items-center gap-4">
        <button onClick={() => setAccount(true)} className="text-[13px] text-mk-muted transition hover:text-mk-ink">إعدادات الحساب</button>
        <button onClick={() => void auth.signOut()} className="text-[13px] text-mk-muted transition hover:text-mk-ink">تسجيل الخروج</button>
      </div>

      {account && <AccountModal onClose={() => setAccount(false)} />}

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

function Center({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex flex-col items-center gap-4 rounded-2xl border border-mk-line-soft bg-mk-surface px-6 py-16 text-center">{children}</div>;
}
