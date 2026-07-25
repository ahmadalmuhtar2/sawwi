/**
 * FooterUniversal — Sawwi section library
 * Shared site footer, business-agnostic. Three variants × three schemes.
 *
 *   A "columns"  — logo + blurb + socials, pages, contact details, opening hours
 *   B "centered" — centered mark, short nav, round socials, one-line hours
 *   C "map"      — info column beside a clickable map plate
 *
 * Plus an optional WhatsApp invite band and the legal bar. Pure (no hooks), so it
 * renders in the server tree. Arabic-first (RTL).
 */

import * as React from "react";

/* ────────────────────────────── types ────────────────────────────── */

export type FooterVariant = "A" | "B" | "C";
export type FooterScheme = "dark" | "light" | "accent";

export interface NavItem {
  label: string;
  href: string;
}

export interface FooterSocials {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  /** digits only, e.g. "963112223344" */
  whatsapp?: string;
}

export interface HoursRow {
  days: string;
  time: string;
}

export interface FooterContent {
  businessName: string;
  latinName?: string;
  /** uploaded logo URL from SiteSettings; falls back to the built-in mark */
  logoUrl?: string;
  blurb?: string;
  address?: string;
  phone?: string;
  email?: string;
  /** Google Maps URL from SiteSettings — makes the map plate clickable */
  mapsUrl?: string;
  hours?: HoursRow[];
  openNowLabel?: string;
  /** shown in the invite band */
  bandTitle?: string;
  bandBody?: string;
  bandCta?: string;
  copyright?: string;
}

export interface FooterUniversalProps {
  variant?: FooterVariant;
  scheme?: FooterScheme;
  nav?: NavItem[];
  socials?: FooterSocials;
  content?: Partial<FooterContent>;
  showHours?: boolean;
  showWhatsappBand?: boolean;
  /** the small "made with Sawwi" credit */
  showSawwiCredit?: boolean;
  legalLinks?: NavItem[];
  className?: string;
}

/* ───────────────────────────── defaults ───────────────────────────── */

export const defaultFooterContent: FooterContent = {
  businessName: "اسم العمل",
  // No default latinName/blurb/email — those are optional; showing a placeholder
  // ("Your Business", a fake email) on a real site looks broken.
  openNowLabel: "مفتوح الآن",
  bandTitle: "سؤال سريع؟ راسلنا على واتساب",
  bandBody: "نرد عادةً خلال دقائق في أوقات العمل.",
  bandCta: "ابدأ محادثة",
  copyright: "© اسم العمل. جميع الحقوق محفوظة.",
};

export const defaultFooterNav: NavItem[] = [
  { label: "الرئيسية", href: "#" },
  { label: "خدماتنا", href: "#services" },
  { label: "المعرض", href: "#gallery" },
  { label: "من نحن", href: "#about" },
  { label: "تواصل", href: "#contact" },
];

// Picker options for the builder footer editor (design + scheme, like the header).
export const FOOTER_VARIANTS: { key: FooterVariant; label: string }[] = [
  { key: "A", label: "أعمدة" },
  { key: "B", label: "متوسّط" },
  { key: "C", label: "خريطة" },
];
export const FOOTER_SCHEMES: { key: FooterScheme; label: string }[] = [
  { key: "dark", label: "داكن" },
  { key: "light", label: "فاتح" },
  { key: "accent", label: "بلون الموقع" },
];

/* ────────────────────────────── tokens ────────────────────────────── */

interface Tokens {
  root: string;
  hairline: string;
  chip: string;
  mark: string;
  band: string;
  cta: string;
  muted: string;
  accentBar: string;
  map: string;
  mapLine: string;
  mapRoad: string;
  pin: string;
  mapPlate: string;
}

function tokensFor(scheme: FooterScheme): Tokens {
  switch (scheme) {
    case "light":
      return {
        root: "bg-neutral-100 text-ink",
        hairline: "border-line",
        chip: "bg-neutral-200 hover:bg-neutral-300",
        mark: "bg-accent-100 text-accent-800",
        band: "bg-surface",
        cta: "bg-accent text-white hover:bg-accent-700",
        muted: "text-muted",
        accentBar: "bg-accent",
        map: "bg-neutral-200",
        mapLine: "oklch(0.26_0.012_70/.07)",
        mapRoad: "bg-ink/[0.08]",
        pin: "text-accent",
        mapPlate: "bg-ink text-paper",
      };
    case "accent":
      return {
        root: "bg-accent-900 text-paper",
        hairline: "border-paper/20",
        chip: "bg-paper/15 hover:bg-paper/25",
        mark: "bg-paper/15 text-paper",
        band: "bg-black/15",
        cta: "bg-paper text-accent-900 hover:bg-white",
        muted: "text-paper/85",
        accentBar: "bg-paper/60",
        map: "bg-black/20",
        mapLine: "oklch(0.96_0.01_95/.08)",
        mapRoad: "bg-paper/10",
        pin: "text-[oklch(0.85_0.09_145)]",
        mapPlate: "bg-paper text-accent-900",
      };
    default:
      return {
        root: "bg-ink-900 text-paper",
        hairline: "border-paper/15",
        chip: "bg-paper/10 hover:bg-paper/20",
        mark: "bg-accent text-white",
        band: "bg-ink-950",
        cta: "bg-accent text-white hover:bg-accent-700",
        muted: "text-paper/80",
        accentBar: "bg-accent",
        map: "bg-ink",
        mapLine: "oklch(0.95_0.004_95/.07)",
        mapRoad: "bg-paper/10",
        pin: "text-accent-400",
        mapPlate: "bg-paper text-ink",
      };
  }
}

/* ────────────────────────────── icons ────────────────────────────── */

const IC = "size-4";

const Facebook = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={IC}>
    <path d="M9.6 14V8.9h1.8l.3-2.1H9.6V5.4c0-.6.2-1 1-1h1.1V2.5c-.2 0-.9-.1-1.7-.1-1.7 0-2.8 1-2.8 2.9v1.5H5.3v2.1h1.9V14h2.4z" />
  </svg>
);
const Instagram = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden className={IC}>
    <rect x="3" y="3" width="10" height="10" rx="3" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="8" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="11" cy="5" r=".8" fill="currentColor" />
  </svg>
);
const TikTok = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={IC}>
    <path d="M10.2 2h-1.7v8.2a1.6 1.6 0 1 1-1.2-1.6V6.9a3.5 3.5 0 1 0 3 3.5V6.1c.6.5 1.4.8 2.3.9V5.2c-1.3-.1-2.3-1.1-2.4-3.2z" />
  </svg>
);
const WhatsApp = ({ className = IC }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={className}>
    <path d="M8 1.5a6.5 6.5 0 0 0-5.6 9.8L1.5 14.5l3.4-.9A6.5 6.5 0 1 0 8 1.5z" />
  </svg>
);
const PinIcon = ({ className = IC }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
    <path d="M8 14s4.5-4 4.5-7A4.5 4.5 0 0 0 8 2.5 4.5 4.5 0 0 0 3.5 7c0 3 4.5 7 4.5 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <circle cx="8" cy="7" r="1.4" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden className={IC}>
    <path d="M3 4.5c0 5 3.5 8.5 8.5 8.5l1.5-2-2.6-1.2-1.2 1.2c-1.4-.7-2.5-1.8-3.2-3.2l1.2-1.2L6 4H4L3 4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden className={IC}>
    <rect x="2" y="3.5" width="12" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
    <path d="M2.6 4.5L8 8.5l5.4-4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);
const DefaultMark = ({ size = 23 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

/* ───────────────────────────── pieces ───────────────────────────── */

function SocialRow({
  socials,
  chip,
  round = false,
}: {
  socials: FooterSocials;
  chip: string;
  round?: boolean;
}) {
  const links: Array<[string, string, React.ReactNode]> = [];
  if (socials.facebook) links.push(["فيسبوك", socials.facebook, <Facebook key="f" />]);
  if (socials.instagram) links.push(["إنستغرام", socials.instagram, <Instagram key="i" />]);
  if (socials.tiktok) links.push(["تيك توك", socials.tiktok, <TikTok key="t" />]);
  // WhatsApp is the dedicated invite-band CTA, not a duplicate social icon.
  if (!links.length) return null;

  return (
    <span className="flex items-center gap-1.5">
      {links.map(([label, href, icon]) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={label}
          aria-label={label}
          className={`inline-flex items-center justify-center text-current transition-colors ${chip} ${
            round ? "size-[38px] rounded-full" : "size-9 rounded-[10px]"
          }`}
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
  centered = false,
}: {
  c: FooterContent;
  markCls: string;
  centered?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-[11px] ${centered ? "flex-col gap-2.5" : ""}`}>
      <span
        className={`inline-grid shrink-0 place-items-center overflow-hidden ${
          centered ? "size-[50px] rounded-[14px]" : "size-[42px] rounded-xl"
        } ${c.logoUrl ? "" : markCls}`}
      >
        {c.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL, not a build asset
          <img src={c.logoUrl} alt={c.businessName} className="size-full object-contain" />
        ) : (
          <DefaultMark size={centered ? 26 : 23} />
        )}
      </span>
      <span className={`flex flex-col gap-px ${centered ? "items-center gap-1" : ""}`}>
        <span className={`font-display font-extrabold -tracking-[0.01em] ${centered ? "text-[21px]" : "text-[19px]"}`}>
          {c.businessName}
        </span>
        {c.latinName && (
          <span
            className={`font-serif uppercase opacity-60 ${
              centered ? "text-[11px] tracking-[0.3em]" : "text-[10.5px] tracking-[0.16em]"
            }`}
          >
            {c.latinName}
          </span>
        )}
      </span>
    </span>
  );
}

function ColHeading({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] opacity-60">{children}</span>
  );
}

function ContactLines({ c, muted }: { c: FooterContent; muted: string }) {
  return (
    <div className={`flex flex-col gap-3 text-sm ${muted}`}>
      {c.address && (
        <span className="flex items-start gap-[9px] leading-[1.6]">
          <PinIcon className="mt-[3px] size-[15px] shrink-0" />
          <span className="text-pretty">{c.address}</span>
        </span>
      )}
      {c.phone && (
        <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="flex items-center gap-[9px] text-current">
          <PhoneIcon />
          <span dir="ltr" className="font-mono text-[13px]">{c.phone}</span>
        </a>
      )}
      {c.email && (
        <a href={`mailto:${c.email}`} className="flex items-center gap-[9px] text-current">
          <MailIcon />
          <span dir="ltr" className="font-mono text-xs [overflow-wrap:anywhere]">{c.email}</span>
        </a>
      )}
    </div>
  );
}

function HoursList({ c, hairline }: { c: FooterContent; hairline: string }) {
  return (
    <div className="flex flex-col gap-3">
      {(c.hours ?? []).map((h) => (
        <span key={h.days} className="flex items-baseline gap-2.5 text-sm">
          <span className="shrink-0 whitespace-nowrap opacity-80">{h.days}</span>
          <span aria-hidden className={`min-w-[18px] flex-[1_0_18px] border-b border-dotted ${hairline}`} />
          <span className="shrink-0 whitespace-nowrap font-mono text-[12.5px]">{h.time}</span>
        </span>
      ))}
      {c.openNowLabel && (
        <span className="inline-flex items-center gap-2 pt-1 text-[13px] opacity-90">
          <span className="size-[7px] rounded-full bg-[oklch(0.72_0.15_145)]" />
          {c.openNowLabel}
        </span>
      )}
    </div>
  );
}

/** Schematic map plate. Swap for a real embed/static tile when you have a key. */
function MapPlate({ t, mapsUrl }: { t: Tokens; mapsUrl?: string }) {
  const Tag = mapsUrl ? "a" : "div";
  return (
    <Tag
      {...(mapsUrl ? { href: mapsUrl, target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label="الاتجاهات على الخريطة"
      className={`relative block min-h-[240px] overflow-hidden border-s ${t.hairline} ${t.map}`}
    >
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${t.mapLine.replace(/_/g, " ")} 1px, transparent 1px), linear-gradient(90deg, ${t.mapLine.replace(/_/g, " ")} 1px, transparent 1px)`,
          backgroundSize: "46px 46px",
        }}
      />
      <span aria-hidden className={`absolute inset-x-0 top-[38%] h-3 ${t.mapRoad}`} />
      <span aria-hidden className={`absolute inset-y-0 start-[34%] w-3 ${t.mapRoad}`} />
      <span aria-hidden className={`absolute start-[34%] top-[38%] -translate-y-full translate-x-1/2 ${t.pin}`}>
        <svg viewBox="0 0 16 16" fill="currentColor" className="size-[30px]">
          <path d="M8 15s5-5 5-8.2A5 5 0 0 0 8 1.8 5 5 0 0 0 3 6.8C3 10 8 15 8 15z" />
          <circle cx="8" cy="6.6" r="1.9" fill="currentColor" fillOpacity="0" />
        </svg>
      </span>
      {mapsUrl && (
        <span
          className={`absolute bottom-3.5 start-3.5 inline-flex items-center gap-2 whitespace-nowrap rounded-[10px] px-3.5 py-[9px] text-[13px] font-semibold shadow-[0_8px_20px_-10px_rgba(0,0,0,.4)] ${t.mapPlate}`}
        >
          <svg viewBox="0 0 16 16" fill="none" className="size-[15px]" aria-hidden>
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          الاتجاهات على الخريطة
        </span>
      )}
    </Tag>
  );
}

/* ──────────────────────────── component ──────────────────────────── */

export default function FooterUniversal({
  variant = "A",
  scheme = "dark",
  nav = defaultFooterNav,
  socials = {},
  content,
  showHours = true,
  showWhatsappBand = true,
  showSawwiCredit = true,
  legalLinks = [],
  className,
}: FooterUniversalProps) {
  const c: FooterContent = { ...defaultFooterContent, ...content };
  const t = tokensFor(scheme);
  const waHref = socials.whatsapp
    ? `https://wa.me/${socials.whatsapp}?text=${encodeURIComponent(`مرحبًا ${c.businessName}`)}`
    : "#contact";

  return (
    <footer dir="rtl" className={`${t.root} ${className ?? ""}`}>
      {/* ── optional WhatsApp invite band ── */}
      {showWhatsappBand && (
        <div className={`flex flex-wrap items-center justify-between gap-5 border-b p-[26px] ${t.hairline} ${t.band}`}>
          <div className="flex flex-col gap-1.5">
            <span className="font-display text-xl font-extrabold -tracking-[0.015em]">{c.bandTitle}</span>
            <span className={`text-[13.5px] ${t.muted}`}>{c.bandBody}</span>
          </div>
          <a
            href={waHref}
            className={`inline-flex h-12 items-center gap-[9px] whitespace-nowrap rounded-xl px-[22px] text-[14.5px] font-semibold transition-colors ${t.cta}`}
          >
            <WhatsApp className="size-[17px]" />
            {c.bandCta}
          </a>
        </div>
      )}

      {/* ── A — columns ── */}
      {variant === "A" && (
        <div
          className={`grid gap-8 px-[22px] py-10 md:px-[26px] md:py-[42px] ${
            showHours
              ? "md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.85fr)_minmax(0,1.25fr)_minmax(215px,1.3fr)]"
              : "md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.3fr)]"
          }`}
        >
          <div className="flex flex-col gap-3.5">
            <Brand c={c} markCls={t.mark} />
            {c.blurb && <p className={`m-0 max-w-[34ch] text-sm leading-[1.75] ${t.muted}`}>{c.blurb}</p>}
            <span className="pt-0.5">
              <SocialRow socials={socials} chip={t.chip} />
            </span>
          </div>

          <nav className="flex flex-col gap-3">
            <ColHeading>الصفحات</ColHeading>
            {nav.map((n, i) => (
              <a key={n.label} href={n.href} className={`text-[14.5px] text-current ${i === 0 ? "" : "opacity-80 hover:opacity-100"}`}>
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-3">
            <ColHeading>تواصل</ColHeading>
            <ContactLines c={c} muted={t.muted} />
          </div>

          {showHours && (c.hours?.length ?? 0) > 0 && (
            <div className="flex flex-col gap-3">
              <ColHeading>أوقات العمل</ColHeading>
              <HoursList c={c} hairline={t.hairline} />
            </div>
          )}
        </div>
      )}

      {/* ── B — centered ── */}
      {variant === "B" && (
        <div className="flex flex-col items-center gap-[22px] px-[22px] pb-10 pt-[52px] text-center md:px-[26px]">
          <Brand c={c} markCls={t.mark} centered />

          <nav className="flex flex-wrap items-center justify-center gap-4 text-[14.5px] md:gap-[26px]">
            {nav.map((n, i) => (
              <a key={n.label} href={n.href} className={`text-current ${i === 0 ? "" : "opacity-80 hover:opacity-100"}`}>
                {n.label}
              </a>
            ))}
          </nav>

          <SocialRow socials={socials} chip={t.chip} round />

          {showHours && (c.hours?.length ?? 0) > 0 && (
            <span className={`flex flex-wrap items-center justify-center gap-3.5 text-[13.5px] ${t.muted}`}>
              {(c.hours ?? []).map((h, i) => (
                <React.Fragment key={h.days}>
                  {i > 0 && <span aria-hidden className={`h-3 w-px border-e ${t.hairline}`} />}
                  <span>
                    {h.days} {h.time}
                  </span>
                </React.Fragment>
              ))}
            </span>
          )}

          <span className={`flex flex-wrap items-center justify-center gap-4 text-[13.5px] ${t.muted}`}>
            {c.address && <span>{c.address}</span>}
            {c.phone && (
              <a href={`tel:${c.phone.replace(/\s/g, "")}`} dir="ltr" className="font-mono text-[13px] text-current">
                {c.phone}
              </a>
            )}
          </span>
        </div>
      )}

      {/* ── C — info + map ── */}
      {variant === "C" && (
        <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-[22px] px-[22px] py-10 md:px-[26px]">
            <Brand c={c} markCls={t.mark} />

            <div className="grid grid-cols-2 gap-[22px] md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <nav className="flex flex-col gap-2.5">
                <ColHeading>الصفحات</ColHeading>
                {nav.slice(0, 4).map((n, i) => (
                  <a key={n.label} href={n.href} className={`text-sm text-current ${i === 0 ? "" : "opacity-80 hover:opacity-100"}`}>
                    {n.label}
                  </a>
                ))}
              </nav>

              <div className="flex flex-col gap-2.5">
                <ColHeading>تواصل</ColHeading>
                <span className={`text-sm leading-[1.6] ${t.muted}`}>{c.address}</span>
                {c.phone && (
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} dir="ltr" className={`text-start font-mono text-[13px] ${t.muted}`}>
                    {c.phone}
                  </a>
                )}
                {showHours && c.hours?.[0] && (
                  <span className={`text-[13.5px] leading-[1.6] ${t.muted}`}>
                    {c.hours[0].time}
                    {c.hours[1] ? ` · الجمعة من ${c.hours[1].time.split("–")[0].trim()}` : ""}
                  </span>
                )}
              </div>
            </div>

            <span className="mt-auto">
              <SocialRow socials={socials} chip={t.chip} />
            </span>
          </div>

          <MapPlate t={t} mapsUrl={c.mapsUrl} />
        </div>
      )}

      {/* ── legal bar (all variants) ── */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3.5 border-t px-[22px] py-4 text-[12.5px] opacity-75 md:px-[26px] ${t.hairline}`}
      >
        <span>{c.copyright}</span>
        <span className="flex flex-wrap items-center gap-3.5">
          {legalLinks.map((l) => (
            <a key={l.label} href={l.href} className="text-current">
              {l.label}
            </a>
          ))}
          {showSawwiCredit && (
            <a
              href="https://sawwi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.06em] text-current"
            >
              صُنع بـ
              <span className="font-display text-[13px] font-extrabold">سوّي</span>
            </a>
          )}
        </span>
      </div>
    </footer>
  );
}
