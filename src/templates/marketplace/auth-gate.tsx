"use client";

// The mandatory first screen of the served marketplace: a visitor must sign in or
// create an account before anything else. Signup offers a buyer / seller choice
// (→ member / contributor server-side). Posts straight to the shared site-auth
// endpoints (the register/login cookies are set there), then refreshes the auth
// context so the shell re-renders into the buyer or seller experience.

import * as React from "react";
import { useSiteAuth } from "@/components/public/site-auth";
import { DISPLAY, MONO, inputCls, btnPrimary, ThemeToggle, type MkTheme } from "./fields";

type Mode = "signin" | "signup";
type AccountType = "buyer" | "seller";

export function AuthGate({ shopName, tagline, theme, onToggleTheme, logoUrl }: { shopName: string; tagline?: string; theme: MkTheme; onToggleTheme: () => void; logoUrl?: string | null }) {
  const auth = useSiteAuth();
  const [mode, setMode] = React.useState<Mode>("signin");
  const [account, setAccount] = React.useState<AccountType>("buyer");
  const [form, setForm] = React.useState({ name: "", phone: "", email: "", password: "", company: "" });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (mode === "signup" && !form.name.trim()) { setError("أدخل الاسم"); return; }
    if (!form.email.trim() || !form.password) { setError("أدخل البريد وكلمة المرور"); return; }
    setError(null);
    setBusy(true);
    const url = mode === "signup" ? "/api/public/site-auth/register" : "/api/public/site-auth/login";
    const body = mode === "signup"
      ? { email: form.email, password: form.password, name: form.name, phone: form.phone, accountType: account, company: form.company }
      : { email: form.email, password: form.password };
    try {
      const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) { await auth.refresh(); return; } // shell re-renders by role
      setError(json && !json.ok ? json.error?.message ?? "تعذّر إتمام الطلب" : "تعذّر إتمام الطلب");
    } catch { setError("تعذّر الاتصال، حاول مجددًا"); }
    setBusy(false);
  }

  return (
    <div dir="rtl" className="relative grid min-h-dvh place-items-center bg-mk-bg px-4 py-10 text-mk-ink" style={{ fontFamily: "var(--font-ui)" }}>
      <div className="absolute end-4 top-4"><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div>
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center text-center">
          {logoUrl ? (
            // Transparent (no plate) so a bg-removed logo blends with the page.
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded logo URL
            <img src={logoUrl} alt={shopName} className="mb-2 h-20 w-auto max-w-64 object-contain" />
          ) : (
            <h1 className="text-[30px] font-bold leading-tight tracking-tight" style={{ fontFamily: DISPLAY }}>{shopName}</h1>
          )}
          {tagline && <p className="mt-1 text-[14px] text-mk-muted">{tagline}</p>}
        </div>

        <div className="overflow-hidden rounded-2xl border border-mk-line-soft bg-mk-surface shadow-mk">
          <div className="flex">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(null); }} className={"flex-1 py-3.5 text-[14.5px] font-semibold transition " + (mode === m ? "bg-mk-surface text-mk-ink" : "bg-mk-track text-mk-muted hover:text-mk-ink")}>
                {m === "signin" ? "تسجيل الدخول" : "حساب جديد"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3 p-5">
            {mode === "signup" && (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>نوع الحساب</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {([["buyer", "مشترٍ", "أتصفّح وأبحث عن سيارة أو عقار"], ["seller", "بائع", "أنشر إعلاناتي وأبيع"]] as const).map(([val, label, desc]) => (
                      <button type="button" key={val} onClick={() => setAccount(val)} className={"flex flex-col items-start gap-0.5 rounded-[12px] border p-3 text-start transition " + (account === val ? "border-mk-accent bg-mk-soft" : "border-mk-line bg-mk-surface hover:border-mk-accent/40")}>
                        <span className="text-[15px] font-semibold text-mk-ink">{label}</span>
                        <span className="text-[11.5px] leading-snug text-mk-muted">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <input value={form.name} onChange={set("name")} placeholder="الاسم" autoComplete="name" maxLength={80} className={inputCls} />
                <input value={form.phone} onChange={set("phone")} placeholder="رقم الهاتف / واتساب (اختياري)" autoComplete="tel" inputMode="tel" dir="ltr" maxLength={30} className={inputCls} />
              </>
            )}
            <input value={form.email} onChange={set("email")} placeholder="البريد الإلكتروني" type="email" autoComplete="email" dir="ltr" maxLength={120} className={inputCls} />
            <input value={form.password} onChange={set("password")} placeholder="كلمة المرور" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} maxLength={200} className={inputCls} />
            <input value={form.company} onChange={set("company")} name="company" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />

            {error && <span className="text-[13px] font-medium text-mk-danger">{error}</span>}

            <button type="submit" disabled={busy} className={btnPrimary + " mt-1"}>{busy ? "…" : mode === "signup" ? "إنشاء الحساب" : "دخول"}</button>
            <button type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); }} className="text-center text-[13px] text-mk-muted transition hover:text-mk-ink">
              {mode === "signup" ? "لديك حساب؟ سجّل الدخول" : "ليس لديك حساب؟ أنشئ واحدًا"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
