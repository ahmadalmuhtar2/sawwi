"use client";

/**
 * FAQUniversal — Sawwi section library
 * Shared FAQ section, business-agnostic. Four variants × three schemes.
 *
 *   A "accordion" — one answer open at a time (first opens by default)
 *   B "columns"   — every answer open in two columns; best for SEO
 *   C "grouped"   — category rail beside the questions, derived from the data
 *   D "qa"        — editorial س/ج badges with serif answers
 *
 * Arabic-first (RTL). Client component (accordion/tab state). Theme tokens +
 * keyframes live in globals.css.
 */

import * as React from "react";
import {
  arNum,
  defaultFAQContent,
  defaultFAQItems,
  type FAQItem,
  type FAQContent,
  type FAQVariant,
  type FAQScheme,
} from "./faq-data";

export type { FAQItem, FAQContent, FAQVariant, FAQScheme } from "./faq-data";
export { arNum, defaultFAQContent, defaultFAQItems } from "./faq-data";

export interface FAQUniversalProps {
  variant?: FAQVariant;
  scheme?: FAQScheme;
  items?: FAQItem[];
  content?: Partial<FAQContent>;
  showNumbers?: boolean;
  showHelpBox?: boolean;
  showCount?: boolean;
  /** index of the answer open on first paint in A; -1 for all closed. Default 0. */
  defaultOpen?: number;
  /** emit FAQPage JSON-LD (recommended — this is the one section Google reads) */
  emitJsonLd?: boolean;
  className?: string;
}

/* ────────────────────────────── tokens ────────────────────────────── */

interface Tokens {
  root: string;
  hairline: string;
  kicker: string;
  num: string;
  iconOn: string;
  iconOff: string;
  tabOn: string;
  tabOff: string;
  qBadge: string;
  aBadge: string;
  help: string;
  cta: string;
}

function tokensFor(scheme: FAQScheme): Tokens {
  switch (scheme) {
    case "dark":
      return {
        root: "bg-ink-900 text-paper",
        hairline: "border-paper/15",
        kicker: "text-accent-300",
        num: "text-accent-400",
        iconOn: "bg-accent-600 text-white",
        iconOff: "bg-paper/10 text-paper/90",
        tabOn: "bg-paper/10 text-paper font-bold",
        tabOff: "bg-transparent text-paper/80 font-medium",
        qBadge: "bg-paper/[0.14] text-paper",
        aBadge: "bg-accent-600 text-white",
        help: "bg-paper/[0.06]",
        cta: "bg-accent-600 text-white hover:bg-accent-700",
      };
    case "accent":
      return {
        root: "bg-accent-900 text-paper",
        hairline: "border-paper/20",
        kicker: "text-paper/85",
        num: "text-paper/75",
        iconOn: "bg-paper text-accent-900",
        iconOff: "bg-paper/[0.14] text-paper",
        tabOn: "bg-paper/[0.14] text-paper font-bold",
        tabOff: "bg-transparent text-paper/[0.88] font-medium",
        qBadge: "bg-paper text-accent-900",
        aBadge: "bg-paper/[0.18] text-paper",
        help: "bg-paper/[0.08]",
        cta: "bg-paper text-accent-900 hover:bg-white",
      };
    default:
      return {
        root: "bg-paper text-ink",
        hairline: "border-line",
        kicker: "text-accent-700",
        num: "text-accent-500",
        iconOn: "bg-accent text-white",
        iconOff: "bg-neutral-200 text-ink/80",
        tabOn: "bg-accent-100 text-accent-800 font-bold",
        tabOff: "bg-transparent text-muted font-medium",
        qBadge: "bg-ink text-white",
        aBadge: "bg-accent-100 text-accent-800",
        help: "bg-neutral-100",
        cta: "bg-accent text-white hover:bg-accent-700",
      };
  }
}

/* ───────────────────────────── pieces ───────────────────────────── */

const WhatsAppIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className="size-4">
    <path d="M8 1.5a6.5 6.5 0 0 0-5.6 9.8L1.5 14.5l3.4-.9A6.5 6.5 0 1 0 8 1.5z" />
  </svg>
);

function Numeral({ n, t }: { n: number; t: Tokens }) {
  return (
    <span aria-hidden className={`min-w-[22px] shrink-0 pt-0.5 font-serif text-sm tracking-[0.04em] ${t.num}`}>
      {arNum(n)}
    </span>
  );
}

/** Question + answer as plain blocks — used by B, C and (unstyled) D. */
function OpenItem({
  item,
  index,
  t,
  showNumbers,
  maxAnswer = "",
}: {
  item: FAQItem;
  index: number;
  t: Tokens;
  showNumbers: boolean;
  maxAnswer?: string;
}) {
  return (
    <>
      <span className="flex items-start gap-3">
        {showNumbers && <Numeral n={index + 1} t={t} />}
        <span className="font-display text-[15.5px] font-bold leading-[1.5] md:text-[16.5px]">
          {item.question}
        </span>
      </span>
      <span
        className={`text-sm leading-[1.9] opacity-[0.72] text-pretty md:text-[14.5px] ${maxAnswer}`}
        style={showNumbers ? { paddingInlineStart: 34 } : undefined}
      >
        {item.answer}
      </span>
    </>
  );
}

function HelpBox({ c, t, waHref }: { c: FAQContent; t: Tokens; waHref: string }) {
  return (
    <div
      className={`mt-[26px] flex flex-wrap items-start justify-between gap-[22px] rounded p-5 md:mt-[38px] md:items-center md:px-[26px] md:py-6 ${t.help}`}
    >
      <div className="flex flex-col gap-[7px]">
        <span className="font-display text-[17px] font-bold md:text-[19px]">{c.helpTitle}</span>
        <span className="max-w-[48ch] text-[13.5px] leading-[1.75] opacity-75">{c.helpBody}</span>
      </div>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex h-12 w-full items-center justify-center gap-2.5 whitespace-nowrap rounded-[3px] px-[22px] font-display text-[14.5px] font-bold transition-colors md:w-auto ${t.cta}`}
      >
        <WhatsAppIcon />
        {c.helpCta}
      </a>
    </div>
  );
}

/* ──────────────────────────── component ──────────────────────────── */

export default function FAQUniversal({
  variant = "A",
  scheme = "paper",
  items = defaultFAQItems,
  content,
  showNumbers = true,
  showHelpBox = true,
  showCount = true,
  defaultOpen = 0,
  emitJsonLd = true,
  className,
}: FAQUniversalProps) {
  const c: FAQContent = { ...defaultFAQContent, ...content };
  const t = tokensFor(scheme);

  const [open, setOpen] = React.useState(defaultOpen);

  // categories are derived from the data, so there is no second list to drift
  const groupNames = React.useMemo(() => {
    const seen: string[] = [];
    items.forEach((q) => {
      if (q.group && !seen.includes(q.group)) seen.push(q.group);
    });
    return seen;
  }, [items]);

  const [group, setGroup] = React.useState<string | undefined>(undefined);
  const activeGroup = group ?? groupNames[0];
  const groupItems = activeGroup ? items.filter((q) => q.group === activeGroup) : items;

  const waHref = c.whatsapp
    ? `https://wa.me/${c.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("مرحبًا، عندي سؤال")}`
    : "#contact";

  return (
    <section
      dir="rtl"
      className={`px-[22px] py-[30px] md:px-[52px] md:pb-11 md:pt-[58px] ${t.root} ${className ?? ""}`}
    >
      {/* Google reads this section more than any other — ship the structured data */}
      {emitJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: items.map((q) => ({
                "@type": "Question",
                name: q.question,
                acceptedAnswer: { "@type": "Answer", text: q.answer },
              })),
            }),
          }}
        />
      )}

      {/* ── head ── */}
      <div
        className={`mb-[18px] flex flex-wrap items-end justify-between gap-6 border-b pb-[22px] md:mb-[26px] md:pb-7 ${t.hairline}`}
      >
        <div className="flex flex-col gap-3">
          <span className={`text-xs font-semibold tracking-[0.08em] ${t.kicker}`}>{c.kicker}</span>
          <h2 className="m-0 font-display text-[clamp(28px,3vw,42px)] font-extrabold leading-[1.3] -tracking-[0.028em] text-balance">
            {c.title}
          </h2>
          {c.lede && (
            <p className="m-0 max-w-[50ch] text-[15px] leading-[1.85] opacity-70 text-pretty md:text-[15.5px]">
              {c.lede}
            </p>
          )}
        </div>
        {showCount && (
          <span className="hidden flex-col items-end gap-1 md:flex">
            <span className="font-serif text-[34px] leading-none">{arNum(items.length)}</span>
            <span className="whitespace-nowrap text-[11.5px] opacity-[0.58]">{c.countLabel}</span>
          </span>
        )}
      </div>

      {/* ── A — accordion ── */}
      {variant === "A" && (
        <div className="flex max-w-full flex-col md:max-w-[820px]">
          {items.map((item, i) => {
            const isOpen = open === i;
            const panelId = `faq-panel-${i}`;
            const btnId = `faq-button-${i}`;
            return (
              <div key={`${item.question}-${i}`} className={`border-b ${t.hairline}`}>
                <button
                  type="button"
                  id={btnId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-start gap-3.5 border-0 bg-transparent py-[18px] text-start font-[inherit] text-current md:py-5"
                >
                  {showNumbers && <Numeral n={i + 1} t={t} />}
                  <span
                    className={`flex-1 font-display text-[15.5px] leading-[1.55] md:text-[16.5px] ${
                      isOpen ? "font-bold" : "font-semibold"
                    }`}
                  >
                    {item.question}
                  </span>
                  <span
                    aria-hidden
                    className={`mt-px inline-flex size-[26px] shrink-0 items-center justify-center rounded-full transition-[transform,background-color] duration-300 ease-[cubic-bezier(.3,.8,.2,1)] ${
                      isOpen ? `rotate-[135deg] ${t.iconOn}` : t.iconOff
                    }`}
                  >
                    <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
                      <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  hidden={!isOpen}
                  className="pb-[18px] animate-fade-down motion-reduce:animate-none md:pb-[22px]"
                >
                  <span
                    className="block max-w-[64ch] text-sm leading-[1.9] opacity-[0.74] text-pretty md:text-[14.5px]"
                    style={showNumbers ? { paddingInlineStart: 34 } : undefined}
                  >
                    {item.answer}
                  </span>
                </div>
              </div>
            );
          })}
          {showHelpBox && <HelpBox c={c} t={t} waHref={waHref} />}
        </div>
      )}

      {/* ── B — two columns, all open ── */}
      {variant === "B" && (
        <>
          <div className="grid grid-cols-1 gap-y-0 md:grid-cols-2 md:gap-x-12">
            {items.map((item, i) => (
              <div
                key={`${item.question}-${i}`}
                className={`flex flex-col gap-2.5 border-t py-[18px] animate-rise motion-reduce:animate-none md:pb-6 md:pt-[22px] ${t.hairline}`}
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <OpenItem item={item} index={i} t={t} showNumbers={showNumbers} />
              </div>
            ))}
          </div>
          {showHelpBox && <HelpBox c={c} t={t} waHref={waHref} />}
        </>
      )}

      {/* ── C — grouped by category ── */}
      {variant === "C" && (
        <>
          <div className="grid grid-cols-1 items-start gap-[22px] md:grid-cols-[minmax(0,0.34fr)_minmax(0,1fr)] md:gap-12">
            {groupNames.length > 0 && (
              <div
                className="flex flex-row flex-wrap gap-2 md:sticky md:top-6 md:flex-col md:gap-1"
                role="tablist"
                aria-label="تصنيفات الأسئلة"
              >
                {groupNames.map((name) => {
                  const on = name === activeGroup;
                  return (
                    <button
                      key={name}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setGroup(name)}
                      className={`flex items-center justify-between gap-2.5 whitespace-nowrap rounded-[3px] border-0 px-3.5 py-2.5 text-start font-[inherit] text-sm md:px-[15px] md:py-[13px] ${
                        on ? t.tabOn : t.tabOff
                      }`}
                    >
                      {name}
                      <span className="font-serif text-[13px] opacity-60">
                        {arNum(items.filter((q) => q.group === name).length)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex min-w-0 flex-col">
              {groupItems.map((item, i) => (
                <div
                  key={`${item.question}-${i}`}
                  className={`flex flex-col gap-2.5 border-b py-[18px] animate-rise motion-reduce:animate-none md:pb-6 md:pt-[22px] ${t.hairline}`}
                  style={{ animationDelay: `${i * 55}ms` }}
                >
                  <OpenItem item={item} index={i} t={t} showNumbers={showNumbers} maxAnswer="max-w-[62ch]" />
                </div>
              ))}
            </div>
          </div>
          {showHelpBox && <HelpBox c={c} t={t} waHref={waHref} />}
        </>
      )}

      {/* ── D — Q/A editorial ── */}
      {variant === "D" && (
        <>
          <div className="flex max-w-full flex-col md:max-w-[780px]">
            {items.map((item, i) => (
              <div
                key={`${item.question}-${i}`}
                className={`flex flex-col gap-3.5 border-b py-5 animate-rise motion-reduce:animate-none md:pb-[26px] md:pt-6 ${t.hairline}`}
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <span className="flex items-start gap-3.5">
                  <span
                    aria-hidden
                    className={`mt-0.5 inline-flex size-[26px] shrink-0 items-center justify-center rounded-full font-display text-xs font-bold ${t.qBadge}`}
                  >
                    س
                  </span>
                  <span className="font-display text-base font-bold leading-[1.5] md:text-[17.5px]">
                    {item.question}
                  </span>
                </span>
                <span className="flex items-start gap-3.5">
                  <span
                    aria-hidden
                    className={`mt-0.5 inline-flex size-[26px] shrink-0 items-center justify-center rounded-full font-display text-xs font-bold ${t.aBadge}`}
                  >
                    ج
                  </span>
                  {/* the answer takes the serif's voice — it's someone speaking */}
                  <span className="max-w-[62ch] font-serif text-[14.5px] leading-[1.85] opacity-[0.82] text-pretty md:text-base">
                    {item.answer}
                  </span>
                </span>
              </div>
            ))}
          </div>
          {showHelpBox && <HelpBox c={c} t={t} waHref={waHref} />}
        </>
      )}
    </section>
  );
}
