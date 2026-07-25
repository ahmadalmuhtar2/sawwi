"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/**
 * Renders preview content inside an <iframe> so CSS viewport breakpoints (md:,
 * sm:, …) resolve against the DEVICE width, not the builder's desktop window.
 * A plain narrow <div> can't do this — Tailwind's `md:` keys off the real
 * viewport, so a phone-width box still shows the desktop layout.
 *
 * Content is rendered live via a React portal into the iframe body (so edits
 * reflect instantly), and the iframe auto-sizes to its content height so the
 * outer column keeps a single scrollbar.
 */
export function PreviewFrame({
  width,
  style,
  children,
}: {
  width: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = ref.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc) return;

    doc.documentElement.setAttribute("dir", "rtl");
    doc.documentElement.setAttribute("lang", "ar");
    doc.body.style.margin = "0";

    // Copy the app's stylesheets (Tailwind utilities + globals) into the iframe.
    document.head
      .querySelectorAll('style, link[rel="stylesheet"]')
      .forEach((node) => doc.head.appendChild(node.cloneNode(true)));

    // Turbopack/dev may deliver CSS via constructable stylesheets — mirror those.
    try {
      const win = iframe.contentWindow as (Window & typeof globalThis) | null;
      if (win && document.adoptedStyleSheets?.length) {
        doc.adoptedStyleSheets = document.adoptedStyleSheets.map((s) => {
          const sheet = new win.CSSStyleSheet();
          for (const rule of s.cssRules) {
            sheet.insertRule(rule.cssText, sheet.cssRules.length);
          }
          return sheet;
        });
      }
    } catch {
      /* cross-document sheet cloning unsupported — the link/style copy covers it */
    }

    // Keep the iframe as tall as its content (single outer scrollbar).
    const resize = () => {
      iframe.style.height = `${doc.documentElement.scrollHeight}px`;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(doc.documentElement);
    resize();

    setMount(doc.body);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <iframe
        ref={ref}
        title="معاينة"
        style={{ width, border: 0, display: "block" }}
        className="mx-auto bg-surface"
      />
      {mount && createPortal(<div style={style}>{children}</div>, mount)}
    </>
  );
}
