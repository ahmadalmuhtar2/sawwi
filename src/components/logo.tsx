import { cn } from "@/lib/cn";

type Variant = "full" | "mark" | "mono-ink" | "mono-white";

const SRC: Record<Variant, string> = {
  full: "/brand/logo.svg",
  mark: "/brand/favicon.svg",
  "mono-ink": "/brand/logo-mono-ink.svg",
  "mono-white": "/brand/logo-mono-white.svg",
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
