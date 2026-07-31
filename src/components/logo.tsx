import { cn } from "@/lib/cn";

type Variant = "full" | "mark" | "mono-ink" | "mono-white";

// The brand is a full-color mark (transparent, tightly-trimmed PNG). The "سوّي"
// wordmark is set in TEXT beside the mark for the `full` lockup — so it inherits
// the surface color (ink on light, white on dark) instead of needing a baked-in
// image per theme. `mark`/`mono-*` render the symbol alone.
export function Logo({
  variant = "full",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const withWordmark = variant === "full";
  return (
    <span className={cn("inline-flex items-center gap-2 leading-none", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/mark.png" alt="سوّي" className="h-full w-auto select-none" />
      {withWordmark && (
        <span
          className="text-[1.5rem] font-extrabold tracking-tight text-ink dark:text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          سَوِّيْ
        </span>
      )}
    </span>
  );
}
