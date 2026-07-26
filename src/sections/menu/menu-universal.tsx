"use client";

// Restaurant Menu — a category-tabbed menu with plate cards (photo + name +
// price + description). Categories are derived from the items' `category` field
// (like FAQ's grouped rail), so there's no second list to keep in sync. Three
// designs: A tabs · B stacked sections · C image cards. Arabic-first (RTL).

import * as React from "react";
import { UtensilsCrossed } from "lucide-react";
import type { MenuVariant, MenuScheme, MenuItem, MenuContent } from "./menu-data";
import { defaultMenuContent, defaultMenuItems } from "./menu-data";

export type { MenuVariant, MenuScheme, MenuItem, MenuContent };
export { defaultMenuContent, defaultMenuItems };

interface Props {
  variant?: MenuVariant;
  scheme?: MenuScheme;
  showImages?: boolean;
  items?: MenuItem[];
  content?: Partial<MenuContent>;
}

interface Tokens {
  section: string;
  card: string;
  kicker: string;
  price: string;
  muted: string;
  tabActive: string;
  tabIdle: string;
  badge: string;
  line: string;
}

function tokensFor(scheme: MenuScheme): Tokens {
  if (scheme === "dark")
    return {
      section: "bg-ink-950 text-paper",
      card: "bg-white/[0.04] border-white/10",
      kicker: "text-accent-300",
      price: "text-accent-300",
      muted: "text-paper/70",
      tabActive: "bg-accent text-white",
      tabIdle: "bg-white/[0.06] text-paper/80 hover:bg-white/10",
      badge: "bg-accent-300/15 text-accent-200",
      line: "border-white/10",
    };
  if (scheme === "accent")
    return {
      section: "bg-accent-900 text-paper",
      card: "bg-white/[0.06] border-white/12",
      kicker: "text-accent-200",
      price: "text-accent-100",
      muted: "text-paper/75",
      tabActive: "bg-paper text-accent-900",
      tabIdle: "bg-white/10 text-paper/85 hover:bg-white/15",
      badge: "bg-paper/15 text-paper",
      line: "border-white/12",
    };
  return {
    section: "bg-paper text-ink",
    card: "bg-surface border-line",
    kicker: "text-accent-700",
    price: "text-accent-800",
    muted: "text-muted",
    tabActive: "bg-accent text-white",
    tabIdle: "bg-neutral-100 text-muted hover:bg-neutral-200",
    badge: "bg-accent-100 text-accent-800",
    line: "border-line",
  };
}

/** Unique categories in first-seen order; items with no category share one flat group. */
function categoriesOf(items: MenuItem[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const c = (it.category || "").trim();
    if (c && !seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out;
}

function Plate({ item, t, showImage }: { item: MenuItem; t: Tokens; showImage: boolean }) {
  return (
    <article className={`flex gap-4 rounded-xl border p-3.5 ${t.card}`}>
      {showImage && (
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-neutral-200 md:size-24">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt={item.name} className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-neutral-400">
              <UtensilsCrossed className="size-6" />
            </span>
          )}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline gap-2">
          <h4 className="font-display text-[15.5px] font-bold leading-tight">{item.name}</h4>
          {item.badge && (
            <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${t.badge}`}>{item.badge}</span>
          )}
          <span aria-hidden className="mx-1 h-px flex-1 self-center border-b border-dashed border-current/20" />
          {item.price && <span className={`shrink-0 font-serif text-[15px] font-semibold ${t.price}`}>{item.price}</span>}
        </div>
        {item.description && <p className={`mt-1 text-[13px] leading-relaxed ${t.muted}`}>{item.description}</p>}
      </div>
    </article>
  );
}

export default function MenuUniversal({
  variant = "A",
  scheme = "paper",
  showImages = true,
  items,
  content,
}: Props) {
  const list = items && items.length ? items : defaultMenuItems;
  const c: MenuContent = { ...defaultMenuContent, ...content };
  const t = tokensFor(scheme);
  const cats = categoriesOf(list);
  const [active, setActive] = React.useState(0);

  const waHref = c.whatsapp
    ? `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(`مرحبًا! حابب أطلب من ${c.title}`)}`
    : undefined;

  const shown = cats.length ? list.filter((it) => (it.category || "").trim() === cats[Math.min(active, cats.length - 1)]) : list;

  return (
    <section dir="rtl" className={`px-6 py-16 md:py-20 ${t.section}`}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          {c.kicker && <p className={`mb-2 font-mono text-xs uppercase tracking-[0.18em] ${t.kicker}`}>{c.kicker}</p>}
          {c.title && <h2 className="font-display text-[clamp(26px,3.4vw,38px)] font-extrabold leading-[1.28]">{c.title}</h2>}
          {c.lede && <p className={`mx-auto mt-3 max-w-[54ch] text-[15px] leading-[1.8] ${t.muted}`}>{c.lede}</p>}
        </header>

        {/* Category tabs (A + C). B stacks all categories instead. */}
        {variant !== "B" && cats.length > 1 && (
          <div className="mb-7 flex flex-wrap justify-center gap-2">
            {cats.map((cat, i) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(i)}
                className={`rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors ${i === active ? t.tabActive : t.tabIdle}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {variant === "B" ? (
          <div className="flex flex-col gap-9">
            {(cats.length ? cats : [""]).map((cat) => {
              const rows = cat ? list.filter((it) => (it.category || "").trim() === cat) : list;
              return (
                <div key={cat || "all"}>
                  {cat && (
                    <h3 className={`mb-3.5 border-b pb-2 font-display text-lg font-bold ${t.line}`}>{cat}</h3>
                  )}
                  <div className="grid gap-3 md:grid-cols-2">
                    {rows.map((it, i) => (
                      <Plate key={i} item={it} t={t} showImage={showImages} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : variant === "C" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((it, i) => (
              <article key={i} className={`flex flex-col overflow-hidden rounded-2xl border ${t.card}`}>
                <div className="relative aspect-[4/3] bg-neutral-200">
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt={it.name} className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-neutral-400">
                      <UtensilsCrossed className="size-8" />
                    </span>
                  )}
                  {it.badge && (
                    <span className={`absolute inset-inline-start-3 inset-block-start-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${t.badge}`}>{it.badge}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-baseline gap-2">
                    <h4 className="font-display text-base font-bold">{it.name}</h4>
                    <span aria-hidden className="mx-1 h-px flex-1 self-center border-b border-dashed border-current/20" />
                    {it.price && <span className={`font-serif text-[15px] font-semibold ${t.price}`}>{it.price}</span>}
                  </div>
                  {it.description && <p className={`mt-1.5 text-[13px] leading-relaxed ${t.muted}`}>{it.description}</p>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {shown.map((it, i) => (
              <Plate key={i} item={it} t={t} showImage={showImages} />
            ))}
          </div>
        )}

        {(c.footnote || (waHref && c.ctaLabel)) && (
          <div className="mt-9 flex flex-col items-center gap-4 text-center">
            {c.footnote && <p className={`max-w-[60ch] text-[13px] leading-relaxed ${t.muted}`}>{c.footnote}</p>}
            {waHref && c.ctaLabel && (
              <a
                href={waHref}
                className={`inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold ${t.tabActive}`}
              >
                {c.ctaLabel}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
