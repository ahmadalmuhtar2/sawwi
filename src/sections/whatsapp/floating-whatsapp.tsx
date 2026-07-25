"use client";

/**
 * FloatingWhatsApp — the persistent corner button, rendered ONCE site-wide
 * (see SiteRender). Appears after `showAfter` px of scroll and retreats when the
 * WhatsApp/contact section is on screen so it never covers the CTA it duplicates.
 * Client component (scroll + IntersectionObserver).
 */

import * as React from "react";

function waLink(number: string, text?: string) {
  const digits = number.replace(/\D/g, "");
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}

const WhatsAppIcon = ({ className = "size-[27px]" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={className}>
    <path d="M8 1.5a6.5 6.5 0 0 0-5.6 9.8L1.5 14.5l3.4-.9A6.5 6.5 0 1 0 8 1.5z" />
  </svg>
);

export interface FloatingWhatsAppProps {
  /** digits only */
  whatsapp: string;
  messageText?: string;
  label?: string;
  subLabel?: string;
  /** px scrolled before it appears — keeps the hero clean. Default 300. */
  showAfter?: number;
  /** hide once this element is in view, e.g. "#whatsapp" */
  hideNear?: string;
  className?: string;
}

export default function FloatingWhatsApp({
  whatsapp,
  messageText = "مرحبًا! عندي سؤال",
  label = "تحتاج مساعدة؟",
  subLabel = "نرد خلال دقائق",
  showAfter = 300,
  hideNear,
  className,
}: FloatingWhatsAppProps) {
  const [shown, setShown] = React.useState(false);
  const [suppressed, setSuppressed] = React.useState(false);

  React.useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      setShown(window.scrollY > showAfter);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(read);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [showAfter]);

  React.useEffect(() => {
    if (!hideNear) return;
    const el = document.querySelector(hideNear);
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setSuppressed(entry.isIntersecting), {
      threshold: 0.15,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hideNear]);

  const visible = shown && !suppressed;

  return (
    <a
      href={waLink(whatsapp, messageText)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      dir="rtl"
      className={`fixed bottom-[18px] start-[18px] z-40 inline-flex items-center gap-3 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      } ${className ?? ""}`}
    >
      <span className="relative inline-flex size-[58px] shrink-0 items-center justify-center rounded-full bg-[oklch(0.62_0.14_152)] text-white shadow-[0_14px_34px_-12px_rgba(20,80,50,.6)]">
        <span className="absolute inset-0 rounded-full bg-[oklch(0.62_0.14_152)] animate-ring motion-reduce:animate-none" />
        <WhatsAppIcon className="relative size-[27px]" />
      </span>
      <span className="hidden flex-col gap-[3px] rounded-[14px_14px_14px_4px] bg-surface px-[15px] py-[11px] text-ink shadow-[0_12px_30px_-14px_rgba(30,25,20,.4)] md:flex">
        <span className="font-display text-[13.5px] font-bold">{label}</span>
        <span className="text-[12.5px] leading-[1.6] opacity-75">{subLabel}</span>
      </span>
    </a>
  );
}
