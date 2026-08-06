"use client";

// A small, theme-aware tooltip. Wraps a SINGLE interactive child (button, link,
// icon) and shows a floating label on hover/focus. The label is PORTALED with
// fixed positioning (into the themed #sw-app shell) so it's never clipped by a
// table/overflow container, and it inherits the light/dark theme. Inverted chip
// (bg-ink / text-bg) for crisp contrast in both themes.
//
// Usage:  <Tooltip label="حذف"><button>…</button></Tooltip>
// Passing an empty/falsy label renders the child untouched (handy for the
// "only when collapsed" sidebar case): <Tooltip label={collapsed ? "…" : ""}>.

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type Side = "top" | "bottom" | "left" | "right";

interface Pos {
  top: number;
  left: number;
  transform: string;
}

function compose<E>(original: ((e: E) => void) | undefined, next: (e: E) => void) {
  return (e: E) => {
    original?.(e);
    next(e);
  };
}

export function Tooltip({
  label,
  side = "top",
  delay = 200,
  children,
}: {
  label: React.ReactNode;
  side?: Side;
  /** Hover delay before showing, ms. */
  delay?: number;
  children: React.ReactElement;
}) {
  const ref = React.useRef<HTMLElement | null>(null);
  const timer = React.useRef<number | undefined>(undefined);
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<Pos | null>(null);
  const id = React.useId();

  const place = React.useCallback(() => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const gap = 8;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const map: Record<Side, Pos> = {
      top: { top: r.top - gap, left: cx, transform: "translate(-50%, -100%)" },
      bottom: { top: r.bottom + gap, left: cx, transform: "translate(-50%, 0)" },
      left: { top: cy, left: r.left - gap, transform: "translate(-100%, -50%)" },
      right: { top: cy, left: r.right + gap, transform: "translate(0, -50%)" },
    };
    setPos(map[side]);
  }, [side]);

  const show = React.useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      place();
      setOpen(true);
    }, delay);
  }, [delay, place]);

  const hide = React.useCallback(() => {
    window.clearTimeout(timer.current);
    setOpen(false);
  }, []);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  React.useEffect(() => {
    if (!open) return;
    const on = () => place();
    window.addEventListener("scroll", on, true);
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on, true);
      window.removeEventListener("resize", on);
    };
  }, [open, place]);

  // No label → passthrough (no wrapper, no behaviour change).
  if (!label) return children;

  const child = React.Children.only(children) as React.ReactElement<
    React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>
  >;
  const p = child.props;
  // Forward our ref + hover/focus handlers onto the trigger via cloneElement.
  // Passing the ref OBJECT to cloneElement (not reading `.current`) is the
  // standard ref-forwarding pattern; the compiler lint rule can't see that, so
  // we scope-disable it here.
  /* eslint-disable react-hooks/refs */
  const cloned = React.cloneElement(child, {
    ref,
    onMouseEnter: compose(p.onMouseEnter, show),
    onMouseLeave: compose(p.onMouseLeave, hide),
    onFocus: compose(p.onFocus, show),
    onBlur: compose(p.onBlur, hide),
    "aria-describedby": open ? id : undefined,
  });
  /* eslint-enable react-hooks/refs */

  return (
    <>
      {cloned}
      {open &&
        pos &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            style={{ position: "fixed", top: pos.top, left: pos.left, transform: pos.transform }}
            className={cn(
              "pointer-events-none z-200 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11.5px] font-medium text-bg shadow-lg",
            )}
          >
            {label}
          </span>,
          (typeof document !== "undefined" && document.getElementById("sw-app")) || document.body,
        )}
    </>
  );
}
