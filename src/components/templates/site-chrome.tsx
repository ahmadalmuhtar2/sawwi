"use client";

// Shared "site chrome" for templates — the small, universal pieces every
// storefront needs and that used to live (duplicated) inside each template:
//   · brand icons (WhatsApp / phone / Instagram / Facebook / TikTok)
//   · <SocialLinks> — renders only the platforms whose URL is set
//   · weekly-hours model: the per-day HoursRow, groupHours() for display, and
//     useOpenNow() for a live "مفتوح الآن" indicator.
//
// Everything here is COLOR-AGNOSTIC (SVGs paint with currentColor; SocialLinks
// takes an `itemClassName` for its palette) so the barbershop, restaurant, and
// foul-fatteh templates can all share one implementation while keeping their own
// look.

import * as React from "react";

/* ─────────────────────────────── icons ─────────────────────────────── */

export const WhatsAppIcon = ({ className = "size-[17px]" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const PhoneIcon = ({ className = "size-[17px]" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={className}>
    <path d="M5.6 2.2 3.3 2c-.5 0-1 .3-1.1.8-.3 1 .1 3.6 2.5 6s5 2.8 6 2.5c.5-.1.8-.6.8-1.1l-.2-2.3c0-.4-.4-.7-.8-.6l-1.7.3c-.2 0-.4 0-.5-.2L7.4 8c-.2-.1-.2-.3-.2-.5l.3-1.7c.1-.4-.2-.8-.6-.8L5.6 2.2Z" />
  </svg>
);

export const InstagramIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" />
  </svg>
);

export const FacebookIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M14 8.5V7c0-.8.2-1.2 1.3-1.2H17V2.8h-2.5C11.8 2.8 10.6 4.3 10.6 7v1.5H8.5V12h2.1v9h3.4v-9h2.4l.4-3.5H14z" />
  </svg>
);

export const TikTokIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M16.5 2h-3v13.2a2.6 2.6 0 1 1-2.2-2.57V9.2a5.9 5.9 0 1 0 5.2 5.85V8.3a6.6 6.6 0 0 0 3.8 1.2V6.4a3.6 3.6 0 0 1-3.6-3.6c0-.27 0-.53 0-.8Z" />
  </svg>
);

/** Social icon links — renders only the platforms whose URL is set. Shared by
 *  the header and footer of every template; each template passes its own
 *  `itemClassName` (the per-link chip styling) so the icons match its palette. */
export function SocialLinks({
  socials,
  className = "",
  size = "size-4",
  itemClassName = "size-8 rounded-full border border-current/20 text-current/70 hover:text-current",
}: {
  socials?: { instagram?: string; facebook?: string; tiktok?: string };
  className?: string;
  size?: string;
  /** styles each link chip (size + border + colors) — palette-specific. */
  itemClassName?: string;
}) {
  const items = [
    { url: socials?.instagram, label: "إنستغرام", Icon: InstagramIcon },
    { url: socials?.facebook, label: "فيسبوك", Icon: FacebookIcon },
    { url: socials?.tiktok, label: "تيك توك", Icon: TikTokIcon },
  ].filter((s) => s.url);
  if (!items.length) return null;
  return (
    <span className={`flex items-center gap-1.5 ${className}`}>
      {items.map(({ url, label, Icon }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className={`inline-flex items-center justify-center transition-colors ${itemClassName}`}
        >
          <Icon className={size} />
        </a>
      ))}
    </span>
  );
}

/* ───────────────────────────── weekly hours ─────────────────────────── */

export interface HoursRow {
  /** the weekday label, e.g. "السبت" */
  day: string;
  /** true → the shop is closed that day */
  closed?: boolean;
  /** true → open around the clock; `open`/`close` are ignored. */
  h24?: boolean;
  /** opening / closing clock labels, e.g. "١٠:٠٠ ص" */
  open?: string;
  close?: string;
}

/** One display line per distinct hours value. Days sharing a value are shown as
 *  ranges when consecutive and joined by commas when apart, e.g. closed on
 *  السبت–الاثنين and الخميس–الجمعة → { label: "السبت – الاثنين، الخميس – الجمعة",
 *  time: "مغلق" }. Days with no hours set (and not marked closed) are skipped. */
export function groupHours(hours: HoursRow[]): Array<{ label: string; time: string }> {
  const timeOf = (h: HoursRow) =>
    h.closed ? "مغلق" : h.h24 ? "٢٤ ساعة" : h.open && h.close ? `${h.open} – ${h.close}` : "";

  // Bucket day-indices by value, keeping the first-seen order for the output.
  const order: string[] = [];
  const byValue = new Map<string, number[]>();
  hours.forEach((h, i) => {
    const t = timeOf(h);
    if (!t) return;
    if (!byValue.has(t)) { byValue.set(t, []); order.push(t); }
    byValue.get(t)!.push(i);
  });

  return order.map((t) => {
    const idxs = byValue.get(t)!;
    // split the day-indices into consecutive runs
    const runs: Array<[number, number]> = [];
    let start = idxs[0];
    let prev = idxs[0];
    for (let k = 1; k < idxs.length; k++) {
      if (idxs[k] === prev + 1) prev = idxs[k];
      else { runs.push([start, prev]); start = prev = idxs[k]; }
    }
    runs.push([start, prev]);
    const label = runs
      .map(([a, b]) => (a === b ? hours[a].day : `${hours[a].day} – ${hours[b].day}`))
      .join("، ");
    return { label, time: t };
  });
}

const WEEKDAY_BY_JS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/** Parse an Arabic 12-hour clock label ("١٠:٠٠ ص") to minutes-since-midnight. */
export function parseArTime(s?: string): number | null {
  if (!s) return null;
  const latin = s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const m = latin.match(/(\d{1,2}):(\d{2})\s*(ص|م)/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (m[3] === "ص") { if (h === 12) h = 0; } else if (h !== 12) h += 12;
  return h * 60 + min;
}

/** Live open/closed state from the weekly hours vs. the visitor's clock. Returns
 *  null until mounted (so SSR and the first client render match). */
export function useOpenNow(hours: HoursRow[]): boolean | null {
  const [open, setOpen] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    const compute = () => {
      const now = new Date();
      const row = hours.find((h) => h.day === WEEKDAY_BY_JS[now.getDay()]);
      if (!row || row.closed) return setOpen(false);
      if (row.h24) return setOpen(true); // open around the clock
      const o = parseArTime(row.open);
      const c = parseArTime(row.close);
      if (o == null || c == null) return setOpen(false);
      const cur = now.getHours() * 60 + now.getMinutes();
      setOpen(c > o ? cur >= o && cur < c : cur >= o || cur < c); // handle past-midnight close
    };
    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  }, [hours]);
  return open;
}
