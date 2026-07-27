"use client";

// Custom single-select dropdown — our own popup (not the native <select> that
// renders in the browser's own chrome). Button + absolute menu, click-outside
// and Escape to close, matches the dashboard menus (see site-actions-menu).

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface MenuOption {
  value: string;
  label: string;
}

export function MenuSelect({
  value,
  options,
  onChange,
  placeholder = "اختر",
  disabled,
  className,
  ariaLabel,
}: {
  value: string;
  options: MenuOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const current = options.find((o) => o.value === value);

  React.useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 text-ink transition focus-ring disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
          open && "border-accent",
        )}
      >
        <span className={cn("truncate text-sm", !current && "text-faint")}>
          {current?.label ?? placeholder}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-lg"
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-start text-sm transition cursor-pointer",
                  active ? "bg-accent-100 text-accent-700 font-medium" : "text-ink hover:bg-black/[0.04] dark:hover:bg-white/6",
                )}
              >
                <span className="truncate">{o.label}</span>
                {active && <Check className="size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
