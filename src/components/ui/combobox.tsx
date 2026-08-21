"use client";

// Searchable single-select — a MenuSelect with a filter box inside the popup. Same
// portaled/fixed positioning so it floats above scroll/overflow containers. Use it
// wherever the option list is long enough to want typing (e.g. picking a provider
// or a customer when recording a match). Filters on the label AND an optional hint
// (e.g. a phone number), so you can find a row by either.

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ComboOption {
  value: string;
  label: string;
  /** Secondary text shown muted beside the label AND included in the search. */
  hint?: string;
}

interface Pos {
  top: number;
  left?: number;
  right?: number;
  minWidth: number;
  maxWidth: number;
  maxHeight: number;
}

export function Combobox({
  value,
  options,
  onChange,
  placeholder = "اختر",
  searchPlaceholder = "ابحث…",
  emptyLabel = "لا نتائج",
  disabled,
  className,
  ariaLabel,
}: {
  value: string;
  options: ComboOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState("");
  const [pos, setPos] = React.useState<Pos | null>(null);
  const current = options.find((o) => o.value === value);

  const filtered = React.useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return options;
    return options.filter((o) => o.label.toLowerCase().includes(t) || (o.hint ?? "").toLowerCase().includes(t));
  }, [options, term]);

  // Position the portaled menu just under the button (mirrors MenuSelect).
  const place = React.useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const MARGIN = 8;
    const MAXW = 360;
    const maxHeight = Math.max(200, window.innerHeight - r.bottom - 12);
    const spaceRight = window.innerWidth - r.left - MARGIN;
    if (spaceRight >= 200) {
      setPos({ top: r.bottom + 4, left: r.left, minWidth: r.width, maxWidth: Math.min(MAXW, spaceRight), maxHeight });
    } else {
      setPos({ top: r.bottom + 4, right: Math.max(MARGIN, window.innerWidth - r.right), minWidth: r.width, maxWidth: Math.min(MAXW, r.right - MARGIN), maxHeight });
    }
  }, []);

  React.useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  // Reset the filter and focus the search box each time it opens.
  React.useEffect(() => {
    if (open) {
      setTerm("");
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open]);

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
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, place]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

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
        <span className={cn("truncate text-sm", !current && "text-faint")}>{current?.label ?? placeholder}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{ top: pos.top, left: pos.left, right: pos.right, minWidth: pos.minWidth, maxWidth: pos.maxWidth, maxHeight: pos.maxHeight, width: "max-content" }}
            className="fixed z-[100] flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
          >
            <div className="flex items-center gap-2 border-b border-line px-2.5 py-2">
              <Search className="size-4 shrink-0 text-faint" />
              <input
                ref={inputRef}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (filtered[0]) pick(filtered[0].value);
                  }
                }}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm outline-none placeholder:text-faint"
              />
            </div>
            <div className="overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-[13px] text-faint">{emptyLabel}</div>
              ) : (
                filtered.map((o) => {
                  const active = o.value === value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => pick(o.value)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-start text-sm transition cursor-pointer",
                        active ? "bg-accent-100 text-accent-700 font-medium" : "text-ink hover:bg-black/[0.04] dark:hover:bg-white/6",
                      )}
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{o.label}</span>
                        {o.hint && <span className="truncate text-[11.5px] text-faint" dir="ltr">{o.hint}</span>}
                      </span>
                      {active && <Check className="size-4 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.getElementById("sw-app") ?? document.body,
        )}
    </div>
  );
}
