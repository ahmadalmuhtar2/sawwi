import * as React from "react";
import { cn } from "@/lib/cn";

type Tone = "accent" | "neutral" | "danger" | "warn" | "outline";

const TONES: Record<Tone, string> = {
  accent: "bg-accent-100 text-accent-900",
  neutral: "bg-black/[0.05] text-muted",
  danger: "bg-danger-100 text-danger",
  warn: "bg-warn-100 text-[oklch(0.45_0.1_75)]",
  outline: "border border-line text-muted",
};

const DOT: Record<Tone, string> = {
  accent: "bg-accent",
  neutral: "bg-faint",
  danger: "bg-danger",
  warn: "bg-warn",
  outline: "bg-faint",
};

export function Badge({
  tone = "neutral",
  dot,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 h-6 text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", DOT[tone])} />}
      {children}
    </span>
  );
}

/** Maps a site/subscription status to a labelled badge (Arabic). */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    draft: { tone: "neutral", label: "مسودة" },
    published: { tone: "accent", label: "منشور" },
    active: { tone: "accent", label: "نشط" },
    grace: { tone: "warn", label: "مهلة" },
    suspended: { tone: "danger", label: "موقوف" },
  };
  const s = map[status] ?? { tone: "neutral" as Tone, label: status };
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}
