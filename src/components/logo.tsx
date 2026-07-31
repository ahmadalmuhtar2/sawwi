import { cn } from "@/lib/cn";

type Variant = "full" | "mark" | "mono-ink" | "mono-white";

// One new brand mark (transparent PNG) for every variant. The mark is full-color
// and reads on both light and dark surfaces, so the old mono lockups were dropped.
const SRC: Record<Variant, string> = {
  full: "/brand/logo.png",
  mark: "/brand/logo.png",
  "mono-ink": "/brand/logo.png",
  "mono-white": "/brand/logo.png",
};

export function Logo({
  variant = "full",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={SRC[variant]} alt="سوّي" className={cn("select-none", className)} />
  );
}
