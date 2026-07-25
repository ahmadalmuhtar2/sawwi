"use client";

/**
 * ContactUniversal — Sawwi section library
 * Shared contact section, business-agnostic. Four variants × three schemes.
 *
 *   A "simple"  — channels beside a short form (name / number / message)
 *   B "rich"    — full form + subject chips, info panel, hours, map
 *   C "booking" — service + day + time picker with a live order summary
 *   D "channels"— no form at all; three large channel cards
 *
 * Every form submits through WhatsApp: the fields are assembled into one message
 * and wa.me opens pre-filled. No form backend, no stored data. Arabic-first (RTL).
 * Client component (form state).
 */

import * as React from "react";
import {
  defaultContactContent,
  defaultHours,
  defaultSubjects,
  defaultServices,
  defaultDays,
  defaultTimes,
  type ContactContent,
  type ContactScheme,
  type ContactVariant,
  type HoursRow,
  type BookingService,
  type ContactSocials,
} from "./contact-data";

export type {
  ContactContent,
  ContactScheme,
  ContactVariant,
  HoursRow,
  BookingService,
  ContactSocials,
} from "./contact-data";
export {
  defaultContactContent,
  defaultHours,
  defaultSubjects,
  defaultServices,
  defaultDays,
  defaultTimes,
} from "./contact-data";

export interface ContactUniversalProps {
  variant?: ContactVariant;
  scheme?: ContactScheme;
  content?: Partial<ContactContent>;
  hours?: HoursRow[];
  socials?: ContactSocials;
  /** variant B's subject chips */
  subjects?: string[];
  /** variant C's pickers */
  services?: BookingService[];
  days?: string[];
  times?: string[];
  showSocial?: boolean;
  showHours?: boolean;
  className?: string;
}

/* ────────────────────────────── tokens ────────────────────────────── */

interface Tokens {
  root: string;
  hairline: string;
  kicker: string;
  border: string;
  dotted: string;
  panel: string;
  panelHairline: string;
  input: string;
  chipOn: string;
  chipOff: string;
  plateWa: string;
  plateNeutral: string;
  cta: string;
  price: string;
  live: string;
  chip: string;
  map: string;
  mapLine: string;
  road: string;
  pin: string;
  pinHole: string;
  plate: string;
  link: string;
}

function tokensFor(scheme: ContactScheme): Tokens {
  switch (scheme) {
    case "dark":
      return {
        root: "bg-ink-900 text-paper",
        hairline: "border-paper/15",
        kicker: "text-accent-300",
        border: "border-paper/[0.22]",
        dotted: "border-paper/[0.22]",
        panel: "bg-paper/[0.06]",
        panelHairline: "border-paper/[0.14]",
        input: "bg-paper/[0.05] border-paper/20",
        chipOn: "bg-paper/20 text-paper border-transparent",
        chipOff: "bg-transparent text-paper border-paper/[0.22]",
        plateWa: "bg-paper/10 text-[oklch(0.85_0.1_150)]",
        plateNeutral: "bg-paper/10 text-paper/90",
        cta: "bg-accent-600 text-white hover:bg-accent-700",
        price: "text-accent-200",
        live: "bg-paper/[0.12] text-[oklch(0.88_0.08_148)]",
        chip: "bg-paper/10",
        map: "bg-ink-950",
        mapLine: "oklch(0.95 0.004 95 / .07)",
        road: "bg-paper/10",
        pin: "text-accent-300",
        pinHole: "oklch(0.16 0.008 70)",
        plate: "bg-paper text-ink",
        link: "text-accent-300 hover:text-accent-200",
      };
    case "accent":
      return {
        root: "bg-accent-900 text-paper",
        hairline: "border-paper/20",
        kicker: "text-paper/85",
        border: "border-paper/[0.28]",
        dotted: "border-paper/[0.28]",
        panel: "bg-paper/[0.08]",
        panelHairline: "border-paper/[0.18]",
        input: "bg-paper/[0.07] border-paper/[0.26]",
        chipOn: "bg-paper text-accent-900 border-transparent",
        chipOff: "bg-transparent text-paper border-paper/[0.28]",
        plateWa: "bg-paper/[0.16] text-paper",
        plateNeutral: "bg-paper/[0.14] text-paper",
        cta: "bg-paper text-accent-900 hover:bg-white",
        price: "text-[oklch(0.94_0.05_145)]",
        live: "bg-paper/[0.14] text-[oklch(0.94_0.05_145)]",
        chip: "bg-paper/[0.12]",
        map: "bg-[oklch(0.22_0.045_155)]",
        mapLine: "oklch(0.96 0.01 95 / .08)",
        road: "bg-paper/[0.11]",
        pin: "text-[oklch(0.92_0.06_145)]",
        pinHole: "oklch(0.22 0.045 155)",
        plate: "bg-paper text-accent-900",
        link: "text-paper hover:text-white",
      };
    default:
      return {
        root: "bg-paper text-ink",
        hairline: "border-line",
        kicker: "text-accent-700",
        border: "border-neutral-300",
        dotted: "border-neutral-300",
        panel: "bg-neutral-100",
        panelHairline: "border-line",
        input: "bg-surface border-neutral-300",
        chipOn: "bg-ink text-white border-transparent",
        chipOff: "bg-transparent text-ink border-neutral-300",
        plateWa: "bg-[oklch(0.93_0.04_150)] text-[oklch(0.36_0.08_152)]",
        plateNeutral: "bg-neutral-200 text-ink/80",
        cta: "bg-accent text-white hover:bg-accent-700",
        price: "text-accent-800",
        live: "bg-[oklch(0.94_0.04_150)] text-[oklch(0.4_0.09_150)]",
        chip: "bg-neutral-200",
        map: "bg-neutral-200",
        mapLine: "oklch(0.26 0.012 70 / .07)",
        road: "bg-ink/10",
        pin: "text-accent",
        pinHole: "oklch(0.93 0.006 85)",
        plate: "bg-ink text-paper",
        link: "text-accent-700 hover:text-accent-800",
      };
  }
}

/* ────────────────────────────── icons ────────────────────────────── */

const WhatsAppIcon = ({ className = "size-[18px]" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={className}>
    <path d="M8 1.5a6.5 6.5 0 0 0-5.6 9.8L1.5 14.5l3.4-.9A6.5 6.5 0 1 0 8 1.5z" />
  </svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-[18px]">
    <path d="M3 4.5c0 5 3.5 8.5 8.5 8.5l1.5-2-2.6-1.2-1.2 1.2c-1.4-.7-2.5-1.8-3.2-3.2l1.2-1.2L6 4H4L3 4.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);
const PinIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-[18px]">
    <path d="M8 14s4.5-4 4.5-7A4.5 4.5 0 0 0 8 2.5 4.5 4.5 0 0 0 3.5 7c0 3 4.5 7 4.5 7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="8" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4">
    <rect x="3" y="3" width="10" height="10" rx="3" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="8" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="11" cy="5" r=".8" fill="currentColor" />
  </svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className="size-4">
    <path d="M9.6 14V8.9h1.8l.3-2.1H9.6V5.4c0-.6.2-1 1-1h1.1V2.5c-.2 0-.9-.1-1.7-.1-1.7 0-2.8 1-2.8 2.9v1.5H5.3v2.1h1.9V14h2.4z" />
  </svg>
);
const TikTokIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className="size-4">
    <path d="M10.2 2h-1.7v8.2a1.6 1.6 0 1 1-1.2-1.6V6.9a3.5 3.5 0 1 0 3 3.5V6.1c.6.5 1.4.8 2.3.9V5.2c-1.3-.1-2.3-1.1-2.4-3.2z" />
  </svg>
);
const Arrow = () => (
  <svg viewBox="0 0 16 16" fill="none" className="size-[15px] -scale-x-100" aria-hidden>
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ─────────────────────── wa.me submit (the whole backend) ─────────────────────── */

function submitViaWhatsApp(
  whatsapp: string | undefined,
  lines: Array<[string, string | undefined]>,
) {
  if (!whatsapp) return;
  const body = lines
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `${k}: ${v!.trim()}`)
    .join("\n");
  const url = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(body)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/* ───────────────────────────── pieces ───────────────────────────── */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-semibold">
        {label}
        {hint && <span className="font-normal opacity-[0.55]"> ({hint})</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls = (t: Tokens, extra = "") =>
  `h-[46px] rounded-[3px] border px-3.5 text-[14.5px] text-current placeholder:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-current/30 ${t.input} ${extra}`;

function Chips({
  options,
  value,
  onPick,
  t,
  prices,
  pill = true,
  minW,
  serif,
}: {
  options: string[];
  value: number;
  onPick: (i: number) => void;
  t: Tokens;
  prices?: string[];
  pill?: boolean;
  minW?: number;
  serif?: boolean;
}) {
  return (
    <span className="flex flex-wrap gap-2">
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === i}
          onClick={() => onPick(i)}
          style={minW ? { minWidth: minW } : undefined}
          className={`inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap border px-[15px] text-[13px] font-semibold leading-none ${
            pill ? "rounded-full" : "rounded-[3px]"
          } ${serif ? "font-serif text-[13.5px] font-normal" : ""} ${value === i ? t.chipOn : t.chipOff}`}
        >
          {o}
          {prices?.[i] && (
            <span className="font-serif text-[12.5px] leading-none opacity-60">{prices[i]}</span>
          )}
        </button>
      ))}
    </span>
  );
}

function ChannelRows({ c, t, compactPlate }: { c: ContactContent; t: Tokens; compactPlate?: boolean }) {
  const rows: Array<{ label: string; value: string; href: string; icon: React.ReactNode; plate: string; ltr?: boolean }> = [];
  if (c.whatsapp)
    rows.push({ label: "واتساب", value: c.phone ?? `+${c.whatsapp}`, href: `https://wa.me/${c.whatsapp.replace(/\D/g, "")}`, icon: <WhatsAppIcon />, plate: t.plateWa, ltr: true });
  if (c.phone)
    rows.push({ label: "هاتف", value: c.phone, href: `tel:${c.phone.replace(/\s/g, "")}`, icon: <PhoneIcon />, plate: t.plateNeutral, ltr: true });
  if (c.address)
    rows.push({ label: "العنوان", value: c.address, href: c.mapsUrl ?? "#", icon: <PinIcon />, plate: t.plateNeutral });

  const size = compactPlate ? "size-[34px] rounded-[9px]" : "size-[38px] rounded-[10px]";

  return (
    <>
      {rows.map((r) => (
        <a
          key={r.label}
          href={r.href}
          {...(r.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" as const } : {})}
          className={`flex items-center gap-3.5 border-b py-3.5 text-current md:py-[15px] ${compactPlate ? t.panelHairline : t.hairline}`}
        >
          <span className={`inline-flex shrink-0 items-center justify-center ${size} ${r.plate}`}>{r.icon}</span>
          <span className="flex min-w-0 flex-col gap-[3px]">
            <span className="text-[11.5px] opacity-[0.55]">{r.label}</span>
            <span dir={r.ltr ? "ltr" : undefined} className={`text-start ${r.ltr ? "font-mono text-[13.5px]" : "text-[14px]"}`}>
              {r.value}
            </span>
          </span>
        </a>
      ))}
    </>
  );
}

function HoursList({ hours, t, dense }: { hours: HoursRow[]; t: Tokens; dense?: boolean }) {
  if (!hours.length) return null;
  return (
    <span className="flex flex-col gap-2.5">
      <span className="text-[11px] opacity-[0.55]">أوقات العمل</span>
      {hours.map((h) => (
        <span key={h.days} className={`flex items-baseline gap-2.5 ${dense ? "text-[13px]" : "text-[13.5px]"}`}>
          <span className="whitespace-nowrap opacity-80">{h.days}</span>
          <span aria-hidden className={`min-w-[16px] flex-[1_0_16px] border-b border-dotted ${t.dotted}`} />
          <span className="whitespace-nowrap font-serif">{h.time}</span>
        </span>
      ))}
    </span>
  );
}

function SocialRow({ socials, t, bare }: { socials: ContactSocials; t: Tokens; bare?: boolean }) {
  const links: Array<[string, string, React.ReactNode]> = [];
  if (socials.instagram) links.push(["إنستغرام", socials.instagram, <InstagramIcon key="i" />]);
  if (socials.facebook) links.push(["فيسبوك", socials.facebook, <FacebookIcon key="f" />]);
  if (socials.tiktok) links.push(["تيك توك", socials.tiktok, <TikTokIcon key="t" />]);
  if (!links.length) return null;

  return (
    <span className="flex items-center gap-2">
      {links.map(([title, href, icon]) => (
        <a
          key={title}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={title}
          className={`inline-flex items-center justify-center text-current ${
            bare ? `size-10 rounded-[11px] border ${t.border}` : `size-9 rounded-[10px] ${t.chip}`
          }`}
        >
          {icon}
        </a>
      ))}
    </span>
  );
}

/** Schematic map plate — no API key; opens the real maps URL when provided. */
function MiniMap({ t, mapsUrl, height }: { t: Tokens; mapsUrl?: string; height: string }) {
  const Tag = (mapsUrl ? "a" : "div") as "a";
  return (
    <Tag
      {...(mapsUrl ? { href: mapsUrl, target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label="الاتجاهات على الخريطة"
      className={`relative block overflow-hidden rounded ${height} ${t.map}`}
    >
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${t.mapLine} 1px, transparent 1px), linear-gradient(90deg, ${t.mapLine} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <span aria-hidden className={`absolute inset-x-0 top-[40%] h-[11px] ${t.road}`} />
      <span aria-hidden className={`absolute inset-y-0 start-[40%] w-[11px] ${t.road}`} />
      <span aria-hidden className={`absolute start-[40%] top-[40%] translate-x-1/2 -translate-y-1/2 drop-shadow-[0_2px_5px_rgba(0,0,0,.3)] ${t.pin}`}>
        <svg viewBox="0 0 16 16" fill="currentColor" className="size-[30px]">
          <path d="M8 15s5-5 5-8.2A5 5 0 0 0 8 1.8 5 5 0 0 0 3 6.8C3 10 8 15 8 15z" />
          <circle cx="8" cy="6.6" r="1.7" fill={t.pinHole} />
        </svg>
      </span>
      {mapsUrl && (
        <span className={`absolute bottom-3 start-3 inline-flex items-center gap-2 whitespace-nowrap rounded-[3px] px-3.5 py-[9px] font-display text-[13px] font-bold ${t.plate}`}>
          <Arrow />
          الاتجاهات
        </span>
      )}
    </Tag>
  );
}

/* ──────────────────────────── component ──────────────────────────── */

export default function ContactUniversal({
  variant = "A",
  scheme = "paper",
  content,
  hours = defaultHours,
  socials = {},
  subjects = defaultSubjects,
  services = defaultServices,
  days = defaultDays,
  times = defaultTimes,
  showSocial = true,
  showHours = true,
  className,
}: ContactUniversalProps) {
  const c: ContactContent = { ...defaultContactContent, ...content };
  const t = tokensFor(scheme);

  const [name, setName] = React.useState("");
  const [number, setNumber] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [note, setNote] = React.useState("");
  const [subject, setSubject] = React.useState(0);
  const [service, setService] = React.useState(0);
  const [day, setDay] = React.useState(0);
  const [time, setTime] = React.useState(Math.min(2, Math.max(0, times.length - 1)));

  const picked = services[service] ?? services[0];

  const heads = {
    A: { title: "تواصل معنا", lede: "اختر ما يناسبك — واتساب أسرع، والهاتف متاح، والباب مفتوح." },
    B: { title: "نحن قريبون منك", lede: "اكتب لنا أو مرّ علينا — كل الطرق تؤدي إلى ردٍّ سريع." },
    C: { title: "اطلب موعدك", lede: "اختر الخدمة والوقت، وسنؤكّد لك الموعد على واتساب خلال دقائق." },
    D: { title: "كيف تصل إلينا", lede: "ثلاث طرق فقط، بلا استمارات ولا انتظار." },
  }[variant];

  const submitSimple = (e: React.FormEvent) => {
    e.preventDefault();
    submitViaWhatsApp(c.whatsapp, [["الاسم", name], ["الرقم", number], ["الرسالة", message]]);
  };

  const submitRich = (e: React.FormEvent) => {
    e.preventDefault();
    submitViaWhatsApp(c.whatsapp, [["الموضوع", subjects[subject]], ["الاسم", name], ["الرقم", number], ["الرسالة", message]]);
  };

  const submitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    submitViaWhatsApp(c.whatsapp, [
      ["طلب موعد", picked ? `${picked.label} (${picked.duration})` : undefined],
      ["الموعد", `${days[day]} ${times[time]}`],
      ["السعر", picked ? `${picked.price} ${c.currency}` : undefined],
      ["الاسم", name],
      ["الرقم", number],
      ["ملاحظة", note],
    ]);
  };

  const bigChannels = [
    { title: "راسلنا على واتساب", desc: "أسرع طريقة — نرد عادةً خلال دقائق في أوقات العمل.", value: "", href: c.whatsapp ? `https://wa.me/${c.whatsapp.replace(/\D/g, "")}` : "#", icon: <WhatsAppIcon />, plate: t.plateWa, ltr: true, lead: true },
    { title: "اتصل بنا", desc: "إن كنت تفضّل الصوت، الخط مفتوح خلال ساعات العمل.", value: "", href: c.phone ? `tel:${c.phone.replace(/\s/g, "")}` : "#", icon: <PhoneIcon />, plate: t.plateNeutral, ltr: true },
    { title: "زُرنا في المحل", desc: "بلا موعد مسبق أيضًا — مرّ علينا في أوقات العمل.", value: "الاتجاهات على الخريطة", href: c.mapsUrl ?? "#", icon: <PinIcon />, plate: t.plateNeutral },
  ];

  return (
    <section
      dir="rtl"
      className={`px-[22px] py-[30px] md:px-[52px] md:py-[56px] ${t.root} ${className ?? ""}`}
    >
      {/* ── head ── */}
      <div className={`mb-6 flex flex-wrap items-end justify-between gap-6 border-b pb-[22px] md:mb-[34px] md:pb-7 ${t.hairline}`}>
        <div className="flex flex-col gap-3">
          <span className={`text-xs font-semibold tracking-[0.08em] ${t.kicker}`}>{c.kicker}</span>
          <h2 className="m-0 font-display text-[clamp(27px,2.9vw,40px)] font-extrabold leading-[1.3] -tracking-[0.028em] text-balance">
            {c.title ?? heads.title}
          </h2>
          <p className="m-0 max-w-[50ch] text-[15px] leading-[1.85] opacity-70 text-pretty md:text-[15.5px]">
            {c.lede ?? heads.lede}
          </p>
        </div>
        {c.replyLine && (
          <span className={`inline-flex w-fit items-center gap-2.5 rounded-full px-[15px] py-[9px] ${t.live}`}>
            <span className="size-2 rounded-full bg-current animate-pulse-soft motion-reduce:animate-none" />
            <span className="whitespace-nowrap text-[13.5px] font-semibold">{c.replyLine}</span>
          </span>
        )}
      </div>

      {/* ── A — simple ── */}
      {variant === "A" && (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-12">
          <div className="flex flex-col">
            <ChannelRows c={c} t={t} />
            {showHours && (
              <span className="pt-[18px]">
                <HoursList hours={hours} t={t} />
              </span>
            )}
            {showSocial && (
              <span className="pt-5">
                <SocialRow socials={socials} t={t} bare />
              </span>
            )}
          </div>

          <form onSubmit={submitSimple} className={`flex flex-col gap-3.5 rounded p-[22px] md:p-[26px] ${t.panel}`}>
            <span className="font-display text-[17px] font-bold">{c.formTitle}</span>
            <span className="text-[13px] leading-[1.7] opacity-70">{c.formNote}</span>
            <Field label="الاسم">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" className={inputCls(t)} />
            </Field>
            <Field label="رقم الواتساب">
              <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="+963 9xx xxx xxx" dir="ltr" inputMode="tel" className={inputCls(t, "text-start")} />
            </Field>
            <Field label="رسالتك">
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="كيف نساعدك؟" className={`min-h-[92px] resize-y rounded-[3px] border p-3 text-[14.5px] leading-[1.6] text-current placeholder:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-current/30 ${t.input}`} />
            </Field>
            <button type="submit" className={`mt-1 inline-flex h-[50px] items-center justify-center gap-2.5 rounded-[3px] border-0 font-display text-[15px] font-bold transition-colors ${t.cta}`}>
              <WhatsAppIcon className="size-[17px]" />
              {c.submitLabel}
            </button>
            <span className="text-center text-xs leading-[1.65] opacity-[0.55]">{c.privacyNote}</span>
          </form>
        </div>
      )}

      {/* ── B — rich ── */}
      {variant === "B" && (
        <div className="grid grid-cols-1 gap-[30px] md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-11">
          <form onSubmit={submitRich} className="flex flex-col gap-4">
            <span className="font-display text-[18px] font-bold">اكتب لنا</span>
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              <Field label="الاسم">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك الكامل" className={inputCls(t)} />
              </Field>
              <Field label="رقم الواتساب">
                <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="+963 9xx xxx xxx" dir="ltr" inputMode="tel" className={inputCls(t, "text-start")} />
              </Field>
            </div>
            <span className="flex flex-col gap-2">
              <span className="text-[12.5px] font-semibold">الموضوع</span>
              <Chips options={subjects} value={subject} onPick={setSubject} t={t} />
            </span>
            <Field label="رسالتك">
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="اكتب تفاصيل طلبك — كلما كانت أوضح كان ردّنا أسرع." className={`min-h-[118px] resize-y rounded-[3px] border p-3 text-[14.5px] leading-[1.65] text-current placeholder:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-current/30 ${t.input}`} />
            </Field>
            <div className="flex flex-col items-stretch gap-3 pt-0.5 md:flex-row md:items-center">
              <button type="submit" className={`inline-flex h-[52px] items-center justify-center gap-2.5 rounded-[3px] border-0 px-6 font-display text-[15px] font-bold transition-colors ${t.cta}`}>
                <WhatsAppIcon className="size-[17px]" />
                {c.submitLabel}
              </button>
              <span className="max-w-[30ch] text-[12.5px] leading-[1.65] opacity-[0.58]">{c.privacyNote}</span>
            </div>
          </form>

          <div className="flex flex-col gap-5">
            <div className={`flex flex-col rounded px-5 py-5 md:px-6 ${t.panel}`}>
              <ChannelRows c={c} t={t} compactPlate />
              {showHours && (
                <span className="pt-4">
                  <HoursList hours={hours} t={t} dense />
                </span>
              )}
              {showSocial && (
                <span className="pt-[18px]">
                  <SocialRow socials={socials} t={t} />
                </span>
              )}
            </div>
            <MiniMap t={t} mapsUrl={c.mapsUrl} height="h-[180px] md:h-[210px]" />
          </div>
        </div>
      )}

      {/* ── C — booking request ── */}
      {variant === "C" && (
        <form onSubmit={submitBooking} className="grid grid-cols-1 gap-[30px] md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:gap-11">
          <div className="flex flex-col gap-[18px]">
            <span className="flex flex-col gap-2">
              <span className="text-[12.5px] font-semibold">الخدمة المطلوبة</span>
              <Chips options={services.map((s) => s.label)} prices={services.map((s) => s.price)} value={service} onPick={setService} t={t} />
            </span>

            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              <span className="flex flex-col gap-2">
                <span className="text-[12.5px] font-semibold">اليوم</span>
                <Chips options={days} value={day} onPick={setDay} t={t} pill={false} minW={52} />
              </span>
              <span className="flex flex-col gap-2">
                <span className="text-[12.5px] font-semibold">الوقت</span>
                <Chips options={times} value={time} onPick={setTime} t={t} pill={false} serif />
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              <Field label="الاسم">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" className={inputCls(t)} />
              </Field>
              <Field label="رقم الواتساب">
                <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="+963 9xx xxx xxx" dir="ltr" inputMode="tel" className={inputCls(t, "text-start")} />
              </Field>
            </div>

            <Field label="ملاحظة" hint="اختياري">
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: أفضّل الحلاق أبو خالد" className={inputCls(t)} />
            </Field>
          </div>

          <div className={`flex h-fit flex-col gap-4 rounded px-5 py-5 md:px-6 ${t.panel}`}>
            <span className="text-[11.5px] font-semibold tracking-[0.06em] opacity-[0.55]">ملخّص الطلب</span>
            <div className="flex flex-col">
              {[
                ["الخدمة", picked?.label ?? "—", "font-display font-bold text-sm"],
                ["الموعد", `${days[day]} · ${times[time]}`, "font-serif text-[15px]"],
                ["المدة", picked?.duration ?? "—", "text-[13.5px]"],
              ].map(([k, v, cls]) => (
                <span key={k} className={`flex items-baseline justify-between gap-3 border-b py-3 ${t.panelHairline}`}>
                  <span className="text-[13px] opacity-[0.65]">{k}</span>
                  <span className={`text-end ${cls}`}>{v}</span>
                </span>
              ))}
              <span className="flex items-baseline justify-between gap-3 pb-0.5 pt-3.5">
                <span className="text-[13px] opacity-[0.65]">السعر</span>
                <span className={`font-serif text-[21px] ${t.price}`}>
                  {picked?.price ?? ""} {c.currency}
                </span>
              </span>
            </div>
            <button type="submit" className={`inline-flex h-[52px] items-center justify-center gap-2.5 rounded-[3px] border-0 font-display text-[15px] font-bold transition-colors ${t.cta}`}>
              <WhatsAppIcon className="size-[17px]" />
              أكّد الطلب على واتساب
            </button>
            <span className="text-xs leading-[1.7] opacity-[0.58]">
              الطلب ليس تأكيدًا نهائيًا — نثبّت الموعد معك برسالة واتساب خلال دقائق.
            </span>

            {showHours && (
              <span className={`border-t pt-4 ${t.panelHairline}`}>
                <HoursList hours={hours} t={t} dense />
              </span>
            )}
            {showSocial && (
              <span className={`border-t pt-3.5 ${t.panelHairline}`}>
                <SocialRow socials={socials} t={t} />
              </span>
            )}
          </div>
        </form>
      )}

      {/* ── D — channels only ── */}
      {variant === "D" && (
        <div className="flex flex-col gap-6 md:gap-[30px]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-[30px]">
            {bigChannels.map((ch, i) => (
              <a
                key={ch.title}
                href={ch.href}
                {...(ch.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" as const } : {})}
                className={`flex flex-col gap-3 border-t-2 pt-5 text-current animate-rise motion-reduce:animate-none ${
                  ch.lead ? t.kicker.replace("text-", "border-") : t.hairline
                }`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className={`inline-flex size-11 items-center justify-center rounded-xl ${ch.plate}`}>{ch.icon}</span>
                <span className="font-display text-[17px] font-bold">{ch.title}</span>
                <span className="text-[13.5px] leading-[1.75] opacity-70 text-pretty">{ch.desc}</span>
                <span className={`mt-auto flex items-center gap-2 border-t pt-3 ${t.hairline}`}>
                  {ch.value && (
                    <span dir={ch.ltr ? "ltr" : undefined} className={`text-start ${ch.ltr ? "font-mono text-[13.5px]" : "text-[13.5px]"}`}>
                      {ch.value}
                    </span>
                  )}
                  <span className="ms-auto opacity-40">
                    <Arrow />
                  </span>
                </span>
              </a>
            ))}
          </div>

          <div className={`flex flex-wrap items-center justify-between gap-5 border-t pt-[22px] ${t.hairline}`}>
            {showHours && hours.length > 0 && (
              <span className="flex flex-wrap items-center gap-4 text-[13.5px] opacity-[0.72]">
                {hours.map((h) => (
                  <span key={h.days} className="whitespace-nowrap">
                    {h.days} · <span className="font-serif">{h.time}</span>
                  </span>
                ))}
              </span>
            )}
            {showSocial && (
              <span className="ms-auto">
                <SocialRow socials={socials} t={t} bare />
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
