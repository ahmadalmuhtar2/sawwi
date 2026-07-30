"use client";

// Reusable END-USER auth for published sites, shared by EVERY template with zero
// per-template code. `TemplateHost` wraps each template in <SiteAuthProvider>, so
// any template can call useSiteAuth() to read the current site-user / role or open
// the auth modal. The floating <SiteAuthWidget> (sign-in button ↔ account chip)
// and the sign-in/up modal both live here.
//
// Ships to the public: neutral (slate) styling, own RTL wrapper, no dashboard UI
// primitives, and a plain fetch (not api-client) so a 401 never bounces a visitor
// to the dashboard /login.

import * as React from "react";
import { UserRound, LogOut, X, Loader2 } from "lucide-react";

export type SiteRole = "manager" | "contributor" | "member";
export interface SiteUser {
  id: string;
  email: string;
  name: string | null;
  role: SiteRole;
}
export type RoleLabels = Record<SiteRole, string>;

interface AuthApi {
  /** Auth is turned on for this site (owner toggle). */
  enabled: boolean;
  user: SiteUser | null;
  labels: RoleLabels;
  loading: boolean;
  /** Open the sign-in / sign-up modal (templates can call this). */
  open: (mode?: "signin" | "signup") => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const DEFAULT_LABELS: RoleLabels = { manager: "مدير", contributor: "مساهم", member: "عضو" };
const Ctx = React.createContext<AuthApi | null>(null);

/** Read the site-auth context. Safe no-op default outside a provider. */
export function useSiteAuth(): AuthApi {
  return (
    React.useContext(Ctx) ?? {
      enabled: false,
      user: null,
      labels: DEFAULT_LABELS,
      loading: false,
      open: () => {},
      signOut: async () => {},
      refresh: async () => {},
    }
  );
}

export function SiteAuthProvider({
  enabled = false,
  labels,
  children,
}: {
  enabled?: boolean;
  labels?: Partial<RoleLabels>;
  children: React.ReactNode;
}) {
  const resolved: RoleLabels = { ...DEFAULT_LABELS, ...labels };
  const [user, setUser] = React.useState<SiteUser | null>(null);
  const [loading, setLoading] = React.useState(enabled);
  const [modal, setModal] = React.useState<null | "signin" | "signup">(null);

  const refresh = React.useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/public/site-auth/me");
      const json = await res.json().catch(() => null);
      setUser(json?.ok ? (json.data.user as SiteUser | null) : null);
    } catch {
      /* keep last state */
    }
    setLoading(false);
  }, [enabled]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is set after an await, not synchronously
    void refresh();
  }, [refresh]);

  const signOut = React.useCallback(async () => {
    try {
      await fetch("/api/public/site-auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  const api: AuthApi = {
    enabled,
    user,
    labels: resolved,
    loading,
    open: (m = "signin") => setModal(m),
    signOut,
    refresh,
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      {modal && (
        <AuthModal
          mode={modal}
          onClose={() => setModal(null)}
          onDone={(u) => {
            setUser(u);
            setModal(null);
          }}
        />
      )}
    </Ctx.Provider>
  );
}

/* ─────────────────────────── the floating widget ────────────────────── */

export function SiteAuthWidget() {
  const { enabled, user, labels, loading, open, signOut } = useSiteAuth();
  const [menu, setMenu] = React.useState(false);
  if (!enabled || loading) return null;

  return (
    <div dir="rtl" className="fixed bottom-4 right-4 z-9998 font-sans">
      {user ? (
        <div className="relative">
          <button
            onClick={() => setMenu((m) => !m)}
            className="flex items-center gap-2 rounded-full border border-black/10 bg-white py-1.5 pe-3 ps-1.5 text-slate-900 shadow-lg transition hover:bg-slate-50"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              {(user.name || user.email)[0]?.toUpperCase()}
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span className="max-w-[9rem] truncate text-[13px] font-semibold">{user.name || user.email}</span>
              <span className="text-[10.5px] text-slate-500">{labels[user.role]}</span>
            </span>
          </button>
          {menu && (
            <div className="absolute bottom-full end-0 mb-2 w-44 overflow-hidden rounded-xl border border-black/10 bg-white p-1 shadow-xl">
              <div className="px-3 py-2 text-[11px] text-slate-400">مسجّل الدخول كـ {labels[user.role]}</div>
              <button
                onClick={() => { setMenu(false); void signOut(); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="size-4" /> تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => open("signin")}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 py-2.5 pe-4 ps-3.5 text-sm font-bold text-white shadow-xl ring-1 ring-black/10 transition hover:bg-slate-800"
        >
          <UserRound className="size-4" />
          تسجيل الدخول
        </button>
      )}
    </div>
  );
}

/* ──────────────────────────────── modal ─────────────────────────────── */

function AuthModal({
  mode: initialMode,
  onClose,
  onDone,
}: {
  mode: "signin" | "signup";
  onClose: () => void;
  onDone: (u: SiteUser | null) => void;
}) {
  const [mode, setMode] = React.useState(initialMode);
  const [form, setForm] = React.useState({ name: "", email: "", password: "", company: "" });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (!form.email.trim() || !form.password) {
      setError("أدخل البريد وكلمة المرور");
      return;
    }
    setBusy(true);
    const url = mode === "signup" ? "/api/public/site-auth/register" : "/api/public/site-auth/login";
    const body =
      mode === "signup"
        ? { email: form.email, password: form.password, name: form.name, company: form.company }
        : { email: form.email, password: form.password };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        onDone((json.data.user as SiteUser | null) ?? null);
        return;
      }
      setError(json && !json.ok ? json.error?.message ?? "تعذّر إتمام الطلب" : "تعذّر إتمام الطلب");
    } catch {
      setError("تعذّر الاتصال، حاول مجددًا");
    }
    setBusy(false);
  }

  const inputCls =
    "h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-[14.5px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900";

  return (
    <div dir="rtl" onClick={onClose} className="fixed inset-0 z-9999 flex items-center justify-center bg-black/45 p-4 font-sans">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[380px] overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <span className="text-base font-bold">{mode === "signup" ? "إنشاء حساب" : "تسجيل الدخول"}</span>
          <button onClick={onClose} aria-label="إغلاق" className="rounded-md p-1 text-slate-400 transition hover:text-slate-900">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-2.5 px-5 py-4">
          {mode === "signup" && (
            <input value={form.name} onChange={set("name")} placeholder="الاسم (اختياري)" autoComplete="name" maxLength={80} className={inputCls} />
          )}
          <input value={form.email} onChange={set("email")} placeholder="البريد الإلكتروني" type="email" autoComplete="email" dir="ltr" maxLength={120} className={inputCls} />
          <input value={form.password} onChange={set("password")} placeholder="كلمة المرور" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} maxLength={200} className={inputCls} />
          {/* Honeypot */}
          <input value={form.company} onChange={set("company")} name="company" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />

          {error && <span className="text-xs font-medium text-red-600">{error}</span>}

          <button type="submit" disabled={busy} className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60">
            {busy && <Loader2 className="size-4 animate-spin" />}
            {mode === "signup" ? "إنشاء الحساب" : "دخول"}
          </button>

          <button
            type="button"
            onClick={() => { setError(null); setMode(mode === "signup" ? "signin" : "signup"); }}
            className="mt-1 text-center text-[13px] text-slate-500 transition hover:text-slate-900"
          >
            {mode === "signup" ? "لديك حساب؟ سجّل الدخول" : "ليس لديك حساب؟ أنشئ واحدًا"}
          </button>
        </form>
      </div>
    </div>
  );
}
