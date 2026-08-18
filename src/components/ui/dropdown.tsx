"use client";

// Custom single-select dropdown — our own popup (not the native <select> that
// renders in the browser's own chrome). Button + a menu PORTALED to <body> with
// fixed positioning, so it floats above any scroll/overflow container (e.g. a
// table with overflow-x-auto) instead of being clipped. Click-outside and Escape
// close it; matches the dashboard menus.

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface MenuOption {
  value: string;
  label: string;
}

interface Pos {
  top: number;
  /** Anchor to the button's inline-start (grow toward the free side). One of
   *  left/right is set depending on which side has room. */
  left?: number;
  right?: number;
  minWidth: number;
  maxWidth: number;
  maxHeight: number;
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
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<Pos | null>(null);
  const current = options.find((o) => o.value === value);

  // Position the portaled menu just under the button. The menu sizes to its OPTION
  // text (min = button width, so it's never narrower than the trigger; max = the
  // viewport), and grows toward whichever side has room — so long labels like
  // «قيد المراجعة» are never truncated. Height is capped to scroll internally.
  const place = React.useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const MARGIN = 8;
    const MAXW = 320;
    const maxHeight = Math.max(160, window.innerHeight - r.bottom - 12);
    const spaceRight = window.innerWidth - r.left - MARGIN;
    if (spaceRight >= 180) {
      // Room to the right: anchor the menu's left edge to the button, grow right.
      setPos({ top: r.bottom + 4, left: r.left, minWidth: r.width, maxWidth: Math.min(MAXW, spaceRight), maxHeight });
    } else {
      // Near the right edge: anchor the menu's right edge to the button, grow left.
      setPos({ top: r.bottom + 4, right: Math.max(MARGIN, window.innerWidth - r.right), minWidth: r.width, maxWidth: Math.min(MAXW, r.right - MARGIN), maxHeight });
    }
  }, []);

  React.useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const reposition = () => place();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    // capture:true so we also catch scrolls of ancestor overflow containers.
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, place]);

  return (
    <div className={cn("relative", className)}>
      <button
        ref={btnRef}
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

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{ top: pos.top, left: pos.left, right: pos.right, minWidth: pos.minWidth, maxWidth: pos.maxWidth, maxHeight: pos.maxHeight, width: "max-content" }}
            className="fixed z-[100] overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-lg"
          >
            {options.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-start text-sm transition cursor-pointer",
                    active
                      ? "bg-accent-100 text-accent-700 font-medium"
                      : "text-ink hover:bg-black/[0.04] dark:hover:bg-white/6",
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {active && <Check className="size-4 shrink-0" />}
                </button>
              );
            })}
          </div>,
          // Portal INTO the themed shell wrapper (carries data-theme) so the menu
          // inherits dark/light; fall back to <body> on public pages.
          document.getElementById("sw-app") ?? document.body,
        )}
    </div>
  );
}
