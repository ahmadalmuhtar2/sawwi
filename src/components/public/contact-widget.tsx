"use client";

// Floating "راسلنا" (contact us) widget shown on a served public site. A visitor
// leaves their name + a way to reach them + a message; it POSTs to the public
// endpoint (/api/public/messages) and lands in the owner's dashboard inbox.
//
// Renders OUTSIDE the template scope (a sibling of <TemplateHost> on the public
// page) so its structure is consistent across every template — but its brand
// colour FOLLOWS the site: the button/header/submit use the site accent (passed
// in), with a readable foreground picked from the accent's luminance. No dashboard
// UI primitives — this ships to the public.

import * as React from "react";
import { MessageCircle, X, Send, CheckCircle2 } from "lucide-react";

type State = "idle" | "sending" | "sent";

const SLATE = "#0F172A";

/** Relative luminance of a #rrggbb color (WCAG), or null if not hex. */
function hexLum(hex: string): number | null {
  const m = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(m)) return null;
  const ch = [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(ch[0]) + 0.7152 * f(ch[1]) + 0.0722 * f(ch[2]);
}

export function ContactWidget({
  slug,
  businessName,
  defaultName,
  defaultContact,
  accent,
}: {
  slug: string;
  businessName?: string | null;
  /** Prefilled from the signed-in site-user (when the site has accounts). */
  defaultName?: string | null;
  defaultContact?: string | null;
  /** The site's brand accent (hex). The button/header/submit adopt it. */
  accent?: string | null;
}) {
  // Fall back to the neutral slate if no (usable) accent is provided.
  const brand = accent && hexLum(accent) != null ? accent : SLATE;
  const lum = hexLum(brand) ?? 0;
  const onBrand = lum > 0.62 ? "#0F172A" : "#FFFFFF"; // readable text on the accent
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
    <div dir="rtl" className="fixed bottom-4 left-4 z-9999 font-sans" style={{ ["--cw-accent" as string]: brand } as React.CSSProperties}>
      {open && (
        <div className="mb-3 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-black/10 bg-white text-slate-900 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3" style={{ background: brand, color: onBrand }}>
            <span className="text-sm font-bold">
              {state === "sent" ? "تم الإرسال" : "راسلنا"}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق"
              className="rounded-md p-1 opacity-80 transition hover:bg-black/10 hover:opacity-100"
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
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--cw-accent)] focus:ring-1 focus:ring-[var(--cw-accent)]"
              />
              <input
                value={form.contact}
                onChange={set("contact")}
                placeholder="رقم الهاتف أو واتساب *"
                inputMode="tel"
                maxLength={60}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--cw-accent)] focus:ring-1 focus:ring-[var(--cw-accent)]"
              />
              <textarea
                value={form.body}
                onChange={set("body")}
                placeholder="رسالتك…"
                rows={3}
                maxLength={1000}
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--cw-accent)] focus:ring-1 focus:ring-[var(--cw-accent)]"
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
                style={{ background: brand, color: onBrand }}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition hover:opacity-90 disabled:opacity-60"
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
        style={{ background: brand, color: onBrand }}
        className="flex size-14 items-center justify-center rounded-full shadow-xl ring-1 ring-black/10 transition hover:scale-105 active:scale-95"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
}
