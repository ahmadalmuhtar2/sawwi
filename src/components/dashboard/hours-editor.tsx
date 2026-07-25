"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";

type DayHours = { closed: true } | { closed?: false; open: string; close: string };
type Hours = Record<string, DayHours>;

// Display order: the Syrian week starts on Saturday.
const DAYS: { key: string; label: string }[] = [
  { key: "sat", label: "السبت" },
  { key: "sun", label: "الأحد" },
  { key: "mon", label: "الإثنين" },
  { key: "tue", label: "الثلاثاء" },
  { key: "wed", label: "الأربعاء" },
  { key: "thu", label: "الخميس" },
  { key: "fri", label: "الجمعة" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// Selectable slots: every 30 min, plus 23:59 so a shop can close at midnight.
const SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) for (const m of [0, 30]) out.push(`${pad(h)}:${pad(m)}`);
  out.push("23:59");
  return out;
})();
// Opening can be any slot except the very last; there must be room for a close.
const OPEN_SLOTS = SLOTS.filter((s) => s !== "23:59");
const closeSlots = (open: string) => SLOTS.filter((s) => toMin(s) > toMin(open));
const firstAfter = (open: string) => closeSlots(open)[0] ?? "23:59";

/** Snap any time string to the nearest valid slot (keeps legacy data selectable). */
function snap(t?: string): string | null {
  if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return null;
  const target = toMin(t);
  return SLOTS.reduce((best, s) =>
    Math.abs(toMin(s) - target) < Math.abs(toMin(best) - target) ? s : best,
  );
}

const DEFAULT_OPEN = "09:00";
const DEFAULT_CLOSE = "22:00";

// Every day is either open or closed — unspecified days default to open so the
// reseller only flips the days that are actually closed (e.g. Friday). Open days
// are snapped to valid slots with close always after open.
function normalize(input: Record<string, unknown>): Hours {
  const out: Hours = {};
  for (const { key } of DAYS) {
    const v = input[key] as DayHours | undefined;
    if (v && (v as { closed?: boolean }).closed) {
      out[key] = { closed: true };
      continue;
    }
    const open = snap((v as { open?: string })?.open) ?? DEFAULT_OPEN;
    let close = snap((v as { close?: string })?.close) ?? DEFAULT_CLOSE;
    if (toMin(close) <= toMin(open)) close = firstAfter(open);
    out[key] = { open, close };
  }
  return out;
}

export function HoursEditor({
  initial,
  value,
  onChange,
  onSave,
  hideSave,
}: {
  initial?: Record<string, unknown>;
  /** Controlled value — when provided, the parent owns the state. */
  value?: Record<string, unknown>;
  onChange?: (hours: Hours) => void;
  onSave?: (hours: Hours) => Promise<void>;
  /** Hide the internal save button (e.g. inside a wizard with its own footer). */
  hideSave?: boolean;
}) {
  const [internal, setInternal] = useState<Hours>(() =>
    normalize(value ?? initial ?? {}),
  );
  const hours = value !== undefined ? normalize(value) : internal;
  const [saving, setSaving] = useState(false);

  function setDay(key: string, next: DayHours) {
    const updated = { ...hours, [key]: next };
    if (onChange) onChange(updated);
    else setInternal(updated);
  }

  function state(key: string): "open" | "closed" {
    return hours[key]?.closed ? "closed" : "open";
  }

  function setOpen(key: string, open: string) {
    const day = hours[key];
    const prevClose = day && !day.closed ? day.close : DEFAULT_CLOSE;
    const close = toMin(prevClose) > toMin(open) ? prevClose : firstAfter(open);
    setDay(key, { open, close });
  }

  async function save() {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(hours);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">حدّد مواعيد كل يوم — مفتوح أو مغلق.</p>
      <div className="divide-y divide-line rounded-lg border border-line">
        {DAYS.map(({ key, label }) => {
          const s = state(key);
          const day = hours[key];
          return (
            <div key={key} className="flex flex-wrap items-center gap-3 p-3">
              <span className="w-16 text-sm font-medium text-ink">{label}</span>

              <div className="inline-flex rounded-md bg-black/[0.05] p-0.5 text-xs">
                {([
                  ["open", "مفتوح"],
                  ["closed", "مغلق"],
                ] as const).map(([val, txt]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() =>
                      setDay(
                        key,
                        val === "closed"
                          ? { closed: true }
                          : {
                              open: (day && !day.closed && day.open) || DEFAULT_OPEN,
                              close: (day && !day.closed && day.close) || DEFAULT_CLOSE,
                            },
                      )
                    }
                    className={cn(
                      "rounded px-2.5 py-1 font-medium transition cursor-pointer",
                      s === val ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
                    )}
                  >
                    {txt}
                  </button>
                ))}
              </div>

              {s === "open" && day && !day.closed && (
                <div className="flex items-center gap-2" dir="ltr">
                  <Select
                    value={day.open}
                    onChange={(e) => setOpen(key, e.target.value)}
                    className="h-9 w-24"
                    aria-label={`وقت فتح ${label}`}
                  >
                    {OPEN_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                  <span className="text-faint">—</span>
                  <Select
                    value={day.close}
                    onChange={(e) => setDay(key, { open: day.open, close: e.target.value })}
                    className="h-9 w-24"
                    aria-label={`وقت إغلاق ${label}`}
                  >
                    {closeSlots(day.open).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!hideSave && (
        <Button onClick={save} loading={saving}>
          حفظ المواعيد
        </Button>
      )}
    </div>
  );
}
