"use client";

/**
 * Restaurant — Sawwi template
 * A Damascene restaurant, full-bleed responsive website, Arabic RTL.
 *
 *   الرئيسية  season specials + course-filtered dishes with allergen codes
 *   المطعم    hero + tasting menu + why + signature dishes + gallery + reviews
 *             followed by chef quote + stats + history timeline + private hall
 *   الحجز     day/time/party reservation picker → a ready WhatsApp message
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Static vs. editable is a TYPE-LEVEL split (same idea as the barbershop):
 *
 *   ALLERGEN_LABELS — universal, frozen. Ships inside the component; a restaurant
 *                     never retypes "G = جلوتين".
 *   RestaurantProps — everything a restaurant fills in: shop info, dishes,
 *                     season, story, hours, reservation options, photos.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Tokenization mirrors the barbershop: only THREE colors are themeable, read
 * from CSS variables so TemplateHost can override them per-site —
 *   accent → --color-gold   ground → --color-warm   ink → --color-cream
 * Everything else is a fixed design value.
 */

import * as React from "react";
import { whatsappLink } from "@/lib/whatsapp";

/* ────────────────────────────── types ────────────────────────────── */

export type Page = "home" | "about" | "visit";

export interface Course {
  id: string;
  label: string;
}

export interface Dish {
  /** course id — must match a Course */
  course: string;
  name: string;
  latin?: string;
  desc?: string;
  price: string;
  /** small gold label: "الأكثر طلبًا", "نباتي" … */
  mark?: string;
  /** suggested pairing, shown in the detail sheet */
  pair?: string;
  /** allergen codes, e.g. ["G","D","N"] — see ALLERGEN_LABELS */
  allergens?: string[];
  photo?: string;
}

export interface Pillar {
  /** icon key — farm | coal | book (falls back to a dot) */
  icon?: string;
  title: string;
  body?: string;
}

export interface SeasonItem {
  tag?: string;
  name: string;
  note?: string;
}

export interface Review {
  stars?: string;
  quote: string;
  name: string;
}

export interface Milestone {
  year: string;
  title: string;
  body?: string;
  /** the "today" node — dot shown in gold */
  now?: boolean;
}

export interface GalleryItem {
  label: string;
  photo?: string;
}

export interface HoursRow {
  days: string;
  time: string;
}

export interface ChefStat {
  value: string;
  label: string;
}

export interface ShopContent {
  name: string;
  latinName?: string;
  tagline?: string;
  heroLine?: string;
  heroLatin?: string;
  heroBlurb?: string;
  heroPhoto?: string;
  brandNote?: string;
  openNote?: string;
  address?: string;
  mapsUrl?: string;
  /** digits only — REQUIRED */
  whatsapp: string;
  phone?: string;
  since?: string;
}

export interface TastingContent {
  title?: string;
  blurb?: string;
  price?: string;
  unit?: string;
  photo?: string;
}

export interface ChefContent {
  name?: string;
  quote?: string;
  photo?: string;
  stats?: ChefStat[];
}

export interface HallContent {
  title?: string;
  body?: string;
  photo?: string;
}

export interface ReservationContent {
  days?: Array<{ label: string; date?: string }>;
  times?: string[];
  party?: string[];
}

export interface VisitContent {
  parking?: string;
  mapPhoto?: string;
  directionsUrl?: string;
}

export interface RestaurantProps {
  shop: ShopContent;
  pillars: Pillar[];
  courses: Course[];
  dishes: Dish[];
  /** indices into `dishes` shown as home-page signatures */
  featured?: number[];
  reviews: Review[];
  chef: ChefContent;
  hall?: HallContent;
  milestones: Milestone[];
  gallery: GalleryItem[];
  hours: HoursRow[];
  reservation?: ReservationContent;
  visit?: VisitContent;
  socials?: Array<{ title: string; glyph: string }>;
  showGallery?: boolean;
  currency?: string;
  className?: string;
}

/* ─────────────── ALLERGENS · universal, frozen ─────────────── */

export const ALLERGEN_LABELS: Record<string, string> = {
  G: "جلوتين",
  D: "حليب",
  N: "مكسّرات",
  S: "سمسم",
  F: "أسماك",
  E: "بيض",
  H: "حار",
};

/* fallbacks so the design reads complete before any content is entered */
export const defaultCourses: Course[] = [
  { id: "mezze", label: "مقبّلات" },
  { id: "mains", label: "أطباق رئيسية" },
  { id: "grill", label: "من الفحم" },
  { id: "sea", label: "بحريات" },
  { id: "sweet", label: "حلويات" },
];

export const defaultReservation: Required<ReservationContent> = {
  days: [
    { label: "الخميس", date: "٣٠/٧" },
    { label: "الجمعة", date: "٣١/٧" },
    { label: "السبت", date: "١/٨" },
    { label: "الأحد", date: "٢/٨" },
  ],
  times: ["٧:٣٠", "٨:٣٠", "٩:٣٠", "١٠:٣٠"],
  party: ["٢", "٣", "٤", "٦", "٨"],
};

/* ───────────────────────────── helpers ───────────────────────────── */

const AR = "٠١٢٣٤٥٦٧٨٩";
export const arInt = (n: number | string) => String(n).replace(/\d/g, (d) => AR[Number(d)]);

/** Arabic label — Readex/sans, never mono (mono has no Arabic coverage). */
const K = "whitespace-nowrap font-sans text-[11.5px] font-semibold leading-[1.5] tracking-[0.07em]";
const K_SM = "whitespace-nowrap font-sans text-[11px] font-semibold leading-[1.5] tracking-[0.06em]";
/** dark text on a gold fill — kept fixed so it stays legible on gold. */
const ON_GOLD = "text-[oklch(0.16_0.03_70)]";

/* ── icons ── */
const WhatsAppIcon = ({ className = "size-[17px]" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={className}>
    <path d="M8 1.5a6.5 6.5 0 0 0-5.6 9.8L1.5 14.5l3.4-.9A6.5 6.5 0 1 0 8 1.5z" />
  </svg>
);
const Chevron = ({ className = "size-3.5" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="none" className={`${className} -scale-x-100`} aria-hidden>
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
    <path d="M4 10.5 12 4l8 6.5V20H4v-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.5 20v-5.5h5V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChefIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
    <path d="M7 21h10M6.5 17h11M7 17c-2 0-3.5-1.6-3.5-3.6 0-2 1.6-3.4 3.4-3.4.3-2 2-3.5 4.1-3.5s3.8 1.5 4.1 3.5c1.8 0 3.4 1.4 3.4 3.4 0 2-1.5 3.6-3.5 3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
    <path d="M4 6.5h16v14H4zM4 10h16M8.5 3v4M15.5 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PILLAR_ICONS: Record<string, React.ReactNode> = {
  farm: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden>
      <path d="M12 21V9M12 9c0-3 2-5 5-5 0 3-2 5-5 5zM12 12c0-3-2-5-5-5 0 3 2 5 5 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  coal: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden>
      <path d="M12 3c1 3 4 4 4 7.5a4 4 0 0 1-8 0C8 8 9.5 7 10 5.5c1.2.8 1.6 2 2 2.5.4-1.4 0-3.5 0-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden>
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13zM11 4h7.5c.8 0 1.5.7 1.5 1.5v13c0 .8-.7 1.5-1.5 1.5H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const NAV_ICONS: Record<Page, React.ReactNode> = {
  home: <HomeIcon />,
  about: <ChefIcon />,
  visit: <CalIcon />,
};

/** Visible placeholder — warm wash, so the layout reads before upload. */
function Photo({ src, alt, className = "" }: { src?: string; alt: string; className?: string }) {
  return (
    <span className={`relative block overflow-hidden bg-[oklch(0.2_0.008_60)] ${className}`}>
      <span aria-hidden className="absolute inset-0 bg-[repeating-linear-gradient(-38deg,rgba(250,246,240,.05)_0_1px,transparent_1px_9px)]" />
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="absolute inset-0 size-full object-cover" />
      )}
    </span>
  );
}

/** The gold "احجز طاولة" CTA — an anchor to the WhatsApp link. */
function GoldCta({ href, label, className = "" }: { href: string; label: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-[3px] bg-gold font-display font-bold ${ON_GOLD} ${className}`}
    >
      {label}
    </a>
  );
}

/** Section kicker + title. */
function Kicker({ kicker, title, size = "text-[21px]" }: { kicker: string; title?: string; size?: string }) {
  return (
    <span className="flex flex-col gap-[7px]">
      <span className={`${K} text-gold-300`}>{kicker}</span>
      {title && (
        <span className={`font-display font-extrabold leading-[1.42] text-cream ${size}`}>{title}</span>
      )}
    </span>
  );
}

/* ──────────────────────────── component ──────────────────────────── */

export default function Restaurant({
  shop,
  pillars,
  courses = defaultCourses,
  dishes,
  featured = [],
  reviews,
  chef = {},
  hall = {},
  milestones,
  gallery,
  hours,
  reservation,
  visit = {},
  socials = [],
  showGallery = true,
  currency = "ل.س",
  className,
}: RestaurantProps) {
  const res = { ...defaultReservation, ...reservation };
  const resDaysList = res.days.length ? res.days : defaultReservation.days;
  const resTimesList = res.times.length ? res.times : defaultReservation.times;
  const resPartyList = res.party.length ? res.party : defaultReservation.party;

  const [page, setPage] = React.useState<Page>("home");
  const [course, setCourse] = React.useState(courses[0]?.id);
  const [dish, setDish] = React.useState(-1);
  const [resDay, setResDay] = React.useState(Math.min(1, resDaysList.length - 1));
  const [resTime, setResTime] = React.useState(Math.min(1, resTimesList.length - 1));
  const [party, setParty] = React.useState(Math.min(1, resPartyList.length - 1));
  const [toast, setToast] = React.useState<string | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // Fall back to the first available id when a stored filter goes stale under
  // live editing (the whole course/tab set can be swapped in the editor).
  const activeCourse = courses.some((c) => c.id === course) ? course : courses[0]?.id;

  // index against the FULL list — filter then index would open the wrong sheet
  const visibleDishes = dishes.map((d, i) => ({ d, i })).filter(({ d }) => d.course === activeCourse);
  const openDish = dish >= 0 ? dishes[dish] : null;
  const featuredDishes = featured.map((i) => ({ d: dishes[i], i })).filter(({ d }) => d);

  const resDayObj = resDaysList[resDay] ?? resDaysList[0];
  const resSummary = `${resDayObj?.label ?? ""} · ${resTimesList[resTime] ?? ""}`;
  const resPartyLabel = `${resPartyList[party] ?? ""} أشخاص`;
  const waMessage =
    `مرحبًا ${shop.name}، أرغب بحجز طاولة: ${resSummary}` +
    `${resDayObj?.date ? ` (${resDayObj.date})` : ""} لـ ${resPartyLabel}. شكرًا.`;
  const waHref = whatsappLink(shop.whatsapp, waMessage);
  const telHref = shop.phone ? `tel:${shop.phone.replace(/\s/g, "")}` : undefined;

  const go = (p: Page) => {
    setPage(p);
    setDish(-1);
  };
  const openFeatured = (i: number) => {
    const d = dishes[i];
    if (d) setCourse(d.course);
    setDish(i);
  };

  const copyPhone = () => {
    if (!shop.phone) return;
    try { navigator.clipboard?.writeText(shop.phone); } catch { /* clipboard blocked */ }
    setToast(`تم نسخ الرقم · ${shop.phone}`);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3800);
  };

  const chip = (on: boolean) =>
    on
      ? "border-transparent bg-gold " + ON_GOLD
      : "border-cream/[0.22] bg-transparent text-cream/90";

  const TABS: Array<{ id: Page; label: string; short: string }> = [
    { id: "home", label: "الرئيسية", short: "الرئيسية" },
    { id: "about", label: "المطعم", short: "المطعم" },
    { id: "visit", label: "الحجز والزيارة", short: "الحجز" },
  ];

  return (
    <div
      dir="rtl"
      className={`relative min-h-dvh w-full overflow-x-hidden bg-warm font-sans text-cream ${className ?? ""}`}
    >
      {/* Content column — a single readable column on phones, full-width website
          on desktop. Each section re-centers its content in a max-w container. */}
      <div className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col pb-16 lg:max-w-none lg:pb-0">
        {/* ══ site header (holds the desktop top-nav) ══ */}
        <header className="sticky top-0 z-50 border-b border-cream/[0.12] bg-warm/95 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-[22px] py-3 lg:px-14">
            <button
              type="button"
              onClick={() => go("home")}
              className="flex flex-col gap-0.5 text-start"
            >
              <span className="font-display text-base font-extrabold leading-[1.4] text-cream lg:text-lg">
                {shop.name}
              </span>
              {shop.brandNote && (
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gold-400">
                  {shop.brandNote}
                </span>
              )}
            </button>

            {/* desktop top-nav — the three pages as horizontal links */}
            <nav className="mx-auto hidden items-center gap-1 lg:flex">
              {TABS.map((t) => {
                const on = page === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-current={on}
                    onClick={() => go(t.id)}
                    className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-[13px] font-semibold leading-none transition-colors ${
                      on ? "bg-cream/10 text-gold" : "text-cream/70 hover:text-cream"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </nav>

            <GoldCta href={waHref} label="احجز طاولة" className="ms-auto h-9 px-3.5 text-[12.5px] lg:ms-0 lg:h-[38px] lg:px-[17px] lg:text-[13px]" />
          </div>
        </header>

        {/* ══════════ المطعم · part one — hero, tasting, why, signatures, gallery, reviews ══════════ */}
        {page === "about" && (
          <div className="flex flex-col animate-rst-page motion-reduce:animate-none">
            {/* hero */}
            <section className="relative overflow-hidden">
              <span aria-hidden className="absolute inset-0 opacity-[0.32]">
                <Photo src={shop.heroPhoto} alt={shop.name} className="size-full" />
              </span>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,oklch(0.115_0.006_60)_8%,oklch(0.115_0.006_60/.82)_55%,oklch(0.115_0.006_60/.4)_100%)]"
              />
              <div className="mx-auto w-full max-w-6xl px-[22px] py-[26px] pb-[30px] lg:px-14 lg:py-16">
                <div className="relative flex max-w-[46ch] flex-col gap-[18px] lg:max-w-[38ch]">
                  <span className={`${K} text-gold-300 animate-rst-rise motion-reduce:animate-none`}>
                    {shop.tagline ?? "مطبخ شامي"}
                  </span>
                  <span className="font-display text-[27px] font-extrabold leading-[1.32] -tracking-[0.02em] text-balance text-cream lg:text-5xl">
                    {shop.heroLine ?? "طعام يُطبَخ كما كان يُطبَخ"}
                  </span>
                  {shop.heroLatin && (
                    <span className="font-serif text-sm italic tracking-[0.04em] text-gold-200">
                      {shop.heroLatin}
                    </span>
                  )}
                  <span aria-hidden className="h-px w-full origin-right bg-[linear-gradient(to_left,oklch(0.76_0.09_85/.55),transparent)] animate-rst-rule motion-reduce:animate-none" />
                  {shop.heroBlurb && (
                    <span className="max-w-[46ch] text-sm leading-[1.9] text-cream/[0.84] text-pretty">
                      {shop.heroBlurb}
                    </span>
                  )}
                  <div className="flex flex-wrap gap-[9px]">
                    <GoldCta href={waHref} label="احجز طاولة" className="h-12 px-[22px] text-[14.5px]" />
                    <button
                      type="button"
                      onClick={() => go("home")}
                      className="inline-flex h-12 items-center rounded-[3px] border border-cream/[0.28] bg-transparent px-[22px] font-display text-[14.5px] font-bold text-cream/95"
                    >
                      تصفّح القائمة
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-x-[22px] gap-y-2 pt-1.5">
                    {shop.openNote && (
                      <span className="inline-flex items-center gap-[7px] text-[12.5px] text-[oklch(0.82_0.06_145)]">
                        <span className="size-[7px] rounded-full bg-current animate-pulse-soft motion-reduce:animate-none" />
                        {shop.openNote}
                      </span>
                    )}
                    {shop.address && (
                      <span className="inline-flex items-center gap-[7px] text-[12.5px] text-cream/80">
                        <span aria-hidden className="text-gold-200">◉</span>
                        {shop.address}
                      </span>
                    )}
                    {shop.phone && (
                      <a href={telHref} className="inline-flex items-center gap-[7px] text-[12.5px] text-cream/80">
                        <span aria-hidden className="text-gold-200">✆</span>
                        <span dir="ltr" className="font-mono">{shop.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* why — pillars */}
            {pillars.length > 0 && (
              <section className="border-t border-cream/10 px-[22px] py-[26px] lg:px-14 lg:py-16">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-[18px]">
                  <Kicker kicker="لماذا هنا" title="ما لا نتنازل عنه" />
                  <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
                    {pillars.map((p) => (
                      <div key={p.title} className="flex flex-col gap-2.5 rounded border border-cream/[0.12] bg-cream/[0.04] p-[18px]">
                        <span className="text-gold-300">{p.icon && PILLAR_ICONS[p.icon] ? PILLAR_ICONS[p.icon] : <span className="block size-[9px] rounded-sm bg-gold" />}</span>
                        <span className="font-display text-[15px] font-bold text-cream">{p.title}</span>
                        {p.body && <span className="text-[12.5px] leading-[1.75] text-cream/[0.78] text-pretty">{p.body}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* signature dishes */}
            {featuredDishes.length > 0 && (
              <section className="border-t border-cream/10 px-[22px] py-[26px] lg:px-14 lg:py-16">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-[18px]">
                  <div className="flex items-baseline justify-between gap-3.5">
                    <Kicker kicker="من القائمة" title="أطباق يعرفها زبائننا" />
                    <button
                      type="button"
                      onClick={() => go("home")}
                      className="inline-flex items-center gap-[7px] whitespace-nowrap text-[12.5px] font-semibold text-gold-300"
                    >
                      كل الأطباق
                      <Chevron className="size-[13px]" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
                    {featuredDishes.map(({ d, i }) => (
                      <button
                        key={d.name}
                        type="button"
                        onClick={() => openFeatured(i)}
                        className="flex flex-col overflow-hidden rounded border border-cream/[0.12] bg-cream/[0.04] text-start text-current transition-colors hover:border-gold/40"
                      >
                        <Photo src={d.photo} alt={d.name} className="h-[148px] w-full" />
                        <span className="flex flex-col gap-[7px] px-4 pb-[17px] pt-3.5">
                          <span className="font-display text-[15px] font-bold text-cream">{d.name}</span>
                          {d.latin && <span className="font-serif text-xs italic text-cream/[0.7]">{d.latin}</span>}
                          <span className="pt-[3px] font-serif text-[17px] text-gold-100">
                            {d.price} {currency}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* gallery drift band */}
            {showGallery && gallery.length > 0 && (
              <section className="flex flex-col overflow-hidden border-t border-cream/10 py-[26px]">
                <div className="mx-auto mb-4 w-full max-w-6xl px-[22px] lg:px-14">
                  <Kicker kicker="من المطبخ والصالة" title="لمحات" size="text-xl" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex w-max gap-2.5 animate-rst-drift motion-reduce:animate-none">
                    {[...gallery, ...gallery].map((g, i) => (
                      <figure key={i} className="relative m-0 h-[120px] w-[168px] shrink-0 overflow-hidden rounded-[3px] lg:h-[180px] lg:w-[260px]">
                        <Photo src={g.photo} alt={g.label} className="absolute inset-0 size-full" />
                        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,oklch(0.115_0.006_60/.85),transparent)] px-[11px] pb-[9px] pt-5 text-[11.5px] text-cream/95">
                          {g.label}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* reviews */}
            {reviews.length > 0 && (
              <section className="border-t border-cream/10 bg-warm-800 px-[22px] py-[30px] lg:px-14 lg:py-16">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-[18px]">
                  <Kicker kicker="قالوا عنّا" title="٤٫٩ من ٥ على خرائط جوجل" />
                  <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
                    {reviews.map((r) => (
                      <figure key={r.name} className="m-0 flex flex-col gap-3 rounded border border-cream/[0.12] p-[18px]">
                        <span className="text-[13px] tracking-[0.18em] text-gold-200">{r.stars ?? "★★★★★"}</span>
                        <blockquote className="m-0 font-serif text-[15.5px] leading-[1.8] text-cream/90 text-pretty">
                          {r.quote}
                        </blockquote>
                        <figcaption className={`${K_SM} text-cream/[0.74]`}>{r.name}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ══════════ الرئيسية · the menu — season specials, courses, dishes, allergens ══════════ */}
        {page === "home" && (
          <div className="flex flex-col animate-rst-page motion-reduce:animate-none">
            {/* course filter (sticky) */}
            <div className="sticky top-[57px] z-40 border-y border-cream/[0.12] bg-warm/95 px-[22px] pb-3 pt-3.5 backdrop-blur-md lg:top-[65px] lg:px-14">
              <div className="mx-auto w-full max-w-6xl">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <span className="font-display text-xl font-extrabold text-cream">القائمة</span>
                  <span className={`${K_SM} text-cream/70`}>{arInt(dishes.length)} طبقًا</span>
                </div>
                <div className="flex gap-[7px] overflow-x-auto pb-0.5">
                  {courses.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={activeCourse === c.id}
                      onClick={() => setCourse(c.id)}
                      className={`inline-flex h-9 shrink-0 items-center gap-[7px] whitespace-nowrap rounded-full border px-[15px] text-[13px] font-semibold leading-none ${chip(activeCourse === c.id)}`}
                    >
                      {c.label}
                      <span className="font-serif text-[12.5px] opacity-60">
                        {arInt(dishes.filter((d) => d.course === c.id).length)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* dish list */}
            <div className="px-[22px] pb-[26px] pt-1 lg:px-14">
              <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-x-[34px] lg:grid-cols-2">
                {visibleDishes.map(({ d, i }, n) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => setDish(i)}
                    style={{ animationDelay: `${n * 55}ms` }}
                    className="flex items-start gap-3.5 border-b border-cream/10 py-[18px] text-start text-current animate-rst-rise motion-reduce:animate-none"
                  >
                    <Photo src={d.photo} alt={d.name} className="size-[78px] shrink-0 rounded-[3px]" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex flex-wrap items-baseline gap-[9px]">
                        <span className="font-display text-[15.5px] font-bold text-cream">{d.name}</span>
                        {d.mark && <span className={`${K_SM} text-gold-200`}>{d.mark}</span>}
                      </span>
                      {d.latin && <span className="font-serif text-xs italic text-cream/[0.7]">{d.latin}</span>}
                      {d.desc && <span className="text-[12.5px] leading-[1.7] text-cream/[0.76] text-pretty">{d.desc}</span>}
                      <span className="flex items-center gap-2.5 pt-[3px]">
                        <span className="font-serif text-lg text-gold-100">{d.price}</span>
                        <span className="flex gap-[5px]">
                          {(d.allergens ?? []).map((code) => (
                            <span
                              key={code}
                              title={ALLERGEN_LABELS[code]}
                              className="inline-flex size-5 items-center justify-center rounded-full bg-cream/10 font-mono text-[9.5px] text-cream/80"
                            >
                              {code}
                            </span>
                          ))}
                        </span>
                        <span className="ms-auto text-cream/60">
                          <Chevron />
                        </span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* allergen legend */}
            <div className="px-[22px] pb-[30px] lg:px-14">
              <div className="mx-auto w-full max-w-6xl">
                <div className="flex flex-wrap gap-x-4 gap-y-[11px] rounded bg-cream/[0.05] p-4">
                  <span className={`w-full ${K_SM} whitespace-normal text-cream/[0.74]`}>دليل مسبّبات الحساسية</span>
                  {Object.entries(ALLERGEN_LABELS).map(([code, label]) => (
                    <span key={code} className="inline-flex items-center gap-[7px] text-[12.5px] text-cream/80">
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-cream/10 font-mono text-[9.5px]">{code}</span>
                      {label}
                    </span>
                  ))}
                  <span className="w-full pt-0.5 text-[12.5px] leading-[1.7] text-cream/[0.74]">
                    الأسعار بالليرة السورية والخدمة غير مشمولة. لأي حساسية، أخبرنا عند الحجز — المطبخ يعدّل الطبق أو يقترح بديلًا.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ المطعم · part two — chef, history timeline, private hall ══════════ */}
        {page === "about" && (
          <div className="flex flex-col animate-rst-page motion-reduce:animate-none">
            {/* chef */}
            <section className="px-[22px] py-[26px] lg:px-14 lg:py-16">
              <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-[26px] lg:grid-cols-2">
                <div className="relative min-h-[230px] overflow-hidden rounded-[3px] lg:min-h-[330px]">
                  <Photo src={chef.photo} alt={chef.name ?? "الشيف"} className="absolute inset-0 size-full" />
                </div>
                <div className="flex flex-col gap-3.5">
                  <Kicker kicker="المطبخ" title={chef.name ?? "الشيف"} size="text-[22px]" />
                  {chef.quote && (
                    <blockquote className="m-0 font-serif text-[17.5px] leading-[1.78] text-cream/90 text-pretty">
                      {chef.quote}
                    </blockquote>
                  )}
                  {chef.stats && chef.stats.length > 0 && (
                    <div className="flex flex-wrap gap-x-[26px] gap-y-3 border-t border-cream/[0.14] pt-4">
                      {chef.stats.map((s) => (
                        <span key={s.label} className="flex flex-col gap-1">
                          <span className="font-serif text-2xl leading-none text-gold-100">{s.value}</span>
                          <span className={`${K_SM} text-cream/70`}>{s.label}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* history timeline */}
            {milestones.length > 0 && (
              <section className="border-t border-cream/10 bg-warm-800 px-[22px] py-[30px] lg:px-14 lg:py-16">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-[18px]">
                  <Kicker kicker="مسيرتنا" title="خمسون عامًا على النار" />
                  <div className="relative grid grid-cols-1 gap-x-10 gap-y-5 ps-[22px] lg:grid-cols-2">
                    <span aria-hidden className="absolute bottom-1.5 start-1 top-1.5 w-px bg-cream/[0.16]" />
                    {milestones.map((m) => (
                      <span key={m.year + m.title} className="relative flex flex-col gap-1">
                        <span
                          aria-hidden
                          className={`absolute -start-[22px] top-[5px] size-[9px] rounded-full shadow-[0_0_0_3px_oklch(0.13_0.008_60)] lg:hidden ${m.now ? "bg-gold" : "bg-cream/[0.3]"}`}
                        />
                        <span className="font-serif text-[15px] tracking-[0.06em] text-gold-200">{m.year}</span>
                        <span className="text-[14.5px] font-semibold text-cream/95">{m.title}</span>
                        {m.body && <span className="text-[12.5px] leading-[1.75] text-cream/[0.78] text-pretty">{m.body}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* private hall */}
            <section className="border-t border-cream/10 px-[22px] py-[30px] lg:px-14 lg:py-16">
              <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-[26px] lg:grid-cols-2">
                <div className="flex flex-col gap-3.5">
                  <Kicker kicker="المناسبات" title={hall.title ?? "قاعة للمجموعات"} size="text-[21px]" />
                  {hall.body && (
                    <span className="max-w-[46ch] text-[13.5px] leading-[1.85] text-cream/80 text-pretty">
                      {hall.body}
                    </span>
                  )}
                  <GoldCta href={waHref} label="اسأل عن القاعة" className="h-[46px] w-fit px-5 text-[13.5px]" />
                </div>
                <div className="relative min-h-[230px] overflow-hidden rounded-[3px] lg:min-h-[330px]">
                  <Photo src={hall.photo} alt={hall.title ?? "القاعة"} className="absolute inset-0 size-full" />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ══════════ الحجز والزيارة ══════════ */}
        {page === "visit" && (
          <div className="flex flex-col animate-rst-page motion-reduce:animate-none">
            {/* reservation picker */}
            <section className="px-[22px] py-[26px] lg:px-14 lg:py-16">
              <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-[26px] lg:grid-cols-2">
                <div className="flex flex-col gap-[17px]">
                  <Kicker kicker="الحجز" title="اختر موعدًا وأرسله لنا" size="text-[22px]" />
                  <span className="text-[13.5px] leading-[1.85] text-cream/80 text-pretty">
                    اختيارك يُرسَل كرسالة جاهزة على واتساب، ونؤكّده لك خلال دقائق.
                  </span>

                  <Picker label="اليوم">
                    {resDaysList.map((r, i) => (
                      <button
                        key={r.label + i}
                        type="button"
                        aria-pressed={resDay === i}
                        onClick={() => setResDay(i)}
                        className={`flex min-w-[68px] flex-col items-center gap-[3px] rounded-[3px] border px-3 py-2.5 ${chip(resDay === i)}`}
                      >
                        <span className="whitespace-nowrap text-[13px] font-semibold">{r.label}</span>
                        {r.date && <span className="font-serif text-xs opacity-65">{r.date}</span>}
                      </button>
                    ))}
                  </Picker>

                  <Picker label="الوقت">
                    {resTimesList.map((t, i) => (
                      <button
                        key={t + i}
                        type="button"
                        aria-pressed={resTime === i}
                        onClick={() => setResTime(i)}
                        className={`h-[42px] whitespace-nowrap rounded-[3px] border px-4 font-serif text-[14.5px] leading-none ${chip(resTime === i)}`}
                      >
                        {t}
                      </button>
                    ))}
                  </Picker>

                  <Picker label="عدد الأشخاص">
                    {resPartyList.map((p, i) => (
                      <button
                        key={p + i}
                        type="button"
                        aria-pressed={party === i}
                        onClick={() => setParty(i)}
                        className={`h-[42px] min-w-[46px] rounded-[3px] border px-3 font-serif text-[14.5px] leading-none ${chip(party === i)}`}
                      >
                        {p}
                      </button>
                    ))}
                  </Picker>
                </div>

                <div className="flex flex-col gap-[13px] rounded border border-cream/[0.12] bg-cream/[0.05] p-5 lg:sticky lg:top-24">
                  <span className={`${K_SM} text-cream/70`}>ملخّص الطلب</span>
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] text-cream/[0.78]">الموعد</span>
                    <span className="font-serif text-base text-cream/95">{resSummary}</span>
                  </span>
                  <span className="flex items-baseline justify-between gap-3 border-t border-cream/[0.12] pt-3">
                    <span className="text-[13px] text-cream/[0.78]">الأشخاص</span>
                    <span className="font-serif text-base text-cream/95">{resPartyLabel}</span>
                  </span>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-1 inline-flex h-[52px] items-center justify-center gap-[9px] rounded-[3px] bg-gold font-display text-[15px] font-bold ${ON_GOLD}`}
                  >
                    <WhatsAppIcon />
                    أرسل الطلب على واتساب
                  </a>
                  {telHref && (
                    <a
                      href={telHref}
                      className="inline-flex h-[46px] items-center justify-center rounded-[3px] border border-cream/[0.22] font-display text-[13.5px] font-bold text-cream/95"
                    >
                      أو اتصل بنا
                    </a>
                  )}
                  <span className="text-[12.5px] leading-[1.75] text-cream/70">
                    للمجموعات فوق ثمانية أشخاص والمناسبات، الاتصال أسرع.
                  </span>
                </div>
              </div>
            </section>

            {/* hours + map */}
            <section className="border-t border-cream/10 bg-warm-800 px-[22px] py-[30px] lg:px-14 lg:py-16">
              <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-[26px] lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                  <Kicker kicker="الزيارة" title="أوقات العمل والوصول" />
                  <div className="flex flex-col gap-2.5">
                    {hours.map((h) => (
                      <span key={h.days} className="flex items-baseline gap-2.5 text-[13.5px] text-cream/[0.82]">
                        <span className="whitespace-nowrap">{h.days}</span>
                        <span aria-hidden className="min-w-4 flex-[1_0_16px] border-b border-dotted border-cream/[0.22]" />
                        <span className="whitespace-nowrap font-serif text-cream/95">{h.time}</span>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col gap-[11px] border-t border-cream/[0.14] pt-4">
                    {shop.address && (
                      <span className="flex items-start gap-2.5 text-[13.5px] leading-[1.7] text-cream/[0.82]">
                        <span aria-hidden className="text-gold-200">◉</span>
                        <span className="text-pretty">{shop.address}</span>
                      </span>
                    )}
                    {visit.parking && (
                      <span className="flex items-start gap-2.5 text-[13.5px] leading-[1.7] text-cream/[0.82]">
                        <span aria-hidden className="text-gold-200">⌁</span>
                        <span className="text-pretty">{visit.parking}</span>
                      </span>
                    )}
                    {shop.phone && (
                      <button
                        type="button"
                        onClick={copyPhone}
                        className="inline-flex h-10 w-fit items-center gap-[9px] rounded-[3px] border border-cream/[0.2] px-[15px] text-[12.5px] font-semibold text-cream/95"
                      >
                        <span dir="ltr" className="font-mono">{shop.phone}</span>
                        انسخ الرقم
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="relative h-[200px] overflow-hidden rounded-[3px] border border-cream/[0.14] lg:h-[270px]">
                    <Photo src={visit.mapPhoto} alt="الموقع" className="absolute inset-0 size-full" />
                  </div>
                  <a
                    href={visit.directionsUrl || shop.mapsUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-[46px] items-center justify-center rounded-[3px] border border-gold/[0.45] bg-gold/10 font-display text-[13.5px] font-bold text-gold-200"
                  >
                    افتح الاتجاهات
                  </a>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ══ site footer (all pages) ══ */}
        <footer className="border-t border-cream/[0.14] bg-warm-900 px-[22px] py-[28px] pb-[30px] lg:px-14 lg:py-14">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-x-10 gap-y-[22px] lg:grid-cols-[1.4fr_1fr_1fr]">
            <div className="flex flex-col gap-2.5">
              <span className="font-display text-lg font-extrabold text-cream">{shop.name}</span>
              {shop.brandNote && (
                <span className="font-serif text-[12.5px] italic tracking-[0.04em] text-cream/[0.74]">
                  {shop.brandNote}
                </span>
              )}
              {shop.openNote && (
                <span className="inline-flex items-center gap-[7px] text-[12.5px] text-[oklch(0.82_0.06_145)]">
                  <span className="size-[7px] rounded-full bg-current animate-pulse-soft motion-reduce:animate-none" />
                  مفتوح الآن
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2.5">
              <span className={`${K_SM} text-cream/70`}>الصفحات</span>
              {TABS.map((t) => (
                <button key={t.id} type="button" onClick={() => go(t.id)} className="self-start text-[13px] text-cream/[0.84]">
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              <span className={`${K_SM} text-cream/70`}>تواصل</span>
              {shop.phone && (
                <a href={telHref} dir="ltr" className="self-start font-mono text-xs text-cream/[0.84]">{shop.phone}</a>
              )}
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="self-start text-[13px] text-cream/[0.84]">واتساب</a>
              {shop.address && (
                <span className="text-[13px] leading-[1.7] text-cream/[0.78] text-pretty">{shop.address}</span>
              )}
              {socials.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {socials.map((s) => (
                    <span
                      key={s.title}
                      title={s.title}
                      className="inline-flex size-[38px] items-center justify-center rounded-[3px] border border-cream/[0.16] text-sm text-cream/[0.88]"
                    >
                      {s.glyph}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {shop.latinName && (
            <span className="mt-6 block border-t border-cream/10 pt-3.5 font-mono text-[10px] uppercase tracking-[0.08em] text-cream/[0.55]">
              © {shop.latinName} · Sawwi
            </span>
          )}
        </footer>

        {/* ══ bottom tab bar (mobile only): FIXED to the screen bottom ══ */}
        <nav className="fixed inset-x-0 bottom-0 z-60 mx-auto flex w-full max-w-107.5 items-stretch border-t border-cream/[0.14] bg-warm-900/95 backdrop-blur-lg lg:hidden">
          {TABS.map((t) => {
            const on = page === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-current={on}
                onClick={() => go(t.id)}
                className={`relative flex flex-1 flex-col items-center justify-center gap-[5px] px-1 pb-[13px] pt-[11px] transition-colors ${
                  on ? "text-gold" : "text-cream/[0.68]"
                }`}
              >
                {on && <span aria-hidden className="absolute inset-x-[22%] top-0 h-0.5 bg-gold" />}
                {NAV_ICONS[t.id]}
                <span className={`whitespace-nowrap text-[10.5px] ${on ? "font-semibold" : "font-normal"}`}>
                  {t.short}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ══ dish sheet: fixed, covers the whole page ══ */}
      {openDish && (
        <div
          onClick={() => setDish(-1)}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(10,8,6,.7)] backdrop-blur-[4px] animate-rst-fade motion-reduce:animate-none lg:items-center lg:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[78vh] w-full max-w-107.5 overflow-y-auto rounded-t-[14px] border-t border-gold/30 bg-warm-700 animate-rst-sheet motion-reduce:animate-none lg:max-h-[86vh] lg:max-w-[560px] lg:rounded-[14px] lg:border"
          >
            <div className="relative h-[210px]">
              <Photo src={openDish.photo} alt={openDish.name} className="absolute inset-0 size-full" />
              <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,oklch(0.145_0.008_60)_3%,transparent_60%)]" />
              <button
                type="button"
                onClick={() => setDish(-1)}
                aria-label="إغلاق"
                className="absolute end-3 top-3 z-[3] inline-flex size-9 items-center justify-center rounded-full bg-[rgba(10,8,6,.6)] text-cream backdrop-blur-[6px]"
              >
                <svg viewBox="0 0 16 16" fill="none" className="size-[15px]">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-[15px] px-[22px] pb-[26px] pt-5">
              <div className="flex flex-col gap-1.5">
                <span className="font-display text-[21px] font-extrabold leading-[1.42] text-cream">{openDish.name}</span>
                {openDish.latin && <span className="font-serif text-[13px] italic text-cream/[0.76]">{openDish.latin}</span>}
              </div>
              {openDish.desc && (
                <span className="text-sm leading-[1.85] text-cream/[0.84] text-pretty">{openDish.desc}</span>
              )}
              {(openDish.allergens?.length || openDish.pair) && (
                <div className="flex flex-wrap items-start gap-3.5 border-t border-cream/[0.12] pt-3.5">
                  {openDish.allergens?.length ? (
                    <span className="flex flex-col gap-[5px]">
                      <span className={`${K_SM} text-cream/70`}>حساسية</span>
                      <span className="flex gap-[5px]">
                        {openDish.allergens.map((code) => (
                          <span
                            key={code}
                            title={ALLERGEN_LABELS[code]}
                            className="inline-flex size-6 items-center justify-center rounded-full bg-cream/10 font-mono text-[10px] text-cream/[0.86]"
                          >
                            {code}
                          </span>
                        ))}
                      </span>
                    </span>
                  ) : null}
                  {openDish.pair && (
                    <span className="ms-auto flex flex-col items-end gap-[5px]">
                      <span className={`${K_SM} text-cream/70`}>يُقترح معه</span>
                      <span className="text-end text-[12.5px] text-gold-200">{openDish.pair}</span>
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between gap-3.5 border-t border-cream/[0.12] pt-4">
                <span className="font-serif text-[26px] leading-none text-gold-100">
                  {openDish.price} {currency}
                </span>
                <GoldCta href={waHref} label="احجز طاولة" className="h-[46px] px-5 text-sm" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ toast (copy phone) ══ */}
      {toast && (
        <div className="fixed inset-x-0 bottom-[76px] z-[90] flex justify-center px-4 lg:bottom-6">
          <span className="inline-flex items-center gap-2.5 rounded border border-gold/30 bg-warm-700 px-4 py-3 text-[13px] text-cream shadow-lg animate-rst-fade motion-reduce:animate-none">
            <span className={`inline-flex size-5 items-center justify-center rounded-full bg-gold ${ON_GOLD}`}>✓</span>
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── small local parts ───────────────────────── */

function Picker({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex flex-col gap-[9px]">
      <span className={`${K_SM} text-cream/70`}>{label}</span>
      <div className="flex flex-wrap gap-[7px]">{children}</div>
    </span>
  );
}
