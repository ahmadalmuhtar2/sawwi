"use client";

// Multi-select site picker backed by SERVER-SIDE search. Typing debounces and
// hits /api/sites/search (capped result window — a "limit", not pagination), so
// the members page never ships every workspace site to the browser. Selected
// sites show as removable chips; the value is the list of {id, businessName}.

import * as React from "react";
import { Search, X, Loader2, Check } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/cn";

export interface SiteOption {
  id: string;
  businessName: string;
}

export function SiteCombobox({
  value,
  onChange,
  placeholder = "ابحث عن موقع بالاسم…",
}: {
  value: SiteOption[];
  onChange: (next: SiteOption[]) => void;
  placeholder?: string;
}) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SiteOption[]>([]);
  const boxRef = React.useRef<HTMLDivElement>(null);

  // Debounced server search. Re-runs 250ms after the query settles (and on open).
  React.useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    // setLoading lives INSIDE the debounce timeout (not synchronously in the
    // effect body) so it doesn't trigger a cascading render on every keystroke.
    const t = setTimeout(() => {
      setLoading(true);
      // apiFetch unwraps the { ok, data } envelope → data is { sites }. Keep the
      // previous results on error/abort so the list doesn't flash empty.
      apiFetch<{ sites: SiteOption[] }>(
        `/api/sites/search?q=${encodeURIComponent(q)}&limit=10`,
        { signal: ctrl.signal },
      )
        .then((d) => setResults(d.sites ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open]);

  // Close on outside click.
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selectedIds = new Set(value.map((v) => v.id));
  const toggle = (opt: SiteOption) => {
    onChange(
      selectedIds.has(opt.id) ? value.filter((v) => v.id !== opt.id) : [...value, opt],
    );
  };

  return (
    <div ref={boxRef} className="relative">
      {/* selected chips */}
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 rounded-md border border-accent bg-accent-50 px-2 py-1 text-xs font-medium text-accent-900"
            >
              {s.businessName}
              <button
                type="button"
                onClick={() => toggle(s)}
                aria-label="إزالة"
                className="rounded hover:bg-accent-100"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* search input */}
      <div className="flex h-10 items-center rounded-md border border-line bg-surface px-3 transition focus-within:border-accent focus-within:ring-3 focus-within:ring-accent-100">
        <Search className="size-4 shrink-0 text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm text-ink outline-none placeholder:text-faint"
        />
        {loading && <Loader2 className="size-4 shrink-0 animate-spin text-faint" />}
      </div>

      {/* results dropdown */}
      {open && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-lg">
          {results.length === 0 && !loading ? (
            <p className="px-3 py-2 text-sm text-faint">لا نتائج.</p>
          ) : (
            results.map((opt) => {
              const on = selectedIds.has(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-start text-sm transition cursor-pointer",
                    on ? "text-accent-900" : "text-ink hover:bg-neutral-100",
                  )}
                >
                  {opt.businessName}
                  {on && <Check className="size-4 text-accent" />}
                </button>
              );
            })
          )}
          <p className="border-t border-line px-3 py-1.5 text-[11px] text-faint">
            تظهر أول ١٠ نتائج — تابع الكتابة لتضييق البحث.
          </p>
        </div>
      )}
    </div>
  );
}
