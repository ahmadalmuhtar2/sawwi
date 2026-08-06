"use client";

// قسّم الفاتورة — the splitter tool (the whole published site). Three steps:
//   ١ الإعداد   — how many people + names + default service/tax
//   ٢ الأصناف   — what was ordered + who shared each item
//   ٣ النتيجة   — each person's fair total (exact ⇄ cash), shareable
// All state is client-side (localStorage + a shareable URL hash). Colours: the
// three tokens (--sb-accent/ground/ink) are themeable; the warm cards/borders/
// amber + avatar palette are fixed house design. See ./engine for the math.

import * as React from "react";
import { ArrowRight, ArrowLeft, Plus, Minus, X, Users, Check, Share2 } from "lucide-react";
import { computeSplit, type LineItem } from "./engine";

/* ── type + numeral helpers ─────────────────────────────────────────────── */
const DISPLAY = "'El Messiri Variable','El Messiri',serif";
const UI = "'Readex Pro Variable','Readex Pro',system-ui,sans-serif";
const AR = "٠١٢٣٤٥٦٧٨٩";
const ar = (n: number | string) => String(n).replace(/\d/g, (d) => AR[+d]);
const fromAr = (s: string) => s.replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
const CUR: Record<string, string> = { SYP: "ل.س", SYP_NEW: "ل.س.ج", USD: "$", TRY: "₺", EUR: "€" };
const AVATARS = ["#3B4530", "#C4643C", "#7A6A3F", "#5B6E52", "#8A5A3B", "#4A5B63"];

// Two warm surface sets. The light set is the exact design (elevated white cards
// on cream); the dark set keeps the same warmth on a dark ground. We pick between
// them from the chosen GROUND's luminance so light stays pixel-perfect and dark
// works — since only accent/ground/ink are themeable tokens.
const LIGHT_SURF = { card: "#FFFFFF", border: "#E6DECE", track: "#D8CEBA", muted: "#6B7060", faint: "#A0A28F" };
const DARK_SURF = { card: "#21251C", border: "#343A2B", track: "#3E4634", muted: "#A7AF98", faint: "#727A64" };

/** Relative luminance of a #rrggbb color (WCAG), or null if not hex. */
function hexLum(hex: string): number | null {
  const m = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(m)) return null;
  const ch = [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(ch[0]) + 0.7152 * f(ch[1]) + 0.0722 * f(ch[2]);
}

let _uid = 0;
const uid = () => `x${Date.now().toString(36)}${(_uid++).toString(36)}`;

/* ── props ──────────────────────────────────────────────────────────────── */
interface Shop { name?: string; logo?: string; tagline?: string }
interface Props {
  shop?: Shop;
  charges?: { service?: number | string; tax?: number | string };
  round?: number | string;
  currency?: string;
  logoUrl?: string | null;
  slug?: string;
}

interface Person { id: string; name: string }
interface Item { id: string; name: string; price: number; qty: number; sharers: string[] | "all" }
type ChargeMode = "percent" | "amount";
interface Charge { mode: ChargeMode; value: number }

interface Persisted { diners: Person[]; items: Item[]; service: Charge; tax: Charge }

/** Coerce a stored/legacy charge (a bare number = old percent) into a Charge. */
function asCharge(v: unknown, fallback: number): Charge {
  if (typeof v === "number") return { mode: "percent", value: v };
  if (v && typeof v === "object") {
    const o = v as { mode?: string; value?: unknown };
    return { mode: o.mode === "amount" ? "amount" : "percent", value: num(o.value, fallback) };
  }
  return { mode: "percent", value: fallback };
}

const num = (v: unknown, d = 0) => {
  const n = Number(fromAr(String(v ?? "")).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : d;
};

/* Serialize the whole table into the URL hash so a result is shareable. */
function encodeState(s: Persisted): string {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(s)))); } catch { return ""; }
}
function decodeState(h: string): Persisted | null {
  try { return JSON.parse(decodeURIComponent(escape(atob(h)))) as Persisted; } catch { return null; }
}

export default function Component(props: Props) {
  const shop = props.shop ?? {};
  const sym = CUR[props.currency ?? "SYP"] ?? props.currency ?? "ل.س";
  const money = (n: number) => `${ar(Math.round(n).toLocaleString("en-US")).replace(/,/g, "٬")} ${sym}`;
  const storeKey = `sb:${props.slug ?? "demo"}`;

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [diners, setDiners] = React.useState<Person[]>(() =>
    ["أحمد", "لمى", "خالد", "رنا", "سامر", "عدنان"].map((name) => ({ id: uid(), name })),
  );
  const [items, setItems] = React.useState<Item[]>([]);
  const [service, setService] = React.useState<Charge>(() => asCharge(props.charges?.service, 10));
  const [tax, setTax] = React.useState<Charge>(() => asCharge(props.charges?.tax, 5));
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [dark, setDark] = React.useState(false);

  // Pick the light vs dark surface set from the chosen ground's luminance (read
  // once on mount — the host sets --sb-ground on an ancestor before paint).
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const L = hexLum(getComputedStyle(el).getPropertyValue("--sb-ground"));
    if (L != null && L < 0.4) setDark(true);
  }, []);

  // Hydrate from URL hash (a shared link) or localStorage, once.
  React.useEffect(() => {
    const fromHash = typeof location !== "undefined" && location.hash.length > 1 ? decodeState(location.hash.slice(1)) : null;
    const raw = fromHash ?? (() => { try { return JSON.parse(localStorage.getItem(storeKey) || "null") as Persisted; } catch { return null; } })();
    if (raw && Array.isArray(raw.diners) && raw.diners.length) {
      // Hydrating client-only state from storage / a shared link — legitimately an
      // effect (localStorage/location are unavailable during SSR).
      /* eslint-disable react-hooks/set-state-in-effect */
      setDiners(raw.diners); setItems(raw.items ?? []);
      setService(asCharge(raw.service, 10)); setTax(asCharge(raw.tax, 5));
      if (fromHash) setStep(3);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on change.
  React.useEffect(() => {
    try { localStorage.setItem(storeKey, JSON.stringify({ diners, items, service, tax } satisfies Persisted)); } catch { /* ignore */ }
  }, [diners, items, service, tax, storeKey]);

  // A charge → engine surcharge: percent uses `rate`, amount uses absolute `amount`.
  const toSurcharge = (key: string, label: string, c: Charge) =>
    c.mode === "percent" ? { key, label, rate: c.value / 100 } : { key, label, amount: c.value };

  const result = React.useMemo(
    () => computeSplit({
      diners, items: items as LineItem[],
      surcharges: [toSurcharge("service", "خدمة", service), toSurcharge("tax", "ضريبة", tax)],
      roundTo: 1, // whole pounds — shares add up honestly
    }),
    [diners, items, service, tax],
  );

  const surf = dark ? DARK_SURF : LIGHT_SURF;
  const rootStyle = {
    fontFamily: UI,
    ["--sb-card" as string]: surf.card,
    ["--sb-border" as string]: surf.border,
    ["--sb-track" as string]: surf.track,
    ["--sb-muted" as string]: surf.muted,
    ["--sb-faint" as string]: surf.faint,
    ["--sb-amber" as string]: "#E0A32E",
    // Accent for TEXT: the raw accent on light; a lightened copy on dark so it
    // stays legible on the dark cards (the raw accent is reserved for fills).
    ["--sb-accent-text" as string]: dark ? "color-mix(in oklch, var(--sb-accent,#3B4530) 58%, white)" : "var(--sb-accent,#3B4530)",
    background: "var(--sb-ground,#F7F2E9)",
    color: "var(--sb-ink,#22261C)",
  } as React.CSSProperties;

  const stepTitle = step === 1 ? "قسّم الفاتورة" : step === 2 ? "اختر الأصناف" : "النتيجة";

  return (
    <div ref={rootRef} dir="rtl" style={rootStyle} className="min-h-dvh w-full">
      <div className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col">
        {/* header */}
        <header className="sticky top-0 z-20 px-5 pb-3 pt-4" style={{ background: "var(--sb-ground,#F7F2E9)" }}>
          <div className="flex items-center">
            <span className="text-[12px]" style={{ color: "var(--sb-faint)" }}>{ar(step)} من ٣</span>
            <h1 className="flex-1 text-center text-[22px] font-semibold" style={{ fontFamily: DISPLAY }}>
              {stepTitle}
            </h1>
            <button
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
              className="grid size-8 place-items-center rounded-lg"
              style={{ color: "var(--sb-ink)", opacity: step > 1 ? 1 : 0, pointerEvents: step > 1 ? "auto" : "none" }}
              aria-label="رجوع"
            >
              <ArrowRight className="size-5" />
            </button>
          </div>
          {/* progress */}
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--sb-track)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${(step / 3) * 100}%`, background: "var(--sb-accent,#3B4530)" }} />
          </div>
        </header>

        <main className="flex-1 px-5 pb-6 pt-3">
          {step === 1 && (
            <>
              {/* owner brand strip — restaurant logo + name + welcome line. The
                  logo comes from Site.logoUrl on the published site, or the
                  content field shop.logo (what the wizard/editor sets, and the
                  only one available in the builder preview). */}
              <div className="flex flex-col items-center gap-2 pb-1 pt-2 text-center">
                {(props.logoUrl || shop.logo) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- storage URL
                  <img src={props.logoUrl || shop.logo} alt="" className="size-14 rounded-2xl object-cover" />
                ) : (
                  <span className="grid size-14 place-items-center rounded-2xl text-white" style={{ background: "var(--sb-accent,#3B4530)" }}>
                    <Users className="size-6" />
                  </span>
                )}
                {shop.name && <div className="text-[18px] font-semibold" style={{ fontFamily: DISPLAY }}>{shop.name}</div>}
                {shop.tagline && <div className="text-[12.5px]" style={{ color: "var(--sb-muted)" }}>{shop.tagline}</div>}
              </div>
              <Setup
                diners={diners} setDiners={setDiners}
                service={service} setService={setService}
                tax={tax} setTax={setTax}
                sym={sym}
              />
            </>
          )}
          {step === 2 && (
            <Items diners={diners} items={items} setItems={setItems} money={money} sym={sym} />
          )}
          {step === 3 && (
            <Result result={result} money={money} onShare={() => {
              const enc = encodeState({ diners, items, service, tax });
              const url = `${location.origin}${location.pathname}#${enc}`;
              navigator.clipboard?.writeText(url).catch(() => {});
              return url;
            }} />
          )}
        </main>

        {/* sticky next bar — `sticky` (not `fixed`) so it stays inside the
            template's own column: it can't cover the platform's سوّي footer or
            escape the builder preview to overlay the dashboard chrome. */}
        {step < 3 && (
          <div className="sticky bottom-0 z-20 border-t px-5 py-4" style={{ background: "var(--sb-card)", borderColor: "var(--sb-border)" }}>
            <button
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              disabled={step === 1 ? diners.length === 0 : items.length === 0}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[18px] font-semibold text-white transition disabled:opacity-40"
              style={{ background: "var(--sb-accent,#3B4530)", fontFamily: DISPLAY }}
            >
              {step === 1 ? "التالي — اختر الأصناف" : "التالي — النتيجة"}
              <ArrowLeft className="size-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════ Step 1 · Setup ════════════════════════════════ */
function Setup({
  diners, setDiners, service, setService, tax, setTax, sym,
}: {
  diners: Person[]; setDiners: React.Dispatch<React.SetStateAction<Person[]>>;
  service: Charge; setService: (c: Charge) => void; tax: Charge; setTax: (c: Charge) => void; sym: string;
}) {
  const [editing, setEditing] = React.useState<string | null>(null);
  const setCount = (next: number) => {
    const n = Math.max(1, Math.min(40, next));
    setDiners((cur) => {
      if (n === cur.length) return cur;
      if (n < cur.length) return cur.slice(0, n);
      const add = Array.from({ length: n - cur.length }, (_, i) => ({ id: uid(), name: `ضيف ${cur.length + i + 1}` }));
      return [...cur, ...add];
    });
  };

  return (
    <div>
      <h2 className="mt-3 text-center text-[26px] font-semibold" style={{ fontFamily: DISPLAY }}>كم شخص عالطاولة؟</h2>
      <p className="mt-1 text-center text-[13px]" style={{ color: "var(--sb-muted)" }}>منقسّم المازة عالكل، والأطباق كلٌّ لصاحبه.</p>

      {/* counter */}
      <div className="mt-5 flex items-center justify-between rounded-2xl border p-4" style={{ background: "var(--sb-card)", borderColor: "var(--sb-border)" }}>
        <button onClick={() => setCount(diners.length - 1)} className="grid size-11 place-items-center rounded-xl border text-[22px]" style={{ borderColor: "var(--sb-track)", background: "var(--sb-ground)" }} aria-label="أقل">
          <Minus className="size-5" />
        </button>
        <div className="text-center">
          <div className="text-[46px] font-bold leading-none" style={{ fontFamily: DISPLAY }}>{ar(diners.length)}</div>
          <div className="mt-1 text-[12px]" style={{ color: "var(--sb-faint)" }}>{peopleWord(diners.length)}</div>
        </div>
        <button onClick={() => setCount(diners.length + 1)} className="grid size-11 place-items-center rounded-xl text-[22px] text-white" style={{ background: "var(--sb-accent,#3B4530)" }} aria-label="أكثر">
          <Plus className="size-5" />
        </button>
      </div>

      {/* names */}
      <div className="mt-6 flex items-center justify-between">
        <span className="text-[11.5px]" style={{ color: "var(--sb-faint)" }}>اضغط لتعديل الاسم</span>
        <span className="text-[13px] font-medium" style={{ color: "var(--sb-muted)" }}>الأسماء</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-3">
        {diners.map((d, i) => (
          <div key={d.id} className="flex flex-col items-center gap-2 rounded-2xl border p-3" style={{ background: "var(--sb-card)", borderColor: "var(--sb-border)" }}>
            <span className="grid size-12 place-items-center rounded-full text-[20px] font-semibold text-white" style={{ background: AVATARS[i % AVATARS.length], fontFamily: DISPLAY }}>
              {d.name.trim().charAt(0) || "ض"}
            </span>
            {editing === d.id ? (
              <input
                autoFocus
                value={d.name}
                onChange={(e) => setDiners((cur) => cur.map((x) => (x.id === d.id ? { ...x, name: e.target.value } : x)))}
                onBlur={() => setEditing(null)}
                onKeyDown={(e) => e.key === "Enter" && setEditing(null)}
                className="w-full rounded-lg border bg-transparent px-1 py-0.5 text-center text-[15px] outline-none"
                style={{ borderColor: "var(--sb-accent,#3B4530)", fontFamily: DISPLAY }}
              />
            ) : (
              <button onClick={() => setEditing(d.id)} className="w-full truncate text-center text-[15px] font-medium" style={{ fontFamily: DISPLAY }}>
                {d.name || "—"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* charges */}
      <div className="mt-6 rounded-2xl border p-4" style={{ background: "var(--sb-card)", borderColor: "var(--sb-border)" }}>
        <div className="flex items-center justify-between">
          <span className="text-[11.5px]" style={{ color: "var(--sb-faint)" }}>محدّدة مسبقًا من المطعم</span>
          <span className="text-[14px] font-medium" style={{ color: "var(--sb-muted)" }}>الخدمة والضريبة</span>
        </div>
        <ChargeRow label="خدمة" charge={service} onChange={setService} sym={sym} />
        <ChargeRow label="ضريبة" charge={tax} onChange={setTax} sym={sym} />
        <p className="mt-3 text-[11.5px]" style={{ color: "var(--sb-amber)" }}>تنقسم بالتساوي على من طلب فقط</p>
      </div>
    </div>
  );
}

function ChargeRow({ label, charge, onChange, sym }: { label: string; charge: Charge; onChange: (c: Charge) => void; sym: string }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {/* percent ⇄ amount */}
        <div className="flex rounded-lg border p-0.5" style={{ borderColor: "var(--sb-track)" }}>
          {(["percent", "amount"] as ChargeMode[]).map((m) => (
            <button
              key={m} onClick={() => onChange({ ...charge, mode: m })}
              className="rounded-md px-2 py-1 text-[12px] font-medium transition"
              style={{ background: charge.mode === m ? "var(--sb-accent,#3B4530)" : "transparent", color: charge.mode === m ? "#fff" : "var(--sb-muted)" }}
            >
              {m === "percent" ? "٪" : sym}
            </button>
          ))}
        </div>
        {/* value */}
        <div className="flex items-center gap-1 rounded-lg border ps-2.5 pe-2 py-1.5" style={{ borderColor: "var(--sb-track)", background: "var(--sb-ground)" }}>
          <input
            inputMode="numeric" value={charge.value ? ar(charge.value) : ""}
            onChange={(e) => onChange({ ...charge, value: num(e.target.value) })}
            placeholder="٠"
            className="bg-transparent text-center text-[14px] font-semibold outline-none"
            style={{ color: "var(--sb-accent-text,#3B4530)", width: charge.mode === "percent" ? "2.5rem" : "5rem" }}
          />
          <span className="text-[11px]" style={{ color: "var(--sb-faint)" }}>{charge.mode === "percent" ? "٪" : sym}</span>
        </div>
      </div>
      <span className="text-[17px]" style={{ fontFamily: DISPLAY }}>{label}</span>
    </div>
  );
}

/* ════════════════════════ Step 2 · Items ════════════════════════════════ */
function Items({
  diners, items, setItems, money, sym,
}: {
  diners: Person[]; items: Item[]; setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  money: (n: number) => string; sym: string;
}) {
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [qty, setQty] = React.useState(1);
  const [sharers, setSharers] = React.useState<string[]>([]); // none selected by default
  const nameRef = React.useRef<HTMLInputElement>(null);

  const toggle = (id: string) => setSharers((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const isOn = (id: string) => sharers.includes(id);
  const allSelected = diners.length > 0 && sharers.length === diners.length;
  const toggleAll = () => setSharers(allSelected ? [] : diners.map((d) => d.id));

  const canAdd = name.trim().length > 0 && num(price) > 0 && sharers.length > 0;
  const add = () => {
    if (!canAdd) return;
    setItems((cur) => [...cur, { id: uid(), name: name.trim(), price: num(price), qty: Math.max(1, qty), sharers: allSelected ? "all" : sharers.slice() }]);
    setName(""); setPrice(""); setQty(1); setSharers([]);
    nameRef.current?.focus();
  };

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div>
      <h2 className="mt-3 text-center text-[24px] font-semibold" style={{ fontFamily: DISPLAY }}>شو انطلب عالطاولة؟</h2>
      <p className="mt-1 text-center text-[13px]" style={{ color: "var(--sb-muted)" }}>اكتب الصنف وسعره، وحدّد مين شاركه.</p>

      {/* add form */}
      <div className="mt-4 rounded-2xl border p-4" style={{ background: "var(--sb-card)", borderColor: "var(--sb-border)" }}>
        <input
          ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الصنف — مثلاً: حمّص"
          className="w-full rounded-xl border bg-transparent px-3 py-2.5 text-[15px] outline-none" style={{ borderColor: "var(--sb-track)", fontFamily: DISPLAY }}
        />
        <div className="mt-3 flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: "var(--sb-track)" }}>
            <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="السعر" className="w-full bg-transparent text-[15px] outline-none" />
            <span className="text-[12px]" style={{ color: "var(--sb-faint)" }}>{sym}</span>
          </div>
          <div className="flex items-center gap-1 rounded-xl border px-2 py-2" style={{ borderColor: "var(--sb-track)" }}>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-6 place-items-center"><Minus className="size-3.5" /></button>
            <span className="w-6 text-center text-[15px]">{ar(qty)}</span>
            <button onClick={() => setQty((q) => q + 1)} className="grid size-6 place-items-center"><Plus className="size-3.5" /></button>
          </div>
        </div>

        {/* who shared it — compact avatar grid (scales to a big table) */}
        <div className="mt-4">
          <div className="mb-2.5 flex items-center justify-between">
            <button
              onClick={toggleAll}
              className="rounded-full border px-3 py-1 text-[12px] font-medium transition"
              style={{
                borderColor: allSelected ? "transparent" : "var(--sb-border)",
                background: allSelected ? "var(--sb-accent,#3B4530)" : "transparent",
                color: allSelected ? "#fff" : "var(--sb-muted)",
              }}
            >
              {allSelected ? "إلغاء الكل" : "تحديد الكل"}
            </button>
            <span className="text-[12px]" style={{ color: "var(--sb-faint)" }}>
              مين شاركه؟{sharers.length ? ` · ${ar(sharers.length)}` : ""}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-x-1 gap-y-2.5">
            {diners.map((d, i) => {
              const on = isOn(d.id);
              return (
                <button key={d.id} onClick={() => toggle(d.id)} className="flex flex-col items-center gap-1 transition" style={{ opacity: on ? 1 : 0.5 }}>
                  <span className="relative grid size-10 place-items-center rounded-full text-[14px] font-semibold text-white" style={{ background: AVATARS[i % AVATARS.length], fontFamily: DISPLAY, boxShadow: on ? "0 0 0 2px var(--sb-card), 0 0 0 4px var(--sb-accent,#3B4530)" : "none" }}>
                    {d.name.charAt(0) || "ض"}
                    {on && (
                      <span className="absolute -bottom-0.5 -inset-e-0.5 grid size-4 place-items-center rounded-full text-white" style={{ background: "var(--sb-accent,#3B4530)", boxShadow: "0 0 0 2px var(--sb-card)" }}>
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <span className="w-full truncate text-center text-[10px]" style={{ color: "var(--sb-muted)" }}>{d.name || "—"}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={add} disabled={!canAdd} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white transition disabled:opacity-40" style={{ background: "var(--sb-accent,#3B4530)" }}>
          <Plus className="size-4" /> أضف الصنف
        </button>
      </div>

      {/* list */}
      {items.length > 0 && (
        <div className="mt-4 space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 rounded-2xl border p-3" style={{ background: "var(--sb-card)", borderColor: "var(--sb-border)" }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[15px] font-medium" style={{ fontFamily: DISPLAY }}>{it.name}</span>
                  {it.qty > 1 && <span className="text-[12px]" style={{ color: "var(--sb-faint)" }}>×{ar(it.qty)}</span>}
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {it.sharers === "all"
                    ? <span className="text-[11.5px]" style={{ color: "var(--sb-muted)" }}>الكل</span>
                    : diners.filter((d) => (it.sharers as string[]).includes(d.id)).map((d, i) => (
                        <span key={d.id} className="grid size-5 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ background: AVATARS[diners.indexOf(d) % AVATARS.length], marginInlineStart: i ? -6 : 0 }}>{d.name.charAt(0)}</span>
                      ))}
                </div>
              </div>
              <span className="shrink-0 text-[14px] font-semibold tabular-nums">{money(it.price * it.qty)}</span>
              <button onClick={() => setItems((cur) => cur.filter((x) => x.id !== it.id))} className="grid size-7 shrink-0 place-items-center rounded-lg" style={{ color: "var(--sb-faint)" }} aria-label="حذف"><X className="size-4" /></button>
            </div>
          ))}
          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-[16px] font-semibold tabular-nums">{money(subtotal)}</span>
            <span className="text-[13px]" style={{ color: "var(--sb-muted)" }}>المجموع قبل الخدمة</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════ Step 3 · Result ═══════════════════════════════ */
function Result({
  result, money, onShare,
}: {
  result: ReturnType<typeof computeSplit>;
  money: (n: number) => string; onShare: () => string;
}) {
  const [copied, setCopied] = React.useState(false);
  const share = () => { onShare(); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div>
      {/* per person */}
      <div className="mt-4 space-y-2.5">
        {result.perDiner.map((d, i) => (
          <div key={d.id} className="rounded-2xl border p-4" style={{ background: "var(--sb-card)", borderColor: "var(--sb-border)" }}>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full text-[17px] font-semibold text-white" style={{ background: AVATARS[i % AVATARS.length], fontFamily: DISPLAY }}>{d.name.charAt(0) || "ض"}</span>
              <span className="flex-1 text-[16px] font-semibold" style={{ fontFamily: DISPLAY }}>{d.name}</span>
              <span className="text-[20px] font-bold tabular-nums" style={{ color: "var(--sb-accent-text,#3B4530)", fontFamily: DISPLAY }}>{money(d.total)}</span>
            </div>
            <div className="mt-2.5 space-y-1 border-t pt-2.5" style={{ borderColor: "var(--sb-border)" }}>
              {d.lines.length === 0 ? (
                <div className="text-[12.5px]" style={{ color: "var(--sb-faint)" }}>لم يطلب شيئًا</div>
              ) : (
                d.lines.map((l, k) => (
                  <div key={k} className="flex items-center justify-between text-[12.5px]" style={{ color: "var(--sb-muted)" }}>
                    <span className="tabular-nums">{money(l.share)}</span>
                    <span>{l.name}</span>
                  </div>
                ))
              )}
              {d.surcharge > 0 && (
                <div className="flex items-center justify-between text-[12.5px]" style={{ color: "var(--sb-amber)" }}>
                  <span className="tabular-nums">{money(d.surcharge)}</span>
                  <span>خدمة وضريبة (بالتساوي)</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* totals */}
      <div className="mt-4 rounded-2xl border p-4 text-[13.5px]" style={{ background: "var(--sb-card)", borderColor: "var(--sb-border)" }}>
        <Row label="مجموع الأصناف" value={money(result.subtotal)} />
        <Row label="الخدمة والضريبة" value={money(result.surchargeTotal)} />
        <div className="mt-2 flex items-center justify-between border-t pt-2 text-[16px] font-bold" style={{ borderColor: "var(--sb-border)", fontFamily: DISPLAY }}>
          <span className="tabular-nums">{money(result.collected)}</span>
          <span>الإجمالي</span>
        </div>
      </div>

      <button onClick={share} className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-semibold text-white" style={{ background: "var(--sb-accent,#3B4530)", height: 52, fontFamily: DISPLAY }}>
        {copied ? <><Check className="size-5" /> تم نسخ الرابط</> : <><Share2 className="size-5" /> شارك النتيجة</>}
      </button>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between py-0.5" style={{ color: tone ?? "var(--sb-muted)" }}>
      <span className="tabular-nums">{value}</span>
      <span>{label}</span>
    </div>
  );
}

/* Arabic plural for the people count. */
function peopleWord(n: number) {
  if (n === 1) return "شخص";
  if (n === 2) return "شخصان";
  if (n >= 3 && n <= 10) return "أشخاص";
  return "شخصًا";
}
