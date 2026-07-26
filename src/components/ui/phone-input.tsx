"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// A single 5-point star (unit, centered, pointing up) — reused for the Syrian flag.
const STAR =
  "M0,-1 L0.2245,-0.309 L0.951,-0.309 L0.363,0.118 L0.588,0.809 L0,0.382 L-0.588,0.809 L-0.363,0.118 L-0.951,-0.309 L-0.2245,-0.309 Z";

// New Syrian flag (2025): green / white / black with three red stars.
// The 🇸🇾 emoji still renders the OLD flag, so we draw it explicitly.
function SyrianFlag() {
  return (
    <svg viewBox="0 0 30 20" className="h-3.5 w-5 shrink-0 rounded-[2px]" aria-hidden>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.667" fill="#007A3D" />
      <rect y="13.333" width="30" height="6.667" fill="#000" />
      <g fill="#CE1126">
        <path d={STAR} transform="translate(10 10) scale(2)" />
        <path d={STAR} transform="translate(15 10) scale(2)" />
        <path d={STAR} transform="translate(20 10) scale(2)" />
      </g>
    </svg>
  );
}

function GermanFlag() {
  return (
    <svg viewBox="0 0 30 20" className="h-3.5 w-5 shrink-0 rounded-[2px]" aria-hidden>
      <rect width="30" height="6.667" fill="#000" />
      <rect y="6.667" width="30" height="6.667" fill="#DD0000" />
      <rect y="13.333" width="30" height="6.667" fill="#FFCE00" />
    </svg>
  );
}

interface Country {
  code: string;
  dial: string;
  name: string;
  example: string;
  Flag: () => React.ReactElement;
}

const COUNTRIES: Country[] = [
  { code: "SY", dial: "+963", name: "سوريا", example: "944 123 456", Flag: SyrianFlag },
  { code: "DE", dial: "+49", name: "ألمانيا", example: "151 23456789", Flag: GermanFlag },
];

/** Split a stored "+963…" value into its country + local digits. */
function parseValue(value: string): { country: Country; local: string } {
  const v = (value ?? "").replace(/\s+/g, "");
  const match = COUNTRIES.find((c) => v.startsWith(c.dial));
  if (match) return { country: match, local: v.slice(match.dial.length).replace(/\D/g, "") };
  return { country: COUNTRIES[0], local: v.replace(/\D/g, "") };
}

export function PhoneInput({
  value = "",
  onChange,
  disabled,
  placeholder,
}: {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  /** Overrides the per-country example placeholder when provided. */
  placeholder?: string;
}) {
  const initial = useMemo(() => parseValue(value), [value]);
  const [dial, setDial] = useState(initial.country.dial);
  const [local, setLocal] = useState(initial.local);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = COUNTRIES.find((c) => c.dial === dial) ?? COUNTRIES[0];

  function emit(nextDial: string, nextLocal: string) {
    onChange?.(nextLocal ? `${nextDial}${nextLocal}` : "");
  }

  return (
    <div
      dir="ltr"
      className="flex h-10 items-stretch rounded-md border border-line bg-surface transition focus-within:border-accent focus-within:ring-3 focus-within:ring-accent-100"
    >
      {/* Country selector */}
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="flex h-full items-center gap-1.5 rounded-s-md border-e border-line px-2.5 text-sm text-ink transition hover:bg-black/[0.03] dark:hover:bg-white/5 disabled:opacity-60 cursor-pointer"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <current.Flag />
          <span className="font-label">{current.dial}</span>
          <ChevronDown className="size-3.5 text-faint" />
        </button>
        {open && (
          <ul
            role="listbox"
            className="absolute start-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
          >
            {COUNTRIES.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => {
                    setDial(c.dial);
                    setOpen(false);
                    emit(c.dial, local);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm text-ink transition hover:bg-black/[0.04] dark:hover:bg-white/6 cursor-pointer"
                >
                  <c.Flag />
                  <span className="flex-1">{c.name}</span>
                  <span className="font-label text-xs text-muted">{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Local number */}
      <input
        type="tel"
        inputMode="numeric"
        disabled={disabled}
        value={local}
        placeholder={placeholder ?? current.example}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, "");
          setLocal(next);
          emit(dial, next);
        }}
        className="h-full min-w-0 flex-1 rounded-e-md bg-transparent px-3 text-ink outline-none placeholder:text-faint disabled:opacity-60"
      />
    </div>
  );
}
