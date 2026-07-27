"use client";

/**
 * Foul & Fatteh (Ajami) — Sawwi template
 * A Damascene foul-and-fatteh house, menu-first, PHONE-first, full-bleed
 * responsive, Arabic RTL. Mirrors the barbershop's inline-editing model — the
 * SAME markup renders on the published site and inside the builder; the
 * `EditableText` / `EditableImage` primitives are inert when published and turn
 * editable in the builder (double-click text, hover images/lists).
 *
 *   القائمة   the menu — an Ajami "cover" hero, an inline-editable group filter
 *             (foul/fatteh/…), and a two-column dish list (add/remove inline).
 *   الزيارة   weekly hours + address + phone (call/copy).
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
import { EditableText, EditableImage, useEdit, useEditList } from "@/components/templates/inline-edit";
import {
  WhatsAppIcon,
  PhoneIcon,
  SocialLinks,
  useOpenNow,
  groupHours,
  type HoursRow,
} from "@/components/templates/site-chrome";

/** Foul palette for the shared social chips (green chrome, gold border, cream). */
const SOCIAL_CHIP = "size-[38px] rounded-[2px] border border-aj-gold/50 text-aj-cream hover:text-aj-cream";

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

export interface ShopContent {
  name: string;
  /** optional uploaded logo (storage URL); shows in the header when set. */
  logo?: string;
  tagline?: string;
  heroLine?: string;
  heroPhoto?: string;
  /** number the shop is called on — the CTA everywhere is "اتصل" */
  phone?: string;
  /** optional; when set, a WhatsApp text link shows in the footer. */
  whatsapp?: string;
  address?: string;
  socials?: { instagram?: string; facebook?: string; tiktok?: string };
  /** short opening line shown in the cover, e.g. "٦:٠٠ ص – ١:٠٠ م" */
  hoursNote?: string;
  /** editable overrides for the visit (الزيارة) section heading */
  visitKicker?: string;
  visitTitle?: string;
}

export interface VisitContent {
  /** a short line under the address, e.g. "تناول في المحلّ · طلبات خارجية" */
  dineNote?: string;
}

export interface FoulFattehProps {
  shop: ShopContent;
  groups: Group[];
  items: MenuItem[];
  hours: HoursRow[];
  visit?: VisitContent;
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

/** Arabic label — Readex/sans, never mono (mono has no Arabic coverage and
 *  positive tracking breaks the cursive joins). */
const K = "whitespace-nowrap font-sans text-[11.5px] font-semibold leading-[1.5] tracking-[0.07em]";
const K_SM = "whitespace-nowrap font-sans text-[11px] font-semibold leading-[1.5] tracking-[0.06em]";
/** dark green text on a gold fill — kept fixed so it stays legible on gold. */
const ON_GOLD = "text-[oklch(0.24_0.04_165)]";

const waLink = (n: string) => `https://wa.me/${n.replace(/\D/g, "")}`;

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
  currency = "ل.س",
  className,
}: FoulFattehProps) {
  const openNow = useOpenNow(hours);
  const editApi = useEdit();
  const itemEdit = useEditList("items", items);
  const groupEdit = useEditList("groups", groups);
  // Removing a category also drops its dishes, in one commit (atomic).
  const removeGroup = (index: number) => {
    const gid = groups[index]?.id;
    editApi?.setMany({
      groups: groups.filter((_, i) => i !== index),
      items: items.filter((it) => it.group !== gid),
    });
  };

  const [page, setPage] = React.useState<Page>("menu");
  const [group, setGroup] = React.useState(groups[0]?.id);
  const [toast, setToast] = React.useState<string | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // Fall back to the first available id when a stored filter goes stale under
  // live editing (the whole group set can be swapped in the editor).
  const activeGroup = groups.some((g) => g.id === group) ? group : groups[0]?.id;
  // Index against the FULL list — filtering then indexing writes the wrong row.
  const visible = items.map((it, i) => ({ it, i })).filter(({ it }) => it.group === activeGroup);

  const telHref = shop.phone ? `tel:${shop.phone.replace(/\s/g, "")}` : undefined;

  const go = (p: Page) => setPage(p);

  const copyPhone = () => {
    if (!shop.phone) return;
    try { navigator.clipboard?.writeText(shop.phone); } catch { /* clipboard blocked */ }
    setToast(`تم نسخ الرقم · ${shop.phone}`);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  };

  const chip = (on: boolean) =>
    on ? "border-transparent bg-aj-gold " + ON_GOLD : "border-aj-ink/25 bg-transparent text-aj-ink";

  const TABS: Array<{ id: Page; label: string; short: string }> = [
    { id: "menu", label: "القائمة", short: "القائمة" },
    { id: "visit", label: "الزيارة", short: "الزيارة" },
  ];

  return (
    <div
      dir="rtl"
      // A real, full-bleed website — the deep-green ground fills the viewport
      // behind the cream content; the sticky green header and fixed bottom tabs
      // pin to the viewport. overflow-x-CLIP (not hidden) so it doesn't become a
      // scroll container that would break the sticky header on mobile.
      className={`relative min-h-dvh w-full overflow-x-clip bg-aj-green font-sans text-aj-ink ${className ?? ""}`}
    >
      {/* Content column — a single readable column on phones, full-width website
          on desktop. Each section re-centers its content in a max-w container. */}
      <div className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col pb-16 lg:max-w-none lg:pb-0">
        {/* ══ site header (green chrome, gold top border, Ajami lattice) ══ */}
        <header className="sticky top-0 z-50 border-b-2 border-aj-gold bg-aj-green-700">
          <Texture size={46} opacity={0.18} />
          <div className="relative mx-auto flex w-full max-w-6xl items-center gap-3 px-[22px] py-3 lg:px-14">
            {(shop.logo || editApi?.editing) && (
              <EditableImage path="shop.logo" className="size-10 shrink-0 overflow-hidden rounded-[3px]">
                <Photo src={shop.logo} alt={shop.name} className="size-10 shrink-0 rounded-[3px] border border-aj-gold/50" />
              </EditableImage>
            )}
            <span className="flex flex-col gap-0.5">
              <EditableText
                path="shop.name"
                value={shop.name}
                className="font-display text-base font-extrabold leading-[1.35] text-aj-cream lg:text-lg"
              />
              <EditableText
                path="shop.tagline"
                value={shop.tagline ?? ""}
                placeholder="الشعار"
                className={`${K_SM} text-aj-gold-200`}
              />
            </span>

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

            {/* live open indicator (desktop) */}
            {openNow !== null && (
              <span
                className={`hidden shrink-0 items-center gap-2 text-[12.5px] lg:inline-flex ${
                  openNow ? "text-aj-cream/90" : "text-aj-gold-200"
                }`}
              >
                <span
                  aria-hidden
                  className={`size-[7px] rounded-full ${
                    openNow ? "bg-[oklch(0.78_0.13_145)] animate-aj-pulse motion-reduce:animate-none" : "bg-current"
                  }`}
                />
                {openNow ? "مفتوح الآن" : "مغلق الآن"}
              </span>
            )}

            <div className="ms-auto flex items-center gap-2 lg:ms-4 lg:gap-3">
              <SocialLinks socials={shop.socials} size="size-4" itemClassName={SOCIAL_CHIP} />
              <a
                href={telHref ?? "#"}
                className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[2px] bg-aj-gold px-3.5 font-display text-[12.5px] font-bold ${ON_GOLD}`}
              >
                <PhoneIcon className="size-3.5" />
                اتصل
              </a>
            </div>
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
                  {/* editable hero photo — dimmed background layer. Positioning is on
                      the <Photo> itself so it survives on the published site (where
                      EditableImage renders its children directly, no wrapper). */}
                  {(shop.heroPhoto || editApi?.editing) && (
                    <EditableImage path="shop.heroPhoto" className="absolute inset-0">
                      <Photo src={shop.heroPhoto} alt={shop.name} className="absolute inset-0 size-full opacity-40" />
                    </EditableImage>
                  )}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_top,oklch(0.27_0.05_165)_12%,oklch(0.27_0.05_165/.8)_62%,oklch(0.27_0.05_165/.5)_100%)]"
                  />
                  {/* content sits above (z-30); it's pointer-events-none so the hero
                      image's edit overlay stays reachable in the gaps, while the
                      interactive/editable children opt back in to pointer events. */}
                  <div className="relative z-30 flex flex-col gap-[15px] p-[24px_22px_26px] pointer-events-none lg:p-[44px_46px] [&_.sw-edit]:pointer-events-auto [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
                    <span className={`${K} text-aj-gold-200 animate-aj-rise motion-reduce:animate-none`}>القائمة</span>
                    <EditableText
                      path="shop.heroLine"
                      value={shop.heroLine ?? "فول وفتّة"}
                      multiline
                      className="font-display text-[30px] font-extrabold leading-[1.3] -tracking-[0.02em] text-aj-cream animate-aj-rise motion-reduce:animate-none lg:text-[46px]"
                    />
                    <span aria-hidden className="h-px w-full origin-right bg-[linear-gradient(to_left,oklch(0.72_0.1_85/.7),transparent)] animate-aj-rule motion-reduce:animate-none" />
                    <div className="flex flex-wrap gap-x-[22px] gap-y-2 animate-aj-rise motion-reduce:animate-none">
                      {(shop.hoursNote || editApi?.editing) && (
                        <span className="inline-flex items-center gap-2 text-[13px] text-aj-cream/90">
                          <span aria-hidden className="text-aj-gold-300">◷</span>
                          <EditableText path="shop.hoursNote" value={shop.hoursNote ?? ""} placeholder="أوقات الدوام" />
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
                        className={`inline-flex h-[46px] items-center gap-2 rounded-[2px] bg-aj-gold px-5 font-display text-sm font-bold ${ON_GOLD}`}
                      >
                        <PhoneIcon className="size-4" />
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

            {/* group filter (sticky) — inline-editable tabs with add/remove */}
            <div className="sticky top-[57px] z-40 border-b border-aj-ink/15 bg-aj-cream/95 px-[22px] py-3 backdrop-blur-md lg:top-[61px] lg:px-14">
              <div className="mx-auto w-full max-w-6xl">
                <div className="flex gap-[7px] overflow-x-auto overscroll-x-contain pb-0.5">
                  {groups.map((g, gi) =>
                    groupEdit.editing ? (
                      <span
                        key={g.id}
                        onClick={() => setGroup(g.id)}
                        title="انقر للاختيار · انقر مرتين لإعادة التسمية"
                        className={`group/tab relative inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-[2px] border ps-[15px] pe-2.5 text-[13px] font-semibold leading-none ${chip(activeGroup === g.id)} ${activeGroup === g.id ? "ring-2 ring-aj-gold/60 ring-offset-2 ring-offset-aj-cream" : ""}`}
                      >
                        <EditableText
                          value={g.label}
                          placeholder="القسم"
                          keepLatinDigits
                          onCommit={(t) => groupEdit.setField(gi, "label", t)}
                        />
                        {groups.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeGroup(gi); }}
                            aria-label="حذف القسم"
                            title="حذف القسم"
                            className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-aj-gold-deep text-[11px] leading-none text-aj-cream"
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    ) : (
                      <button
                        key={g.id}
                        type="button"
                        aria-pressed={activeGroup === g.id}
                        onClick={() => setGroup(g.id)}
                        className={`inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-[2px] border px-[15px] text-[13px] font-semibold leading-none ${chip(activeGroup === g.id)}`}
                      >
                        {g.label}
                      </button>
                    ),
                  )}
                  {groupEdit.editing && (
                    <button
                      type="button"
                      onClick={() => {
                        const id = "g" + Math.random().toString(36).slice(2, 8);
                        groupEdit.add({ id, label: "قسم جديد" });
                        setGroup(id); // select it so its (empty) dishes show for editing
                      }}
                      aria-label="إضافة قسم"
                      className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[2px] border border-dashed border-aj-ink/35 px-4 text-[13px] font-semibold leading-none text-aj-ink/70 transition-colors hover:border-aj-gold hover:text-aj-ink"
                    >
                      <span className="text-base leading-none">＋</span> قسم
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* menu list — two columns on desktop */}
            <section className="px-[22px] pb-[26px] pt-[18px] lg:px-14">
              <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-x-[44px] lg:grid-cols-2">
                {visible.map(({ it, i }, n) => (
                  <div
                    key={`item-${i}`}
                    style={{ animationDelay: `${n * 55}ms` }}
                    className="group/item relative flex items-start gap-3.5 border-b border-aj-ink/15 py-4 animate-aj-rise motion-reduce:animate-none"
                  >
                    <EditableImage onChange={(url) => itemEdit.setField(i, "photo", url)} className="size-[62px] shrink-0 rounded-[2px]">
                      <Photo src={it.photo} alt={it.name} className="size-[62px] shrink-0 rounded-[2px] border border-aj-gold/50" />
                    </EditableImage>
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex flex-wrap items-baseline gap-[9px]">
                        <EditableText value={it.name} onCommit={(t) => itemEdit.setField(i, "name", t)} className="font-display text-[15.5px] font-bold text-aj-ink" />
                        <EditableText value={it.mark ?? ""} placeholder="وسم" onCommit={(t) => itemEdit.setField(i, "mark", t)} className={`${K_SM} rounded-[2px] bg-aj-gold/20 px-2 py-[3px] text-aj-gold-deep`} />
                      </span>
                      <EditableText value={it.latin ?? ""} placeholder="بالإنجليزية" keepLatinDigits onCommit={(t) => itemEdit.setField(i, "latin", t)} className="font-serif text-xs text-aj-ink-soft" />
                      <EditableText value={it.desc ?? ""} placeholder="أضف وصفًا…" multiline onCommit={(t) => itemEdit.setField(i, "desc", t)} className="text-[12.5px] leading-[1.7] text-aj-ink-soft text-pretty" />
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-[3px]">
                      <EditableText value={it.price} onCommit={(t) => itemEdit.setField(i, "price", t)} className="font-serif text-[19px] leading-none text-aj-gold-deep" />
                      <span className={`${K_SM} text-aj-ink-soft`}>{currency}</span>
                    </span>
                    {itemEdit.editing && (
                      <button
                        type="button"
                        onClick={() => itemEdit.remove(i)}
                        aria-label="حذف الطبق"
                        className="absolute -end-2 -top-2 z-10 inline-flex size-6 cursor-pointer items-center justify-center rounded-full bg-aj-gold-deep text-xs text-aj-cream shadow"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {itemEdit.editing && (
                  <button
                    type="button"
                    onClick={() => itemEdit.add({ group: activeGroup ?? groups[0]?.id ?? "", name: "طبق جديد", latin: "", desc: "", price: "٠", mark: "", photo: "" })}
                    className="my-4 flex cursor-pointer items-center justify-center gap-2 rounded-[2px] border border-dashed border-aj-ink/30 py-4 text-sm font-semibold text-aj-ink/70 transition-colors hover:border-aj-gold hover:text-aj-ink"
                  >
                    <span className="text-lg leading-none">＋</span> إضافة طبق
                  </button>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ══════════ الزيارة ══════════ */}
        {page === "visit" && (
          <div className="flex flex-col bg-aj-cream animate-aj-page motion-reduce:animate-none">
            <section className="px-[22px] py-[28px] lg:px-14">
              <div className="mx-auto w-full max-w-6xl">
                {/* hours + address + contact */}
                <div className="flex flex-col gap-4">
                  <span className="flex flex-col gap-2">
                    <EditableText path="shop.visitKicker" value={shop.visitKicker ?? "الزيارة"} className={`${K} text-aj-gold-deep`} />
                    <EditableText path="shop.visitTitle" value={shop.visitTitle ?? "الأوقات والموقع"} className="font-display text-[21px] font-extrabold text-aj-ink lg:text-[26px]" />
                  </span>
                  <div className="flex flex-col gap-2.5">
                    {groupHours(hours).map((g, i) => (
                      <span key={`hours-${i}`} className="flex items-baseline gap-2.5 text-[13.5px] text-aj-ink-soft">
                        <span className="whitespace-nowrap">{g.label}</span>
                        <span aria-hidden className="min-w-4 flex-[1_0_16px] border-b border-dotted border-aj-ink/30" />
                        <span className={`whitespace-nowrap font-serif ${g.time === "مغلق" ? "text-aj-gold-deep" : "text-aj-ink"}`}>{g.time}</span>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col gap-[11px] border-t border-aj-gold/45 pt-4">
                    {(shop.address || editApi?.editing) && (
                      <span className="flex items-start gap-2.5 text-[13.5px] leading-[1.7] text-aj-ink-soft">
                        <span aria-hidden className="text-aj-gold-deep">◉</span>
                        <EditableText path="shop.address" value={shop.address ?? ""} placeholder="العنوان" multiline className="text-pretty" />
                      </span>
                    )}
                    {(visit.dineNote || editApi?.editing) && (
                      <span className="flex items-start gap-2.5 text-[13.5px] leading-[1.7] text-aj-ink-soft">
                        <span aria-hidden className="text-aj-gold-deep">◈</span>
                        <EditableText path="visit.dineNote" value={visit.dineNote ?? ""} placeholder="ملاحظة الخدمة…" multiline className="text-pretty" />
                      </span>
                    )}
                    <div className="flex flex-wrap gap-[9px] pt-1.5">
                      <a
                        href={telHref ?? "#"}
                        className={`inline-flex h-11 items-center gap-2 rounded-[2px] bg-aj-gold px-[18px] font-display text-[13.5px] font-bold ${ON_GOLD}`}
                      >
                        <PhoneIcon className="size-4" />
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
              </div>
            </section>
          </div>
        )}

        {/* ══ site footer (all pages) — green chrome, gold top border ══ */}
        <footer className="relative border-t-2 border-aj-gold bg-aj-green-700 px-[22px] py-[24px] pb-[28px] lg:px-14 lg:py-[36px]">
          <Texture size={46} opacity={0.16} />
          <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-x-10 gap-y-5 lg:grid-cols-[1.4fr_1fr_1fr]">
            <div className="flex flex-col gap-2">
              <EditableText path="shop.name" value={shop.name} className="font-display text-lg font-extrabold text-aj-cream" />
              <EditableText path="shop.tagline" value={shop.tagline ?? ""} placeholder="الشعار" className={`${K_SM} text-aj-gold-200`} />
              {openNow !== null && (
                <span
                  className={`mt-1 inline-flex items-center gap-[7px] text-[12.5px] ${
                    openNow ? "text-[oklch(0.82_0.13_150)]" : "text-aj-gold-200"
                  }`}
                >
                  <span
                    className={`size-[7px] rounded-full bg-current ${openNow ? "animate-aj-pulse motion-reduce:animate-none" : ""}`}
                  />
                  {openNow ? "مفتوح الآن" : "مغلق الآن"}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2.5">
              <span className={`${K_SM} text-aj-gold-200`}>الصفحات</span>
              {TABS.map((t) => (
                <button key={t.id} type="button" onClick={() => go(t.id)} className="self-start text-[13px] text-aj-cream/90 hover:text-aj-cream">
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              <span className={`${K_SM} text-aj-gold-200`}>تواصل</span>
              {shop.phone && (
                <a href={telHref} className="flex items-center gap-2.5 self-start text-aj-cream/90 transition-colors hover:text-aj-cream">
                  <PhoneIcon className="size-4 text-aj-gold-300" />
                  <span dir="ltr" className="font-mono text-xs">{shop.phone}</span>
                </a>
              )}
              {shop.whatsapp && (
                <a
                  href={waLink(shop.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 self-start text-aj-cream/90 transition-colors hover:text-aj-cream"
                >
                  <WhatsAppIcon className="size-4 text-aj-gold-300" />
                  <span dir="ltr" className="font-mono text-xs">{shop.whatsapp}</span>
                </a>
              )}
              {(shop.address || editApi?.editing) && (
                <span className="flex items-start gap-2.5 text-[13px] leading-[1.7] text-aj-cream/85">
                  <span aria-hidden className="text-aj-gold-300">◉</span>
                  <EditableText path="shop.address" value={shop.address ?? ""} placeholder="العنوان" multiline className="text-pretty" />
                </span>
              )}
              <SocialLinks socials={shop.socials} className="pt-1" itemClassName={SOCIAL_CHIP} />
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
