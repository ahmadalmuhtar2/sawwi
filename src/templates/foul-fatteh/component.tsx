"use client";

/**
 * Foul & Fatteh (Ajami) — Sawwi template
 * A Damascene foul-and-fatteh house, menu-first, full-bleed responsive, Arabic RTL.
 *
 *   القائمة   the menu — an Ajami "cover" hero, a group filter (foul/fatteh/…),
 *             and a two-column dish list.
 *   الزيارة   hours + address + phone (copy) + a map image and directions link.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Tokenization mirrors the restaurant: only THREE colors are themeable, read
 * from CSS variables so TemplateHost can override them per-site —
 *   accent → --color-aj-gold   ground → --color-aj-green   ink → --color-aj-cream
 * Note this template is LIGHT-content: the menu sits on a cream surface with dark
 * ink text, while the header / footer / cover are the deep-green chrome. The
 * Ajami "lattice" is a self-contained inline-SVG pattern (no external assets).
 * Everything but the three tokens is a fixed design value.
 * ─────────────────────────────────────────────────────────────────────────
 */

import * as React from "react";

/* ────────────────────────────── types ────────────────────────────── */

export type Page = "menu" | "visit";

export interface Group {
  id: string;
  label: string;
}

export interface MenuItem {
  /** group id — must match a Group */
  group: string;
  name: string;
  latin?: string;
  desc?: string;
  price: string;
  /** small gold label: "نباتي", "حار قليلًا" … */
  mark?: string;
  photo?: string;
}

export interface HoursRow {
  days: string;
  time: string;
}

export interface ShopContent {
  name: string;
  latinName?: string;
  tagline?: string;
  heroLine?: string;
  heroPhoto?: string;
  /** number the shop is called on — the CTA everywhere is "اتصل" */
  phone?: string;
  /** optional, stored but this template calls rather than messages */
  whatsapp?: string;
  address?: string;
  mapsUrl?: string;
  /** short opening line shown in the header + cover, e.g. "٦:٠٠ ص – ١:٠٠ م" */
  hoursNote?: string;
}

export interface VisitContent {
  mapPhoto?: string;
  directionsUrl?: string;
  /** a short line under the address, e.g. "تناول في المحلّ · طلبات خارجية" */
  dineNote?: string;
}

export interface FoulFattehProps {
  shop: ShopContent;
  groups: Group[];
  items: MenuItem[];
  hours: HoursRow[];
  visit?: VisitContent;
  socials?: Array<{ title: string; glyph: string }>;
  currency?: string;
  className?: string;
}

/* fallbacks so the design reads complete before any content is entered */
export const defaultGroups: Group[] = [
  { id: "foul", label: "الفول" },
  { id: "fatteh", label: "الفتّة" },
  { id: "side", label: "مقبّلات وإضافات" },
  { id: "drink", label: "مشروبات" },
];

/* ───────────────────────────── helpers ───────────────────────────── */

const AR = "٠١٢٣٤٥٦٧٨٩";
export const arInt = (n: number | string) => String(n).replace(/\d/g, (d) => AR[Number(d)]);

/** Arabic label — Readex/sans, never mono (mono has no Arabic coverage and
 *  positive tracking breaks the cursive joins). */
const K = "whitespace-nowrap font-sans text-[11.5px] font-semibold leading-[1.5] tracking-[0.07em]";
const K_SM = "whitespace-nowrap font-sans text-[11px] font-semibold leading-[1.5] tracking-[0.06em]";
/** dark green text on a gold fill — kept fixed so it stays legible on gold. */
const ON_GOLD = "text-[oklch(0.24_0.04_165)]";

/** Self-contained Ajami lattice — an inline SVG data URI (gold stroke). Replaces
 *  the design's external assets/ajami-*.svg; rendered at a low fixed opacity on
 *  the green chrome + cover. */
const AJAMI_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg fill='none' stroke='%23d8b25e' stroke-width='1'%3E%3Cpath d='M24 0L48 24 24 48 0 24Z'/%3E%3Cpath d='M24 13L35 24 24 35 13 24Z'/%3E%3Cpath d='M0 0L48 48M48 0L0 48' stroke-opacity='0.5'/%3E%3C/g%3E%3C/svg%3E\")";

function Texture({ size = 46, opacity = 0.2 }: { size?: number; opacity?: number }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ backgroundImage: AJAMI_URI, backgroundSize: `${size}px ${size}px`, opacity }}
    />
  );
}

/* ── icons ── */
const BowlIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
    <path d="M3.5 10.5h17a8.5 8.5 0 0 1-17 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 21h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
    <path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15 12 21 12 21z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const NAV_ICONS: Record<Page, React.ReactNode> = {
  menu: <BowlIcon />,
  visit: <PinIcon />,
};

/** Visible placeholder — cream wash, so the layout reads before upload. */
function Photo({ src, alt, className = "" }: { src?: string; alt: string; className?: string }) {
  return (
    <span className={`relative block overflow-hidden bg-[oklch(0.9_0.02_88)] ${className}`}>
      <span aria-hidden className="absolute inset-0 bg-[repeating-linear-gradient(-38deg,oklch(0.24_0.04_165/.05)_0_1px,transparent_1px_9px)]" />
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="absolute inset-0 size-full object-cover" />
      )}
    </span>
  );
}

/* ──────────────────────────── component ──────────────────────────── */

export default function FoulFatteh({
  shop,
  groups = defaultGroups,
  items,
  hours,
  visit = {},
  socials = [],
  currency = "ل.س",
  className,
}: FoulFattehProps) {
  const [page, setPage] = React.useState<Page>("menu");
  const [group, setGroup] = React.useState(groups[0]?.id);
  const [toast, setToast] = React.useState<string | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // Fall back to the first available id when a stored filter goes stale under
  // live editing (the whole group set can be swapped in the editor).
  const activeGroup = groups.some((g) => g.id === group) ? group : groups[0]?.id;
  const visibleItems = items.filter((it) => it.group === activeGroup);

  const telHref = shop.phone ? `tel:${shop.phone.replace(/\s/g, "")}` : undefined;

  const go = (p: Page) => setPage(p);

  const copyPhone = () => {
    if (!shop.phone) return;
    try { navigator.clipboard?.writeText(shop.phone); } catch { /* clipboard blocked */ }
    setToast(`تم نسخ الرقم · ${shop.phone}`);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  };

  const TABS: Array<{ id: Page; label: string; short: string }> = [
    { id: "menu", label: "القائمة", short: "القائمة" },
    { id: "visit", label: "الزيارة", short: "الزيارة" },
  ];

  return (
    <div
      dir="rtl"
      // A real, full-bleed website — the deep-green ground fills the viewport
      // behind the cream content; the sticky green header and fixed bottom tabs
      // pin to the viewport.
      className={`relative min-h-dvh w-full overflow-x-hidden bg-aj-green font-sans text-aj-ink ${className ?? ""}`}
    >
      {/* Content column — a single readable column on phones, full-width website
          on desktop. Each section re-centers its content in a max-w container. */}
      <div className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col pb-16 lg:max-w-none lg:pb-0">
        {/* ══ site header (green chrome, gold top border, Ajami lattice) ══ */}
        <header className="sticky top-0 z-50 border-b-2 border-aj-gold bg-aj-green-700">
          <Texture size={46} opacity={0.18} />
          <div className="relative mx-auto flex w-full max-w-6xl items-center gap-3 px-[22px] py-3 lg:px-14">
            <button type="button" onClick={() => go("menu")} className="flex flex-col gap-0.5 text-start">
              <span className="font-display text-base font-extrabold leading-[1.35] text-aj-cream lg:text-lg">
                {shop.name}
              </span>
              {shop.tagline && <span className={`${K_SM} text-aj-gold-200`}>{shop.tagline}</span>}
            </button>

            {/* desktop top-nav — the two pages as horizontal links */}
            <nav className="mx-auto hidden items-center gap-1 lg:flex">
              {TABS.map((t) => {
                const on = page === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-current={on}
                    onClick={() => go(t.id)}
                    className={`inline-flex h-9 items-center rounded-[2px] px-[13px] text-[13px] font-semibold leading-none transition-colors ${
                      on ? "bg-aj-cream/15 text-aj-gold-200" : "text-aj-cream/85 hover:text-aj-cream"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </nav>

            {/* desktop hours indicator */}
            {shop.hoursNote && (
              <span className="hidden shrink-0 items-center gap-2 text-[12.5px] text-aj-cream/90 lg:inline-flex">
                <span aria-hidden className="size-[7px] rounded-full bg-[oklch(0.78_0.13_145)] animate-aj-pulse motion-reduce:animate-none" />
                {shop.hoursNote}
              </span>
            )}

            <a
              href={telHref ?? "#"}
              className={`ms-auto inline-flex h-9 items-center whitespace-nowrap rounded-[2px] bg-aj-gold px-3.5 font-display text-[12.5px] font-bold lg:ms-4 lg:h-[34px] ${ON_GOLD}`}
            >
              اتصل
            </a>
          </div>
        </header>

        {/* ══════════ القائمة ══════════ */}
        {page === "menu" && (
          <div className="flex flex-col bg-aj-cream animate-aj-page motion-reduce:animate-none">
            {/* Ajami cover panel */}
            <section className="px-[18px] py-[18px] lg:px-14 lg:py-[30px]">
              <div className="mx-auto w-full max-w-6xl">
                <div
                  className="relative overflow-hidden rounded-[3px] border-2 border-aj-gold bg-aj-green-800"
                  style={{ boxShadow: "inset 0 0 0 6px oklch(0.27 0.05 165), inset 0 0 0 7px oklch(0.68 0.11 82 / .55)" }}
                >
                  <Texture size={56} opacity={0.28} />
                  <span aria-hidden className="absolute inset-0 opacity-40">
                    <Photo src={shop.heroPhoto} alt={shop.name} className="size-full" />
                  </span>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,oklch(0.27_0.05_165)_12%,oklch(0.27_0.05_165/.8)_62%,oklch(0.27_0.05_165/.5)_100%)]"
                  />
                  <div className="relative flex flex-col gap-[15px] p-[24px_22px_26px] lg:p-[44px_46px]">
                    <span className={`${K} text-aj-gold-200 animate-aj-rise motion-reduce:animate-none`}>القائمة</span>
                    <span className="font-display text-[30px] font-extrabold leading-[1.3] -tracking-[0.02em] text-aj-cream animate-aj-rise motion-reduce:animate-none lg:text-[46px]">
                      {shop.heroLine ?? "فول وفتّة"}
                    </span>
                    <span aria-hidden className="h-px w-full origin-right bg-[linear-gradient(to_left,oklch(0.72_0.1_85/.7),transparent)] animate-aj-rule motion-reduce:animate-none" />
                    <div className="flex flex-wrap gap-x-[22px] gap-y-2 animate-aj-rise motion-reduce:animate-none">
                      {shop.hoursNote && (
                        <span className="inline-flex items-center gap-2 text-[13px] text-aj-cream/90">
                          <span aria-hidden className="text-aj-gold-300">◷</span>
                          {shop.hoursNote}
                        </span>
                      )}
                      {shop.address && (
                        <span className="inline-flex items-center gap-2 text-[13px] text-aj-cream/90">
                          <span aria-hidden className="text-aj-gold-300">◉</span>
                          {shop.address}
                        </span>
                      )}
                      {shop.phone && (
                        <a href={telHref} className="inline-flex items-center gap-2 text-[13px] text-aj-cream/90">
                          <span aria-hidden className="text-aj-gold-300">✆</span>
                          <span dir="ltr" className="font-mono text-xs">{shop.phone}</span>
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-[9px] animate-aj-rise motion-reduce:animate-none">
                      <a
                        href={telHref ?? "#"}
                        className={`inline-flex h-[46px] items-center rounded-[2px] bg-aj-gold px-5 font-display text-sm font-bold ${ON_GOLD}`}
                      >
                        اتصل واطلب
                      </a>
                      <button
                        type="button"
                        onClick={() => go("visit")}
                        className="inline-flex h-[46px] items-center rounded-[2px] border border-aj-cream/40 bg-transparent px-5 font-display text-sm font-bold text-aj-cream"
                      >
                        الموقع والأوقات
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* gold Ajami band divider */}
            <div
              aria-hidden
              className="h-[22px] bg-aj-gold/15"
              style={{ backgroundImage: AJAMI_URI, backgroundSize: "44px 22px" }}
            />

            {/* group filter (sticky) */}
            <div className="sticky top-[57px] z-40 border-b border-aj-ink/15 bg-aj-cream/95 px-[22px] py-3 backdrop-blur-md lg:top-[61px] lg:px-14">
              <div className="mx-auto w-full max-w-6xl">
                <div className="flex gap-[7px] overflow-x-auto">
                  {groups.map((g) => {
                    const on = activeGroup === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setGroup(g.id)}
                        className={`inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-[2px] border px-[15px] text-[13px] font-semibold leading-none ${
                          on ? "border-transparent bg-aj-gold " + ON_GOLD : "border-aj-ink/25 bg-transparent text-aj-ink"
                        }`}
                      >
                        {g.label}
                        <span className="font-serif text-[12.5px] opacity-70">
                          {arInt(items.filter((it) => it.group === g.id).length)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* menu list — two columns on desktop */}
            <section className="px-[22px] pb-[26px] pt-[18px] lg:px-14">
              <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-x-[44px] lg:grid-cols-2">
                {visibleItems.map((it, n) => (
                  <div
                    key={it.name}
                    style={{ animationDelay: `${n * 55}ms` }}
                    className="flex items-start gap-3.5 border-b border-aj-ink/15 py-4 animate-aj-rise motion-reduce:animate-none"
                  >
                    <Photo src={it.photo} alt={it.name} className="size-[62px] shrink-0 rounded-[2px] border border-aj-gold/50" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex flex-wrap items-baseline gap-[9px]">
                        <span className="font-display text-[15.5px] font-bold text-aj-ink">{it.name}</span>
                        {it.mark && (
                          <span className={`${K_SM} rounded-[2px] bg-aj-gold/20 px-2 py-[3px] text-aj-gold-deep`}>{it.mark}</span>
                        )}
                      </span>
                      {it.latin && <span className="font-serif text-xs text-aj-ink-soft">{it.latin}</span>}
                      {it.desc && <span className="text-[12.5px] leading-[1.7] text-aj-ink-soft text-pretty">{it.desc}</span>}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-[3px]">
                      <span className="font-serif text-[19px] leading-none text-aj-gold-deep">{it.price}</span>
                      <span className={`${K_SM} text-aj-ink-soft`}>{currency}</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ══════════ الزيارة ══════════ */}
        {page === "visit" && (
          <div className="flex flex-col bg-aj-cream animate-aj-page motion-reduce:animate-none">
            <section className="px-[22px] py-[28px] lg:px-14">
              <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-[26px] lg:grid-cols-2">
                {/* hours + address + contact */}
                <div className="flex flex-col gap-4">
                  <span className="flex flex-col gap-2">
                    <span className={`${K} text-aj-gold-deep`}>الزيارة</span>
                    <span className="font-display text-[21px] font-extrabold text-aj-ink lg:text-[26px]">الأوقات والموقع</span>
                  </span>
                  <div className="flex flex-col gap-2.5">
                    {hours.map((h) => (
                      <span key={h.days} className="flex items-baseline gap-2.5 text-[13.5px] text-aj-ink-soft">
                        <span className="whitespace-nowrap">{h.days}</span>
                        <span aria-hidden className="min-w-4 flex-[1_0_16px] border-b border-dotted border-aj-ink/30" />
                        <span className="whitespace-nowrap font-serif text-aj-ink">{h.time}</span>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col gap-[11px] border-t border-aj-gold/45 pt-4">
                    {shop.address && (
                      <span className="flex items-start gap-2.5 text-[13.5px] leading-[1.7] text-aj-ink-soft">
                        <span aria-hidden className="text-aj-gold-deep">◉</span>
                        <span className="text-pretty">{shop.address}</span>
                      </span>
                    )}
                    {visit.dineNote && (
                      <span className="flex items-start gap-2.5 text-[13.5px] leading-[1.7] text-aj-ink-soft">
                        <span aria-hidden className="text-aj-gold-deep">◈</span>
                        <span className="text-pretty">{visit.dineNote}</span>
                      </span>
                    )}
                    <div className="flex flex-wrap gap-[9px] pt-1.5">
                      <a
                        href={telHref ?? "#"}
                        className={`inline-flex h-11 items-center rounded-[2px] bg-aj-gold px-[18px] font-display text-[13.5px] font-bold ${ON_GOLD}`}
                      >
                        اتصل
                      </a>
                      {shop.phone && (
                        <button
                          type="button"
                          onClick={copyPhone}
                          className="inline-flex h-11 items-center gap-2.5 rounded-[2px] border border-aj-ink/30 px-4 text-[12.5px] font-semibold text-aj-ink"
                        >
                          <span dir="ltr" className="font-mono text-xs">{shop.phone}</span>
                          انسخ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {/* map + directions */}
                <div className="flex flex-col gap-2.5">
                  <div className="relative h-[200px] overflow-hidden rounded-[2px] border border-aj-gold/50 lg:h-[280px]">
                    <Photo src={visit.mapPhoto} alt="الموقع" className="absolute inset-0 size-full" />
                  </div>
                  <a
                    href={visit.directionsUrl || shop.mapsUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-[46px] items-center justify-center rounded-[2px] border border-aj-gold bg-aj-gold/15 font-display text-[13.5px] font-bold text-aj-gold-deep"
                  >
                    افتح الاتجاهات
                  </a>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ══ site footer (all pages) — green chrome, gold top border ══ */}
        <footer className="relative border-t-2 border-aj-gold bg-aj-green-700 px-[22px] py-[24px] pb-[28px] lg:px-14 lg:py-[36px]">
          <Texture size={46} opacity={0.16} />
          <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-x-10 gap-y-5 lg:grid-cols-[1.4fr_1fr_1fr]">
            <div className="flex flex-col gap-2">
              <span className="font-display text-lg font-extrabold text-aj-cream">{shop.name}</span>
              {shop.tagline && <span className={`${K_SM} text-aj-gold-200`}>{shop.tagline}</span>}
            </div>
            <div className="flex flex-col gap-2.5">
              <span className={`${K_SM} text-aj-gold-200`}>الصفحات</span>
              {TABS.map((t) => (
                <button key={t.id} type="button" onClick={() => go(t.id)} className="self-start text-[13px] text-aj-cream/90">
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              <span className={`${K_SM} text-aj-gold-200`}>تواصل</span>
              {shop.phone && (
                <a href={telHref} dir="ltr" className="self-start font-mono text-xs text-aj-cream/90">{shop.phone}</a>
              )}
              {shop.address && (
                <span className="text-[13px] leading-[1.7] text-aj-cream/85 text-pretty">{shop.address}</span>
              )}
              {socials.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {socials.map((s) => (
                    <span
                      key={s.title}
                      title={s.title}
                      className="inline-flex size-[38px] items-center justify-center rounded-[2px] border border-aj-gold/50 text-sm text-aj-cream"
                    >
                      {s.glyph}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </footer>

        {/* ══ bottom tab bar (mobile only): FIXED to the screen bottom ══ */}
        <nav className="fixed inset-x-0 bottom-0 z-60 mx-auto flex w-full max-w-107.5 items-stretch border-t-2 border-aj-gold bg-aj-green-700/95 backdrop-blur-lg lg:hidden">
          {TABS.map((t) => {
            const on = page === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-current={on}
                onClick={() => go(t.id)}
                className={`relative flex flex-1 flex-col items-center justify-center gap-[5px] px-1 pb-[13px] pt-[11px] transition-colors ${
                  on ? "text-aj-gold-200" : "text-aj-cream/70"
                }`}
              >
                {on && <span aria-hidden className="absolute inset-x-[30%] top-0 h-0.5 bg-aj-gold" />}
                {NAV_ICONS[t.id]}
                <span className={`whitespace-nowrap text-[10.5px] ${on ? "font-semibold" : "font-normal"}`}>{t.short}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ══ toast (copy phone) ══ */}
      {toast && (
        <div className="fixed inset-x-0 bottom-[76px] z-[90] flex justify-center px-4 lg:bottom-6">
          <span className="inline-flex items-center gap-2.5 rounded-[2px] border border-aj-gold/60 bg-aj-green-800 px-4 py-3 text-[13px] text-aj-cream shadow-lg animate-aj-rise motion-reduce:animate-none">
            <span className={`inline-flex size-5 items-center justify-center rounded-full bg-aj-gold ${ON_GOLD}`}>✓</span>
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}
