"use client";

// Portfolio (universal) — a scroll-driven one-page portfolio that works for any
// profession. Ported from the handoff Design Component into Sawwi's system:
//   · BILINGUAL — `lang` ("ar" | "en") flips direction + the font pairing
//     (Arabic: El Messiri / Readex · English: Newsreader / Hanken). Chosen in the
//     onboarding wizard; every string is editable content.
//   · The look is driven by 3 themeable tokens (accent/ground/ink); every other
//     surface/line/text tone is DERIVED in the [data-tpl="portfolio"] cascade,
//     read here as bg-[var(--pf-surface)] etc., so light AND dark palettes work.
//   · Signature motion (letter-scatter name, scrubbing marquee, sticky stacking
//     deck, photo parallax, velocity tilt, ghost numerals, reveals + counting
//     facts) runs in ONE rAF loop that writes transforms straight to the DOM.
//     All of it is disabled under prefers-reduced-motion and degrades to a fully
//     visible static page (fail-safe reveals) for exports/print/SSR.
//
// Renders identically in the builder (inline editing), the draft preview, and the
// published site — the inline primitives are inert without an EditProvider.

import * as React from "react";
import { Mail, Phone, MessageCircle, Camera, ArrowDown, X, Plus } from "lucide-react";
import {
  EditableText, EditableImage, useEdit, useEditList, useEditStrings, toArabicDigits,
} from "@/components/templates/inline-edit";

/* Brand glyphs (lucide dropped its brand icons) — filled marks in currentColor. */
type IconProps = { className?: string };
function IgIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className} aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5.5" /><circle cx="12" cy="12" r="4" />
      <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function InIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0zM.4 8h4.2v13H.4V8zm7 0h4v1.8h.06c.56-1 1.9-2.05 3.94-2.05 4.2 0 4.98 2.6 4.98 6V21h-4.2v-5.9c0-1.4-.03-3.2-2-3.2-2 0-2.3 1.5-2.3 3.1V21h-4.2V8z" />
    </svg>
  );
}
function GhIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.2 1.18a11 11 0 0 1 5.82 0c2.22-1.5 3.2-1.18 3.2-1.18.63 1.59.23 2.76.11 3.05.75.81 1.2 1.84 1.2 3.1 0 4.43-2.7 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" />
    </svg>
  );
}

/* ───────────────────────────── content shape ───────────────────────────── */

interface Socials { instagram?: string; linkedin?: string; github?: string }
interface Shop {
  name: string; brand?: string; role?: string; kicker?: string;
  headline?: string; pitch?: string; status?: string; logo?: string;
  email?: string; whatsapp?: string; phone?: string;
  heroPhoto?: string; aboutPhoto?: string; heroCaption?: string;
  socials?: Socials;
}
interface Work { title: string; meta?: string; outcome?: string; desc?: string; tags?: string[]; photo?: string }
interface Fact { value: number; suffix?: string; label: string }
interface Service { title: string; body?: string }
interface Milestone { year: string; role: string; org?: string; note?: string }

export interface PortfolioProps {
  lang?: "ar" | "en";
  shop: Shop;
  marquee: string[];
  works: Work[];
  about: { heading?: string; body?: string };
  facts: Fact[];
  services: Service[];
  timeline: Milestone[];
  quote: { text?: string; by?: string };
  contact: { heading?: string; body?: string; note?: string };
  footer?: string;
  currency?: string;
}

/* ───────────────────────── frozen bilingual chrome ──────────────────────── */

const NAV_IDS = ["work", "about", "services", "path", "contact"] as const;
const L = {
  ar: {
    nav: { work: "الأعمال", about: "نبذة", services: "الخدمات", path: "المسار", contact: "تواصل" },
    workSec: "القسم ٠١ — أعمال مختارة", aboutSec: "القسم ٠٢ — نبذة",
    servicesSec: "القسم ٠٣ — ما أقدّمه", pathSec: "القسم ٠٤ — المسار", contactSec: "تواصل",
    result: "النتيجة", scroll: "مرّر", case: "حالة", stacks: "تتراكم أثناء التمرير",
    workCta: "شاهد الأعمال", aboutCta: "من أنا", contactCta: "تواصل معي",
    changePhoto: "صورة", addTag: "＋ وسم", addWork: "＋ أضف عملًا", addSkill: "＋ مهارة",
    addService: "＋ خدمة", addRow: "＋ صف", cases: "أعمال",
  },
  en: {
    nav: { work: "Work", about: "About", services: "Services", path: "Path", contact: "Contact" },
    workSec: "Sec.01 — Selected work", aboutSec: "Sec.02 — About",
    servicesSec: "Sec.03 — What I do", pathSec: "Sec.04 — The path", contactSec: "Contact",
    result: "Result", scroll: "Scroll", case: "CASE", stacks: "they stack as you scroll",
    workCta: "See the work", aboutCta: "Who I am", contactCta: "Get in touch",
    changePhoto: "Photo", addTag: "＋ tag", addWork: "＋ Add a project", addSkill: "＋ skill",
    addService: "＋ service", addRow: "＋ row", cases: "cases",
  },
} as const;

/* ───────────────────────────── small helpers ───────────────────────────── */

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

/** Find the nearest scrolling ancestor (builder = the dashboard <main>; published
 *  = the document; builder mobile = the iframe document). */
function findScroller(el: HTMLElement, win: Window): HTMLElement {
  let n: HTMLElement | null = el.parentElement;
  while (n) {
    const oy = win.getComputedStyle(n).overflowY;
    if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight + 4) return n;
    n = n.parentElement;
  }
  return (el.ownerDocument.scrollingElement as HTMLElement) || el.ownerDocument.documentElement;
}

/** Digits: Arabic-Indic in the Arabic build, Latin in the English build. */
function useDigits(lang: "ar" | "en") {
  return React.useCallback((v: string | number) => (lang === "ar" ? toArabicDigits(String(v)) : String(v)), [lang]);
}

function waLink(phone: string) {
  let d = phone.replace(/[^0-9]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "49" + d.slice(1); // owner is DE-based; local 0 → +49
  return `https://wa.me/${d}`;
}

function Photo({ src, alt, label }: { src?: string; alt: string; label?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL
    return <img src={src} alt={alt} className="absolute inset-0 size-full object-cover" />;
  }
  return (
    <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--pf-faint)]">
      <Camera className="size-6 opacity-70" />
      {label && <span className="px-4 text-center text-[12px]" style={{ fontFamily: "var(--pf-mono)" }}>{label}</span>}
    </span>
  );
}

/* ═══════════════════════════════ component ══════════════════════════════ */

export default function Portfolio(props: PortfolioProps) {
  const lang: "ar" | "en" = props.lang === "en" ? "en" : "ar";
  const dir = lang === "ar" ? "rtl" : "ltr";
  const t = L[lang];
  const dig = useDigits(lang);
  const edit = useEdit();
  const editing = Boolean(edit?.editing);

  const shop = props.shop;
  const socials = shop.socials ?? {};
  const rootRef = React.useRef<HTMLDivElement>(null);
  const hintRef = React.useRef<HTMLSpanElement>(null);
  const stampRef = React.useRef<HTMLSpanElement>(null);
  const scrollerRef = React.useRef<HTMLElement | null>(null);
  const [active, setActive] = React.useState<string>("top");

  const fonts = lang === "ar"
    ? { ui: '"Readex Pro Variable", system-ui, sans-serif', display: '"El Messiri Variable", Georgia, serif' }
    : { ui: '"Hanken Grotesk Variable", system-ui, sans-serif', display: '"Newsreader Variable", Georgia, serif' };
  const MONO = '"JetBrains Mono Variable", ui-monospace, monospace';

  /* ── the scroll engine ──────────────────────────────────────────────── */
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const win = root.ownerDocument.defaultView || window;
    const reduce = win.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const scroller = findScroller(root, win);
    scrollerRef.current = scroller;
    const docScroll = root.ownerDocument.scrollingElement;
    const frameRect = () =>
      scroller === docScroll ? { top: 0, height: win.innerHeight } : (scroller as HTMLElement).getBoundingClientRect();

    /* reveals — hidden ONLY where a live observer can restore them */
    const reveals = Array.from(root.querySelectorAll<HTMLElement>("[data-pf-reveal]"));
    const show = (n: HTMLElement) => { n.style.opacity = "1"; n.style.transform = "none"; };
    let io: IntersectionObserver | undefined;
    let failsafe: number | undefined;

    const runCounters = (scope: Element) => {
      const nodes = Array.from(scope.querySelectorAll<HTMLElement>("[data-pf-count]"));
      if (!nodes.length) return;
      const t0 = win.performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / 950);
        const e = 1 - Math.pow(1 - k, 3);
        nodes.forEach((n) => {
          const target = parseFloat(n.getAttribute("data-count") || "0") || 0;
          n.textContent = dig(Math.round(target * e)) + (n.getAttribute("data-suffix") || "");
        });
        if (k < 1) win.requestAnimationFrame(tick);
      };
      win.requestAnimationFrame(tick);
    };

    if (!reduce && typeof IntersectionObserver === "function") {
      const fr0 = frameRect();
      reveals.forEach((n) => {
        if (n.getBoundingClientRect().top < fr0.top + fr0.height) return; // already on screen → never hide
        n.style.opacity = "0";
        n.style.transform = "translateY(22px)";
        n.style.transition = "opacity .7s cubic-bezier(.2,.8,.2,1), transform .7s cubic-bezier(.2,.8,.2,1)";
      });
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          show(e.target as HTMLElement);
          runCounters(e.target);
          io!.unobserve(e.target);
        });
      }, { root: scroller === docScroll ? null : scroller, rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
      reveals.forEach((n) => io!.observe(n));
      failsafe = win.setTimeout(() => reveals.forEach((n) => { if (n.style.opacity !== "1") show(n); }), 1400);
    } else {
      reveals.forEach(show);
      root.querySelectorAll<HTMLElement>("[data-pf-count]").forEach((n) => {
        n.textContent = dig(n.getAttribute("data-count") || "0") + (n.getAttribute("data-suffix") || "");
      });
    }

    /* scrollspy → active nav */
    const onSpy = () => {
      const base = frameRect().top;
      let a = "top";
      root.querySelectorAll<HTMLElement>("[data-sec]").forEach((s) => {
        if (s.getBoundingClientRect().top - base <= 150) a = s.getAttribute("data-sec") || a;
      });
      setActive((prev) => (prev === a ? prev : a));
    };
    const spyTarget: EventTarget = scroller === docScroll ? win : scroller;
    spyTarget.addEventListener("scroll", onSpy, { passive: true });
    onSpy();

    if (reduce) {
      return () => { io?.disconnect(); if (failsafe) win.clearTimeout(failsafe); spyTarget.removeEventListener("scroll", onSpy); };
    }

    /* one rAF loop drives every per-frame transform */
    let raf = 0, last = scroller.scrollTop, tilt = 0, tiltT = 0;
    const loop = (time: number) => {
      raf = win.requestAnimationFrame(loop);
      const fr = frameRect();
      const top = scroller.scrollTop;
      const v = top - last; last = top;
      tiltT = clamp(tiltT * 0.86 + v * 0.012, -1, 1);
      tilt += (tiltT - tilt) * 0.12;
      const tl = Math.abs(tilt) < 0.002 ? 0 : tilt;

      const k = clamp(top / 340, 0, 1);
      const letters = root.querySelectorAll<HTMLElement>("[data-pf-ltr]");
      for (let i = 0; i < letters.length; i++) {
        const s = Math.sin(i * 7.3) * 0.5 + 0.5;
        const r = Math.sin(i * 3.1);
        letters[i].style.transform = k === 0 ? "none"
          : `translateY(${(-k * (18 + s * 90)).toFixed(1)}px) translateX(${(k * r * 30).toFixed(1)}px) rotate(${(k * r * 14).toFixed(2)}deg)`;
        letters[i].style.opacity = String(1 - k * 0.92);
      }
      if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, 1 - k * 2.4));
      if (stampRef.current) stampRef.current.style.transform = `rotate(${(top * 0.22).toFixed(1)}deg)`;

      const mq = root.querySelector<HTMLElement>("[data-pf-marquee]");
      if (mq) { const half = mq.scrollWidth / 2; if (half > 0) mq.style.transform = `translateX(${(-((time * 0.028 + top * 0.45) % half)).toFixed(1)}px)`; }

      root.querySelectorAll<HTMLElement>("[data-pf-parallax]").forEach((node) => {
        const p = node.parentElement; if (!p) return;
        const r = p.getBoundingClientRect();
        const rel = (r.top + r.height / 2 - fr.top - fr.height / 2) / fr.height;
        const amt = Number(node.getAttribute("data-amt")) || 30;
        node.style.transform = `scale(1.16) translateY(${(rel * -amt).toFixed(1)}px)`;
      });

      const cards = root.querySelectorAll<HTMLElement>("[data-pf-stack]");
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i]; const wrap = card.parentElement; if (!wrap) continue;
        const wr = wrap.getBoundingClientRect();
        const stickyTop = parseFloat(card.style.top) || 0;
        const travel = wr.height - card.offsetHeight;
        const pinned = travel > 0 ? clamp((stickyTop - (wr.top - fr.top)) / travel, 0, 1) : 0;
        const dr = i % 2 ? -1 : 1;
        card.style.transform = `scale(${(1 - pinned * 0.055).toFixed(4)}) rotate(${(tl * dr * 1.1).toFixed(3)}deg)`;
        card.style.filter = pinned > 0 ? `brightness(${(1 - pinned * 0.09).toFixed(3)})` : "none";
      }

      const ghosts = root.querySelectorAll<HTMLElement>("[data-pf-ghost]");
      for (let i = 0; i < ghosts.length; i++) {
        const g = ghosts[i]; const p = g.parentElement; if (!p) continue;
        const r = p.getBoundingClientRect();
        const rel = (r.top + r.height / 2 - fr.top - fr.height / 2) / (fr.height + r.height);
        g.style.transform = `translateX(${(rel * 150 * (i % 2 ? 1 : -1)).toFixed(1)}px)`;
        g.style.opacity = String(Math.max(0, 0.9 - Math.abs(rel) * 1.3));
      }
    };
    raf = win.requestAnimationFrame(loop);
    return () => {
      win.cancelAnimationFrame(raf);
      io?.disconnect();
      if (failsafe) win.clearTimeout(failsafe);
      spyTarget.removeEventListener("scroll", onSpy);
    };
    // Re-init when the language or the number of animated nodes changes.
  }, [lang, dig, props.works.length, props.facts.length]);

  const jump = React.useCallback((id: string) => {
    const root = rootRef.current; const scroller = scrollerRef.current; if (!root || !scroller) return;
    const base = scroller.getBoundingClientRect ? (scroller === root.ownerDocument.scrollingElement ? 0 : scroller.getBoundingClientRect().top) : 0;
    if (id === "top") { scroller.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const sec = root.querySelector<HTMLElement>(`[data-sec="${id}"]`);
    if (!sec) return;
    scroller.scrollTo({ top: scroller.scrollTop + sec.getBoundingClientRect().top - base - 8, behavior: "smooth" });
  }, []);

  /* ── editing helpers for the inline lists ───────────────────────────── */
  const worksEd = useEditList<Work>("works", props.works);
  const skillsEd = useEditStrings("marquee", props.marquee);
  const factsEd = useEditList<Fact>("facts", props.facts);
  const servicesEd = useEditList<Service>("services", props.services);
  const timeEd = useEditList<Milestone>("timeline", props.timeline);
  const setTag = (wi: number, tags: string[], ti: number, val: string) =>
    worksEd.setField(wi, "tags", tags.map((x, i) => (i === ti ? val : x)));
  const removeTag = (wi: number, tags: string[], ti: number) =>
    worksEd.setField(wi, "tags", tags.filter((_, i) => i !== ti));

  const name = shop.name || "";
  const firstName = name.split(" ")[0] || name;
  // Scatter tokens for the hero. Arabic is a cursive script: splitting a word
  // into individual letters forces each glyph to its ISOLATED form and the word
  // falls apart (أ ح م د instead of أحمد). Joining only happens *within* a word
  // — spaces already break it — so Arabic scatters per WORD (each word stays
  // fully shaped) while Latin keeps its nicer per-letter scatter.
  const letters = lang === "ar" ? name.split(/(\s+)/).filter(Boolean) : name.split("");

  const contactLinks = [
    shop.email && { icon: Mail, label: "Email", href: `mailto:${shop.email}` },
    shop.whatsapp && { icon: MessageCircle, label: "WhatsApp", href: waLink(shop.whatsapp) },
    shop.phone && { icon: Phone, label: lang === "ar" ? "هاتف" : "Phone", href: `tel:${shop.phone.replace(/\s/g, "")}` },
    socials.instagram && { icon: IgIcon, label: "Instagram", href: socials.instagram },
    socials.linkedin && { icon: InIcon, label: "LinkedIn", href: socials.linkedin },
    socials.github && { icon: GhIcon, label: "GitHub", href: socials.github },
  ].filter(Boolean) as { icon: React.ComponentType<IconProps>; label: string; href: string }[];

  const kicker = "font-medium uppercase tracking-[0.14em] text-[11px] text-[var(--pf-accent-strong)]";
  const sectionPad = "px-[18px] lg:px-12";

  return (
    <div
      ref={rootRef}
      dir={dir}
      lang={lang}
      className="pf-scope relative min-h-dvh overflow-x-clip bg-[var(--pf-page)] text-[var(--pf-ink)] [background-image:linear-gradient(var(--pf-line-soft)_1px,transparent_1px),linear-gradient(90deg,var(--pf-line-soft)_1px,transparent_1px)] [background-size:56px_56px]"
      style={{ ["--pf-ui"]: fonts.ui, ["--pf-display"]: fonts.display, ["--pf-mono"]: MONO, fontFamily: "var(--pf-ui)" } as React.CSSProperties}
    >
      {/* ══════════ masthead (sticky) ══════════ */}
      <header className="sticky top-0 z-40 border-b border-[var(--pf-line-soft)] bg-[color-mix(in_oklch,var(--pf-bg)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-[18px] py-3 lg:gap-4 lg:px-8">
          <button onClick={() => jump("top")} className="flex min-w-0 items-baseline gap-2 text-[var(--pf-ink)]">
            <span className="min-w-0 truncate text-[20px] font-medium" style={{ fontFamily: "var(--pf-display)" }}>
              {shop.brand || firstName || (lang === "ar" ? "الاسم" : "Name")}
            </span>
            {shop.role && <span className="hidden shrink-0 text-[10.5px] uppercase tracking-[0.12em] text-[var(--pf-faint)] sm:inline" style={{ fontFamily: MONO }}>{shop.role}</span>}
          </button>
          <nav className="sw-no-scrollbar ms-auto hidden min-w-0 gap-1 overflow-x-auto md:flex">
            {NAV_IDS.map((id) => (
              <button key={id} onClick={() => jump(id)}
                className={"h-[34px] shrink-0 whitespace-nowrap rounded-[8px] px-3 text-[14px] transition " +
                  (active === id ? "bg-[var(--pf-wash)] font-semibold text-[var(--pf-ink)]" : "text-[var(--pf-muted)] hover:text-[var(--pf-ink)]")}>
                {t.nav[id]}
              </button>
            ))}
          </nav>
          {shop.status && (
            <span className="hidden shrink-0 items-center gap-2 whitespace-nowrap md:ms-0 md:inline-flex">
              <span className="size-[7px] animate-pulse rounded-full bg-[var(--pf-accent)]" />
              <span className="text-[10.5px] uppercase tracking-[0.1em] text-[var(--pf-muted)]" style={{ fontFamily: MONO }}>{shop.status}</span>
            </span>
          )}
          <button onClick={() => jump("contact")} className="ms-auto inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-[10px] bg-[var(--pf-accent)] px-4 text-[14px] font-medium text-white transition hover:bg-[var(--pf-accent-strong)] md:ms-0">
            {t.contactCta}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1240px]">

        {/* ══════════ HERO ══════════ */}
        <section data-sec="top" className={"relative " + sectionPad + " py-[30px] lg:py-14"}>
          <span ref={stampRef} aria-hidden className="pointer-events-none absolute top-6 end-[18px] hidden size-[58px] items-center justify-center rounded-full border border-dashed border-[color-mix(in_oklch,var(--pf-accent)_45%,transparent)] text-[20px] text-[var(--pf-accent)] lg:end-12 lg:flex">✳</span>
          <span data-pf-ghost aria-hidden className="pointer-events-none absolute top-0 start-[18px] whitespace-nowrap text-[82px] leading-none text-transparent [-webkit-text-stroke:1px_var(--pf-line)] lg:start-12 lg:text-[205px]" style={{ fontFamily: "var(--pf-display)" }}>{firstName}</span>

          <div className="relative z-[1] grid items-center gap-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-11">
            <div className="flex min-w-0 flex-col gap-[18px]">
              <EditableText path="shop.kicker" value={shop.kicker ?? ""} placeholder={lang === "ar" ? "سطر تعريفي قصير…" : "A short intro line…"}
                className="inline-flex h-[30px] w-fit items-center rounded-full bg-[var(--pf-accent-soft)] px-3.5 text-[12.5px] font-medium text-[var(--pf-accent-strong)]" />
              <h1 aria-label={name} className="text-[52px] leading-none tracking-[-0.03em] lg:text-[88px]" style={{ fontFamily: "var(--pf-display)" }}>
                {editing ? (
                  <EditableText path="shop.name" value={name} placeholder={lang === "ar" ? "اسمك" : "Your name"} className="inline" keepLatinDigits />
                ) : (
                  letters.map((c, i) => (
                    <span key={i} data-pf-ltr aria-hidden className="inline-block will-change-transform">{c === " " ? " " : c}</span>
                  ))
                )}
              </h1>
              <EditableText path="shop.headline" value={shop.headline ?? ""} as="p" placeholder={lang === "ar" ? "سطر واحد عمّا تفعله…" : "One line on what you do…"}
                className="max-w-[24ch] text-[19px] font-semibold leading-[1.35] tracking-[-0.01em] lg:text-[24px]" />
              <EditableText path="shop.pitch" value={shop.pitch ?? ""} as="p" multiline placeholder={lang === "ar" ? "جملتان تصفان عملك…" : "A sentence or two about your work…"}
                className="max-w-[44ch] text-[17.5px] italic leading-[1.6] text-[var(--pf-muted)]" />
              <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
                <button onClick={() => jump("work")} className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-[var(--pf-accent)] px-6 text-[15px] font-medium text-white transition hover:bg-[var(--pf-accent-strong)]">
                  {t.workCta} <ArrowDown className="size-3.5" />
                </button>
                <button onClick={() => jump("about")} className="h-12 rounded-[10px] border border-[var(--pf-line)] bg-[var(--pf-surface)] px-5 text-[14.5px] font-medium text-[var(--pf-ink)] transition hover:bg-[var(--pf-wash-2)]">
                  {t.aboutCta}
                </button>
              </div>
              <span ref={hintRef} className="inline-flex items-center gap-2 pt-2.5 text-[11px] uppercase tracking-[0.12em] text-[var(--pf-faint)]" style={{ fontFamily: MONO }}>
                {t.scroll} <ArrowDown className="size-3" />
              </span>
            </div>

            <figure className="relative m-0 h-[240px] overflow-hidden rounded-[18px] border border-[var(--pf-line-soft)] bg-[var(--pf-wash)] shadow-[var(--pf-card-shadow)] lg:h-[430px]">
              <EditableImage path="shop.heroPhoto" className="absolute inset-0 block size-full">
                <span data-pf-parallax data-amt="30" className="absolute inset-0 block scale-[1.16] will-change-transform">
                  <Photo src={shop.heroPhoto} alt={name} label={lang === "ar" ? "صورتك أثناء العمل" : "A photo of you at work"} />
                </span>
              </EditableImage>
              <figcaption className="pointer-events-none absolute bottom-3 start-3 inline-flex h-[26px] items-center rounded-full bg-[color-mix(in_oklch,var(--pf-surface)_88%,transparent)] px-3 text-[12px] font-medium text-[var(--pf-muted)] backdrop-blur">
                <EditableText path="shop.heroCaption" value={shop.heroCaption ?? ""} placeholder={lang === "ar" ? "تعليق الصورة" : "Photo caption"} />
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ══════════ MARQUEE (skills) ══════════ */}
        {(props.marquee.length > 0 || editing) && (
          <section className="overflow-hidden border-y border-[var(--pf-line-soft)] bg-[var(--pf-surface)] py-4">
            {editing ? (
              <div className={"flex flex-wrap items-center gap-2 " + sectionPad}>
                {props.marquee.map((m, i) => (
                  <span key={i} className="group/sk relative inline-flex items-center rounded-full border border-[var(--pf-line)] px-3 py-1">
                    <EditableText value={m} onCommit={(v) => skillsEd.setAt(i, v)} className="text-[15px]" keepLatinDigits />
                    <button onClick={() => skillsEd.remove(i)} className="ms-1.5 cursor-pointer text-[var(--pf-faint)] hover:text-[var(--pf-accent-strong)]"><X className="size-3.5" /></button>
                  </span>
                ))}
                <button onClick={() => skillsEd.add(lang === "ar" ? "مهارة" : "Skill")} className="cursor-pointer rounded-full border border-dashed border-[var(--pf-line)] px-3 py-1 text-[13px] text-[var(--pf-muted)]">{t.addSkill}</button>
              </div>
            ) : (
              <div data-pf-marquee className="flex w-max gap-9 will-change-transform">
                {props.marquee.concat(props.marquee).map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-9 whitespace-nowrap text-[17px]" style={{ fontFamily: "var(--pf-display)", color: i % 2 ? "var(--pf-faint)" : "var(--pf-ink)" }}>
                    {m}<span className="size-[5px] rounded-full bg-[color-mix(in_oklch,var(--pf-accent)_50%,transparent)]" />
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ══════════ WORK — sticky stacking deck ══════════ */}
        {(props.works.length > 0 || editing) && (
          <section data-sec="work" className={"relative " + sectionPad + " pb-2.5 pt-11"}>
            <span data-pf-ghost aria-hidden className="pointer-events-none absolute top-8 end-[-20px] whitespace-nowrap text-[120px] leading-none text-transparent [-webkit-text-stroke:1px_var(--pf-line)] lg:text-[230px]" style={{ fontFamily: "var(--pf-display)" }}>{dig("01")}</span>
            <div data-pf-reveal className="relative flex items-end justify-between gap-6">
              <div className="flex flex-col gap-2.5">
                <span className={kicker} style={{ fontFamily: MONO }}>{t.workSec}</span>
                <SectionHeading lang={lang} />
              </div>
              <span className="hidden whitespace-nowrap rounded-full border border-[var(--pf-line)] px-3 py-1.5 text-[11.5px] text-[var(--pf-muted)] lg:inline" style={{ fontFamily: MONO }}>
                {dig(props.works.length)} {t.cases} — {t.stacks}
              </span>
            </div>

            <div className="flex flex-col pt-6">
              {props.works.map((w, i) => {
                const last = i === props.works.length - 1;
                const tags = w.tags ?? [];
                return (
                  <div key={`work-${i}`} className={last ? "h-[560px] lg:h-[400px]" : "h-[690px] lg:h-[570px]"}>
                    <div data-pf-stack style={{ top: `${14 + i * 16}px` }}
                      className="grid h-[560px] origin-top grid-cols-1 gap-4 overflow-hidden rounded-[18px] border border-[var(--pf-line-soft)] bg-[var(--pf-surface)] p-5 shadow-[var(--pf-card-shadow)] will-change-transform lg:h-[400px] lg:grid-cols-[1.05fr_.95fr] lg:gap-6 lg:p-7">
                      <div className="flex min-w-0 flex-col gap-3">
                        <span className="flex items-center gap-3">
                          <span className="inline-flex size-[38px] shrink-0 items-center justify-center rounded-full bg-[var(--pf-accent-soft)] text-[12.5px] text-[var(--pf-accent-strong)]" style={{ fontFamily: MONO }}>{dig("0" + (i + 1))}</span>
                          <EditableText value={w.meta ?? ""} onCommit={(v) => worksEd.setField(i, "meta", v)} placeholder={lang === "ar" ? "٢٠٢٥ · المجال · الدور" : "2025 · Domain · Role"}
                            className="truncate text-[11px] tracking-[0.06em] text-[var(--pf-faint)]" keepLatinDigits />
                        </span>
                        <EditableText value={w.title} onCommit={(v) => worksEd.setField(i, "title", v)} placeholder={lang === "ar" ? "عنوان المشروع" : "Project title"}
                          className="text-[19px] font-semibold leading-[1.22] tracking-[-0.012em] lg:text-[24px]" />
                        <EditableText value={w.desc ?? ""} onCommit={(v) => worksEd.setField(i, "desc", v)} multiline placeholder={lang === "ar" ? "وصف المشروع…" : "Project description…"}
                          className="line-clamp-3 max-w-[50ch] text-[14px] leading-[1.65] text-[var(--pf-muted)] lg:line-clamp-4" />
                        <span className="flex items-baseline gap-2.5">
                          <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-[var(--pf-accent-soft)] px-2.5 text-[11.5px] font-medium text-[var(--pf-accent-strong)]">{t.result}</span>
                          <EditableText value={w.outcome ?? ""} onCommit={(v) => worksEd.setField(i, "outcome", v)} placeholder={lang === "ar" ? "النتيجة في سطر" : "The result in one line"}
                            className="text-[14.5px] italic leading-[1.5] text-[var(--pf-ink)]" style={{ fontFamily: "var(--pf-display)" }} />
                        </span>
                        <span className="mt-auto flex flex-wrap gap-1.5">
                          {tags.map((tag, ti) => (
                            <span key={ti} className="group/tag inline-flex items-center rounded-full border border-[var(--pf-line)] bg-[var(--pf-surface)] px-3 py-1 text-[12.5px] text-[var(--pf-muted)]">
                              <EditableText value={tag} onCommit={(v) => setTag(i, tags, ti, v)} className="whitespace-nowrap" keepLatinDigits />
                              {editing && <button onClick={() => removeTag(i, tags, ti)} className="ms-1 cursor-pointer text-[var(--pf-faint)] hover:text-[var(--pf-accent-strong)]"><X className="size-3" /></button>}
                            </span>
                          ))}
                          {editing && <button onClick={() => worksEd.setField(i, "tags", [...tags, lang === "ar" ? "وسم" : "tag"])} className="cursor-pointer rounded-full border border-dashed border-[var(--pf-line)] px-2.5 py-1 text-[12px] text-[var(--pf-muted)]">{t.addTag}</button>}
                        </span>
                      </div>
                      <figure className="relative m-0 min-h-[160px] overflow-hidden rounded-[8px] border border-[var(--pf-line-soft)] bg-[var(--pf-wash)]">
                        <EditableImage onChange={(url) => worksEd.setField(i, "photo", url)} className="absolute inset-0 block size-full">
                          <Photo src={w.photo} alt={w.title} label={w.title} />
                        </EditableImage>
                        <span className="pointer-events-none absolute bottom-2 start-2 inline-flex h-[22px] items-center rounded-full bg-[color-mix(in_oklch,var(--pf-surface)_86%,transparent)] px-2.5 text-[9.5px] tracking-[0.1em] text-[var(--pf-muted)] backdrop-blur" style={{ fontFamily: MONO }}>{t.case}·{dig("0" + (i + 1))}</span>
                      </figure>
                      {editing && (
                        <button onClick={() => worksEd.remove(i)} className="absolute end-3 top-3 z-10 inline-flex size-7 cursor-pointer items-center justify-center rounded-full bg-[var(--pf-ink)] text-[var(--pf-surface)]"><X className="size-3.5" /></button>
                      )}
                    </div>
                  </div>
                );
              })}
              {editing && (
                <button onClick={() => worksEd.add({ title: lang === "ar" ? "مشروع جديد" : "New project", meta: "2026", outcome: "", desc: "", tags: [], photo: "" })}
                  className="mt-3 flex w-fit cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-[var(--pf-line)] px-4 py-2.5 text-[14px] font-medium text-[var(--pf-muted)]">{t.addWork}</button>
              )}
            </div>
          </section>
        )}

        {/* ══════════ ABOUT ══════════ */}
        <section data-sec="about" className={"relative " + sectionPad + " pb-11 pt-8"}>
          <span data-pf-ghost aria-hidden className="pointer-events-none absolute top-5 end-[-20px] whitespace-nowrap text-[120px] leading-none text-transparent [-webkit-text-stroke:1px_var(--pf-line)] lg:text-[230px]" style={{ fontFamily: "var(--pf-display)" }}>{dig("02")}</span>
          <div className="relative grid items-center gap-6 lg:grid-cols-[.9fr_1.1fr] lg:gap-11">
            <figure data-pf-reveal className="relative m-0 h-[250px] overflow-hidden rounded-[18px] border border-[var(--pf-line-soft)] bg-[var(--pf-wash)] shadow-[var(--pf-card-shadow)] lg:h-[400px]">
              <EditableImage path="shop.aboutPhoto" className="absolute inset-0 block size-full">
                <span data-pf-parallax data-amt="34" className="absolute inset-0 block scale-[1.16] will-change-transform">
                  <Photo src={shop.aboutPhoto} alt={name} label={lang === "ar" ? "صورة شخصية" : "Portrait photograph"} />
                </span>
              </EditableImage>
            </figure>
            <div data-pf-reveal className="flex flex-col gap-4">
              <span className={kicker} style={{ fontFamily: MONO }}>{t.aboutSec}</span>
              <EditableText path="about.heading" value={props.about.heading ?? ""} as="h3" placeholder={lang === "ar" ? "عنوان النبذة" : "About heading"}
                className="max-w-[20ch] text-[28px] leading-[1.1] tracking-[-0.02em] lg:text-[40px]" style={{ fontFamily: "var(--pf-display)" }} />
              <EditableText path="about.body" value={props.about.body ?? ""} as="p" multiline placeholder={lang === "ar" ? "فقرة عنك…" : "A paragraph about you…"}
                className="max-w-[50ch] text-[15px] leading-[1.7] text-[var(--pf-muted)]" />
              {(props.facts.length > 0 || editing) && (
                <div className="flex flex-wrap gap-3.5 pt-1.5">
                  {props.facts.map((f, i) => (
                    <span key={`fact-${i}`} className="group/fact relative flex min-w-[118px] flex-col gap-1 rounded-[12px] border border-[var(--pf-line-soft)] bg-[var(--pf-surface)] px-4.5 py-3.5 shadow-[var(--pf-card-shadow)]">
                      {editing ? (
                        <span className="flex items-baseline gap-0.5 text-[34px] leading-none" style={{ fontFamily: "var(--pf-display)" }}>
                          <EditableText value={String(f.value)} onCommit={(v) => factsEd.setField(i, "value", parseInt(v.replace(/[^0-9]/g, ""), 10) || 0)} className="inline" keepLatinDigits />
                          <EditableText value={f.suffix ?? ""} onCommit={(v) => factsEd.setField(i, "suffix", v)} className="inline text-[20px]" placeholder="+" />
                        </span>
                      ) : (
                        <span data-pf-count data-count={String(f.value)} data-suffix={f.suffix ?? ""} className="text-[34px] leading-none [font-variant-numeric:tabular-nums]" style={{ fontFamily: "var(--pf-display)" }}>{dig(f.value)}{f.suffix ?? ""}</span>
                      )}
                      <EditableText value={f.label} onCommit={(v) => factsEd.setField(i, "label", v)} placeholder={lang === "ar" ? "الوصف" : "Label"}
                        className="whitespace-nowrap text-[10.5px] uppercase tracking-[0.08em] text-[var(--pf-faint)]" style={{ fontFamily: MONO }} />
                      {editing && <button onClick={() => factsEd.remove(i)} className="absolute -end-2 -top-2 inline-flex size-5 cursor-pointer items-center justify-center rounded-full bg-[var(--pf-ink)] text-[var(--pf-surface)]"><X className="size-3" /></button>}
                    </span>
                  ))}
                  {editing && props.facts.length < 4 && (
                    <button onClick={() => factsEd.add({ value: 0, suffix: "", label: lang === "ar" ? "وصف" : "Label" })} className="min-w-[80px] cursor-pointer rounded-[12px] border border-dashed border-[var(--pf-line)] px-4 py-3.5 text-[13px] text-[var(--pf-muted)]">＋</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ══════════ SERVICES ══════════ */}
        {(props.services.length > 0 || editing) && (
          <section data-sec="services" className={"relative " + sectionPad + " pb-11 pt-2.5"}>
            <span data-pf-ghost aria-hidden className="pointer-events-none absolute top-0 end-[-20px] whitespace-nowrap text-[120px] leading-none text-transparent [-webkit-text-stroke:1px_var(--pf-line)] lg:text-[230px]" style={{ fontFamily: "var(--pf-display)" }}>{dig("03")}</span>
            <div data-pf-reveal className="relative flex max-w-[60ch] flex-col gap-2.5">
              <span className={kicker} style={{ fontFamily: MONO }}>{t.servicesSec}</span>
              <h3 className="text-[28px] leading-[1.08] tracking-[-0.02em] lg:text-[40px]" style={{ fontFamily: "var(--pf-display)" }}>{lang === "ar" ? "طرق للعمل معي" : "Ways to work with me"}</h3>
            </div>
            <div className="grid grid-cols-1 gap-3.5 pt-6 lg:grid-cols-3">
              {props.services.map((s, i) => (
                <div key={`svc-${i}`} data-pf-reveal className="group/svc relative flex flex-col gap-3 rounded-[16px] border border-[var(--pf-line-soft)] bg-[var(--pf-surface)] p-6 shadow-[var(--pf-card-shadow)] transition hover:-translate-y-0.5">
                  <span className="inline-flex size-[38px] items-center justify-center rounded-full bg-[var(--pf-accent-soft)] text-[12.5px] text-[var(--pf-accent-strong)]" style={{ fontFamily: MONO }}>{dig("0" + (i + 1))}</span>
                  <EditableText value={s.title} onCommit={(v) => servicesEd.setField(i, "title", v)} placeholder={lang === "ar" ? "عنوان الخدمة" : "Service title"} className="text-[18px] font-semibold leading-[1.3]" />
                  <EditableText value={s.body ?? ""} onCommit={(v) => servicesEd.setField(i, "body", v)} multiline placeholder={lang === "ar" ? "سطر عن الخدمة…" : "A line about it…"} className="text-[14px] leading-[1.7] text-[var(--pf-muted)]" />
                  {editing && <button onClick={() => servicesEd.remove(i)} className="absolute end-3 top-3 inline-flex size-6 cursor-pointer items-center justify-center rounded-full bg-[var(--pf-ink)] text-[var(--pf-surface)]"><X className="size-3.5" /></button>}
                </div>
              ))}
              {editing && props.services.length < 4 && (
                <button onClick={() => servicesEd.add({ title: lang === "ar" ? "خدمة جديدة" : "New service", body: "" })} className="flex cursor-pointer items-center justify-center gap-2 rounded-[16px] border border-dashed border-[var(--pf-line)] p-6 text-[14px] font-medium text-[var(--pf-muted)]"><Plus className="size-4" />{t.addService}</button>
              )}
            </div>
          </section>
        )}

        {/* ══════════ PATH (timeline) ══════════ */}
        {(props.timeline.length > 0 || editing) && (
          <section data-sec="path" className={"relative " + sectionPad + " pb-11 pt-2.5"}>
            <span data-pf-ghost aria-hidden className="pointer-events-none absolute top-0 end-[-20px] whitespace-nowrap text-[120px] leading-none text-transparent [-webkit-text-stroke:1px_var(--pf-line)] lg:text-[230px]" style={{ fontFamily: "var(--pf-display)" }}>{dig("04")}</span>
            <div data-pf-reveal className="relative flex flex-col gap-2.5">
              <span className={kicker} style={{ fontFamily: MONO }}>{t.pathSec}</span>
              <h3 className="text-[28px] leading-[1.08] tracking-[-0.02em] lg:text-[40px]" style={{ fontFamily: "var(--pf-display)" }}>{lang === "ar" ? "المسار حتى الآن" : "The path so far"}</h3>
            </div>
            <div className="flex flex-col gap-2.5 pt-6">
              {props.timeline.map((m, i) => (
                <div key={`ms-${i}`} data-pf-reveal className="group/ms relative grid grid-cols-[62px_1fr] items-baseline gap-4 rounded-[14px] border border-[var(--pf-line-soft)] bg-[var(--pf-surface)] px-5 py-4 shadow-[var(--pf-card-shadow)] lg:grid-cols-[80px_.8fr_1.2fr]">
                  <EditableText value={m.year} onCommit={(v) => timeEd.setField(i, "year", v)} placeholder="2024—" className="whitespace-nowrap text-[12.5px] text-[var(--pf-accent-strong)]" style={{ fontFamily: MONO }} keepLatinDigits />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <EditableText value={m.role} onCommit={(v) => timeEd.setField(i, "role", v)} placeholder={lang === "ar" ? "الدور" : "Role"} className="text-[15.5px] font-semibold leading-[1.3]" />
                    <EditableText value={m.org ?? ""} onCommit={(v) => timeEd.setField(i, "org", v)} placeholder={lang === "ar" ? "الجهة" : "Organization"} className="text-[10.5px] uppercase tracking-[0.08em] text-[var(--pf-faint)]" style={{ fontFamily: MONO }} keepLatinDigits />
                  </span>
                  <EditableText value={m.note ?? ""} onCommit={(v) => timeEd.setField(i, "note", v)} multiline placeholder={lang === "ar" ? "ملاحظة قصيرة…" : "A short note…"} className="hidden max-w-[44ch] text-[13.5px] leading-[1.6] text-[var(--pf-muted)] lg:block" />
                  {editing && <button onClick={() => timeEd.remove(i)} className="absolute end-3 top-3 inline-flex size-6 cursor-pointer items-center justify-center rounded-full bg-[var(--pf-ink)] text-[var(--pf-surface)]"><X className="size-3.5" /></button>}
                </div>
              ))}
              {editing && (
                <button onClick={() => timeEd.add({ year: "2026—", role: lang === "ar" ? "دور جديد" : "New role", org: "", note: "" })} className="flex w-fit cursor-pointer items-center gap-2 rounded-[14px] border border-dashed border-[var(--pf-line)] px-4 py-2.5 text-[14px] font-medium text-[var(--pf-muted)]">{t.addRow}</button>
              )}
            </div>
          </section>
        )}

        {/* ══════════ QUOTE ══════════ */}
        {((props.quote.text ?? "").trim() || editing) && (
          <section className={sectionPad + " pb-12 pt-5"}>
            <figure data-pf-reveal className="mx-auto flex max-w-[36ch] flex-col gap-4 text-center">
              <span className="text-[44px] leading-[.6] text-[var(--pf-accent)]" style={{ fontFamily: "var(--pf-display)" }}>{lang === "ar" ? "«" : "”"}</span>
              <EditableText path="quote.text" value={props.quote.text ?? ""} as="blockquote" multiline placeholder={lang === "ar" ? "اقتباس أو شهادة قصيرة…" : "A short quote or testimonial…"}
                className="text-[22px] italic leading-[1.4] tracking-[-0.01em] lg:text-[28px]" style={{ fontFamily: "var(--pf-display)" }} />
              <EditableText path="quote.by" value={props.quote.by ?? ""} as="figcaption" placeholder={lang === "ar" ? "الاسم — المنصب" : "Name — role"}
                className="text-[11px] uppercase tracking-[0.1em] text-[var(--pf-faint)]" style={{ fontFamily: MONO }} />
            </figure>
          </section>
        )}

        {/* ══════════ CONTACT ══════════ */}
        <section data-sec="contact" className={sectionPad + " pb-8"}>
          <div data-pf-reveal className="relative grid items-center gap-8 overflow-hidden rounded-[20px] bg-[var(--pf-ink)] p-[26px] lg:grid-cols-[1.3fr_.7fr] lg:p-12">
            <span aria-hidden className="pointer-events-none absolute end-[-120px] top-[-140px] size-[420px] rounded-full" style={{ background: "radial-gradient(circle, color-mix(in oklch, var(--pf-accent) 32%, transparent), transparent 68%)" }} />
            <div className="relative flex flex-col gap-3.5">
              <span className="text-[11px] uppercase tracking-[0.14em]" style={{ fontFamily: MONO, color: "color-mix(in oklch, var(--pf-accent) 65%, var(--pf-bg))" }}>{t.contactSec}</span>
              <EditableText path="contact.heading" value={props.contact.heading ?? ""} as="h3" placeholder={lang === "ar" ? "عندك فكرة؟" : "Got an idea?"}
                className="text-[32px] leading-[1.05] tracking-[-0.025em] text-[var(--pf-bg)] lg:text-[46px]" style={{ fontFamily: "var(--pf-display)" }} />
              <EditableText path="contact.body" value={props.contact.body ?? ""} as="p" multiline placeholder={lang === "ar" ? "سطر يدعو للتواصل…" : "A line inviting them to reach out…"}
                className="max-w-[44ch] text-[15px] leading-[1.7] text-[color-mix(in_oklch,var(--pf-bg)_72%,transparent)]" />
            </div>
            <div className="relative flex flex-col gap-3">
              {shop.email ? (
                <a href={`mailto:${shop.email}`} className="inline-flex h-[52px] items-center justify-center rounded-[10px] bg-[var(--pf-accent)] px-5 text-[15.5px] font-medium text-white transition hover:bg-[var(--pf-accent-strong)]" dir="ltr">{shop.email}</a>
              ) : shop.whatsapp ? (
                <a href={waLink(shop.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[10px] bg-[var(--pf-accent)] px-5 text-[15.5px] font-medium text-white transition hover:bg-[var(--pf-accent-strong)]"><MessageCircle className="size-4" />{t.contactCta}</a>
              ) : null}
              {contactLinks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {contactLinks.map((c) => (
                    <a key={c.label} href={c.href} target="_blank" rel="noreferrer" title={c.label}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--pf-bg)_26%,transparent)] px-3.5 text-[13px] text-[color-mix(in_oklch,var(--pf-bg)_85%,transparent)] transition hover:border-[color-mix(in_oklch,var(--pf-bg)_55%,transparent)] hover:text-[var(--pf-bg)]">
                      <c.icon className="size-4" /><span className="hidden sm:inline">{c.label}</span>
                    </a>
                  ))}
                </div>
              )}
              <EditableText path="contact.note" value={props.contact.note ?? ""} placeholder={lang === "ar" ? "ملاحظة صغيرة…" : "A small note…"}
                className="text-[12.5px] leading-[1.6] text-[color-mix(in_oklch,var(--pf-bg)_55%,transparent)]" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-5 pt-6">
            <span className="text-[10.5px] uppercase tracking-[0.1em] text-[var(--pf-faint)]" style={{ fontFamily: MONO }}>© {dig(2026)} {name}</span>
            <EditableText path="footer" value={props.footer ?? ""} placeholder="Essen · CET" className="text-[10.5px] uppercase tracking-[0.1em] text-[var(--pf-faint)]" style={{ fontFamily: MONO }} keepLatinDigits />
          </div>
        </section>
      </div>
    </div>
  );
}

/** The Selected-work heading is house copy (bilingual), kept editable-free. */
function SectionHeading({ lang }: { lang: "ar" | "en" }) {
  return (
    <h3 className="text-[28px] leading-[1.08] tracking-[-0.02em] lg:text-[40px]" style={{ fontFamily: "var(--pf-display)" }}>
      {lang === "ar" ? "مشاريع مختارة، تحكيها نتائجها" : "Selected projects, told by their results"}
    </h3>
  );
}
