"use client";

// A small "i" icon with a hover/focus tooltip describing what a field is for.
// The bubble is portaled to <body> with fixed positioning, so it escapes any
// overflow clipping or stacking context of the surrounding panel (it always
// paints on top). Position is measured from the icon on open.

import * as React from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

export function InfoTip({ text }: { text: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  const show = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.top, left: r.left + r.width / 2 });
  }, []);
  const hide = React.useCallback(() => setPos(null), []);

  return (
    <span
      ref={ref}
      className="inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={0}
      role="img"
      aria-label={text}
    >
      <Info className="size-3.5 cursor-help text-faint transition hover:text-ink" aria-hidden />
      {pos !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            style={{ top: pos.top - 8, left: pos.left, zIndex: 2147483000 }}
            className="pointer-events-none fixed max-w-64 -translate-x-1/2 -translate-y-full rounded-md bg-ink px-2.5 py-1.5 text-start text-xs leading-relaxed text-surface shadow-lg"
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
