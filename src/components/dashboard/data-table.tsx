"use client";

// Presentational table whose SORT + FILTERS are CONTROLLED by the parent (the
// admin CRM drives them through URL params → the server queries the DB, so
// filtering/sorting/search span the whole dataset, not just a client window).
// Rows arrive already filtered & sorted; this component only renders + reports
// header/filter interactions back up. Responsive: table on md+, cards below.

import * as React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  label: string;
  /** Server-sortable (the column `key` is the sort key sent to the server). */
  sortable?: boolean;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export interface Filter {
  key: string; // URL param name
  label: string;
  options: { value: string; label: string }[];
}

export function DataTable<T extends { id?: string }>({
  rows,
  columns,
  filters = [],
  sort,
  onSort,
  filterValues = {},
  onFilter,
}: {
  rows: T[];
  columns: Column<T>[];
  filters?: Filter[];
  sort?: { key: string; dir: "asc" | "desc" } | null;
  onSort?: (key: string) => void;
  filterValues?: Record<string, string>;
  onFilter?: (key: string, value: string) => void;
}) {
  const sortableCols = columns.filter((c) => c.sortable);

  const SortIcon = ({ colKey }: { colKey: string }) =>
    sort?.key === colKey ? (
      sort.dir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
    ) : (
      <ChevronsUpDown className="size-3 opacity-40" />
    );

  return (
    <div>
      {(filters.length > 0 || sortableCols.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          {filters.map((f) => (
            <select
              key={f.key}
              value={filterValues[f.key] ?? ""}
              onChange={(e) => onFilter?.(f.key, e.target.value)}
              className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink cursor-pointer"
            >
              <option value="">{f.label}: الكل</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}

          {/* mobile-only sort control (headers aren't clickable in card view) */}
          {sortableCols.length > 0 && onSort && (
            <div className="flex items-center gap-1 md:hidden">
              <select
                value={sort?.key ?? ""}
                onChange={(e) => onSort(e.target.value)}
                className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink cursor-pointer"
              >
                <option value="">ترتيب حسب…</option>
                {sortableCols.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              {sort && (
                <button
                  type="button"
                  onClick={() => onSort(sort.key)}
                  aria-label="عكس الترتيب"
                  className="rounded-md border border-line p-1.5 text-muted transition hover:text-ink cursor-pointer"
                >
                  {sort.dir === "asc" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* desktop: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-160 text-start text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-faint">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-2.5 text-start font-medium">
                  {c.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(c.key)}
                      className="inline-flex items-center gap-1 transition hover:text-ink cursor-pointer"
                    >
                      {c.label}
                      <SortIcon colKey={c.key} />
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-faint">
                  لا نتائج.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id ?? i} className="border-t border-line">
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3 text-ink", c.className)}>
                      {c.render(r)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* mobile: one card per row */}
      <div className="divide-y divide-line md:hidden">
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-faint">لا نتائج.</p>
        ) : (
          rows.map((r, i) => (
            <div key={r.id ?? i} className="space-y-2 px-4 py-3.5">
              {columns.map((c) =>
                c.label ? (
                  <div key={c.key} className="flex items-start justify-between gap-3 text-sm">
                    <span className="shrink-0 text-xs text-faint">{c.label}</span>
                    <span className="min-w-0 text-end text-ink">{c.render(r)}</span>
                  </div>
                ) : (
                  <div key={c.key} className="pt-1">
                    {c.render(r)}
                  </div>
                ),
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
