// The section design system — render components for every section type. Used by
// BOTH the dashboard live-preview and the public renderer (single source of
// truth). Each honors {variant, scheme} and reads structured site data.
//
// Variants: "A" is the default/canonical layout; "B" and "C" are alternate
// layouts of the SAME content (alignment, columns, emphasis) — never different
// data. Unknown variants fall back to "A".

import {
  MessageCircle,
  Megaphone,
} from "lucide-react";
import type { SectionProps, SiteRenderData, SectionLink } from "./types";
import { text, whatsappLink, readLink } from "./types";
import { SCHEME_BG, mutedText, cardBg, onSchemeButton } from "./scheme";
import { openStatus, groupedHours, toArabicDigits } from "./hours";
import { formatPrice, symbolOf, priceAmount } from "@/shared/currency";
import HeaderUniversal, {
  type HeaderScheme,
  type HeaderVariant,
} from "./headers/header-universal";
import FooterUniversal, {
  type FooterScheme,
  type FooterVariant,
} from "./footers/footer-universal";
import HeroBarbershop, {
  defaultHeroContent,
  type HeroContent,
  type HeroVariant,
} from "./heroes/hero-barbershop";
import AboutUniversal, {
  defaultAboutContent,
  type AboutContent,
  type AboutScheme,
  type AboutVariant,
} from "./abouts/about-universal";
import ServicesUniversal, {
  defaultServicesContent,
  type ServicesContent,
  type ServiceItem,
  type ServicesVariant,
} from "./services/services-universal";
import GalleryUniversal from "./galleries/gallery-universal";
import {
  defaultGalleryPhotos,
  defaultGalleryContent,
  type GalleryContent,
  type GalleryPhoto,
  type GalleryVariant,
} from "./galleries/gallery-data";
import ReviewsUniversal from "./reviews/reviews-universal";
import {
  defaultReviews,
  defaultReviewsContent,
  type ReviewsContent,
  type ReviewItem,
  type RatingBucket,
  type ReviewsVariant,
} from "./reviews/reviews-data";
import TeamUniversal, {
  defaultTeamMembers,
  defaultTeamContent,
  type TeamContent,
  type TeamMember,
  type TeamVariant,
} from "./team/team-universal";
import HoursUniversal from "./opening-hours/hours-universal";
import {
  defaultHoursContent,
  type HoursContent,
  type HoursVariant,
  type DaySchedule,
} from "./opening-hours/hours-data";
import MapUniversal from "./map/map-universal";
import {
  defaultMapContent,
  type MapContent,
  type MapVariant,
  type Branch,
} from "./map/map-data";
import WhatsAppCTAUniversal, {
  defaultWhatsAppContent,
  type WhatsAppContent,
  type WhatsAppVariant,
  type WhatsAppScheme,
  type QuickMessage,
} from "./whatsapp/whatsapp-cta";
import FAQUniversal from "./faq/faq-universal";
import {
  defaultFAQContent,
  type FAQContent,
  type FAQItem,
  type FAQVariant,
} from "./faq/faq-data";
import ContactUniversal from "./contact/contact-universal";
import {
  defaultContactContent,
  defaultSubjects,
  defaultDays,
  defaultTimes,
  type ContactContent,
  type ContactVariant,
  type BookingService,
  type ContactSocials,
} from "./contact/contact-data";

function Wrap({
  scheme,
  children,
  className = "",
}: {
  scheme: SectionProps["scheme"];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={SCHEME_BG[scheme]}>
      <div className={`mx-auto max-w-4xl px-6 py-14 ${className}`}>{children}</div>
    </section>
  );
}

function Heading({
  children,
  align = "center",
}: {
  children: React.ReactNode;
  align?: "center" | "start";
}) {
  // Explicit classes (not interpolated) so Tailwind's scanner emits them.
  const alignClass = align === "start" ? "text-start" : "text-center";
  return (
    <h2 className={`${alignClass} text-2xl font-extrabold md:text-3xl`}>{children}</h2>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────
// Hero is the first section to move to the DESIGN-DISPATCH model: `variant` is a
// design key resolved against HERO_DESIGNS. Shared designs (A/B/C) live here;
// vertical-specific designs (e.g. a barbershop hero) are added as new components
// and registered below + in src/sections/designs.ts. Unknown keys fall back to A.

/** Shared bits every hero design reuses (headline/subtext/CTA). */
function heroParts({ content, site, scheme }: SectionProps) {
  const headline = text(content, "headline", site.businessName);
  const subtext = text(content, "subtext", "");
  const cta = text(content, "ctaLabel", "تواصل معنا");
  const button = (
    <a
      href={whatsappLink(site.settings.whatsappNumber, `مرحبًا ${site.businessName}`)}
      className={`inline-flex items-center gap-2 rounded-md px-6 py-3 font-medium ${onSchemeButton(scheme)}`}
    >
      <MessageCircle className="size-5" /> {cta}
    </a>
  );
  return { headline, subtext, button };
}

/** A — centered classic (shared, default). */
function HeroCentered(props: SectionProps) {
  const { scheme } = props;
  const { headline, subtext, button } = heroParts(props);
  return (
    <Wrap scheme={scheme} className="text-center !py-20">
      <h1 className="text-3xl font-extrabold md:text-5xl">{headline}</h1>
      {subtext && <p className={`mx-auto mt-4 max-w-xl text-lg ${mutedText(scheme)}`}>{subtext}</p>}
      <div className="mt-8">{button}</div>
    </Wrap>
  );
}

/** B — right-aligned headline band (shared). */
function HeroBand(props: SectionProps) {
  const { scheme } = props;
  const { headline, subtext, button } = heroParts(props);
  return (
    <Wrap scheme={scheme} className="!py-16 text-right">
      <h1 className="text-3xl font-extrabold md:text-5xl">{headline}</h1>
      {subtext && <p className={`mt-4 max-w-xl text-lg ${mutedText(scheme)}`}>{subtext}</p>}
      <div className="mt-8">{button}</div>
    </Wrap>
  );
}

/** C — split with a big initial (shared). */
function HeroSplit(props: SectionProps) {
  const { scheme, site } = props;
  const { headline, subtext, button } = heroParts(props);
  return (
    <Wrap scheme={scheme} className="!py-16">
      <div className="flex flex-col items-center gap-6 md:flex-row-reverse md:items-center md:justify-between md:text-right">
        <div
          className={`flex size-28 shrink-0 items-center justify-center rounded-2xl text-5xl font-extrabold ${cardBg(scheme)}`}
        >
          {site.businessName.slice(0, 1)}
        </div>
        <div className="text-center md:text-right">
          <h1 className="text-3xl font-extrabold md:text-5xl">{headline}</h1>
          {subtext && <p className={`mt-3 max-w-xl text-lg ${mutedText(scheme)}`}>{subtext}</p>}
          <div className="mt-6">{button}</div>
        </div>
      </div>
    </Wrap>
  );
}

// ── Barbershop heroes (vertical: barbershop) ──────────────────────────────────
// Adapter: Sawwi's {content, site} → the HeroBarbershop design API. Every field
// falls back to a sensible default (site settings first, then the design's own
// Arabic placeholder) so a fresh section never looks broken. Editable keys are
// the design's content keys; images are storage URLs kept in content.*Url.

// Per-design default copy. The three barbershop designs use the SAME content
// keys but with different placeholder copy (poster vs card vs emblem headlines),
// so defaults are chosen by design key.
function barberCopyDefaults(variant: string) {
  const d = defaultHeroContent;
  if (variant === "barber-editorial") {
    return {
      titleLine1: "كرسيٌّ واحد،",
      titleLine2: "عشرون دقيقةً",
      titleAccent: "تُغيّر يومك",
      body: "ثلاثة حلاقين يعملون كما تعلّموا من آبائهم: بأدواتٍ حُفظت جيدًا، وبوقتٍ يُمنح للعميل لا يُقتَطع منه.",
      primaryCta: "احجز موعدك",
      secondaryCta: "قائمة الأسعار",
    };
  }
  if (variant === "barber-emblem") {
    return {
      titleLine1: "صالونٌ يعرف اسمك",
      titleLine2: "وقصّتك المفضّلة",
      titleAccent: d.titleAccent,
      body: "احجز موعدك في دقيقة عبر واتساب، واحضر حين يحين وقتك — بلا انتظار.",
      primaryCta: d.primaryCta,
      secondaryCta: d.secondaryCta,
    };
  }
  // poster (barber-cinematic) + fallback
  return {
    titleLine1: d.titleLine1,
    titleLine2: d.titleLine2,
    titleAccent: d.titleAccent,
    body: d.body,
    primaryCta: d.primaryCta,
    secondaryCta: d.secondaryCta,
  };
}

// Resolve a button's SectionLink to a concrete href (and whether it's WhatsApp,
// so the button can show the WA icon). Falls back to a safe "#".
function resolveHref(
  link: SectionLink,
  site: SiteRenderData,
  waDigits: string,
  waMessage: string,
): { href: string; whatsapp: boolean } {
  switch (link.kind) {
    case "section":
      return { href: link.value ? `#${link.value}` : "#", whatsapp: false };
    case "page": {
      const base = site.basePath ?? "";
      const path = link.value || "/";
      return { href: path === "/" ? base || "/" : base + path, whatsapp: false };
    }
    case "url":
      return { href: link.value || "#", whatsapp: false };
    case "none":
      return { href: "#", whatsapp: false };
    case "whatsapp":
    default:
      return { href: whatsappLink(waDigits || defaultHeroContent.whatsapp, waMessage), whatsapp: true };
  }
}

function barbershopContent(props: SectionProps): Partial<HeroContent> {
  const { content, site, variant } = props;
  const s = site.settings;
  const d = defaultHeroContent;
  const cd = barberCopyDefaults(variant);
  const waDigits = (s.whatsappNumber ?? "").replace(/[^0-9]/g, "");
  // Status is automatic from the site's working hours (not user-editable). When
  // no hours are configured, the indicator is hidden (empty label).
  const status = openStatus(s.openingHours);
  const rating = text(content, "rating", d.rating);
  const reviewCount = text(content, "reviewCount", d.reviewCount);
  const shopName = text(content, "shopName", site.businessName || d.shopName);

  // Button destinations. Defaults: primary → WhatsApp; secondary → the section
  // that matches the design (prices for the card, services otherwise).
  const waMessage = `مرحبًا ${shopName}، أريد حجز موعد`;
  const defaultSecSlug = variant === "barber-editorial" ? "pricelist" : "services";
  const primary = resolveHref(
    readLink(content, "primaryLink") ?? { kind: "whatsapp" },
    site,
    waDigits,
    waMessage,
  );
  const secondary = resolveHref(
    readLink(content, "secondaryLink") ?? { kind: "section", value: defaultSecSlug },
    site,
    waDigits,
    waMessage,
  );

  return {
    shopName,
    latinName: text(content, "latinName", d.latinName),
    monogram: text(content, "monogram", site.businessName?.slice(0, 1) || d.monogram),
    established: text(content, "established", d.established),
    city: text(content, "city", d.city),
    kicker: text(content, "kicker", d.kicker),
    titleLine1: text(content, "titleLine1", cd.titleLine1),
    titleLine2: text(content, "titleLine2", cd.titleLine2),
    titleAccent: text(content, "titleAccent", cd.titleAccent),
    body: text(content, "body", cd.body),
    primaryCta: text(content, "primaryCta", cd.primaryCta),
    secondaryCta: text(content, "secondaryCta", cd.secondaryCta),
    primaryHref: primary.href,
    primaryIsWhatsapp: primary.whatsapp,
    secondaryHref: secondary.href,
    openLabel: status ? status.label : "",
    openShort: status ? (status.open ? "مفتوح الآن" : "مغلق الآن") : "",
    openState: status ? (status.open ? "open" : "closed") : undefined,
    addressShort: text(content, "addressShort", s.address ?? d.addressShort),
    rating,
    reviewCount,
    ratingLine: `${rating} · ${reviewCount}`,
    yearsValue: text(content, "yearsValue", d.yearsValue),
    yearsLabel: text(content, "yearsLabel", d.yearsLabel),
    photoCaption: text(content, "photoCaption", d.photoCaption),
    whatsapp: waDigits || d.whatsapp,
  };
}

function barbershopImages(content: Record<string, unknown>) {
  return {
    bg: text(content, "bgUrl", "") || undefined,
    portrait: text(content, "portraitUrl", "") || undefined,
  };
}

function makeBarberHero(variant: HeroVariant) {
  function BarberHero(props: SectionProps) {
    return (
      <HeroBarbershop
        variant={variant}
        content={barbershopContent(props)}
        images={barbershopImages(props.content)}
      />
    );
  }
  return BarberHero;
}

/**
 * The EFFECTIVE value shown for each editable field — what the section actually
 * renders, after resolving stored content, site settings, and design defaults.
 * The builder inspector uses this so fields are pre-filled with real values (not
 * blank) even when the value is derived rather than explicitly stored.
 */
export function fieldEffectiveValues(
  variant: string,
  content: Record<string, unknown>,
  site: SiteRenderData,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (variant.startsWith("barber-")) {
    const resolved = barbershopContent({ variant, scheme: "primary", content, site });
    const images = barbershopImages(content);
    const merged: Record<string, unknown> = {
      ...resolved,
      bgUrl: images.bg ?? "",
      portraitUrl: images.portrait ?? "",
    };
    for (const [k, v] of Object.entries(merged)) {
      if (typeof v === "string" || Array.isArray(v)) out[k] = v;
    }
  } else if (variant.startsWith("about-")) {
    return aboutFieldEffectiveValues(variant, content, site);
  } else if (variant.startsWith("services-")) {
    return servicesFieldEffectiveValues(content);
  } else if (variant.startsWith("gallery-")) {
    return galleryFieldEffectiveValues(content);
  } else if (variant.startsWith("reviews-")) {
    return reviewsFieldEffectiveValues(content);
  } else if (variant.startsWith("team-")) {
    return teamFieldEffectiveValues(content);
  } else if (variant.startsWith("hours-")) {
    return hoursFieldEffectiveValues(content);
  } else if (variant.startsWith("map-")) {
    return mapFieldEffectiveValues(content);
  } else if (variant.startsWith("wa-")) {
    return whatsappFieldEffectiveValues(content, site);
  } else if (variant.startsWith("faq-")) {
    return faqFieldEffectiveValues(content);
  } else if (variant.startsWith("contact-")) {
    return contactFieldEffectiveValues(content);
  }
  return out;
}

/** design key → component. Add vertical-specific hero designs here. */
const HERO_DESIGNS: Record<string, React.ComponentType<SectionProps>> = {
  A: HeroCentered,
  B: HeroBand,
  C: HeroSplit,
  "barber-cinematic": makeBarberHero("A"),
  "barber-editorial": makeBarberHero("B"),
  "barber-emblem": makeBarberHero("C"),
};

export function Hero(props: SectionProps) {
  const Design = HERO_DESIGNS[props.variant] ?? HeroCentered;
  return <Design {...props} />;
}

// ── About (shared, all verticals) ─────────────────────────────────────────────
// Design-dispatch like the hero: the `variant` key selects one of the three
// AboutUniversal layouts. Values/stats/milestones are repeatable `group` records
// in content; text + images are per-section editable. Legacy A/B/C rows still map.

const ABOUT_VARIANTS: Record<string, AboutVariant> = {
  "about-photo": "A",
  "about-statement": "B",
  "about-milestones": "C",
  A: "A",
  B: "B",
  C: "C",
};
const VALUE_ICONS = ["hand", "clock", "star", "shield"] as const;

// Several bespoke designs share the same paper/dark/accent scheme triplet. Map
// the section's stored ColorScheme onto it (dark-ish → dark, accent-ish → accent).
function schemeTriplet(scheme: SectionProps["scheme"]): "paper" | "dark" | "accent" {
  if (scheme === "dark" || scheme === "bold") return "dark";
  if (scheme === "primary" || scheme === "accent" || scheme === "soft") return "accent";
  return "paper";
}
const aboutScheme = (scheme: SectionProps["scheme"]): AboutScheme => schemeTriplet(scheme);

// Per-variant default copy (the timeline leads with different headings/kicker).
function aboutCopyDefaults(variant: string) {
  const d = defaultAboutContent;
  if (variant === "about-milestones") {
    return {
      kicker: "مسيرتنا",
      titleLine1: "من محلٍّ واحد",
      titleLine2: "إلى فريقٍ يعرفه الحيّ",
      lede: "لم يحدث شيء بسرعة، وهذا جيد. كل خطوة أخذت وقتها حتى صارت ثابتة.",
    };
  }
  return { kicker: d.kicker, titleLine1: d.titleLine1, titleLine2: d.titleLine2, lede: d.lede };
}

/** Read a repeatable `group` field (array of string records) from content. */
function readGroup(content: Record<string, unknown>, key: string): Record<string, string>[] | null {
  const v = content[key];
  if (!Array.isArray(v)) return null;
  return v
    .filter((it): it is Record<string, unknown> => !!it && typeof it === "object")
    .map((it) => {
      const row: Record<string, string> = {};
      for (const [k, val] of Object.entries(it)) if (typeof val === "string") row[k] = val;
      return row;
    });
}

function aboutContent(props: SectionProps): Partial<AboutContent> {
  const { content, variant, site } = props;
  const d = defaultAboutContent;
  const cd = aboutCopyDefaults(variant);

  const values = (readGroup(content, "values") ?? d.values).map((v, i) => ({
    title: v.title ?? "",
    body: v.body ?? "",
    icon: VALUE_ICONS[i % VALUE_ICONS.length],
  }));
  const stats = (readGroup(content, "stats") ?? d.stats).map((s) => ({
    value: s.value ?? "",
    label: s.label ?? "",
  }));
  const milestonesRaw = readGroup(content, "milestones") ?? d.milestones;
  const milestones = milestonesRaw.map((m, i) => ({
    year: m.year ?? "",
    title: m.title ?? "",
    body: m.body ?? "",
    current: i === milestonesRaw.length - 1, // the last row is "today"
  }));

  return {
    kicker: text(content, "kicker", cd.kicker),
    titleLine1: text(content, "titleLine1", cd.titleLine1),
    titleLine2: text(content, "titleLine2", cd.titleLine2),
    lede: text(content, "lede", cd.lede),
    body: text(content, "body", d.body ?? ""),
    signature: text(content, "signature", `— فريق ${site.businessName || "العمل"}`),
    signatureMeta: text(content, "signatureMeta", site.businessName || d.signatureMeta || ""),
    badgeValue: text(content, "badgeValue", d.badgeValue ?? ""),
    badgeLabel: text(content, "badgeLabel", d.badgeLabel ?? ""),
    values,
    stats,
    milestones,
  };
}

function aboutImages(content: Record<string, unknown>) {
  return {
    main: text(content, "mainUrl", "") || undefined,
    detail: text(content, "detailUrl", "") || undefined,
    team: text(content, "teamUrl", "") || undefined,
  };
}

/** Effective values for the inspector — text keys, `group` arrays, image URLs. */
function aboutFieldEffectiveValues(
  variant: string,
  content: Record<string, unknown>,
  site: SiteRenderData,
): Record<string, unknown> {
  const d = defaultAboutContent;
  const cd = aboutCopyDefaults(variant);
  const strip = (rows: readonly Record<string, unknown>[], keys: string[]) =>
    rows.map((r) => Object.fromEntries(keys.map((k) => [k, typeof r[k] === "string" ? (r[k] as string) : ""])));
  return {
    kicker: text(content, "kicker", cd.kicker),
    titleLine1: text(content, "titleLine1", cd.titleLine1),
    titleLine2: text(content, "titleLine2", cd.titleLine2),
    lede: text(content, "lede", cd.lede),
    body: text(content, "body", d.body ?? ""),
    values: readGroup(content, "values") ?? strip(d.values as unknown as Record<string, unknown>[], ["title", "body"]),
    stats: readGroup(content, "stats") ?? strip(d.stats as unknown as Record<string, unknown>[], ["value", "label"]),
    milestones: readGroup(content, "milestones") ?? strip(d.milestones as unknown as Record<string, unknown>[], ["year", "title", "body"]),
    signature: text(content, "signature", `— فريق ${site.businessName || "العمل"}`),
    signatureMeta: text(content, "signatureMeta", site.businessName || d.signatureMeta || ""),
    badgeValue: text(content, "badgeValue", d.badgeValue ?? ""),
    badgeLabel: text(content, "badgeLabel", d.badgeLabel ?? ""),
    mainUrl: text(content, "mainUrl", ""),
    detailUrl: text(content, "detailUrl", ""),
    teamUrl: text(content, "teamUrl", ""),
  };
}

export function About(props: SectionProps) {
  const variant = ABOUT_VARIANTS[props.variant] ?? "A";
  return (
    <AboutUniversal
      variant={variant}
      scheme={aboutScheme(props.scheme)}
      content={aboutContent(props)}
      images={aboutImages(props.content)}
    />
  );
}

// ── ServicesGrid (shared, all verticals) ──────────────────────────────────────
// Design-dispatch like the hero/about. Items come from the site's ONE service
// list (edited in the services editor, not per-section); the inspector edits the
// header copy + design + (variant C) the photos. Legacy A/B/C keys still map.

const SERVICES_VARIANTS: Record<string, ServicesVariant> = {
  "services-numbered": "A",
  "services-list": "B",
  "services-photos": "C",
  A: "A",
  B: "B",
  C: "C",
};
const SERVICES_PHOTO_COUNT = 3;
// Generic placeholders so the design previews with structure when a site has no
// services yet (real sites are seeded with services, so this is a rare fallback).
const SERVICE_FALLBACK: ServiceItem[] = [
  { name: "الخدمة الأولى", desc: "وصف مختصر لهذه الخدمة.", price: "حسب الطلب" },
  { name: "الخدمة الثانية", desc: "وصف مختصر لهذه الخدمة.", price: "حسب الطلب" },
  { name: "الخدمة الثالثة", desc: "وصف مختصر لهذه الخدمة.", price: "حسب الطلب" },
];

function servicesItems(
  site: SiteRenderData,
  content: Record<string, unknown>,
  variant: ServicesVariant,
): ServiceItem[] {
  // Prices render with the site's single currency + Arabic digits (so every
  // service matches regardless of how each was typed); durations are localized too.
  const cur = site.settings.currency;
  const mapped: ServiceItem[] = site.services.map((s) => ({
    name: s.name,
    desc: s.description ?? undefined,
    dur: s.duration ? toArabicDigits(s.duration) : undefined,
    price: s.price ? formatPrice(s.price, cur) : undefined,
  }));
  const all = mapped.length ? mapped : SERVICE_FALLBACK;
  // Optional `limit` trims the list — used to show a teaser of the top services
  // on the home page while a dedicated services page renders the full list.
  const rawLimit = Number(content.limit);
  const items =
    Number.isFinite(rawLimit) && rawLimit > 0 ? all.slice(0, rawLimit) : all;
  // Variant C shows photos; they're per-section image URLs applied to the first
  // few services in order (services themselves carry no photo).
  if (variant === "C") {
    return items.map((it, i) =>
      i < SERVICES_PHOTO_COUNT
        ? { ...it, photo: text(content, `photo${i + 1}Url`, "") || undefined }
        : it,
    );
  }
  return items;
}

function servicesContent(
  content: Record<string, unknown>,
  site: SiteRenderData,
): Partial<ServicesContent> {
  const d = defaultServicesContent;
  const waDigits = (site.settings.whatsappNumber ?? "").replace(/[^0-9]/g, "");
  return {
    kicker: text(content, "kicker", d.kicker),
    title: text(content, "title", d.title),
    lede: text(content, "lede", d.lede ?? ""),
    countLabel: text(content, "countLabel", d.countLabel ?? ""),
    footnote: text(content, "footnote", d.footnote ?? ""),
    ctaLabel: text(content, "ctaLabel", d.ctaLabel ?? ""),
    whatsapp: waDigits || undefined,
  };
}

function servicesFieldEffectiveValues(
  content: Record<string, unknown>,
): Record<string, unknown> {
  const d = defaultServicesContent;
  return {
    kicker: text(content, "kicker", d.kicker),
    title: text(content, "title", d.title),
    lede: text(content, "lede", d.lede ?? ""),
    countLabel: text(content, "countLabel", d.countLabel ?? ""),
    footnote: text(content, "footnote", d.footnote ?? ""),
    ctaLabel: text(content, "ctaLabel", d.ctaLabel ?? ""),
    photo1Url: text(content, "photo1Url", ""),
    photo2Url: text(content, "photo2Url", ""),
    photo3Url: text(content, "photo3Url", ""),
  };
}

export function ServicesGrid(props: SectionProps) {
  const variant = SERVICES_VARIANTS[props.variant] ?? "A";
  return (
    <ServicesUniversal
      variant={variant}
      scheme={schemeTriplet(props.scheme)}
      items={servicesItems(props.site, props.content, variant)}
      content={servicesContent(props.content, props.site)}
      photoCount={SERVICES_PHOTO_COUNT}
    />
  );
}

export function PriceList({ scheme, content, site }: SectionProps) {
  const items = site.services;
  return (
    <Wrap scheme={scheme}>
      <Heading>{text(content, "title", "قائمة الأسعار")}</Heading>
      <div className="mx-auto mt-8 max-w-xl divide-y divide-current/10">
        {items.map((s) => (
          <div key={s.id} className="flex items-baseline justify-between py-3">
            <span className="font-medium">{s.name}</span>
            <span className="mx-3 flex-1 border-b border-dashed border-current/20" />
            <span className="font-label">{s.price ? formatPrice(s.price, site.settings.currency) : "—"}</span>
          </div>
        ))}
      </div>
    </Wrap>
  );
}

// ── Gallery (shared, all verticals) ───────────────────────────────────────────
// Design-dispatch: four motion/layout designs (mosaic/bands/stage/columns). It's
// a client island (variants B/C/D animate/interact). Photos are a per-section
// list of {src,label}, edited via the inspector's image-capable `group` field.

const GALLERY_VARIANTS: Record<string, GalleryVariant> = {
  "gallery-mosaic": "A",
  "gallery-bands": "B",
  "gallery-stage": "C",
  "gallery-columns": "D",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
};

/** Read the section's photo list; falls back to labelled placeholders so the
 *  design previews with structure before any image is uploaded. */
function galleryPhotos(content: Record<string, unknown>): GalleryPhoto[] {
  const rows = readGroup(content, "photos");
  if (!rows || rows.length === 0) return defaultGalleryPhotos;
  // Keep an empty label EMPTY (don't invent one) — a blank description hides that
  // photo's caption. Writing text shows it; leaving it blank hides it.
  return rows.map((r) => ({
    src: r.src || undefined,
    label: r.label || "",
  }));
}

function galleryContent(
  content: Record<string, unknown>,
  site: SiteRenderData,
): Partial<GalleryContent> {
  const d = defaultGalleryContent;
  const waDigits = (site.settings.whatsappNumber ?? "").replace(/[^0-9]/g, "");
  return {
    kicker: text(content, "kicker", d.kicker),
    title: text(content, "title", d.title),
    lede: text(content, "lede", d.lede ?? ""),
    countLabel: text(content, "countLabel", d.countLabel ?? ""),
    footnote: text(content, "footnote", d.footnote ?? ""),
    ctaLabel: text(content, "ctaLabel", d.ctaLabel ?? ""),
    whatsapp: waDigits || undefined,
  };
}

function galleryFieldEffectiveValues(
  content: Record<string, unknown>,
): Record<string, unknown> {
  const d = defaultGalleryContent;
  return {
    kicker: text(content, "kicker", d.kicker),
    title: text(content, "title", d.title),
    lede: text(content, "lede", d.lede ?? ""),
    countLabel: text(content, "countLabel", d.countLabel ?? ""),
    footnote: text(content, "footnote", d.footnote ?? ""),
    ctaLabel: text(content, "ctaLabel", d.ctaLabel ?? ""),
    // Photos default to empty rows so the builder starts from an explicit list
    // (the design's own placeholders only fill the live preview, not the editor).
    photos: readGroup(content, "photos") ?? [],
  };
}

export function Gallery(props: SectionProps) {
  const variant = GALLERY_VARIANTS[props.variant] ?? "A";
  return (
    <GalleryUniversal
      variant={variant}
      scheme={schemeTriplet(props.scheme)}
      photos={galleryPhotos(props.content)}
      content={galleryContent(props.content, props.site)}
    />
  );
}

// ── Testimonials / Reviews (shared, all verticals) ────────────────────────────
// Design-dispatch: four designs (grid/marquee/solo/summary). Reviews are a
// per-SECTION list (name/meta/rating/text) edited in the builder — NOT the site
// settings — so they carry real ratings. The average + the variant-D star
// distribution are COMPUTED from those ratings (no fake numbers). Client island.

const REVIEWS_VARIANTS: Record<string, ReviewsVariant> = {
  "reviews-grid": "A",
  "reviews-marquee": "B",
  "reviews-solo": "C",
  "reviews-summary": "D",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
};

// Default rows for the builder editor (string records), from the design's samples.
const DEFAULT_REVIEW_ROWS: Record<string, string>[] = defaultReviews.map((r) => ({
  name: r.name,
  meta: r.meta ?? "",
  rating: String(r.rating),
  text: r.text,
}));

/** Parse a user-entered rating (Arabic or Latin digits) → 1–5, default 5. */
function parseReviewRating(v: string): number {
  const latin = v.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const n = parseInt(latin, 10);
  if (Number.isNaN(n)) return 5;
  return Math.min(5, Math.max(1, n));
}

function reviewsItems(content: Record<string, unknown>): ReviewItem[] {
  const rows = readGroup(content, "reviews");
  const source = rows && rows.length ? rows : DEFAULT_REVIEW_ROWS;
  return source.map((r) => ({
    name: r.name || "عميل",
    meta: r.meta || undefined,
    rating: parseReviewRating(r.rating ?? ""),
    text: r.text || "",
  }));
}

/** Average + star distribution computed from the actual reviews. */
function reviewsDerived(items: ReviewItem[]): {
  average?: string;
  buckets: RatingBucket[];
  total: number;
} {
  const total = items.length;
  const counts = [0, 0, 0, 0, 0]; // index 0 = 1★ … 4 = 5★
  items.forEach((r) => { counts[r.rating - 1]++; });
  const avg = total ? items.reduce((s, r) => s + r.rating, 0) / total : 0;
  const average = total ? toArabicDigits(avg.toFixed(1)).replace(".", "٫") : undefined;
  const buckets: RatingBucket[] = [5, 4, 3, 2, 1].map((star) => ({
    label: toArabicDigits(String(star)),
    count: counts[star - 1],
    pct: total ? Math.round((counts[star - 1] / total) * 100) : 0,
  }));
  return { average, buckets, total };
}

function reviewsContent(
  content: Record<string, unknown>,
  site: SiteRenderData,
  derived: ReturnType<typeof reviewsDerived>,
): Partial<ReviewsContent> {
  const d = defaultReviewsContent;
  const waDigits = (site.settings.whatsappNumber ?? "").replace(/[^0-9]/g, "");
  return {
    kicker: text(content, "kicker", d.kicker),
    title: text(content, "title", d.title),
    lede: text(content, "lede", d.lede ?? ""),
    average: derived.average,
    totalLabel: text(content, "totalLabel", `من ${toArabicDigits(String(derived.total))} تقييمًا`),
    footnote: text(content, "footnote", d.footnote ?? ""),
    ctaLabel: text(content, "ctaLabel", d.ctaLabel ?? ""),
    writeLabel: text(content, "writeLabel", d.writeLabel ?? ""),
    whatsapp: waDigits || undefined,
  };
}

function reviewsFieldEffectiveValues(content: Record<string, unknown>): Record<string, unknown> {
  const d = defaultReviewsContent;
  return {
    kicker: text(content, "kicker", d.kicker),
    title: text(content, "title", d.title),
    lede: text(content, "lede", d.lede ?? ""),
    footnote: text(content, "footnote", d.footnote ?? ""),
    ctaLabel: text(content, "ctaLabel", d.ctaLabel ?? ""),
    writeLabel: text(content, "writeLabel", d.writeLabel ?? ""),
    reviews: readGroup(content, "reviews") ?? DEFAULT_REVIEW_ROWS,
  };
}

export function Testimonials(props: SectionProps) {
  const variant = REVIEWS_VARIANTS[props.variant] ?? "A";
  const items = reviewsItems(props.content);
  const derived = reviewsDerived(items);
  return (
    <ReviewsUniversal
      variant={variant}
      scheme={schemeTriplet(props.scheme)}
      reviews={items}
      buckets={derived.buckets}
      content={reviewsContent(props.content, props.site, derived)}
    />
  );
}

// ── Team (shared, all verticals) ──────────────────────────────────────────────
// Design-dispatch: four designs (portraits/rows/squares/featured). Members are a
// per-SECTION list (name/role/photo/years/bio/quote/socials) edited in the
// builder — NOT the site settings — with per-member photo uploads. Pure/server.

const TEAM_VARIANTS: Record<string, TeamVariant> = {
  "team-portraits": "A",
  "team-rows": "B",
  "team-squares": "C",
  "team-featured": "D",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
};

// Default rows for the builder editor (string records), from the design's samples.
const DEFAULT_TEAM_ROWS: Record<string, string>[] = defaultTeamMembers.map((mem) => ({
  name: mem.name,
  role: mem.role,
  photo: "",
  years: mem.years != null ? String(mem.years) : "",
  bio: mem.bio ?? "",
  quote: mem.quote ?? "",
  instagram: mem.socials?.instagram ?? "",
  whatsapp: mem.socials?.whatsapp ?? "",
}));

function teamMembers(content: Record<string, unknown>): TeamMember[] {
  const rows = readGroup(content, "members");
  const source = rows && rows.length ? rows : DEFAULT_TEAM_ROWS;
  return source.map((r) => {
    const yearsNum = parseInt((r.years ?? "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))), 10);
    const instagram = r.instagram || undefined;
    const whatsapp = (r.whatsapp ?? "").replace(/[^0-9]/g, "") || undefined;
    return {
      name: r.name || "عضو الفريق",
      role: r.role || "",
      photo: r.photo || undefined,
      years: Number.isNaN(yearsNum) ? undefined : yearsNum,
      bio: r.bio || undefined,
      quote: r.quote || undefined,
      socials: instagram || whatsapp ? { instagram, whatsapp } : undefined,
    };
  });
}

function teamContent(
  content: Record<string, unknown>,
  site: SiteRenderData,
): Partial<TeamContent> {
  const d = defaultTeamContent;
  const waDigits = (site.settings.whatsappNumber ?? "").replace(/[^0-9]/g, "");
  return {
    kicker: text(content, "kicker", d.kicker),
    title: text(content, "title", d.title),
    lede: text(content, "lede", d.lede ?? ""),
    countLabel: text(content, "countLabel", d.countLabel ?? ""),
    featuredLabel: text(content, "featuredLabel", d.featuredLabel ?? ""),
    footnote: text(content, "footnote", d.footnote ?? ""),
    ctaLabel: text(content, "ctaLabel", d.ctaLabel ?? ""),
    whatsapp: waDigits || undefined,
  };
}

function teamFieldEffectiveValues(content: Record<string, unknown>): Record<string, unknown> {
  const d = defaultTeamContent;
  return {
    kicker: text(content, "kicker", d.kicker),
    title: text(content, "title", d.title),
    lede: text(content, "lede", d.lede ?? ""),
    featuredLabel: text(content, "featuredLabel", d.featuredLabel ?? ""),
    footnote: text(content, "footnote", d.footnote ?? ""),
    ctaLabel: text(content, "ctaLabel", d.ctaLabel ?? ""),
    members: readGroup(content, "members") ?? DEFAULT_TEAM_ROWS,
  };
}

export function Team(props: SectionProps) {
  const variant = TEAM_VARIANTS[props.variant] ?? "A";
  return (
    <TeamUniversal
      variant={variant}
      scheme={schemeTriplet(props.scheme)}
      members={teamMembers(props.content)}
      content={teamContent(props.content, props.site)}
    />
  );
}

// ── Faq (shared, all verticals) ───────────────────────────────────────────────
// Design-dispatch: four designs (accordion/columns/grouped/qa). Questions are a
// per-SECTION list (question/answer/category) edited in the builder — NOT the
// site settings. Client island; emits FAQPage JSON-LD for SEO.

const FAQ_VARIANTS: Record<string, FAQVariant> = {
  "faq-accordion": "A",
  "faq-columns": "B",
  "faq-grouped": "C",
  "faq-qa": "D",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
};

const DEFAULT_FAQ_ROWS: Record<string, string>[] = [
  { question: "هل أحتاج موعدًا مسبقًا؟", answer: "نستقبل بلا موعد، لكن الحجز عبر واتساب يوفّر عليك الانتظار.", group: "المواعيد" },
  { question: "هل الأسعار المعلنة نهائية؟", answer: "نعم، الأسعار نهائية وتشمل كل شيء بلا رسوم إضافية.", group: "الأسعار" },
  { question: "هل تستخدمون أدوات معقّمة؟", answer: "كل الأدوات تُعقّم بعد كل زبون، والشفرات تُستخدم مرة واحدة.", group: "الخدمات" },
];

function faqItems(content: Record<string, unknown>): FAQItem[] {
  const rows = readGroup(content, "items");
  const source = rows && rows.length ? rows : DEFAULT_FAQ_ROWS;
  return source
    .filter((r) => (r.question ?? "").trim())
    .map((r) => ({ question: r.question, answer: r.answer || "", group: r.group || undefined }));
}

function faqContent(
  content: Record<string, unknown>,
  site: SiteRenderData,
): Partial<FAQContent> {
  const d = defaultFAQContent;
  const waDigits = (site.settings.whatsappNumber ?? "").replace(/[^0-9]/g, "");
  return {
    kicker: text(content, "kicker", d.kicker),
    title: text(content, "title", d.title),
    lede: text(content, "lede", d.lede ?? ""),
    helpTitle: text(content, "helpTitle", d.helpTitle ?? ""),
    helpBody: text(content, "helpBody", d.helpBody ?? ""),
    helpCta: text(content, "helpCta", d.helpCta ?? ""),
    whatsapp: waDigits || undefined,
  };
}

function faqFieldEffectiveValues(content: Record<string, unknown>): Record<string, unknown> {
  const d = defaultFAQContent;
  return {
    kicker: text(content, "kicker", d.kicker),
    title: text(content, "title", d.title),
    lede: text(content, "lede", d.lede ?? ""),
    helpTitle: text(content, "helpTitle", d.helpTitle ?? ""),
    helpBody: text(content, "helpBody", d.helpBody ?? ""),
    helpCta: text(content, "helpCta", d.helpCta ?? ""),
    items: readGroup(content, "items") ?? DEFAULT_FAQ_ROWS,
  };
}

export function Faq(props: SectionProps) {
  const variant = FAQ_VARIANTS[props.variant] ?? "A";
  return (
    <FAQUniversal
      variant={variant}
      scheme={schemeTriplet(props.scheme)}
      items={faqItems(props.content)}
      content={faqContent(props.content, props.site)}
    />
  );
}

// ── OpeningHours (shared, all verticals) ──────────────────────────────────────
// Design-dispatch: four designs (table/status/week/address). The SCHEDULE comes
// from site SETTINGS (not per-section) — only the section's copy is editable. The
// open/closed status is computed live in the shop timezone by the client island.

const HOURS_VARIANTS: Record<string, HoursVariant> = {
  "hours-table": "A",
  "hours-status": "B",
  "hours-week": "C",
  "hours-address": "D",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
};

// sat-first day metadata: settings key → js weekday (getDay) + Arabic labels.
const HOURS_DAY_META = [
  { key: "sat", js: 6, name: "السبت", short: "سبت" },
  { key: "sun", js: 0, name: "الأحد", short: "أحد" },
  { key: "mon", js: 1, name: "الاثنين", short: "اثنين" },
  { key: "tue", js: 2, name: "الثلاثاء", short: "ثلاثاء" },
  { key: "wed", js: 3, name: "الأربعاء", short: "أربعاء" },
  { key: "thu", js: 4, name: "الخميس", short: "خميس" },
  { key: "fri", js: 5, name: "الجمعة", short: "جمعة" },
] as const;

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map((x) => Number.parseInt(x, 10));
  return h * 60 + (m || 0);
};

/** Build the design's schedule from the site's settings hours (kept in settings,
 *  not editable per-section). Falls back to the design's default week if unset. */
function scheduleFromSettings(site: SiteRenderData): DaySchedule[] | undefined {
  const hours = site.settings.openingHours;
  if (!hours || Object.keys(hours).length === 0) return undefined; // → design default
  return HOURS_DAY_META.map((d) => {
    const h = hours[d.key] as { closed?: unknown; open?: unknown; close?: unknown } | undefined;
    // Open only when it has real times AND isn't flagged closed. Checking
    // `closed === true` (not `"closed" in h`) so a `{ closed: false, … }` day
    // still counts as open.
    if (!h || h.closed === true || typeof h.open !== "string" || typeof h.close !== "string") {
      return { js: d.js, name: d.name, short: d.short };
    }
    return { js: d.js, name: d.name, short: d.short, open: toMinutes(h.open), close: toMinutes(h.close) };
  });
}

function hoursContent(
  content: Record<string, unknown>,
  site: SiteRenderData,
): Partial<HoursContent> {
  const d = defaultHoursContent;
  const waDigits = (site.settings.whatsappNumber ?? "").replace(/[^0-9]/g, "");
  return {
    kicker: text(content, "kicker", d.kicker),
    title: text(content, "title", d.title),
    lede: text(content, "lede", d.lede ?? ""),
    seasonalNote: text(content, "seasonalNote", d.seasonalNote ?? ""),
    footnote: text(content, "footnote", d.footnote ?? ""),
    ctaLabel: text(content, "ctaLabel", d.ctaLabel ?? ""),
    bookLabel: text(content, "bookLabel", d.bookLabel ?? ""),
    // Address / phone / map come from settings (variant D).
    address: site.settings.address ?? undefined,
    phone: site.settings.phone ?? undefined,
    mapsUrl: site.settings.googleMapsUrl ?? undefined,
    whatsapp: waDigits || undefined,
  };
}

function hoursFieldEffectiveValues(content: Record<string, unknown>): Record<string, unknown> {
  const d = defaultHoursContent;
  return {
    kicker: text(content, "kicker", d.kicker),
    title: text(content, "title", d.title),
    lede: text(content, "lede", d.lede ?? ""),
    seasonalNote: text(content, "seasonalNote", d.seasonalNote ?? ""),
    footnote: text(content, "footnote", d.footnote ?? ""),
    ctaLabel: text(content, "ctaLabel", d.ctaLabel ?? ""),
    bookLabel: text(content, "bookLabel", d.bookLabel ?? ""),
  };
}

export function OpeningHours(props: SectionProps) {
  const variant = HOURS_VARIANTS[props.variant] ?? "A";
  return (
    <HoursUniversal
      variant={variant}
      scheme={schemeTriplet(props.scheme)}
      schedule={scheduleFromSettings(props.site)}
      content={hoursContent(props.content, props.site)}
    />
  );
}

// ── MapAddress / Location (shared, all verticals) ─────────────────────────────
// Design-dispatch: four designs (split/wide/overlay/branches). Address + phone +
// map link come from site SETTINGS; only the section's copy is editable. The
// "branches" design adds a per-section branch list. Schematic map (no API key).

const MAP_VARIANTS: Record<string, MapVariant> = {
  "map-split": "A",
  "map-wide": "B",
  "map-overlay": "C",
  "map-branches": "D",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
};

function mapContent(
  content: Record<string, unknown>,
  site: SiteRenderData,
): Partial<MapContent> {
  const d = defaultMapContent;
  const waDigits = (site.settings.whatsappNumber ?? "").replace(/[^0-9]/g, "");
  return {
    kicker: text(content, "kicker", d.kicker),
    title: text(content, "title", d.title),
    lede: text(content, "lede", d.lede ?? ""),
    transportNote: text(content, "transportNote", d.transportNote ?? ""),
    landmarkLabel: text(content, "landmarkLabel", d.landmarkLabel ?? ""),
    directionsLabel: text(content, "directionsLabel", d.directionsLabel ?? ""),
    copyLabel: text(content, "copyLabel", d.copyLabel ?? ""),
    // From settings (single business location):
    businessName: site.businessName,
    address: site.settings.address ?? undefined,
    phone: site.settings.phone ?? undefined,
    mapsUrl: site.settings.googleMapsUrl ?? undefined,
    whatsapp: waDigits || undefined,
  };
}

/** Branches for the "branches" design. Uses the section's branch list; when
 *  empty, synthesizes one branch from the site's own settings (the main location). */
function mapBranches(content: Record<string, unknown>, site: SiteRenderData): Branch[] {
  const rows = readGroup(content, "branches");
  if (rows && rows.length) {
    return rows.map((r) => ({
      name: r.name || site.businessName,
      address: r.address || "",
      hours: r.hours || undefined,
      phone: r.phone || undefined,
      mapsUrl: r.mapsUrl || undefined,
    }));
  }
  return [
    {
      name: site.businessName,
      address: site.settings.address ?? "",
      phone: site.settings.phone ?? undefined,
      mapsUrl: site.settings.googleMapsUrl ?? undefined,
      main: true,
    },
  ];
}

function mapFieldEffectiveValues(content: Record<string, unknown>): Record<string, unknown> {
  const d = defaultMapContent;
  return {
    kicker: text(content, "kicker", d.kicker),
    title: text(content, "title", d.title),
    lede: text(content, "lede", d.lede ?? ""),
    transportNote: text(content, "transportNote", d.transportNote ?? ""),
    landmarkLabel: text(content, "landmarkLabel", d.landmarkLabel ?? ""),
    directionsLabel: text(content, "directionsLabel", d.directionsLabel ?? ""),
    copyLabel: text(content, "copyLabel", d.copyLabel ?? ""),
    branches: readGroup(content, "branches") ?? [],
  };
}

export function MapAddress(props: SectionProps) {
  const variant = MAP_VARIANTS[props.variant] ?? "A";
  return (
    <MapUniversal
      variant={variant}
      scheme={schemeTriplet(props.scheme)}
      content={mapContent(props.content, props.site)}
      branches={variant === "D" ? mapBranches(props.content, props.site) : undefined}
    />
  );
}

// ── ContactBlock (shared, all verticals) ──────────────────────────────────────
// Design-dispatch: four designs (simple/rich/booking/channels). Channels + hours
// + socials come from site SETTINGS; booking services from site.services. Forms
// submit via WhatsApp (no backend). Copy + pick-lists editable. Client island.

const CONTACT_VARIANTS: Record<string, ContactVariant> = {
  "contact-simple": "A",
  "contact-rich": "B",
  "contact-booking": "C",
  "contact-channels": "D",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
};

function readList(content: Record<string, unknown>, key: string): string[] | undefined {
  const v = content[key];
  if (!Array.isArray(v)) return undefined;
  const list = v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  return list.length ? list : undefined;
}

function contactContent(
  content: Record<string, unknown>,
  site: SiteRenderData,
): Partial<ContactContent> {
  const d = defaultContactContent;
  const s = site.settings;
  const waDigits = (s.whatsappNumber ?? "").replace(/[^0-9]/g, "");
  return {
    kicker: text(content, "kicker", d.kicker),
    // title/lede fall back to the design's per-variant heading when empty.
    title: text(content, "title", "") || undefined,
    lede: text(content, "lede", "") || undefined,
    replyLine: text(content, "replyLine", d.replyLine ?? ""),
    formTitle: text(content, "formTitle", d.formTitle ?? ""),
    formNote: text(content, "formNote", d.formNote ?? ""),
    submitLabel: text(content, "submitLabel", d.submitLabel ?? ""),
    privacyNote: text(content, "privacyNote", d.privacyNote ?? ""),
    // Currency is site-wide (settings), not per-section — the booking summary
    // appends this symbol after each Arabic-digit price.
    currency: symbolOf(s.currency),
    whatsapp: waDigits || undefined,
    phone: s.phone ?? undefined,
    address: s.address ?? undefined,
    mapsUrl: s.googleMapsUrl ?? undefined,
  };
}

/** Booking services (variant C) from the site's service list. Prices are digit-
 *  localized here; the section appends the site currency symbol (see above). */
function contactServices(site: SiteRenderData): BookingService[] | undefined {
  if (!site.services.length) return undefined; // → design defaults
  return site.services.map((s) => ({
    label: s.name,
    price: priceAmount(s.price),
    duration: s.duration ? toArabicDigits(s.duration) : "",
  }));
}

function contactSocials(site: SiteRenderData): ContactSocials {
  const raw = (site.settings.socials ?? {}) as Record<string, string>;
  return { instagram: raw.instagram, facebook: raw.facebook, tiktok: raw.tiktok };
}

function contactFieldEffectiveValues(content: Record<string, unknown>): Record<string, unknown> {
  const d = defaultContactContent;
  return {
    kicker: text(content, "kicker", d.kicker),
    title: text(content, "title", ""),
    lede: text(content, "lede", ""),
    replyLine: text(content, "replyLine", d.replyLine ?? ""),
    formTitle: text(content, "formTitle", d.formTitle ?? ""),
    formNote: text(content, "formNote", d.formNote ?? ""),
    submitLabel: text(content, "submitLabel", d.submitLabel ?? ""),
    privacyNote: text(content, "privacyNote", d.privacyNote ?? ""),
    subjects: readList(content, "subjects") ?? defaultSubjects,
    days: readList(content, "days") ?? defaultDays,
    times: readList(content, "times") ?? defaultTimes,
  };
}

export function ContactBlock(props: SectionProps) {
  const variant = CONTACT_VARIANTS[props.variant] ?? "A";
  return (
    <ContactUniversal
      variant={variant}
      scheme={schemeTriplet(props.scheme)}
      content={contactContent(props.content, props.site)}
      hours={groupedHours(props.site.settings.openingHours)}
      socials={contactSocials(props.site)}
      subjects={readList(props.content, "subjects")}
      services={contactServices(props.site)}
      days={readList(props.content, "days")}
      times={readList(props.content, "times")}
    />
  );
}

export function AnnouncementBanner({ scheme, content }: SectionProps) {
  return (
    <section className={SCHEME_BG[scheme]}>
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-3 px-6 py-3 text-center font-medium">
        <Megaphone className="size-5 shrink-0 opacity-80" />
        <span>{text(content, "text", "أضف نص الإعلان هنا")}</span>
      </div>
    </section>
  );
}

// ── WhatsAppCTA (shared, all verticals) ───────────────────────────────────────
// Design-dispatch: four designs (band/centered/chat/floating). The number comes
// from site SETTINGS; copy + quick-reply chips are editable. Pure/server. The
// persistent floating button is a separate site-wide widget (see SiteRender).

const WHATSAPP_VARIANTS: Record<string, WhatsAppVariant> = {
  "wa-band": "A",
  "wa-centered": "B",
  "wa-chat": "C",
  "wa-floating": "D",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
};

// WhatsAppCTA has its own green/paper/dark schemes (not the paper/dark/accent
// triplet): accent-ish → WhatsApp green, light → paper, dark → dark.
function waScheme(scheme: SectionProps["scheme"]): WhatsAppScheme {
  if (scheme === "dark" || scheme === "bold") return "dark";
  if (scheme === "light" || scheme === "muted") return "paper";
  return "green";
}

const DEFAULT_WA_QUICK_ROWS: Record<string, string>[] = [
  { label: "بدّي أحجز موعد", text: "مرحبًا! بدّي أحجز موعد" },
  { label: "شو الأسعار؟", text: "مرحبًا! بحب أسأل عن الأسعار" },
  { label: "وين مكانكم؟", text: "مرحبًا! وين مكانكم بالضبط؟" },
];

function waQuickMessages(content: Record<string, unknown>): QuickMessage[] {
  const rows = readGroup(content, "quickMessages");
  const source = rows && rows.length ? rows : DEFAULT_WA_QUICK_ROWS;
  return source
    .filter((r) => (r.label ?? "").trim())
    .map((r) => ({ label: r.label, text: r.text || undefined }));
}

function whatsappContent(
  content: Record<string, unknown>,
  site: SiteRenderData,
): Partial<WhatsAppContent> {
  const d = defaultWhatsAppContent;
  return {
    // Support the legacy "headline" key from earlier seeds.
    title: text(content, "title", text(content, "headline", d.title)),
    subtext: text(content, "subtext", d.subtext),
    ctaLabel: text(content, "ctaLabel", d.ctaLabel),
    replyLine: text(content, "replyLine", d.replyLine ?? ""),
    // The pre-filled message follows the site's name: an empty seed defaults to
    // "مرحبًا <name>", and a "{name}" token in a seeded message is substituted —
    // so templates never bake a fixed shop name into the greeting.
    messageText: text(content, "messageText", `مرحبًا ${site.businessName}`).replaceAll("{name}", site.businessName),
    bubbleTitle: text(content, "bubbleTitle", d.bubbleTitle ?? ""),
    businessName: site.businessName,
    phone: site.settings.phone ?? undefined,
  };
}

function whatsappFieldEffectiveValues(
  content: Record<string, unknown>,
  site: SiteRenderData,
): Record<string, unknown> {
  const d = defaultWhatsAppContent;
  return {
    title: text(content, "title", text(content, "headline", d.title)),
    subtext: text(content, "subtext", d.subtext),
    ctaLabel: text(content, "ctaLabel", d.ctaLabel),
    replyLine: text(content, "replyLine", d.replyLine ?? ""),
    messageText: text(content, "messageText", `مرحبًا ${site.businessName}`).replaceAll("{name}", site.businessName),
    bubbleTitle: text(content, "bubbleTitle", d.bubbleTitle ?? ""),
    quickMessages: readGroup(content, "quickMessages") ?? DEFAULT_WA_QUICK_ROWS,
  };
}

export function WhatsAppCTA(props: SectionProps) {
  const variant = WHATSAPP_VARIANTS[props.variant] ?? "A";
  const waDigits = (props.site.settings.whatsappNumber ?? "").replace(/[^0-9]/g, "");
  return (
    <WhatsAppCTAUniversal
      variant={variant}
      scheme={waScheme(props.scheme)}
      whatsapp={waDigits}
      content={whatsappContent(props.content, props.site)}
      quickMessages={waQuickMessages(props.content)}
    />
  );
}

// Header & Footer are automatic (settings + pages). The header is the universal
// client header (sticky + condense-on-scroll). Its `variant` (A/B/C) and scheme
// (light/dark/glass) are site-wide styling; the scheme is passed via content.
function headerVariant(v: string): HeaderVariant {
  return v === "B" || v === "C" ? v : "A";
}
function headerScheme(v: unknown): HeaderScheme {
  return v === "dark" || v === "accent" ? v : "light";
}

export function Header({ site, variant, content }: SectionProps) {
  const base = site.basePath ?? "";
  const link = (p: string) => (p === "/" ? base || "/" : base + p);
  const pages = (site.nav ?? []).filter((p) => p.title);
  const nav = pages.map((p) => ({ label: p.title, href: link(p.path) }));
  const s = site.settings;
  const waDigits = (s.whatsappNumber ?? "").replace(/[^0-9]/g, "");
  const status = openStatus(s.openingHours);
  const socialsRaw = (s.socials ?? {}) as Record<string, string>;

  // A booking page (titled «احجز موعد» or at /book) becomes the header CTA — it
  // still shows as a normal nav link too. Otherwise the CTA falls back to
  // WhatsApp inside HeaderUniversal.
  const bookPage = pages.find((p) => p.title === "احجز موعد" || p.path === "/book");

  return (
    <HeaderUniversal
      variant={headerVariant(variant)}
      scheme={headerScheme(content.headerScheme)}
      nav={nav.length ? nav : undefined}
      socials={{
        facebook: socialsRaw.facebook,
        instagram: socialsRaw.instagram,
        tiktok: socialsRaw.tiktok,
        whatsapp: waDigits || undefined,
      }}
      content={{
        businessName: site.businessName,
        logoUrl: site.logoUrl ?? undefined,
        homeHref: base || "/",
        phone: s.phone ?? undefined,
        addressShort: s.address ?? undefined,
        hoursLabel: status?.label,
        contactLabel: bookPage ? "احجز موعد" : "تواصل",
        contactHref: bookPage ? link(bookPage.path) : undefined,
      }}
    />
  );
}

function footerVariant(v: string): FooterVariant {
  return v === "B" || v === "C" ? v : "A";
}
function footerScheme(v: unknown): FooterScheme {
  return v === "light" || v === "accent" ? v : "dark";
}

export function Footer({ site, variant, content }: SectionProps) {
  const base = site.basePath ?? "";
  const link = (p: string) => (p === "/" ? base || "/" : base + p);
  const nav = (site.nav ?? [])
    .filter((p) => p.title)
    .map((p) => ({ label: p.title, href: link(p.path) }));
  const s = site.settings;
  const waDigits = (s.whatsappNumber ?? "").replace(/[^0-9]/g, "");
  const status = openStatus(s.openingHours);
  const socialsRaw = (s.socials ?? {}) as Record<string, string>;
  const year = toArabicDigits(String(new Date().getFullYear()));

  return (
    <FooterUniversal
      variant={footerVariant(variant)}
      scheme={footerScheme(content.footerScheme)}
      // The WhatsApp invite band is omitted — sites have a dedicated WhatsApp CTA
      // section, so the band would be redundant.
      showWhatsappBand={false}
      nav={nav.length ? nav : undefined}
      socials={{
        facebook: socialsRaw.facebook,
        instagram: socialsRaw.instagram,
        tiktok: socialsRaw.tiktok,
        whatsapp: waDigits || undefined,
      }}
      content={{
        businessName: site.businessName,
        logoUrl: site.logoUrl ?? undefined,
        address: s.address ?? undefined,
        phone: s.phone ?? undefined,
        mapsUrl: s.googleMapsUrl ?? undefined,
        hours: groupedHours(s.openingHours),
        openNowLabel: status?.open ? "مفتوح الآن" : undefined,
        copyright: `© ${year} ${site.businessName}. جميع الحقوق محفوظة.`,
      }}
    />
  );
}

export const SECTION_COMPONENTS: Record<
  string,
  React.ComponentType<SectionProps>
> = {
  Hero,
  About,
  ServicesGrid,
  PriceList,
  Gallery,
  Testimonials,
  Team,
  OpeningHours,
  MapAddress,
  Faq,
  ContactBlock,
  AnnouncementBanner,
  WhatsAppCTA,
  Header,
  Footer,
};

// Stable in-page anchors per section type, so CTA links like the hero's
// "الخدمات والأسعار" (#services) / "قائمة الأسعار" (#pricelist) scroll to the
// right section on the same page.
export const SECTION_ANCHORS: Record<string, string> = {
  About: "about",
  ServicesGrid: "services",
  PriceList: "pricelist",
  Gallery: "gallery",
  Testimonials: "reviews",
  Team: "team",
  OpeningHours: "hours",
  MapAddress: "location",
  Faq: "faq",
  ContactBlock: "contact",
  WhatsAppCTA: "whatsapp",
};

/** Render one section by type; returns null for unknown types. */
export function RenderSection(props: SectionProps & { type: string }) {
  const Cmp = SECTION_COMPONENTS[props.type];
  if (!Cmp) return null;
  const anchor = SECTION_ANCHORS[props.type];
  const rendered = <Cmp {...props} />;
  // Wrap anchored sections so in-page links resolve (scroll-margin keeps the
  // target from sitting flush against the top).
  return anchor ? (
    <div id={anchor} className="scroll-mt-4">
      {rendered}
    </div>
  ) : (
    rendered
  );
}
