import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "subtle" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-sm hover:bg-accent-600 active:translate-y-px",
  secondary:
    "bg-surface text-ink border border-line hover:bg-bg active:translate-y-px",
  ghost: "text-ink hover:bg-black/[0.04] active:translate-y-px",
  subtle: "bg-accent-100 text-accent-900 hover:bg-accent-200",
  danger: "bg-danger text-white hover:opacity-90 active:translate-y-px",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-md",
  lg: "h-12 px-6 text-base gap-2 rounded-lg",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconOnly?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, iconOnly, disabled, children, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition select-none whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        SIZES[size],
        VARIANTS[variant],
        iconOnly && "px-0 aspect-square",
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
