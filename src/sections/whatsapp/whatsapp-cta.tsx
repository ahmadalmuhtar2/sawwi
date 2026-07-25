/**
 * WhatsAppCTA — Sawwi section library
 * Shared WhatsApp call-to-action with subtext. Four variants × three schemes.
 *
 *   A "band"     — compact single row; drop between sections or above the footer
 *   B "centered" — large centred block with quick-message chips; strongest converter
 *   C "chat"     — copy beside a WhatsApp conversation mock (shows what happens next)
 *   D "floating" — an in-section preview of the persistent corner button
 *
 * Every link is a real wa.me deep link with the message pre-filled. Arabic-first
 * (RTL). Pure component (no hooks) so it renders in the server tree.
 */

import * as React from "react";

/* ────────────────────────────── types ────────────────────────────── */

export type WhatsAppVariant = "A" | "B" | "C" | "D";
export type WhatsAppScheme = "green" | "paper" | "dark";

export interface QuickMessage {
  /** chip label — also the message body unless `text` is given */
  label: string;
  text?: string;
}

export interface ChatLine {
  from: "customer" | "business";
  text: string;
}

export interface WhatsAppContent {
  title: string;
  /** the subtext under the title */
  subtext: string;
  ctaLabel: string;
  /** sets expectation instead of silence */
  replyLine?: string;
  /** pre-filled body of the main CTA */
  messageText?: string;
  /** fallback for people who don't use WhatsApp */
  phone?: string;
  businessName?: string;
  /** variant D's bubble */
  bubbleTitle?: string;
}

export interface WhatsAppCTAProps {
  variant?: WhatsAppVariant;
  scheme?: WhatsAppScheme;
  /** digits only, e.g. "963112223344" — REQUIRED for real links */
  whatsapp: string;
  content?: Partial<WhatsAppContent>;
  quickMessages?: QuickMessage[];
  /** variant C's conversation */
  chat?: ChatLine[];
  showReplyTime?: boolean;
  showQuickMessages?: boolean;
  showPhoneFallback?: boolean;
  className?: string;
}

/* ───────────────────────────── defaults ───────────────────────────── */

export const defaultWhatsAppContent: WhatsAppContent = {
  title: "سؤال سريع؟ راسلنا على واتساب",
  subtext: "احجز موعدًا أو اسأل عن أي خدمة — بلا استمارات ولا انتظار على الهاتف.",
  ctaLabel: "ابدأ محادثة",
  replyLine: "نرد عادةً خلال دقائق في أوقات العمل",
  messageText: "مرحبًا! عندي سؤال",
  phone: "+963 11 222 3344",
  businessName: "اسم العمل",
  bubbleTitle: "تحتاج مساعدة؟",
};

export const defaultQuickMessages: QuickMessage[] = [
  { label: "بدّي أحجز موعد", text: "مرحبًا! بدّي أحجز موعد" },
  { label: "شو الأسعار؟", text: "مرحبًا! بحب أسأل عن الأسعار" },
  { label: "وين مكانكم؟", text: "مرحبًا! وين مكانكم بالضبط؟" },
];

export const defaultChat: ChatLine[] = [
  { from: "customer", text: "مرحبًا! بدّي أحجز موعد بكرا العصر إذا في مجال 🙏" },
  { from: "business", text: "أهلًا فيك 👋 في موعد ٥:٣٠ أو ٧:٠٠ — أي وحدة تناسبك؟" },
  { from: "customer", text: "٥:٣٠ تمام، شكرًا!" },
];

/* ───────────────────────── wa.me link builder ───────────────────────── */

/** Exported so the header, hero and footer all build identical links. */
export function waLink(number: string, text?: string) {
  const digits = number.replace(/\D/g, "");
  return text
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${digits}`;
}

/* ────────────────────────────── tokens ────────────────────────────── */

interface Tokens {
  root: string;
  hairline: string;
  kicker: string;
  link: string;
  mark: string;
  cta: string;
  ctaShadow: string;
  chip: string;
  live: string;
  chatShell: string;
  chatHead: string;
  chatAvatar: string;
  chatBody: string;
  bubbleIn: string;
  bubbleOut: string;
  demoBg: string;
  skeleton: string;
  fabCard: string;
}

function tokensFor(scheme: WhatsAppScheme): Tokens {
  switch (scheme) {
    case "paper":
      return {
        root: "bg-paper text-ink",
        hairline: "border-line",
        kicker: "text-[oklch(0.4_0.09_152)]",
        link: "text-[oklch(0.38_0.09_152)] hover:text-[oklch(0.32_0.08_152)]",
        mark: "bg-[oklch(0.94_0.04_150)] text-[oklch(0.36_0.08_152)]",
        cta: "bg-[oklch(0.62_0.14_152)] text-white hover:bg-[oklch(0.56_0.13_152)]",
        ctaShadow: "shadow-[0_14px_34px_-16px_oklch(0.62_0.14_152/.8)]",
        chip: "bg-surface border-neutral-300",
        live: "bg-[oklch(0.62_0.15_148)]",
        chatShell: "bg-surface border-line",
        chatHead: "bg-[oklch(0.32_0.07_152)] text-[oklch(0.97_0.01_150)]",
        chatAvatar: "bg-paper/[0.22] text-[oklch(0.97_0.01_150)]",
        chatBody: "bg-[oklch(0.965_0.008_100)]",
        bubbleIn: "bg-surface text-ink",
        bubbleOut: "bg-[oklch(0.9_0.06_150)] text-[oklch(0.26_0.05_152)]",
        demoBg: "bg-neutral-100",
        skeleton: "bg-neutral-300",
        fabCard: "bg-surface text-ink",
      };
    case "dark":
      return {
        root: "bg-ink-900 text-paper",
        hairline: "border-paper/15",
        kicker: "text-[oklch(0.82_0.09_150)]",
        link: "text-[oklch(0.85_0.09_150)] hover:text-[oklch(0.9_0.08_150)]",
        mark: "bg-paper/10 text-[oklch(0.85_0.1_150)]",
        cta: "bg-[oklch(0.62_0.14_152)] text-white hover:bg-[oklch(0.56_0.13_152)]",
        ctaShadow: "shadow-[0_14px_34px_-16px_oklch(0.62_0.14_152/.7)]",
        chip: "bg-paper/[0.06] border-paper/20",
        live: "bg-[oklch(0.78_0.15_148)]",
        chatShell: "bg-ink border-paper/[0.14]",
        chatHead: "bg-[oklch(0.28_0.05_152)] text-[oklch(0.96_0.01_150)]",
        chatAvatar: "bg-paper/[0.18] text-[oklch(0.97_0.01_150)]",
        chatBody: "bg-[oklch(0.21_0.01_70)]",
        bubbleIn: "bg-[oklch(0.28_0.008_70)] text-paper",
        bubbleOut: "bg-[oklch(0.4_0.07_152)] text-[oklch(0.96_0.01_150)]",
        demoBg: "bg-paper/[0.05]",
        skeleton: "bg-paper/[0.14]",
        fabCard: "bg-[oklch(0.26_0.01_70)] text-paper",
      };
    default: // green — WhatsApp's own colour, deepened for legibility
      return {
        root: "bg-[oklch(0.32_0.07_152)] text-[oklch(0.97_0.01_150)]",
        hairline: "border-paper/20",
        kicker: "text-[oklch(0.88_0.06_150)]",
        link: "text-[oklch(0.97_0.01_150)] hover:text-white",
        mark: "bg-paper/[0.16] text-[oklch(0.97_0.01_150)]",
        cta: "bg-paper text-[oklch(0.32_0.07_152)] hover:bg-white",
        ctaShadow: "shadow-[0_14px_34px_-16px_rgba(0,0,0,.5)]",
        chip: "bg-paper/10 border-paper/[0.26]",
        live: "bg-[oklch(0.82_0.16_148)]",
        chatShell: "bg-white border-paper/20",
        chatHead: "bg-[oklch(0.28_0.06_152)] text-[oklch(0.97_0.01_150)]",
        chatAvatar: "bg-paper/20 text-[oklch(0.97_0.01_150)]",
        chatBody: "bg-[oklch(0.96_0.008_100)]",
        bubbleIn: "bg-white text-ink",
        bubbleOut: "bg-[oklch(0.88_0.06_150)] text-[oklch(0.24_0.05_152)]",
        demoBg: "bg-paper/[0.07]",
        skeleton: "bg-paper/[0.18]",
        fabCard: "bg-white text-ink",
      };
  }
}

/* ────────────────────────────── pieces ────────────────────────────── */

const WhatsAppIcon = ({ className = "size-[18px]" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={className}>
    <path d="M8 1.5a6.5 6.5 0 0 0-5.6 9.8L1.5 14.5l3.4-.9A6.5 6.5 0 1 0 8 1.5z" />
  </svg>
);

/** The mark with its slow outward ring — the section's one piece of motion. */
function Mark({ t, size, iconCls }: { t: Tokens; size: number; iconCls: string }) {
  const ringBg = t.mark.split(" ")[0];
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${t.mark}`}
      style={{ width: size, height: size }}
    >
      <span className={`absolute inset-0 rounded-full animate-ring motion-reduce:animate-none ${ringBg}`} />
      <WhatsAppIcon className={`relative ${iconCls}`} />
      <span className="sr-only">WhatsApp</span>
    </span>
  );
}

function ReplyLine({ t, text }: { t: Tokens; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px] opacity-[0.78]">
      <span className={`size-[7px] rounded-full animate-pulse-soft motion-reduce:animate-none ${t.live}`} />
      {text}
    </span>
  );
}

function PhoneFallback({ show, phone, prefix }: { show: boolean; phone?: string; prefix: string }) {
  if (!show || !phone) return null;
  return (
    <a
      href={`tel:${phone.replace(/\s/g, "")}`}
      className="inline-flex items-center gap-2 text-[13.5px] text-current opacity-[0.72]"
    >
      {prefix}
      <span dir="ltr" className="font-mono text-[13px]">{phone}</span>
    </a>
  );
}

function QuickChips({
  messages,
  whatsapp,
  t,
  centered,
}: {
  messages: QuickMessage[];
  whatsapp: string;
  t: Tokens;
  centered?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-2.5 ${centered ? "justify-center" : "flex-col items-start"}`}>
      {messages.map((q) => (
        <a
          key={q.label}
          href={waLink(whatsapp, q.text ?? q.label)}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex h-[38px] max-w-full items-center gap-2 whitespace-nowrap rounded-full border px-[15px] text-[13px] font-medium text-current ${t.chip}`}
        >
          <span className="opacity-50">”</span>
          {q.label}
        </a>
      ))}
    </div>
  );
}

/* ──────────────────────────── component ──────────────────────────── */

export default function WhatsAppCTA({
  variant = "A",
  scheme = "green",
  whatsapp,
  content,
  quickMessages = defaultQuickMessages,
  chat = defaultChat,
  showReplyTime = true,
  showQuickMessages = true,
  showPhoneFallback = true,
  className,
}: WhatsAppCTAProps) {
  const c: WhatsAppContent = { ...defaultWhatsAppContent, ...content };
  const t = tokensFor(scheme);
  const href = waLink(whatsapp, c.messageText);

  return (
    <section dir="rtl" className={`${t.root} ${className ?? ""}`}>
      {/* ── A — band ── */}
      {variant === "A" && (
        <div className="flex flex-wrap items-start justify-between gap-[22px] px-[22px] py-7 md:items-center md:gap-[30px] md:px-[46px] md:py-9">
          <div className="flex min-w-0 items-start gap-[18px] md:items-center">
            <Mark t={t} size={48} iconCls="size-[23px]" />
            <div className="flex min-w-0 flex-col gap-2">
              <span className="font-display text-[21px] font-extrabold leading-[1.35] -tracking-[0.02em] text-balance md:text-[25px]">
                {c.title}
              </span>
              <span className="max-w-[46ch] text-sm leading-[1.75] opacity-[0.78] text-pretty md:text-[15px]">
                {c.subtext}
              </span>
              {showReplyTime && c.replyLine && (
                <span className="pt-0.5">
                  <ReplyLine t={t} text={c.replyLine} />
                </span>
              )}
            </div>
          </div>
          <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:items-end">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex h-[54px] w-full items-center justify-center gap-2.5 whitespace-nowrap rounded-[3px] px-[26px] font-display text-[15.5px] font-bold transition-colors md:w-auto ${t.cta} ${t.ctaShadow}`}
            >
              <WhatsAppIcon />
              {c.ctaLabel}
            </a>
            <PhoneFallback show={showPhoneFallback} phone={c.phone} prefix="أو اتصل مباشرة" />
          </div>
        </div>
      )}

      {/* ── B — centered ── */}
      {variant === "B" && (
        <div className="flex flex-col items-center gap-[22px] px-[22px] pb-11 pt-10 text-center md:px-[46px] md:pb-[72px] md:pt-[68px]">
          <span className="animate-rise motion-reduce:animate-none">
            <Mark t={t} size={68} iconCls="size-[32px]" />
          </span>
          <span
            className="max-w-[22ch] font-display text-[27px] font-extrabold leading-[1.32] -tracking-[0.028em] text-balance animate-rise motion-reduce:animate-none md:text-[clamp(30px,3.2vw,44px)]"
            style={{ animationDelay: "80ms" }}
          >
            {c.title}
          </span>
          <span
            className="max-w-[44ch] text-[14.5px] leading-[1.85] opacity-[0.78] text-pretty animate-rise motion-reduce:animate-none md:text-base"
            style={{ animationDelay: "160ms" }}
          >
            {c.subtext}
          </span>

          {showQuickMessages && quickMessages.length > 0 && (
            <QuickChips messages={quickMessages} whatsapp={whatsapp} t={t} centered />
          )}

          <div
            className="flex flex-col items-center gap-3 pt-1 animate-rise motion-reduce:animate-none"
            style={{ animationDelay: "260ms" }}
          >
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex h-14 items-center justify-center gap-2.5 whitespace-nowrap rounded-[3px] px-[30px] font-display text-base font-bold transition-colors ${t.cta} ${t.ctaShadow}`}
            >
              <WhatsAppIcon className="size-[19px]" />
              {c.ctaLabel}
            </a>
            {showReplyTime && c.replyLine && <ReplyLine t={t} text={c.replyLine} />}
            <PhoneFallback show={showPhoneFallback} phone={c.phone} prefix="أو اتصل" />
          </div>
        </div>
      )}

      {/* ── C — copy + chat mock ── */}
      {variant === "C" && (
        <div className="grid grid-cols-1 items-center gap-8 px-[22px] pb-[38px] pt-[34px] md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] md:gap-[52px] md:px-[46px] md:py-14">
          <div className="flex flex-col gap-[18px]">
            <span className="inline-flex w-fit items-center gap-2.5">
              <span className={`inline-flex size-[34px] items-center justify-center rounded-full ${t.mark}`}>
                <WhatsAppIcon className="size-[17px]" />
              </span>
              <span className={`text-xs font-semibold tracking-[0.06em] ${t.kicker}`}>
                واتساب · أسرع طريقة
              </span>
            </span>
            <span className="max-w-[20ch] font-display text-[25px] font-extrabold leading-[1.32] -tracking-[0.028em] text-balance md:text-[clamp(28px,2.9vw,38px)]">
              {c.title}
            </span>
            <span className="max-w-[42ch] text-sm leading-[1.85] opacity-[0.78] text-pretty md:text-[15px]">
              {c.subtext}
            </span>
            {showQuickMessages && quickMessages.length > 0 && (
              <QuickChips messages={quickMessages} whatsapp={whatsapp} t={t} />
            )}
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-1 inline-flex h-[54px] w-fit items-center justify-center gap-2.5 whitespace-nowrap rounded-[3px] px-[26px] font-display text-[15.5px] font-bold transition-colors ${t.cta} ${t.ctaShadow}`}
            >
              <WhatsAppIcon />
              {c.ctaLabel}
            </a>
          </div>

          <div className="flex justify-center">
            <div className={`w-full max-w-full overflow-hidden rounded-[18px] border shadow-[0_26px_60px_-30px_rgba(30,25,20,.45)] md:w-[340px] ${t.chatShell}`}>
              <div className={`flex items-center gap-[11px] px-4 py-3.5 ${t.chatHead}`}>
                <span className={`inline-flex size-[34px] items-center justify-center rounded-full font-display text-sm font-bold ${t.chatAvatar}`}>
                  {c.businessName?.replace(/^(صالون|مطعم|مقهى)\s/, "").charAt(0)}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{c.businessName}</span>
                  {showReplyTime && (
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] opacity-80">
                      <span className={`size-1.5 rounded-full animate-pulse-soft motion-reduce:animate-none ${t.live}`} />
                      متصل الآن
                    </span>
                  )}
                </span>
              </div>
              <div className={`flex flex-col gap-2.5 px-4 pb-5 pt-[18px] ${t.chatBody}`}>
                {chat.map((line, i) => (
                  <span
                    key={i}
                    className={`max-w-[82%] px-3.5 py-[11px] text-[13.5px] leading-[1.65] ${
                      line.from === "customer"
                        ? `self-start rounded-[14px_14px_14px_4px] ${t.bubbleIn}`
                        : `self-end rounded-[14px_14px_4px_14px] ${t.bubbleOut}`
                    }`}
                  >
                    {line.text}
                  </span>
                ))}
                {/* the business is mid-reply — reinforces "نرد خلال دقائق" */}
                <span className={`inline-flex self-end items-center gap-1 rounded-[14px_14px_4px_14px] px-4 py-3 ${t.bubbleOut}`}>
                  {[0, 0.2, 0.4].map((d) => (
                    <span
                      key={d}
                      className="size-1.5 rounded-full bg-current opacity-50 animate-typing motion-reduce:animate-none"
                      style={{ animationDelay: `${d}s` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── D — floating button preview ── */}
      {variant === "D" && (
        <div className="flex flex-col px-[22px] py-[30px] md:p-[46px]">
          <div className={`mb-[26px] flex flex-col gap-3 border-b pb-6 ${t.hairline}`}>
            <span className={`text-xs font-semibold tracking-[0.08em] ${t.kicker}`}>زر ثابت</span>
            <h2 className="m-0 font-display text-[25px] font-extrabold leading-[1.3] -tracking-[0.028em] md:text-[clamp(28px,2.8vw,36px)]">
              زر واتساب عائم في كل الصفحات
            </h2>
            <p className="m-0 max-w-[52ch] text-sm leading-[1.85] opacity-70 text-pretty md:text-[15px]">
              يبقى في زاوية الشاشة أثناء التمرير، ولا يغطّي المحتوى. هذه معاينة داخل القسم لشكله على الموقع.
            </p>
          </div>

          <div className={`relative h-[300px] overflow-hidden rounded border md:h-[340px] ${t.demoBg} ${t.hairline}`}>
            <span aria-hidden className="absolute inset-0 flex flex-col gap-3 p-[22px]">
              <span className={`h-3 w-[46%] rounded-[3px] ${t.skeleton}`} />
              <span className={`h-[9px] w-[74%] rounded-[3px] opacity-60 ${t.skeleton}`} />
              <span className={`h-[9px] w-[66%] rounded-[3px] opacity-60 ${t.skeleton}`} />
              <span className={`mt-1.5 h-[110px] w-full rounded opacity-[0.45] ${t.skeleton}`} />
              <span className={`h-[9px] w-[58%] rounded-[3px] opacity-60 ${t.skeleton}`} />
            </span>

            <div className="absolute bottom-[18px] start-[18px] flex items-center gap-3">
              <span className="relative inline-flex size-[58px] shrink-0 items-center justify-center rounded-full bg-[oklch(0.62_0.14_152)] text-white shadow-[0_14px_34px_-12px_rgba(20,80,50,.6)]">
                <span className="absolute inset-0 rounded-full bg-[oklch(0.62_0.14_152)] animate-ring motion-reduce:animate-none" />
                <WhatsAppIcon className="relative size-[27px]" />
              </span>
              <span className={`hidden max-w-[240px] flex-col gap-[3px] rounded-[14px_14px_14px_4px] px-[15px] py-[11px] shadow-[0_12px_30px_-14px_rgba(30,25,20,.4)] md:flex ${t.fabCard}`}>
                <span className="font-display text-[13.5px] font-bold">{c.bubbleTitle}</span>
                <span className="text-[12.5px] leading-[1.6] opacity-75">{c.replyLine}</span>
              </span>
            </div>
          </div>

          <div className={`mt-[22px] flex flex-wrap items-center gap-[18px] border-t pt-5 ${t.hairline}`}>
            <span className="max-w-[46ch] text-[13px] leading-[1.7] opacity-60">
              يظهر بعد تمرير ٣٠٠ بكسل ليبقى الهيرو نظيفًا، ويختفي حين يصل الزائر إلى قسم التواصل.
            </span>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`ms-auto inline-flex items-center gap-2 whitespace-nowrap font-display text-sm font-bold transition-colors ${t.link}`}
            >
              {c.ctaLabel}
              <svg viewBox="0 0 16 16" fill="none" className="size-[15px] -scale-x-100" aria-hidden>
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
