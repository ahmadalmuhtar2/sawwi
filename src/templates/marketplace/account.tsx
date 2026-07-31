"use client";

// The signed-in user's account settings — a modal any role can open (from the
// header account chip, the seller area, or the admin panel). Edits name, contact
// phone, and (optionally) password. Email is shown but NOT editable (it's the
// account identity). Saves via profileApi → PATCH /me, then refreshes auth so the
// new name/phone flow into the enquiry + contact prefills immediately.

import * as React from "react";
import { useSiteAuth } from "@/components/public/site-auth";
import { profileApi } from "./admin-client";
import { MkModal, inputCls, btnPrimary, btnGhost, MONO } from "./fields";

export function AccountModal({ onClose }: { onClose: () => void }) {
  const auth = useSiteAuth();
  const user = auth.user;
  const [form, setForm] = React.useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    password: "",
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    if (busy) return;
    if (!form.name.trim()) { setError("الاسم مطلوب"); return; }
    if (form.password && form.password.length < 8) { setError("كلمة المرور ٨ أحرف على الأقل"); return; }
    setBusy(true); setError(null);
    try {
      await profileApi.update({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        ...(form.password ? { password: form.password } : {}),
      });
      await auth.refresh();
      setDone(true);
      setForm((f) => ({ ...f, password: "" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ");
    }
    setBusy(false);
  }

  return (
    <MkModal
      title="إعدادات الحساب"
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className={btnGhost}>إغلاق</button>
        <button onClick={save} disabled={busy} className={btnPrimary}>{busy ? "جارٍ الحفظ…" : "حفظ"}</button>
      </>}
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>الاسم</span>
          <input value={form.name} onChange={set("name")} placeholder="الاسم" maxLength={80} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>رقم الهاتف / واتساب</span>
          <input value={form.phone} onChange={set("phone")} placeholder="09xxxxxxxx" inputMode="tel" dir="ltr" maxLength={30} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>كلمة مرور جديدة (اختياري)</span>
          <input value={form.password} onChange={set("password")} placeholder="اتركها فارغة للإبقاء عليها" type="password" autoComplete="new-password" maxLength={200} className={inputCls} />
        </label>
        <div className="rounded-[10px] border border-mk-line-soft bg-mk-track px-3 py-2">
          <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>البريد الإلكتروني</span>
          <p className="text-[13.5px] text-mk-muted" dir="ltr">{user?.email}</p>
        </div>
        {error && <span className="text-[13px] font-medium text-mk-danger">{error}</span>}
        {done && !error && <span className="text-[13px] font-medium text-emerald-600">تم حفظ التغييرات.</span>}
      </div>
    </MkModal>
  );
}
