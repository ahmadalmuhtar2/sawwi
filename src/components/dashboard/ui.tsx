// Shared dashboard presentation primitives — the visual language of the
// redesigned dashboard (page header, seamless stat grid, panels, initial tiles),
// built on our semantic tokens so light mode degrades cleanly. Pure/no hooks, so
// server components (e.g. the dashboard home) can render them directly.

import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

/* Arabic-Indic digits for counts/labels rendered server-side. */
const AR = "٠١٢٣٤٥٦٧٨٩";
export const toArabicDigits = (n: number | string) =>
  String(n).replace(/\d/g, (d) => AR[Number(d)]);

/* ── page header: title + subtitle on the start, actions on the end ── */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start gap-4">
      <div className="min-w-0">
        <h1 className="text-[25px] font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[13.5px] text-muted">{subtitle}</p>}
      </div>
      {children && <div className="ms-auto flex flex-wrap items-center gap-2.5">{children}</div>}
    </div>
  );
}

/* ── stat grid: seamless cells split by 1px hairlines (bg shows through the
 *    gap), each cell hover-lifts to the surface color ── */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
      {children}
    </div>
  );
}

type StatTone = "up" | "down" | "warn" | "muted";
const STAT_TONE: Record<StatTone, string> = {
  up: "text-accent-300",
  down: "text-danger",
  warn: "text-warn",
  muted: "text-faint",
};

export function StatCell({
  label,
  value,
  hint,
  hintTone = "muted",
  valueTone,
  href,
  active,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  hintTone?: StatTone;
  /** Colour the number itself (e.g. warn for "expiring soon"). */
  valueTone?: StatTone;
  /** Makes the whole cell a link — clicking filters + navigates (URL-reflected). */
  href?: string;
  /** Highlight when this cell is the active filter. */
  active?: boolean;
}) {
  const inner = (
    <>
      <div className="flex items-center gap-1.5 text-[12.5px] text-muted">
        {label}
        {href && <ChevronLeft className="size-3.5 text-faint opacity-0 transition-opacity group-hover/stat:opacity-100" />}
      </div>
      <div className={cn("mt-2 text-[30px] font-bold leading-none tracking-tight tabular-nums", valueTone ? STAT_TONE[valueTone] : "text-ink")}>
        {value}
      </div>
      {hint && <div className={cn("mt-2 text-[11.5px]", STAT_TONE[hintTone])}>{hint}</div>}
    </>
  );
  const cls = cn(
    "block px-5 py-5 transition-colors",
    active ? "bg-surface" : "bg-bg hover:bg-surface",
    href && "group/stat cursor-pointer",
    active && "ring-1 ring-inset ring-accent-300/40",
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/* ── panel: bordered card with an optional header (title + trailing action) ── */
export function Panel({
  title,
  action,
  className,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-line bg-surface", className)}>
      {title && (
        <div className="flex items-center gap-2.5 border-b border-line px-4.5 py-3.75">
          <h2 className="text-[14.5px] font-semibold text-ink">{title}</h2>
          {action && <div className="ms-auto text-[12.5px]">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ── filter chips: the design's `.fbar`/`.fb` row (bordered pills, mint active).
 *    Presentational — the parent owns the selected key and passes onChange. ── */
export function FilterChips<K extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { key: K; label: string; count?: number }[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={cn(
              "rounded-md border px-3.5 py-1.5 text-[13px] transition-colors cursor-pointer",
              active
                ? "border-accent bg-neutral-100 text-accent-300"
                : "border-line bg-surface text-muted hover:border-neutral-300 hover:text-ink",
            )}
          >
            {o.label}
            {typeof o.count === "number" && <span className="text-faint"> · {toArabicDigits(o.count)}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── initial tile: the logo if present, else a deterministic accent-tinted
 *    square with the first letter (purely presentational, no data invented) ── */
const TILE_TINTS = [
  "bg-[#0B7A5F]",
  "bg-[#1B5E9E]",
  "bg-[#B4530E]",
  "bg-[#6E3B8A]",
  "bg-[#2C4A44]",
  "bg-[#3A6E8F]",
];
function tintFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % TILE_TINTS.length;
  return TILE_TINTS[h];
}

export function SiteThumb({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  className?: string;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- storage URL
      <img
        src={logoUrl}
        alt=""
        className={cn("size-8.5 shrink-0 rounded-lg object-cover", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid size-8.5 shrink-0 place-items-center rounded-lg text-[13px] font-semibold text-white",
        tintFor(name),
        className,
      )}
    >
      {name.trim().charAt(0) || "س"}
    </span>
  );
}
