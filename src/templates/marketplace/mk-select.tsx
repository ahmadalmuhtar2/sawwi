"use client";

// A custom, mk-tokened dropdown that replaces the native <select> everywhere in
// the marketplace template. The native control renders the OS popup — unstyleable,
// inconsistent across platforms, and a plain white list even in dark mode. This one
// is a real listbox: a styled trigger + a floating menu (portaled to <body> with
// fixed positioning so it escapes any overflow/stacking of the surrounding panel),
// with keyboard navigation, type-ahead, a selected check, and RTL-correct layout.

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type MkOption = { value: string; label: string };

export function MkSelect({
  value,
  onChange,
  options,
  placeholder = "اختر",
  disabled,
  invalid,
  triggerClass = "",
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  options: MkOption[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** Input-like classes for the closed trigger (height/border/padding/text). */
  triggerClass?: string;
}) {
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  // Portal into the marketplace theme root (not <body>) so the floating menu
  // inherits the mk-* tokens — including the dark override + any custom palette —
  // which are scoped to that subtree. Fixed positioning stays viewport-relative
  // because the root has no transform/filter/backdrop-filter.
  const [host, setHost] = React.useState<HTMLElement | null>(null);
  const [rect, setRect] = React.useState<{ top: number; left: number; width: number; below: boolean } | null>(null);
  const [active, setActive] = React.useState(0); // keyboard-highlighted index
  const typeahead = React.useRef({ q: "", at: 0 });

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const place = React.useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Prefer opening downward; flip up when the menu would overflow the viewport.
    const room = window.innerHeight - r.bottom;
    const below = room > 260 || room > r.top;
    setRect({ top: below ? r.bottom + 4 : r.top - 4, left: r.left, width: r.width, below });
  }, []);

  const openMenu = React.useCallback(() => {
    if (disabled) return;
    setHost((btnRef.current?.closest("[data-mk-theme]") as HTMLElement) ?? document.body);
    place();
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }, [disabled, place, selectedIndex]);
  const close = React.useCallback(() => { setOpen(false); btnRef.current?.focus(); }, []);

  // Keep the floating menu glued to the trigger while open (page/inner scroll, resize).
  React.useEffect(() => {
    if (!open) return;
    const onMove = () => place();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    const onDown = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node) || listRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, place]);

  // Keep the highlighted option scrolled into view.
  React.useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const choose = (i: number) => { const o = options[i]; if (o) onChange(o.value); setOpen(false); btnRef.current?.focus(); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); openMenu(); }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, options.length - 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); return; }
    if (e.key === "Home") { e.preventDefault(); setActive(0); return; }
    if (e.key === "End") { e.preventDefault(); setActive(options.length - 1); return; }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(active); return; }
    // Type-ahead: jump to the next option starting with the typed run of characters.
    if (e.key.length === 1) {
      const now = Date.now();
      const ta = typeahead.current;
      ta.q = now - ta.at > 800 ? e.key : ta.q + e.key;
      ta.at = now;
      const hit = options.findIndex((o) => o.label.toLowerCase().startsWith(ta.q.toLowerCase()));
      if (hit >= 0) setActive(hit);
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        data-open={open || undefined}
        data-invalid={invalid || undefined}
        className={
          "flex items-center justify-between gap-2 text-start disabled:cursor-not-allowed disabled:opacity-60 data-open:border-mk-accent data-invalid:border-mk-danger " +
          triggerClass
        }
      >
        <span className={"truncate " + (selected ? "" : "text-mk-faint")}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={"size-4 shrink-0 text-mk-faint transition-transform duration-200 " + (open ? "rotate-180" : "")} aria-hidden />
      </button>

      {open && host && rect &&
        createPortal(
          <div
            ref={listRef}
            role="listbox"
            style={{
              top: rect.top, left: rect.left, width: rect.width,
              transform: rect.below ? undefined : "translateY(-100%)",
              zIndex: 2147483000,
            }}
            className="fixed max-h-[min(18rem,60vh)] overflow-auto overscroll-contain rounded-xl border border-mk-line bg-mk-surface p-1.5 shadow-xl"
          >
            {options.map((o, i) => {
              const isSel = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  data-i={i}
                  role="option"
                  aria-selected={isSel}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={
                    "flex w-full items-center justify-between gap-2 rounded-[8px] px-3 py-2 text-start text-[14px] transition " +
                    (i === active ? "bg-mk-track " : "") +
                    (isSel ? "font-semibold text-mk-strong" : "text-mk-ink")
                  }
                >
                  <span className="truncate">{o.label}</span>
                  {isSel && <Check className="size-4 shrink-0 text-mk-accent" aria-hidden />}
                </button>
              );
            })}
          </div>,
          host,
        )}
    </>
  );
}
