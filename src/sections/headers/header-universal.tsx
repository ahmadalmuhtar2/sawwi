"use client";

/**
 * HeaderUniversal — Sawwi section library
 * Shared site header, business-agnostic. Three variants × three schemes.
 *
 *   A "bar"       — logo start, nav center, socials + contact CTA end
 *   B "twoTier"   — thin utility strip (hours/location/phone/socials) above the main bar
 *   C "centered"  — logo + name centered, nav beneath
 *
 * SCROLL BEHAVIOUR:
 *   • The header is `sticky top-0` — no layout shift, no spacer element needed.
 *   • It CONDENSES after ~24px: shorter bar, solid background + blur + hairline.
 *   • `glass` starts transparent over the hero and turns solid once condensed.
 *   • Optional `hideOnScrollDown`: the bar slides away on scroll-down, back on up.
 *
 * Client component (needs scroll + drawer state). Arabic-first (RTL).
 */

import * as React from "react";

/* ────────────────────────────── types ────────────────────────────── */

export type HeaderVariant = "A" | "B" | "C";
export type HeaderScheme = "light" | "dark" | "accent";

export interface NavItem {
  label: string;
  href: string;
}

export interface HeaderSocials {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  /** digits only, e.g. "963112223344" */
  whatsapp?: string;
}

export interface HeaderContent {
  businessName: string;
  latinName?: string;
  /** uploaded logo URL from SiteSettings; falls back to the default mark */
  logoUrl?: string;
  homeHref?: string;
  phone?: string;
  hoursLabel?: string;
  addressShort?: string;
  contactLabel?: string;
  /** Explicit CTA target. When set (e.g. the booking page), the CTA links here
   *  instead of the default WhatsApp / #contact fallback. */
  contactHref?: string;
}

export interface HeaderUniversalProps {
  variant?: HeaderVariant;
  scheme?: HeaderScheme;
  nav?: NavItem[];
  socials?: HeaderSocials;
  content?: Partial<HeaderContent>;
  showSocials?: boolean;
  showContact?: boolean;
  /** slide the bar away while scrolling down (nice on phones). Default false. */
  hideOnScrollDown?: boolean;
  /** px scrolled before the header condenses. Default 24. */
  condenseAfter?: number;
  className?: string;
}

/* ───────────────────────────── defaults ───────────────────────────── */

export const defaultHeaderContent: HeaderContent = {
  businessName: "اسم العمل",
  // No default latinName — only shows a tagline if one is explicitly provided
  // (avoids a placeholder like "Your Business" leaking onto real sites).
  homeHref: "/",
  phone: "+963 11 222 3344",
  hoursLabel: "يوميًا ٩ صباحًا – ١٠ مساءً",
  addressShort: "دمشق — شارع بغداد",
  contactLabel: "تواصل معنا",
};

// Picker options for the Appearance settings (design + scheme, like the hero).
export const HEADER_VARIANTS: { key: HeaderVariant; label: string }[] = [
  { key: "A", label: "شريط" },
  { key: "B", label: "طبقتان" },
  { key: "C", label: "متوسّط" },
];
export const HEADER_SCHEMES: { key: HeaderScheme; label: string }[] = [
  { key: "dark", label: "داكن" },
  { key: "light", label: "فاتح" },
  { key: "accent", label: "بلون الموقع" },
];

export const defaultNav: NavItem[] = [
  { label: "الرئيسية", href: "#" },
  { label: "خدماتنا", href: "#services" },
  { label: "المعرض", href: "#gallery" },
  { label: "من نحن", href: "#about" },
  { label: "تواصل", href: "#contact" },
];

/* ────────────────────────── scroll behaviour ────────────────────────── */

function useScrollState(condenseAfter: number) {
  const [condensed, setCondensed] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    let last = window.scrollY;
    let frame = 0;

    const read = () => {
      frame = 0;
      const y = window.scrollY;
      setCondensed(y > condenseAfter);
      setHidden(y > 160 && y > last);
      last = y;
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [condenseAfter]);

  return { condensed, hidden };
}

/** Lock page scroll while the mobile drawer is open. */
function useScrollLock(locked: boolean) {
  React.useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

/* ────────────────────────────── tokens ────────────────────────────── */

interface Tokens {
  bar: string;
  text: string;
  hairline: string;
  chip: string;
  strip: string;
  stripText: string;
  stripChip: string;
  mark: string;
  cta: string;
  drawer: string;
}

function tokensFor(scheme: HeaderScheme, condensed: boolean): Tokens {
  switch (scheme) {
    case "dark":
      return {
        bar: "bg-ink-900 border-paper/15",
        text: "text-paper",
        hairline: "border-paper/15",
        chip: "bg-paper/10 hover:bg-paper/20",
        strip: "bg-ink-950",
        stripText: "text-paper/90",
        stripChip: "bg-paper/12 hover:bg-paper/20",
        mark: "bg-accent text-white",
        cta: "bg-accent text-white hover:bg-accent-700",
        drawer: "bg-ink-900 text-paper",
      };
    case "accent":
      return {
        bar: condensed
          ? "bg-accent-900/95 backdrop-blur-md border-paper/20"
          : "bg-accent-900 border-paper/20",
        text: "text-paper",
        hairline: "border-paper/20",
        chip: "bg-paper/15 hover:bg-paper/25",
        strip: "bg-black/15",
        stripText: "text-paper/90",
        stripChip: "bg-paper/15 hover:bg-paper/25",
        mark: "bg-paper/15 text-paper",
        cta: "bg-paper text-accent-900 hover:bg-white",
        drawer: "bg-accent-900 text-paper",
      };
    default:
      return {
        bar: condensed
          ? "bg-surface/90 backdrop-blur-md border-line"
          : "bg-surface border-line",
        text: "text-ink",
        hairline: "border-line",
        chip: "bg-neutral-200 hover:bg-neutral-300",
        strip: "bg-ink",
        stripText: "text-paper/90",
        stripChip: "bg-paper/13 hover:bg-paper/22",
        mark: "bg-accent-100 text-accent-800",
        cta: "bg-accent text-white hover:bg-accent-700",
        drawer: "bg-surface text-ink",
      };
  }
}

/* ────────────────────────────── icons ────────────────────────────── */

const ICON_CLS = "size-4";

function Facebook() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={ICON_CLS}>
      <path d="M9.6 14V8.9h1.8l.3-2.1H9.6V5.4c0-.6.2-1 1-1h1.1V2.5c-.2 0-.9-.1-1.7-.1-1.7 0-2.8 1-2.8 2.9v1.5H5.3v2.1h1.9V14h2.4z" />
    </svg>
  );
}
function Instagram() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={ICON_CLS}>
      <rect x="3" y="3" width="10" height="10" rx="3" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="11" cy="5" r=".8" fill="currentColor" />
    </svg>
  );
}
function TikTok() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={ICON_CLS}>
      <path d="M10.2 2h-1.7v8.2a1.6 1.6 0 1 1-1.2-1.6V6.9a3.5 3.5 0 1 0 3 3.5V6.1c.6.5 1.4.8 2.3.9V5.2c-1.3-.1-2.3-1.1-2.4-3.2z" />
    </svg>
  );
}
function WhatsApp() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={ICON_CLS}>
      <path d="M8 1.5a6.5 6.5 0 0 0-5.6 9.8L1.5 14.5l3.4-.9A6.5 6.5 0 1 0 8 1.5z" />
    </svg>
  );
}
function DefaultMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/* ───────────────────────────── pieces ───────────────────────────── */

function SocialRow({
  socials,
  chip,
  size = "md",
}: {
  socials: HeaderSocials;
  chip: string;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "size-[26px] rounded-[7px]" : "size-[34px] rounded-[9px]";
  const links: Array<[string, string, React.ReactNode]> = [];
  if (socials.facebook) links.push(["فيسبوك", socials.facebook, <Facebook key="f" />]);
  if (socials.instagram) links.push(["إنستغرام", socials.instagram, <Instagram key="i" />]);
  if (socials.tiktok) links.push(["تيك توك", socials.tiktok, <TikTok key="t" />]);
  // WhatsApp is intentionally NOT here — it's the dedicated contact CTA, so
  // showing it again as a social icon would duplicate the button.
  if (!links.length) return null;

  return (
    <span className="flex items-center gap-1">
      {links.map(([label, href, icon]) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={label}
          aria-label={label}
          className={`inline-flex ${box} items-center justify-center text-current transition-colors ${chip}`}
        >
          {icon}
        </a>
      ))}
    </span>
  );
}

function Brand({
  c,
  markCls,
  condensed,
  centered = false,
}: {
  c: HeaderContent;
  markCls: string;
  condensed: boolean;
  centered?: boolean;
}) {
  const box = centered
    ? condensed
      ? "size-10 rounded-xl"
      : "size-[54px] rounded-[15px]"
    : condensed
      ? "size-9 rounded-[10px]"
      : "size-10 rounded-[11px]";

  return (
    <a
      href={c.homeHref ?? "/"}
      className={`inline-flex items-center gap-[11px] text-current ${centered ? "flex-col gap-2" : ""}`}
    >
      <span className={`inline-grid ${box} shrink-0 place-items-center overflow-hidden transition-all duration-200 ${c.logoUrl ? "" : markCls}`}>
        {c.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL, not a build asset
          <img src={c.logoUrl} alt={c.businessName} className="size-full object-contain" />
        ) : (
          <DefaultMark size={centered && !condensed ? 28 : 22} />
        )}
      </span>
      <span className={`flex flex-col ${centered ? "items-center gap-1" : "gap-px"}`}>
        <span
          className={`whitespace-nowrap font-display font-extrabold -tracking-[0.01em] transition-all duration-200 ${
            centered ? (condensed ? "text-lg" : "text-[22px]") : condensed ? "text-[17px]" : "text-lg"
          }`}
        >
          {c.businessName}
        </span>
        {c.latinName && (
          <span
            className={`whitespace-nowrap font-serif uppercase opacity-60 transition-all duration-200 ${
              centered ? "text-[11px] tracking-[0.3em]" : "text-[10.5px] tracking-[0.16em]"
            } ${condensed && !centered ? "hidden" : ""}`}
          >
            {c.latinName}
          </span>
        )}
      </span>
    </a>
  );
}

function Burger({
  open,
  onClick,
  hairline,
}: {
  open: boolean;
  onClick: () => void;
  hairline: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
      aria-expanded={open}
      aria-controls="site-menu"
      className={`inline-flex size-[42px] items-center justify-center rounded-[11px] border text-current lg:hidden ${hairline}`}
    >
      {open ? (
        <svg viewBox="0 0 16 16" fill="none" className="size-[18px]" aria-hidden>
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" fill="none" className="size-[18px]" aria-hidden>
          <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

/* ──────────────────────────── component ──────────────────────────── */

export default function HeaderUniversal({
  variant = "A",
  scheme = "light",
  nav = defaultNav,
  socials = {},
  content,
  showSocials = true,
  showContact = true,
  hideOnScrollDown = false,
  condenseAfter = 24,
  className,
}: HeaderUniversalProps) {
  const c: HeaderContent = { ...defaultHeaderContent, ...content };
  const { condensed, hidden } = useScrollState(condenseAfter);
  const [open, setOpen] = React.useState(false);
  useScrollLock(open);

  const t = tokensFor(scheme, condensed);
  const centered = variant === "C";

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onResize = () => window.innerWidth >= 1024 && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const slideAway = hideOnScrollDown && hidden && !open;
  const contactHref =
    c.contactHref || (socials.whatsapp ? `https://wa.me/${socials.whatsapp}` : "#contact");

  return (
    <header
      dir="rtl"
      className={`sticky top-0 z-50 transition-transform duration-300 ${
        slideAway ? "-translate-y-full" : "translate-y-0"
      } ${className ?? ""}`}
    >
      {/* ── B: utility strip. Scrolls away with the page (not part of the pinned bar). ── */}
      {variant === "B" && (
        <div className={`hidden h-10 items-center gap-[18px] overflow-hidden px-[22px] text-[12.5px] lg:flex ${t.strip} ${t.stripText}`}>
          {c.hoursLabel && (
            <span className="inline-flex items-center gap-[7px] whitespace-nowrap">
              <svg viewBox="0 0 16 16" fill="none" className="size-[13px]" aria-hidden>
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              {c.hoursLabel}
            </span>
          )}
          {c.addressShort && (
            <>
              <span aria-hidden className="h-3.5 w-px bg-current opacity-25" />
              <span className="inline-flex items-center gap-[7px] whitespace-nowrap">
                <svg viewBox="0 0 16 16" fill="none" className="size-[13px]" aria-hidden>
                  <path d="M8 14s4.5-4 4.5-7A4.5 4.5 0 0 0 8 2.5 4.5 4.5 0 0 0 3.5 7c0 3 4.5 7 4.5 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  <circle cx="8" cy="7" r="1.4" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                {c.addressShort}
              </span>
            </>
          )}
          <span className="ms-auto flex items-center gap-2.5">
            {c.phone && (
              <a href={`tel:${c.phone.replace(/\s/g, "")}`} dir="ltr" className="whitespace-nowrap font-mono text-xs text-current">
                {c.phone}
              </a>
            )}
            {showSocials && <SocialRow socials={socials} chip={t.stripChip} size="sm" />}
          </span>
        </div>
      )}

      {/* ── main bar (this is what stays pinned) ── */}
      <div className={`border-b transition-[background-color,backdrop-filter,border-color] duration-200 ${t.bar} ${t.text}`}>
        {centered ? (
          <div className={`px-[22px] transition-all duration-200 ${condensed ? "py-2" : "pt-[22px]"}`}>
            <div className={`flex w-full items-center justify-between gap-3 ${condensed ? "" : "lg:mb-3"}`}>
              {showSocials && <span className="hidden lg:block"><SocialRow socials={socials} chip={t.chip} /></span>}
              {condensed && <div className="lg:hidden" />}
              {condensed && (
                <span className="hidden lg:block">
                  <Brand c={c} markCls={t.mark} condensed centered={false} />
                </span>
              )}
              <span className="ms-auto flex items-center gap-2.5">
                {showContact && (
                  <a href={contactHref} className={`hidden h-[38px] items-center gap-2 rounded-full px-4 text-[13.5px] font-semibold transition-colors lg:inline-flex ${t.cta}`}>
                    <WhatsApp />
                    {c.contactLabel}
                  </a>
                )}
                <Burger open={open} onClick={() => setOpen((v) => !v)} hairline={t.hairline} />
              </span>
            </div>

            {!condensed && (
              <div className="flex flex-col items-center gap-3.5 pb-0">
                <Brand c={c} markCls={t.mark} condensed={false} centered />
                <nav className={`hidden w-full items-center justify-center gap-[30px] border-t py-3 text-[14.5px] lg:flex ${t.hairline}`}>
                  {nav.map((n, i) => (
                    <a key={n.label} href={n.href} className={`text-current ${i === 0 ? "font-semibold" : "opacity-70 hover:opacity-100"}`}>
                      {n.label}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {condensed && (
              <nav className="hidden items-center justify-center gap-[26px] py-1 text-sm lg:flex">
                {nav.map((n, i) => (
                  <a key={n.label} href={n.href} className={`text-current ${i === 0 ? "font-semibold" : "opacity-70 hover:opacity-100"}`}>
                    {n.label}
                  </a>
                ))}
              </nav>
            )}
          </div>
        ) : (
          <div className={`flex items-center gap-5 px-[22px] transition-[height] duration-200 ${condensed ? "h-[58px]" : "h-[74px]"}`}>
            <Brand c={c} markCls={t.mark} condensed={condensed} />

            <nav className="mx-auto hidden items-center gap-[26px] text-[14.5px] lg:flex">
              {nav.map((n, i) => (
                <a key={n.label} href={n.href} className={`text-current ${i === 0 ? "font-semibold" : "opacity-70 hover:opacity-100"}`}>
                  {n.label}
                </a>
              ))}
            </nav>

            <div className="ms-auto flex items-center gap-2.5">
              {showSocials && <span className="hidden lg:block"><SocialRow socials={socials} chip={t.chip} /></span>}
              {showContact && (
                <a href={contactHref} className={`hidden h-[42px] items-center gap-2 rounded-[11px] px-[18px] text-sm font-semibold transition-colors lg:inline-flex ${t.cta}`}>
                  <WhatsApp />
                  {c.contactLabel}
                </a>
              )}
              <Burger open={open} onClick={() => setOpen((v) => !v)} hairline={t.hairline} />
            </div>
          </div>
        )}
      </div>

      {/* ── mobile drawer ── */}
      <div
        id="site-menu"
        hidden={!open}
        className={`flex flex-col border-b lg:hidden ${t.hairline} ${t.drawer}`}
      >
        {nav.map((n, i) => (
          <a
            key={n.label}
            href={n.href}
            onClick={() => setOpen(false)}
            className={`border-b px-[22px] py-3.5 text-current last:border-b-0 ${t.hairline} ${i === 0 ? "font-semibold" : ""}`}
          >
            {n.label}
          </a>
        ))}
        <div className={`flex items-center gap-2 border-t px-[22px] py-3.5 ${t.hairline}`}>
          {showSocials && <SocialRow socials={socials} chip={t.chip} />}
          {showContact && (
            <a href={contactHref} className={`ms-auto inline-flex h-[38px] items-center gap-2 rounded-[10px] px-4 text-[13.5px] font-semibold ${t.cta}`}>
              <WhatsApp />
              {c.contactLabel}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
