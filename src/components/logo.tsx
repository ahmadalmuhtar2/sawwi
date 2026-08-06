import { cn } from "@/lib/cn";

type Variant = "full" | "mark" | "mono-ink" | "mono-white";

// The brand mark is a rounded-square tile that carries its own background, so it
// stays legible on any surface by SWAPPING with the theme: the "On Light" mark
// (white tile, teal bars) in light mode, the "On Ink" mark (ink tile, white
// bars) in dark mode. `dark:` compiles to `[data-theme="dark"] &` (see globals).
// The "سوّي" wordmark is set in TEXT beside the mark for the `full` lockup, so it
// inherits the surface color. `mark`/`mono-*` render the symbol alone.
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
      <img src="/brand/mark-on-light.svg" alt="سوّي" className="h-full w-auto select-none dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/mark-on-ink.svg" alt="" aria-hidden className="hidden h-full w-auto select-none dark:block" />
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
