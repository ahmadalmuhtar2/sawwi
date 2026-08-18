"use client";

// شغلة (Shaghleh) — a single-page placeholder for a Syrian services marketplace.
// Two jobs: recruit service PROVIDERS (the important one), and route CUSTOMERS to
// a human via WhatsApp. Arabic-only, full RTL. The brand accent is themeable and
// the template supports BOTH light and dark palettes (the surface set is derived
// from the chosen ground's luminance, so light stays pixel-perfect and dark works).
// Both forms POST to the site-scoped submissions endpoint; the customer form also
// offers a WhatsApp shortcut.
//
// Honesty rules (non-negotiable): zero fake testimonials/ratings/counters. The
// hero line «لسا عم نبلّش» is what makes the promise credible — do not remove it.

import * as React from "react";
import {
  Code, Palette, Languages, GraduationCap, Camera, Zap, Droplet, Hammer, Paintbrush,
  Sparkles, Snowflake, Truck, Briefcase, X, Check, ChevronDown, MessageCircle, Upload, Loader2,
} from "lucide-react";
import { useEdit } from "@/components/templates/inline-edit";
import { SyrianFlag } from "@/components/ui/syrian-flag";
import { MAX_IMAGE_BYTES, maxSizeLabel } from "@/shared/uploads";
import { SERVICE_CATEGORIES, SERVICE_GROUPS, SERVICE_CATEGORY_OTHER, MAX_SUBMISSION_IMAGES } from "@/shared/submissions";
import { SYRIAN_REGIONS, REGION_OTHER } from "@/shared/syria";

const HEAD = "'Readex Pro Variable','Readex Pro',sans-serif";
const BODY = "'Cairo Variable','Cairo',sans-serif";

interface Shop { name?: string; whatsapp?: string; tagline?: string }
interface Props { shop?: Shop; categories?: string[]; slug?: string; siteId?: string; logoUrl?: string | null; route?: string[] }

// The dedicated provider sign-up page lives at this path on the published site
// (e.g. sub.sawwi.online/join) — a clean URL to point ads/outside traffic at.
const APPLY_PATH = "join";

type IconType = React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>;
// Icons for the curated شغلة categories; any other configured category falls back
// to a neutral glyph (categories are site config, not a fixed list).
const ICON_BY_LABEL: Record<string, IconType> = {
  "برمجة وتطوير": Code,
  "تصميم غرافيك": Palette,
  "ترجمة": Languages,
  "تدريس خصوصي": GraduationCap,
  "تصوير": Camera,
  "كهرباء": Zap,
  "سباكة": Droplet,
  "نجارة": Hammer,
  "دهان وديكور": Paintbrush,
  "تنظيف منازل": Sparkles,
  "تكييف وتبريد": Snowflake,
  "نقل وتوصيل": Truck,
};

const STEPS = [
  { n: "١", t: "احكيلنا شو بتحتاج", b: "بترسلنا رسالة واتساب وبتشرح الشغلة بكم كلمة." },
  { n: "٢", t: "منبعتلك الشخص المناسب", b: "منختار من قائمتنا حدا شغله مجرَّب ومنوصلك فيه." },
  { n: "٣", t: "منتابع بعد الشغلة", b: "منسألك كيف كانت، ويلي شغله مو منيح منشيله من القائمة." },
];

const FAQ = [
  { q: "كم بتكلف الخدمة؟", a: "السعر بتتفق عليه مباشرة مع مزوّد الخدمة. نحنا ما مناخد عمولة على الشغل." },
  { q: "كيف بتتأكدوا من الحرفي؟", a: "منشوف شغله السابق ومنحكي معه قبل ما نضيفه، ومنتابع مع الزبون بعد كل شغلة." },
  { q: "وين بتشتغلوا؟", a: "عم نبلّش بدمشق وريفها، وعم نتوسع حسب الطلب." },
  { q: "بتاخدوا مصاري من المزوّد؟", a: "التسجيل مجاني حالياً." },
];

/** Relative luminance (WCAG) of a color string — accepts `rgb()/rgba()` (what the
 *  browser resolves computed colors to) or `#rrggbb`. Returns null if unparseable.
 *  Used to pick the light vs dark surface set from the chosen ground. */
function colorLum(color: string): number | null {
  const s = (color ?? "").trim();
  if (!s) return null;
  let r: number, g: number, b: number;
  const rgb = s.match(/^rgba?\(([^)]+)\)/i);
  if (rgb) {
    const parts = rgb[1].split(/[,\s/]+/).map(parseFloat).filter((n) => !Number.isNaN(n));
    if (parts.length < 3) return null;
    [r, g, b] = parts;
  } else {
    const h = s.replace(/^#/, "");
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const f = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

// Two surface sets. LIGHT is the exact shipped design (white cards on off-white),
// left as fixed hex. DARK is DERIVED from the chosen ground + ink via color-mix, so
// every dark palette (teal/blue/plum/forest/clay) stays cohesive — cards, borders
// and muted text take on that palette's own hue instead of a fixed teal-tinted set —
// and the secondary text sits at a comfortable, readable contrast (68% ink).
const LIGHT_SURF = { surface: "#F5F8F7", card: "#FFFFFF", border: "#E2E9E7", muted: "#657B7D", header: "rgba(255,255,255,.95)" };
const DARK_SURF = {
  surface: "color-mix(in oklch, var(--sh-ground) 93%, var(--sh-ink) 7%)",
  card: "color-mix(in oklch, var(--sh-ground) 87%, var(--sh-ink) 13%)",
  border: "color-mix(in oklch, var(--sh-ground) 74%, var(--sh-ink) 26%)",
  muted: "color-mix(in oklch, var(--sh-ground) 32%, var(--sh-ink) 68%)",
  header: "color-mix(in oklch, var(--sh-ground) 82%, transparent)",
};

/* brand-tile logo: white speech bubble + person silhouette on brand colour */
function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span className="inline-grid shrink-0 place-items-center rounded-[10px]" style={{ width: size, height: size, background: "var(--sh-brand)" }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="#fff" />
        <circle cx="12" cy="9" r="2.4" fill="var(--sh-brand)" />
        <path d="M7.5 15c.6-2 2.3-3.2 4.5-3.2s3.9 1.2 4.5 3.2" fill="var(--sh-brand)" />
      </svg>
    </span>
  );
}

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
const waLink = (num?: string, text?: string) => {
  const digits = (num ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};

export default function Shaghleh({ shop = {}, categories, siteId, logoUrl, route }: Props) {
  const editing = !!useEdit()?.editing;
  const name = shop.name || "شغلة";
  const whatsapp = shop.whatsapp || "";
  const cats = categories && categories.length ? categories : [...SERVICE_CATEGORIES];
  const [modal, setModal] = React.useState(false);
  const applying = route?.[0] === APPLY_PATH; // the dedicated /join sign-up page

  // Pick light vs dark from the ground token's luminance (host sets --sh-ground on
  // an ancestor before paint). Read once on mount.
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const detect = () => {
      const cs = getComputedStyle(el);
      // The root paints `background: var(--sh-ground)`, so its resolved
      // backgroundColor is the ground in rgb() — reliable regardless of how the
      // token was authored (hex / rgb / oklch).
      const L = colorLum(cs.backgroundColor) ?? colorLum(cs.getPropertyValue("--sh-ground"));
      if (L != null) setDark(L < 0.4);
    };
    detect();
    // Re-detect when the theme wrapper's inline token vars change — live palette
    // switches in the builder update the surfaces without a remount.
    const scope = el.closest<HTMLElement>("[data-tpl]");
    if (!scope) return;
    const obs = new MutationObserver(detect);
    obs.observe(scope, { attributes: true, attributeFilter: ["style"] });
    return () => obs.disconnect();
  }, []);

  const S = dark ? DARK_SURF : LIGHT_SURF;
  const root: React.CSSProperties = {
    fontFamily: BODY,
    fontSize: 17,
    lineHeight: 1.75,
    // The brand colour is the accent token; brand-dark/brand-tint derive from it so
    // a recolour stays cohesive. ink + ground come from the two other tokens; the
    // surface/card/border/muted set is chosen from the ground's tone (light/dark).
    ["--sh-brand" as string]: "var(--tpl-accent, #00A08A)",
    // Accent used as TEXT on tinted backgrounds — darkened on light for contrast on
    // white; brightened on dark (blended toward ink) so it reads clearly on the ground.
    ["--sh-brand-dark" as string]: dark
      ? "color-mix(in oklch, var(--tpl-accent, #00A08A) 56%, var(--sh-ink, #EAF2F0))"
      : "color-mix(in oklch, var(--tpl-accent, #00A08A) 72%, #001b16)",
    ["--sh-brand-tint" as string]: `color-mix(in oklch, var(--tpl-accent, #00A08A) ${dark ? 20 : 12}%, ${dark ? "var(--sh-ground, #0E1513)" : "#ffffff"})`,
    ["--sh-surface" as string]: S.surface,
    ["--sh-card" as string]: S.card,
    ["--sh-border" as string]: S.border,
    ["--sh-muted" as string]: S.muted,
    ["--sh-header" as string]: S.header,
    ["--sh-danger" as string]: dark ? "#FF8A80" : "#B4231D",
    color: "var(--sh-ink, #10201F)",
    background: "var(--sh-ground, #ffffff)",
  };

  return (
    <div ref={rootRef} dir="rtl" style={root} className="min-h-dvh overflow-x-clip">
      {applying ? (
        <ProviderApply name={name} logoUrl={logoUrl} siteId={siteId} editing={editing} />
      ) : (
      <>
      {/* 1 · HEADER */}
      <header className="sticky top-0 z-30 border-b backdrop-blur" style={{ borderColor: "var(--sh-border)", background: "var(--sh-header)" }}>
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5">
          <button onClick={() => scrollTo("top")} className="flex items-center gap-2.5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- storage URL
              <img src={logoUrl} alt="" className="size-9 rounded-[10px] object-cover" />
            ) : (
              <LogoMark />
            )}
            <span className="text-[22px] font-bold" style={{ fontFamily: HEAD }}>{name}</span>
          </button>
          <nav className="flex items-center gap-4">
            <button onClick={() => scrollTo("how")} className="hidden text-[15px] font-medium sm:inline" style={{ color: "var(--sh-muted)" }}>كيف بتشتغل</button>
            <button onClick={() => scrollTo("provider")} className="rounded-[12px] px-4 py-2.5 text-[14px] font-semibold text-white" style={{ background: "var(--sh-brand)" }}>سجّل كمزوّد خدمة</button>
          </nav>
        </div>
      </header>

      <span id="top" />

      {/* 2 · HERO */}
      <section className="px-5 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-[34px] font-bold leading-[1.3] md:text-[46px]" style={{ fontFamily: HEAD }}>كل خدمة بتلزمك، بمكان واحد</h1>
          <p className="mx-auto mt-5 max-w-2xl text-[18px]" style={{ color: "var(--sh-muted)" }}>
            منوصلك بحرفيين ومستقلين موثوقين بسوريا. منختارهم واحد واحد، ومنتابع معك بعد كل شغلة.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button onClick={() => setModal(true)} className="w-full min-h-[52px] rounded-[14px] px-7 text-[17px] font-semibold text-white sm:w-auto" style={{ background: "var(--sh-brand)" }}>بدي خدمة</button>
            <button onClick={() => scrollTo("provider")} className="w-full min-h-[52px] rounded-[14px] border-2 px-7 text-[17px] font-semibold sm:w-auto" style={{ borderColor: "var(--sh-brand)", color: "var(--sh-brand-dark)" }}>سجّل كمزوّد خدمة</button>
          </div>
          <p className="mt-5 text-[14px]" style={{ color: "var(--sh-muted)" }}>لسا عم نبلّش. سجّل هلق وكون من أول الأسماء بالقائمة.</p>
        </div>
      </section>

      {/* 3 · CATEGORIES */}
      <section className="px-5 py-14" style={{ background: "var(--sh-surface)" }}>
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {cats.map((label) => {
              const Icon = ICON_BY_LABEL[label] ?? Briefcase;
              return (
                <div key={label} className="flex items-center gap-3 rounded-3xl border p-5" style={{ borderColor: "var(--sh-border)", background: "var(--sh-card)" }}>
                  <Icon className="size-6 shrink-0" style={{ color: "var(--sh-brand)" }} strokeWidth={1.75} />
                  <span className="text-[16px] font-semibold">{label}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-center text-[15px]" style={{ color: "var(--sh-muted)" }}>وأي خدمة تانية بتخطر ببالك.</p>
        </div>
      </section>

      {/* 4 · HOW IT WORKS */}
      <section id="how" className="px-5 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full text-[24px] font-bold" style={{ background: "var(--sh-brand-tint)", color: "var(--sh-brand-dark)", fontFamily: HEAD }}>{s.n}</span>
              <h3 className="mt-4 text-[19px] font-bold" style={{ fontFamily: HEAD }}>{s.t}</h3>
              <p className="mt-2 text-[16px]" style={{ color: "var(--sh-muted)" }}>{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5 · PROVIDER SIGN UP — the most important block */}
      <section id="provider" className="px-5 py-16" style={{ background: "var(--sh-brand-tint)" }}>
        <div className="mx-auto w-full max-w-[680px] rounded-[32px] p-6 md:p-9" style={{ background: "var(--sh-card)", boxShadow: "0 20px 50px -30px rgba(0,112,95,.35)" }}>
          <h2 className="text-[26px] font-bold" style={{ fontFamily: HEAD }}>عندك مهنة أو خدمة بتقدمها؟</h2>
          <p className="mt-2 text-[16px]" style={{ color: "var(--sh-muted)" }}>سجّل بلاش. لما يجيك زبون منوصلك فيه مباشرة.</p>
          <SubmissionForm
            kind="PROVIDER" siteId={siteId} editing={editing} whatsapp={whatsapp}
            detailsLabel="رابط لشغلك" detailsOptional submitLabel="سجّلني" withPhotos photosLabel="صور من شغلك"
            note="منراجع كل طلب بالإيد. إذا انطبقت الشروط منتواصل معك عالواتساب."
          />
        </div>
      </section>

      {/* 7 · FAQ */}
      <section className="px-5 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-center text-[26px] font-bold" style={{ fontFamily: HEAD }}>أسئلة بتتكرر</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border p-0" style={{ borderColor: "var(--sh-border)", background: "var(--sh-card)" }}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" style={{ color: "var(--sh-muted)" }} />
                </summary>
                <p className="px-5 pb-5 text-[16px]" style={{ color: "var(--sh-muted)" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8 · FOOTER */}
      <footer className="px-5 py-12" style={{ background: "var(--sh-surface)" }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2.5">
            <LogoMark size={32} />
            <span className="text-[18px] font-bold" style={{ fontFamily: HEAD }}>{name}</span>
          </div>
          <p className="text-[14px]" style={{ color: "var(--sh-muted)" }} dir="ltr">شغلة · shaghleh.com</p>
          {waLink(whatsapp) && (
            <a href={waLink(whatsapp)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[15px] font-semibold" style={{ color: "var(--sh-brand-dark)" }}>
              <MessageCircle className="size-4" /> راسلنا على واتساب
            </a>
          )}
          <p className="text-[13px]" style={{ color: "var(--sh-muted)" }}>{[...SERVICE_CATEGORIES].join(" · ")}</p>
        </div>
      </footer>

      {/* MOBILE sticky CTA — sticky (not fixed) so it never covers the سوّي footer */}
      <div className="sticky bottom-0 z-30 border-t p-3 md:hidden" style={{ borderColor: "var(--sh-border)", background: "var(--sh-card)" }}>
        <button onClick={() => setModal(true)} className="min-h-[48px] w-full rounded-[14px] text-[17px] font-semibold text-white" style={{ background: "var(--sh-brand)" }}>بدي خدمة</button>
      </div>

      {/* 6 · CUSTOMER REQUEST modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-5" onClick={() => setModal(false)}>
          <div className="w-full max-w-[680px] overflow-y-auto rounded-t-[28px] p-6 sm:rounded-[28px] md:p-9" style={{ ...root, background: "var(--sh-card)", maxHeight: "92dvh" }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-start justify-between">
              <h2 className="text-[24px] font-bold" style={{ fontFamily: HEAD }}>شو الخدمة يلي بتلزمك؟</h2>
              <button onClick={() => setModal(false)} className="grid size-9 place-items-center rounded-full" style={{ color: "var(--sh-muted)" }} aria-label="إغلاق"><X className="size-5" /></button>
            </div>
            <SubmissionForm
              kind="CUSTOMER" siteId={siteId} editing={editing} whatsapp={whatsapp}
              detailsLabel="تفاصيل الشغلة" detailsTextarea detailsOptional submitLabel="ابعت الطلب"
              withPhotos photosLabel="صور"
            />
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

/* ───────────────────── the dedicated provider sign-up page ───────────────────── */
// A focused, full-page multi-step form (with a progress bar) for حرفيين — the URL
// to point ads / outside traffic at (/join). Reuses the same themed field controls
// and posts the same PROVIDER submission as the inline landing form.
const APPLY_STEPS = [
  { key: "who", title: "التعريف" },
  { key: "service", title: "خدمتك" },
  { key: "work", title: "شغلك" },
  { key: "review", title: "مراجعة" },
];

function ProviderApply({ name, logoUrl, siteId, editing }: {
  name: string;
  logoUrl?: string | null;
  siteId?: string;
  editing: boolean;
}) {
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState<FormData>({ name: "", phone: "", category: "", area: "", details: "", company: "", images: [] });
  const [state, setState] = React.useState<FormState>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [fields, setFields] = React.useState<Record<string, string>>({});
  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm((f) => ({ ...f, [k]: v }));
  const inert = !siteId || editing;

  const stepError = (): string | null => {
    if (step === 0) {
      if (form.name.trim().length < 2) return "اكتب اسمك";
      if (!/^\+9639\d{8}$/.test(form.phone)) return "اكتب رقم واتساب صحيح";
    }
    if (step === 1) {
      if (!form.category) return "اختر الخدمة يلي بتقدمها";
      if (!form.area) return "اختر المنطقة يلي بتغطيها";
    }
    return null;
  };

  const next = () => {
    const e = stepError();
    if (e) { setError(e); return; }
    setError(null);
    setStep((s) => Math.min(s + 1, APPLY_STEPS.length - 1));
  };
  const back = () => { setError(null); setStep((s) => Math.max(s - 1, 0)); };

  const submit = async () => {
    if (inert) return;
    setState("sending"); setError(null); setFields({});
    const utmSource = typeof location !== "undefined" ? new URLSearchParams(location.search).get("utm_source") || undefined : undefined;
    try {
      const res = await fetch(`/api/sites/${siteId}/submissions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "PROVIDER", ...form, utmSource }),
      });
      const json = (await res.json()) as { ok: boolean; error?: { message?: string; fields?: Record<string, string> } };
      if (json.ok) setState("done");
      else {
        setState("idle");
        setError(json.error?.message ?? "تعذّر الإرسال، جرّب كمان مرة");
        setFields(json.error?.fields ?? {});
        if (json.error?.fields?.name || json.error?.fields?.phone) setStep(0);
        else if (json.error?.fields?.category || json.error?.fields?.area) setStep(1);
      }
    } catch {
      setState("idle");
      setError("تعذّر الاتصال. تأكّد من الإنترنت وجرّب كمان مرة.");
    }
  };

  const progress = state === "done" ? 100 : ((step + 1) / APPLY_STEPS.length) * 100;

  return (
    <div className="mx-auto min-h-dvh max-w-[560px] px-5 py-8">
      {/* header + progress */}
      <div className="mb-6 flex items-center gap-2.5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- storage URL
          <img src={logoUrl} alt="" className="size-9 rounded-[10px] object-cover" />
        ) : (
          <LogoMark />
        )}
        <span className="text-[20px] font-bold" style={{ fontFamily: HEAD }}>{name}</span>
      </div>
      <div className="mb-2 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--sh-surface)" }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "var(--sh-brand)" }} />
      </div>
      {state !== "done" && (
        <p className="mb-6 text-[13px]" style={{ color: "var(--sh-muted)" }}>
          خطوة {"١٢٣٤"[step]} من ٤ — {APPLY_STEPS[step].title}
        </p>
      )}

      {state === "done" ? (
        <div className="mt-10 rounded-[24px] p-8 text-center" style={{ background: "var(--sh-brand-tint)" }}>
          <span className="mx-auto grid size-14 place-items-center rounded-full text-white" style={{ background: "var(--sh-brand)" }}><Check className="size-7" /></span>
          <h2 className="mt-4 text-[24px] font-bold" style={{ fontFamily: HEAD }}>وصلنا طلبك</h2>
          <p className="mt-2 text-[16px]" style={{ color: "var(--sh-muted)" }}>منراجعه بالإيد ومنتواصل معك عالواتساب إذا انطبقت الشروط.</p>
          <a href="./" className="mt-6 inline-block text-[15px] font-semibold" style={{ color: "var(--sh-brand-dark)" }}>رجوع للصفحة الرئيسية</a>
        </div>
      ) : (
        <div className="space-y-4">
          {step === 0 && (
            <>
              <h1 className="text-[26px] font-bold" style={{ fontFamily: HEAD }}>سجّل كمزوّد خدمة</h1>
              <p className="text-[15px]" style={{ color: "var(--sh-muted)" }}>عبّي المعلومات بأربع خطوات سريعة. التسجيل مجاني.</p>
              <Field label="الاسم" error={fields.name}>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="شو اسمك؟" />
              </Field>
              <Field label="رقم الواتساب" error={fields.phone}>
                <PhoneField value={form.phone} onChange={(v) => set("phone", v)} />
              </Field>
            </>
          )}
          {step === 1 && (
            <>
              <Field label="الخدمة يلي بتقدمها" error={fields.category}>
                <Picker value={form.category} onChange={(v) => set("category", v)} placeholder="اختر خدمة" groups={[...SERVICE_GROUPS, { items: [SERVICE_CATEGORY_OTHER] }]} />
              </Field>
              <Field label="المنطقة يلي بتغطيها" error={fields.area}>
                <Picker value={form.area} onChange={(v) => set("area", v)} placeholder="اختر المنطقة" groups={[{ items: [...SYRIAN_REGIONS, REGION_OTHER] }]} />
              </Field>
            </>
          )}
          {step === 2 && (
            <>
              <Field label="رابط لشغلك" optional>
                <input value={form.details} onChange={(e) => set("details", e.target.value)} className={inputCls} placeholder="رابط أو وصف قصير لشغلك" />
              </Field>
              <Field label="صور من شغلك" optional>
                <PhotoField siteId={siteId} inert={inert} images={form.images} onChange={(v) => set("images", v)} onError={setError} />
              </Field>
            </>
          )}
          {step === 3 && (
            <div className="space-y-2 rounded-2xl border p-5" style={{ borderColor: "var(--sh-border)", background: "var(--sh-card)" }}>
              <h2 className="mb-2 text-[18px] font-bold" style={{ fontFamily: HEAD }}>راجع معلوماتك</h2>
              <ReviewRow label="الاسم" value={form.name} />
              <ReviewRow label="واتساب" value={form.phone} ltr />
              <ReviewRow label="الخدمة" value={form.category} />
              <ReviewRow label="المنطقة" value={form.area} />
              {form.details && <ReviewRow label="رابط/وصف" value={form.details} />}
              {form.images.length > 0 && <ReviewRow label="الصور" value={`${form.images.length}`} />}
            </div>
          )}

          {/* honeypot */}
          <input tabIndex={-1} autoComplete="off" aria-hidden value={form.company} onChange={(e) => set("company", e.target.value)} className="absolute -left-[9999px] size-0" />

          {error && <p className="text-[14px] font-medium" style={{ color: "var(--sh-danger)" }}>{error}</p>}
          {inert && <p className="text-[13px]" style={{ color: "var(--sh-muted)" }}>{editing ? "هذا نموذج — التسجيل يعمل على الموقع المنشور." : "المعاينة فقط."}</p>}

          <div className="flex items-center gap-3 pt-2">
            {step > 0 && (
              <button type="button" onClick={back} className="min-h-[52px] rounded-[14px] border-2 px-6 text-[16px] font-semibold" style={{ borderColor: "var(--sh-border)", color: "var(--sh-ink)" }}>رجوع</button>
            )}
            {step < APPLY_STEPS.length - 1 ? (
              <button type="button" onClick={next} className="min-h-[52px] flex-1 rounded-[14px] text-[17px] font-semibold text-white" style={{ background: "var(--sh-brand)" }}>التالي</button>
            ) : (
              <button type="button" onClick={submit} disabled={state === "sending" || inert} className="min-h-[52px] flex-1 rounded-[14px] text-[17px] font-semibold text-white disabled:opacity-60" style={{ background: "var(--sh-brand)" }}>
                {state === "sending" ? "عم نبعت…" : "سجّلني"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewRow({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 last:border-0" style={{ borderColor: "var(--sh-border)" }}>
      <span className="text-[13px]" style={{ color: "var(--sh-muted)" }}>{label}</span>
      <span className="text-[15px] font-medium" dir={ltr ? "ltr" : undefined}>{value || "—"}</span>
    </div>
  );
}

/* ───────────────────────── the shared form ───────────────────────── */
type FormState = "idle" | "sending" | "done";
interface FormData { name: string; phone: string; category: string; area: string; details: string; company: string; images: string[] }

function SubmissionForm({
  kind, siteId, editing, whatsapp, detailsLabel, detailsTextarea, detailsOptional, submitLabel, note, withPhotos, photosLabel,
}: {
  kind: "PROVIDER" | "CUSTOMER";
  siteId?: string;
  editing: boolean;
  whatsapp: string;
  detailsLabel: string;
  detailsTextarea?: boolean;
  detailsOptional?: boolean;
  submitLabel: string;
  note?: string;
  withPhotos?: boolean;
  photosLabel?: string;
}) {
  const [form, setForm] = React.useState<FormData>({ name: "", phone: "", category: "", area: "", details: "", company: "", images: [] });
  const [state, setState] = React.useState<FormState>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [fields, setFields] = React.useState<Record<string, string>>({});
  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm((f) => ({ ...f, [k]: v }));

  const inert = !siteId || editing; // gallery/builder → preview only, never POST
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inert) return;
    setState("sending"); setError(null); setFields({});
    const utmSource = typeof location !== "undefined" ? new URLSearchParams(location.search).get("utm_source") || undefined : undefined;
    try {
      const res = await fetch(`/api/sites/${siteId}/submissions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, ...form, utmSource }),
      });
      const json = (await res.json()) as { ok: boolean; error?: { message?: string; fields?: Record<string, string> } };
      if (json.ok) setState("done");
      else {
        setState("idle");
        setError(json.error?.message ?? "تعذّر الإرسال، جرّب كمان مرة");
        setFields(json.error?.fields ?? {});
      }
    } catch {
      setState("idle");
      setError("تعذّل الاتصال. تأكّد من الإنترنت وجرّب كمان مرة.");
    }
  };

  if (state === "done") {
    const wa = waLink(
      whatsapp,
      kind === "CUSTOMER" ? `مرحبا، عبّيت طلب خدمة على شغلة: ${form.category} — ${form.area}` : undefined,
    );
    return (
      <div className="mt-6 rounded-2xl p-5 text-center" style={{ background: "var(--sh-brand-tint)" }}>
        <span className="mx-auto grid size-12 place-items-center rounded-full text-white" style={{ background: "var(--sh-brand)" }}><Check className="size-6" /></span>
        <p className="mt-3 text-[18px] font-bold" style={{ fontFamily: HEAD }}>وصلنا طلبك</p>
        <p className="mt-1 text-[15px]" style={{ color: "var(--sh-muted)" }}>
          {kind === "PROVIDER" ? "منراجعه بالإيد ومنتواصل معك عالواتساب إذا انطبقت الشروط." : "منتواصل معك قريب. إذا مستعجل، ابعتلنا عالواتساب هلق."}
        </p>
        {kind === "CUSTOMER" && wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-[14px] px-6 py-3 text-[16px] font-semibold text-white" style={{ background: "var(--sh-brand)" }}>
            <MessageCircle className="size-5" /> احكينا عالواتساب
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      <Field label="الاسم" error={fields.name}>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="شو اسمك؟" />
      </Field>
      <Field label="رقم الواتساب" error={fields.phone}>
        <PhoneField value={form.phone} onChange={(v) => set("phone", v)} />
      </Field>
      <Field label={kind === "PROVIDER" ? "الخدمة يلي بتقدمها" : "نوع الخدمة"} error={fields.category}>
        <Picker
          value={form.category}
          onChange={(v) => set("category", v)}
          placeholder="اختر خدمة"
          groups={[...SERVICE_GROUPS, { items: [SERVICE_CATEGORY_OTHER] }]}
        />
      </Field>
      <Field label={kind === "PROVIDER" ? "المنطقة يلي بتغطيها" : "المنطقة"} error={fields.area}>
        <Picker
          value={form.area}
          onChange={(v) => set("area", v)}
          placeholder="اختر المنطقة"
          groups={[{ items: [...SYRIAN_REGIONS, REGION_OTHER] }]}
        />
      </Field>
      <Field label={detailsLabel} optional={detailsOptional} error={fields.details}>
        {detailsTextarea ? (
          <textarea value={form.details} onChange={(e) => set("details", e.target.value)} rows={3} className={inputCls} placeholder="اكتب تفاصيل الشغلة…" />
        ) : (
          <input value={form.details} onChange={(e) => set("details", e.target.value)} className={inputCls} placeholder="رابط أو وصف قصير لشغلك" />
        )}
      </Field>

      {withPhotos && (
        <Field label={photosLabel ?? "صور"} optional error={fields.images}>
          <PhotoField siteId={siteId} inert={inert} images={form.images} onChange={(v) => set("images", v)} onError={setError} />
        </Field>
      )}

      {/* honeypot — hidden from real users */}
      <input tabIndex={-1} autoComplete="off" aria-hidden value={form.company} onChange={(e) => set("company", e.target.value)} className="absolute -left-[9999px] size-0" />

      {error && <p className="text-[14px] font-medium" style={{ color: "var(--sh-danger)" }}>{error}</p>}
      {inert && <p className="text-[13px]" style={{ color: "var(--sh-muted)" }}>{editing ? "هذا نموذج — التسجيل يعمل على الموقع المنشور." : "المعاينة فقط."}</p>}

      <button type="submit" disabled={state === "sending" || inert} className="min-h-[52px] w-full rounded-[14px] text-[17px] font-semibold text-white disabled:opacity-60" style={{ background: "var(--sh-brand)" }}>
        {state === "sending" ? "عم نبعت…" : submitLabel}
      </button>
      {note && <p className="text-center text-[13px]" style={{ color: "var(--sh-muted)" }}>{note}</p>}
    </form>
  );
}

const inputCls =
  "w-full rounded-[12px] border bg-[var(--sh-card)] px-4 py-3 text-[16px] outline-none focus:border-[var(--sh-brand)] [border-color:var(--sh-border)] [color:var(--sh-ink)] placeholder:[color:var(--sh-muted)]";

/** Syria-locked WhatsApp field — a fixed «🇸🇾 +963» prefix + the national number.
 *  Emits the full E.164 string ("+9639XXXXXXXX"); server re-validates. */
function PhoneField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const national = value.replace(/^\+963/, "").replace(/\D/g, "");
  const set = (raw: string) => {
    const digits = raw.replace(/\D/g, "").replace(/^0+/, "").slice(0, 9);
    onChange(digits ? `+963${digits}` : "");
  };
  return (
    <div dir="ltr" className="flex items-stretch rounded-[12px] border [border-color:var(--sh-border)] focus-within:border-[var(--sh-brand)]" style={{ background: "var(--sh-card)" }}>
      <span className="flex items-center gap-1.5 border-e px-3 text-[15px] [border-color:var(--sh-border)]" style={{ color: "var(--sh-muted)" }}>
        <SyrianFlag /> +963
      </span>
      <input
        value={national}
        onChange={(e) => set(e.target.value)}
        inputMode="tel"
        placeholder="9XX XXX XXX"
        className="min-w-0 flex-1 rounded-e-[12px] bg-transparent px-3 py-3 text-[16px] outline-none [color:var(--sh-ink)] placeholder:[color:var(--sh-muted)]"
      />
    </div>
  );
}

/** A custom, theme-matched dropdown (replaces a native <select>). The option list
 *  is capped at a fraction of the viewport and scrolls internally, so a very long
 *  catalogue never runs off the screen; it flips above the field when there isn't
 *  room below. Grouped headers keep the big service list navigable. */
function Picker({ value, onChange, placeholder, groups }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  groups: { label?: string; items: readonly string[] }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [up, setUp] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const below = window.innerHeight - r.bottom;
      // Flip up only when there's clearly more room above than below.
      setUp(below < 300 && r.top > below);
    }
    setOpen((o) => !o);
  };

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={`${inputCls} flex items-center justify-between gap-2 text-start`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate" style={{ color: value ? "var(--sh-ink)" : "var(--sh-muted)" }}>
          {value || placeholder}
        </span>
        <ChevronDown className={`size-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--sh-muted)" }} />
      </button>
      {open && (
        <div
          role="listbox"
          className={`absolute z-40 max-h-[min(55vh,320px)] w-full overflow-y-auto overscroll-contain rounded-[12px] border p-1 shadow-xl ${up ? "bottom-full mb-1.5" : "top-full mt-1.5"}`}
          style={{ background: "var(--sh-card)", borderColor: "var(--sh-border)" }}
        >
          {groups.map((g, gi) => (
            <div key={g.label ?? `g${gi}`}>
              {g.label && <div className="px-2.5 pt-2 pb-1 text-[12px] font-bold" style={{ color: "var(--sh-muted)" }}>{g.label}</div>}
              {g.items.map((opt) => {
                const active = opt === value;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => { onChange(opt); setOpen(false); }}
                    className={`flex w-full items-center justify-between gap-2 rounded-[8px] px-2.5 py-2 text-start text-[15px] transition-colors ${active ? "" : "hover:[background-color:var(--sh-brand-tint)]"}`}
                    style={active ? { background: "var(--sh-brand-tint)", color: "var(--sh-brand-dark)" } : { color: "var(--sh-ink)" }}
                  >
                    <span className="min-w-0 truncate">{opt}</span>
                    {active && <Check className="size-4 shrink-0" style={{ color: "var(--sh-brand-dark)" }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Multi-image uploader (≤2MB each, ≤MAX_SUBMISSION_IMAGES) POSTing to the public,
 *  site-scoped submissions upload endpoint. Inert in the builder/gallery preview. */
function PhotoField({ siteId, inert, images, onChange, onError }: {
  siteId?: string;
  inert: boolean;
  images: string[];
  onChange: (v: string[]) => void;
  onError: (msg: string | null) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const atMax = images.length >= MAX_SUBMISSION_IMAGES;

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length || !siteId || inert) return;
    onError(null);
    setBusy(true);
    const next = [...images];
    for (const file of files) {
      if (next.length >= MAX_SUBMISSION_IMAGES) break;
      if (file.size > MAX_IMAGE_BYTES) { onError(`أقصى حجم للصورة ${maxSizeLabel(MAX_IMAGE_BYTES)}`); continue; }
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`/api/sites/${siteId}/submissions/uploads`, { method: "POST", body: fd });
        const json = (await res.json()) as { ok: boolean; data?: { url?: string }; error?: { message?: string } };
        if (json.ok && json.data?.url) next.push(json.data.url);
        else onError(json.error?.message ?? "تعذّر رفع الصورة");
      } catch {
        onError("تعذّر رفع الصورة");
      }
    }
    onChange(next);
    setBusy(false);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {images.map((url, i) => (
          <div key={url} className="relative size-20 overflow-hidden rounded-[12px] border" style={{ borderColor: "var(--sh-border)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- storage URL */}
            <img src={url} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              className="absolute end-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white"
              aria-label="حذف الصورة"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {!atMax && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy || inert}
            className="grid size-20 place-items-center rounded-[12px] border-2 border-dashed disabled:opacity-60"
            style={{ borderColor: "var(--sh-border)", color: "var(--sh-muted)" }}
            aria-label="أضف صورة"
          >
            {busy ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={pick} />
      <p className="mt-1.5 text-[12.5px]" style={{ color: "var(--sh-muted)" }}>JPG أو PNG أو WEBP — أقصى حجم {maxSizeLabel(MAX_IMAGE_BYTES)} للصورة.</p>
    </div>
  );
}

function Field({ label, optional, error, children }: { label: string; optional?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-medium">
        {label}
        {optional && <span className="text-[13px] font-normal" style={{ color: "var(--sh-muted)" }}> (اختياري)</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[13px] font-medium" style={{ color: "var(--sh-danger)" }}>{error}</span>}
    </label>
  );
}
