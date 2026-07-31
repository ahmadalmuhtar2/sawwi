"use client";

// Floating "راسلنا" (contact us) widget shown on a served public site. A visitor
// leaves their name + a way to reach them + a message; it POSTs to the public
// endpoint (/api/public/messages) and lands in the owner's dashboard inbox.
//
// Deliberately self-contained: it renders OUTSIDE the template scope (a sibling
// of <TemplateHost> on the public page), so it never inherits a template's
// palette and looks consistent across every template. Neutral dark styling +
// its own RTL wrapper. No dashboard UI primitives — this ships to the public.

import * as React from "react";
import { MessageCircle, X, Send, CheckCircle2 } from "lucide-react";

type State = "idle" | "sending" | "sent";

export function ContactWidget({
  slug,
  businessName,
  defaultName,
  defaultContact,
}: {
  slug: string;
  businessName?: string | null;
  /** Prefilled from the signed-in site-user (when the site has accounts). */
  defaultName?: string | null;
  defaultContact?: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<State>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ name: defaultName ?? "", contact: defaultContact ?? "", body: "", company: "" });

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setError(null);
    if (!form.name.trim() || !form.body.trim()) {
      setError("الرجاء إدخال الاسم والرسالة");
      return;
    }
    if (!form.contact.trim()) {
      setError("الرجاء إدخال رقم الهاتف أو واتساب");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/public/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, ...form }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error?: { message?: string } }
        | null;
      if (res.ok && json?.ok) {
        setState("sent");
        setForm({ name: defaultName ?? "", contact: defaultContact ?? "", body: "", company: "" });
        return;
      }
      setError(json && !json.ok ? json.error?.message ?? "تعذّر الإرسال" : "تعذّر الإرسال");
      setState("idle");
    } catch {
      setError("تعذّر الاتصال، تحقق من الإنترنت وحاول مجددًا");
      setState("idle");
    }
  }

  return (
    <div dir="rtl" className="fixed bottom-4 left-4 z-9999 font-sans">
      {open && (
        <div className="mb-3 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-black/10 bg-white text-slate-900 shadow-2xl">
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
            <span className="text-sm font-bold">
              {state === "sent" ? "تم الإرسال" : "راسلنا"}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق"
              className="rounded-md p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          {state === "sent" ? (
            <div className="flex flex-col items-center gap-3 px-5 py-8 text-center">
              <CheckCircle2 className="size-10 text-emerald-500" />
              <p className="text-sm font-medium text-slate-700">
                وصلتنا رسالتك، سنعاود التواصل معك قريبًا.
              </p>
              <button
                type="button"
                onClick={() => setState("idle")}
                className="text-xs font-semibold text-slate-500 underline underline-offset-4 hover:text-slate-900"
              >
                إرسال رسالة أخرى
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-2.5 px-4 py-4">
              {businessName ? (
                <p className="text-[13px] leading-5 text-slate-500">
                  اترك رسالتك لـ <span className="font-semibold text-slate-700">{businessName}</span> وسنعاود التواصل معك.
                </p>
              ) : null}

              <input
                value={form.name}
                onChange={set("name")}
                placeholder="الاسم"
                autoComplete="name"
                maxLength={80}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
              <input
                value={form.contact}
                onChange={set("contact")}
                placeholder="رقم الهاتف أو واتساب *"
                inputMode="tel"
                maxLength={60}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
              <textarea
                value={form.body}
                onChange={set("body")}
                placeholder="رسالتك…"
                rows={3}
                maxLength={1000}
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />

              {/* Honeypot — off-screen, hidden from real users. Bots fill it. */}
              <input
                value={form.company}
                onChange={set("company")}
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />

              {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}

              <button
                type="submit"
                disabled={state === "sending"}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                <Send className="size-4" />
                {state === "sending" ? "جارٍ الإرسال…" : "إرسال"}
              </button>
            </form>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "إغلاق نموذج المراسلة" : "راسلنا"}
        aria-expanded={open}
        className="flex size-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl ring-1 ring-black/10 transition hover:scale-105 hover:bg-slate-800 active:scale-95"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
}
