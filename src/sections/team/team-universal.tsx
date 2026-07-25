/**
 * TeamUniversal — Sawwi section library
 * Shared team / staff section, business-agnostic. Four variants × three schemes.
 *
 *   A "portraits" — tall photos, editorial numbering, years badge
 *   B "rows"      — monogram rows, NO photos needed (largest teams, least space)
 *   C "squares"   — equal square photos in a grid
 *   D "featured"  — owner large with a personal quote, rest as a list
 *
 * Arabic-first (RTL). Pure component (no hooks) so it renders in the server tree.
 */

import * as React from "react";

/* ────────────────────────────── types ────────────────────────────── */

export type TeamVariant = "A" | "B" | "C" | "D";
export type TeamScheme = "paper" | "dark" | "accent";

export interface TeamSocials {
  instagram?: string;
  /** digits only, e.g. "963112223344" */
  whatsapp?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  /** whole years; rendered in Arabic-Indic numerals */
  years?: number;
  /** shown only for the featured member in variant D */
  quote?: string;
  /** Media Service URL — used in A, C and D's feature slot */
  photo?: string;
  socials?: TeamSocials;
}

export interface TeamContent {
  kicker: string;
  title: string;
  lede?: string;
  countLabel?: string;
  /** kicker over the featured member in variant D */
  featuredLabel?: string;
  footnote?: string;
  ctaLabel?: string;
  /** digits only — fallback for the section CTA */
  whatsapp?: string;
}

export interface TeamUniversalProps {
  variant?: TeamVariant;
  scheme?: TeamScheme;
  members?: TeamMember[];
  content?: Partial<TeamContent>;
  showBio?: boolean;
  showSocial?: boolean;
  showYears?: boolean;
  showCount?: boolean;
  className?: string;
}

/* ───────────────────────── numerals + defaults ───────────────────────── */

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export const arNum = (n: number) =>
  String(n).padStart(2, "0").replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
export const arInt = (n: number | string) =>
  String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

/** Strip an Arabic kunya so "أبو خالد" initials as "خ", not "أ". */
export const initialOf = (name: string) => name.replace(/^(أبو|أم)\s/, "").charAt(0);

export const defaultTeamContent: TeamContent = {
  kicker: "من يعمل عندنا",
  title: "الفريق",
  lede: "وجوهٌ ستراها كل مرة تزورنا — نفس الفريق منذ سنوات.",
  countLabel: "من أفراد الفريق",
  featuredLabel: "صاحب المكان",
  footnote: "تحبّ أن تحجز مع شخصٍ بعينه؟ اذكر اسمه في رسالة واتساب ونرتّب لك موعدًا معه.",
  ctaLabel: "احجز مع أحد الفريق",
};

export const defaultTeamMembers: TeamMember[] = [
  {
    name: "أبو خالد",
    role: "صاحب المكان · حلاق أول",
    years: 27,
    bio: "تعلّم الحرفة عن أبيه وفتح المحل عام ١٩٩٨. يقصّ بالمقص فقط.",
    quote:
      "الحلاقة ليست خدمة تُشترى بسرعة — إنها عشرون دقيقة يجلس فيها الرجل ويثق بك. هذه الثقة هي كل ما بنيته.",
  },
  { name: "رامي خوري", role: "حلاق · حلاقة بالموسى", years: 9, bio: "متخصّص بحلاقة الموسى والمنشفة الساخنة. هادئ ودقيق." },
  { name: "سامر عودة", role: "حلاق · قصّات حديثة", years: 6, bio: "يتابع القصّات الجديدة ويحسن التعامل مع الشباب والأطفال." },
  { name: "نور فارس", role: "عناية بالبشرة", years: 4, bio: "جلسات تنظيف وترطيب للوجه قبل الحلاقة أو بعدها." },
];

/* ────────────────────────────── tokens ────────────────────────────── */

interface Tokens {
  root: string;
  hairline: string;
  kicker: string;
  link: string;
  num: string;
  role: string;
  photoBg: string;
  /** years badge over a photo */
  badge: string;
  /** social chip */
  chip: string;
}

function tokensFor(scheme: TeamScheme): Tokens {
  switch (scheme) {
    case "dark":
      return {
        root: "bg-ink-900 text-paper",
        hairline: "border-paper/15",
        kicker: "text-accent-300",
        link: "text-accent-300 hover:text-accent-200",
        num: "text-accent-400",
        role: "text-accent-200",
        photoBg: "bg-paper/[0.08]",
        badge: "bg-ink-950/[0.82] text-paper",
        chip: "bg-paper/10 hover:bg-paper/20",
      };
    case "accent":
      return {
        root: "bg-accent-900 text-paper",
        hairline: "border-paper/20",
        kicker: "text-paper/85",
        link: "text-paper hover:text-white",
        num: "text-paper/75",
        role: "text-[oklch(0.9_0.05_145)]",
        photoBg: "bg-paper/[0.12]",
        badge: "bg-paper text-accent-900",
        chip: "bg-paper/[0.14] hover:bg-paper/25",
      };
    default:
      return {
        root: "bg-paper text-ink",
        hairline: "border-line",
        kicker: "text-accent-700",
        link: "text-accent-700 hover:text-accent-800",
        num: "text-accent-500",
        role: "text-accent-700",
        photoBg: "bg-neutral-200",
        badge: "bg-surface text-ink",
        chip: "bg-neutral-200 hover:bg-neutral-300",
      };
  }
}

const TINTS = [
  { bg: "bg-[oklch(0.93_0.02_155)]", fg: "text-[oklch(0.36_0.07_155)]" },
  { bg: "bg-[oklch(0.93_0.02_250)]", fg: "text-[oklch(0.38_0.06_260)]" },
  { bg: "bg-[oklch(0.94_0.025_70)]", fg: "text-[oklch(0.4_0.06_60)]" },
  { bg: "bg-[oklch(0.93_0.02_20)]", fg: "text-[oklch(0.42_0.07_25)]" },
  { bg: "bg-[oklch(0.93_0.015_310)]", fg: "text-[oklch(0.4_0.05_310)]" },
];

function tintFor(i: number, scheme: TeamScheme) {
  if (scheme === "dark") return { bg: "bg-paper/[0.12]", fg: "text-accent-200" };
  if (scheme === "accent") return { bg: "bg-paper/[0.18]", fg: "text-paper" };
  return TINTS[i % TINTS.length];
}

/* ───────────────────────────── pieces ───────────────────────────── */

/** Photo or a neutral placeholder — only for boxes ≥150px. */
function Photo({ member, priority }: { member: TeamMember; priority?: boolean }) {
  if (!member.photo) {
    return (
      <div
        aria-hidden
        className="size-full bg-[repeating-linear-gradient(-45deg,transparent_0_10px,rgba(0,0,0,.035)_10px_20px)]"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded storage URL
    <img
      src={member.photo}
      alt={member.name}
      loading={priority ? "eager" : "lazy"}
      className="size-full object-cover"
    />
  );
}

/** Tinted initial monogram — for small boxes where a photo can't read. */
function Monogram({
  member,
  index,
  scheme,
  size,
  rounded = "rounded-full",
}: {
  member: TeamMember;
  index: number;
  scheme: TeamScheme;
  size: number;
  rounded?: string;
}) {
  const tint = tintFor(index, scheme);
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center font-display font-bold ${rounded} ${tint.bg} ${tint.fg}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initialOf(member.name)}
    </span>
  );
}

function Years({ years, size = "text-[22px]" }: { years: number; size?: string }) {
  return (
    <span className="flex shrink-0 flex-col items-end gap-0.5">
      <span className={`font-serif leading-none ${size}`}>{arInt(years)}</span>
      <span className="whitespace-nowrap text-[10.5px] opacity-[0.55]">سنة خبرة</span>
    </span>
  );
}

const InstagramIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-3.5">
    <rect x="3" y="3" width="10" height="10" rx="3" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="8" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="11" cy="5" r=".8" fill="currentColor" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className="size-3.5">
    <path d="M8 1.5a6.5 6.5 0 0 0-5.6 9.8L1.5 14.5l3.4-.9A6.5 6.5 0 1 0 8 1.5z" />
  </svg>
);
const Arrow = () => (
  <svg viewBox="0 0 16 16" fill="none" className="size-[15px] -scale-x-100" aria-hidden>
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function SocialRow({
  member,
  t,
  rounded = "rounded-lg",
}: {
  member: TeamMember;
  t: Tokens;
  rounded?: string;
}) {
  const s = member.socials ?? {};
  const links: Array<[string, string, React.ReactNode]> = [];
  if (s.instagram) links.push(["إنستغرام", s.instagram, <InstagramIcon key="i" />]);
  if (s.whatsapp) links.push(["واتساب", `https://wa.me/${s.whatsapp}`, <WhatsAppIcon key="w" />]);
  if (!links.length) return null;

  return (
    <span className="flex items-center gap-1.5">
      {links.map(([label, href, icon]) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${member.name} — ${label}`}
          className={`inline-flex size-[30px] items-center justify-center text-current transition-colors ${rounded} ${t.chip}`}
        >
          {icon}
        </a>
      ))}
    </span>
  );
}

/* ──────────────────────────── component ──────────────────────────── */

export default function TeamUniversal({
  variant = "A",
  scheme = "paper",
  members = defaultTeamMembers,
  content,
  showBio = true,
  showSocial = true,
  showYears = true,
  showCount = true,
  className,
}: TeamUniversalProps) {
  const c: TeamContent = { ...defaultTeamContent, ...content };
  const t = tokensFor(scheme);

  const lead = members[0];
  const rest = members.slice(1);

  const ctaHref = c.whatsapp
    ? `https://wa.me/${c.whatsapp}?text=${encodeURIComponent("مرحبًا، أريد الحجز مع أحد الفريق")}`
    : "#contact";

  return (
    <section
      dir="rtl"
      className={`px-[22px] py-[30px] md:px-[52px] md:pb-11 md:pt-[58px] ${t.root} ${className ?? ""}`}
    >
      {/* ── head ── */}
      <div
        className={`mb-6 flex flex-wrap items-end justify-between gap-6 border-b pb-[22px] md:mb-[34px] md:pb-7 ${t.hairline}`}
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
            <span className="font-serif text-[34px] leading-none">{arNum(members.length)}</span>
            <span className="whitespace-nowrap text-[11.5px] opacity-[0.58]">{c.countLabel}</span>
          </span>
        )}
      </div>

      {/* ── A — portraits ── */}
      {variant === "A" && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {members.map((mem, i) => (
            <figure
              key={`${mem.name}-${i}`}
              className="m-0 flex flex-col gap-4 animate-rise motion-reduce:animate-none"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`relative h-[200px] overflow-hidden rounded-[3px] md:h-[320px] ${t.photoBg}`}>
                <Photo member={mem} priority={i === 0} />
                {showYears && mem.years != null && (
                  <span
                    className={`pointer-events-none absolute start-2.5 top-2.5 flex items-baseline gap-[5px] rounded-[3px] px-2.5 py-[5px] ${t.badge}`}
                  >
                    <span className="font-serif text-[15px] leading-none">{arInt(mem.years)}</span>
                    <span className="text-[10.5px] opacity-75">سنة</span>
                  </span>
                )}
              </div>
              <figcaption className="flex flex-col gap-2">
                <span className="flex items-baseline gap-2.5">
                  <span className={`shrink-0 font-serif text-[13px] tracking-[0.04em] ${t.num}`}>
                    {arNum(i + 1)}
                  </span>
                  <span className="font-display text-[17.5px] font-bold">{mem.name}</span>
                </span>
                <span className={`text-[13px] font-medium ${t.role}`}>{mem.role}</span>
                {showBio && mem.bio && (
                  <span className="text-[13.5px] leading-[1.75] opacity-[0.68] text-pretty">{mem.bio}</span>
                )}
                {showSocial && (
                  <span className="pt-1">
                    <SocialRow member={mem} t={t} />
                  </span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* ── B — monogram rows (no photos) ── */}
      {variant === "B" && (
        <div className="flex flex-col">
          {members.map((mem, i) => (
            <div
              key={`${mem.name}-${i}`}
              className={`flex items-start gap-3 border-b py-4 md:items-center md:gap-4 md:py-[18px] ${t.hairline}`}
            >
              <Monogram member={mem} index={i} scheme={scheme} size={54} rounded="rounded-[3px]" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="flex flex-wrap items-baseline gap-2.5">
                  <span className="font-display text-[17px] font-bold">{mem.name}</span>
                  <span className={`text-[12.5px] font-medium ${t.role}`}>{mem.role}</span>
                </span>
                {showBio && mem.bio && (
                  <span className="max-w-[58ch] text-[13.5px] leading-[1.75] opacity-[0.68] text-pretty">
                    {mem.bio}
                  </span>
                )}
              </div>
              {showYears && mem.years != null && <Years years={mem.years} />}
              {showSocial && (
                <span className="hidden md:block">
                  <SocialRow member={mem} t={t} />
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── C — square plates ── */}
      {variant === "C" && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {members.map((mem, i) => (
            <figure
              key={`${mem.name}-${i}`}
              className="m-0 flex flex-col gap-3.5 animate-rise motion-reduce:animate-none"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`relative h-[150px] overflow-hidden rounded-[3px] md:h-[230px] ${t.photoBg}`}>
                <Photo member={mem} priority={i === 0} />
              </div>
              <figcaption className="flex flex-col gap-[7px]">
                <span className="font-display text-[16.5px] font-bold">{mem.name}</span>
                <span className={`text-[12.5px] font-medium ${t.role}`}>{mem.role}</span>
                {showYears && mem.years != null && (
                  <span className="flex items-baseline gap-[5px] pt-0.5">
                    <span className="font-serif text-[15px] leading-none">{arInt(mem.years)}</span>
                    <span className="text-[10.5px] opacity-[0.55]">سنة خبرة</span>
                  </span>
                )}
                {showBio && mem.bio && (
                  <span className="pt-0.5 text-[13px] leading-[1.7] opacity-[0.68] text-pretty">{mem.bio}</span>
                )}
                {showSocial && (
                  <span className="pt-[5px]">
                    <SocialRow member={mem} t={t} />
                  </span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* ── D — featured owner + rest ── */}
      {variant === "D" && lead && (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-[52px]">
          <div className="flex flex-col gap-[18px]">
            <div className={`relative h-[260px] overflow-hidden rounded-[3px] md:h-[380px] ${t.photoBg}`}>
              <Photo member={lead} priority />
            </div>
            <div className="flex flex-col gap-3">
              <span className={`text-xs font-semibold tracking-[0.06em] ${t.kicker}`}>
                {c.featuredLabel}
              </span>
              <span className="font-display text-2xl font-extrabold -tracking-[0.02em] md:text-3xl">
                {lead.name}
              </span>
              <span className={`text-[13.5px] font-medium ${t.role}`}>{lead.role}</span>
              {lead.quote && (
                <blockquote className="m-0 max-w-[40ch] font-serif text-base leading-[1.75] opacity-[0.88] text-pretty md:text-lg">
                  ”{lead.quote}“
                </blockquote>
              )}
              {showYears && lead.years != null && (
                <span className={`mt-1 flex items-baseline gap-[7px] border-t pt-3 ${t.hairline}`}>
                  <span className="font-serif text-[26px] leading-none">{arInt(lead.years)}</span>
                  <span className="text-[11.5px] opacity-[0.58]">سنة في الحرفة</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            {rest.map((mem, i) => (
              <div
                key={`${mem.name}-${i}`}
                className={`flex items-center gap-3.5 border-b py-4 ${t.hairline}`}
              >
                {/* +1 keeps the tint sequence aligned with the full member list */}
                <Monogram member={mem} index={i + 1} scheme={scheme} size={50} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-display text-base font-bold">{mem.name}</span>
                  <span className={`text-[12.5px] font-medium ${t.role}`}>{mem.role}</span>
                  {showBio && mem.bio && (
                    <span className="text-[13px] leading-[1.7] opacity-[0.66] text-pretty">{mem.bio}</span>
                  )}
                </div>
                {showYears && mem.years != null && <Years years={mem.years} size="text-[19px]" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── footnote + one quiet CTA ── */}
      {(c.footnote || c.ctaLabel) && (
        <div
          className={`mt-6 flex flex-wrap items-baseline justify-between gap-5 border-t pt-5 md:mt-[34px] ${t.hairline}`}
        >
          {c.footnote && (
            <span className="max-w-[54ch] text-[13px] leading-[1.7] opacity-60">{c.footnote}</span>
          )}
          {c.ctaLabel && (
            <a
              href={ctaHref}
              className={`inline-flex items-center gap-2 whitespace-nowrap font-display text-sm font-bold transition-colors ${t.link}`}
            >
              {c.ctaLabel}
              <Arrow />
            </a>
          )}
        </div>
      )}
    </section>
  );
}
