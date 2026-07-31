"use client";

// Schema-driven form for a template's editable data. Renders a StepDef's fields
// (text / textarea / image / list-of-records) bound to a nested content object.
// Shared by the onboarding wizard and the post-creation editor.

import * as React from "react";
import { ChevronDown, ChevronUp, ImageIcon, Loader2, Plus, Trash2, X } from "lucide-react";
import type { FieldDef } from "@/templates/types";
import { getPath, setPath } from "@/templates/content";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { MenuSelect } from "@/components/ui/dropdown";
import { SegmentedControl } from "@/components/ui/segmented";
import { PhoneInput } from "@/components/ui/phone-input";
import { api, ApiClientError } from "@/lib/api-client";
import { MAX_IMAGE_BYTES, maxSizeLabel } from "@/shared/uploads";

type Content = Record<string, unknown>;
type Upload = (file: File) => Promise<string>;

/* ── weekly hours: a fixed set of days, each open (from→to) or closed ── */

export interface DayHours {
  day: string;
  closed?: boolean;
  /** true → open 24 hours; open/close are ignored. */
  h24?: boolean;
  open?: string;
  close?: string;
}

/** Syrian week order — the row set the hours editor always renders. */
const WEEK_DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

const AR = "٠١٢٣٤٥٦٧٨٩";
const arDigits = (s: string | number) => String(s).replace(/\d/g, (d) => AR[Number(d)]);

/** Half-hourly clock labels for a full day, in Arabic 12-hour form (ص/م). */
const TIME_OPTIONS: { value: string; label: string }[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "٠٠" : "٣٠";
  const period = h < 12 ? "ص" : "م";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const label = `${arDigits(h12)}:${m} ${period}`;
  return { value: label, label };
});

/** Merge the stored hours (matched by day) over the canonical week so the editor
 *  always shows all seven days regardless of what's saved. */
function normalizeWeek(stored: unknown): DayHours[] {
  const byDay = new Map<string, DayHours>();
  if (Array.isArray(stored)) {
    for (const r of stored) {
      const row = r as DayHours;
      if (row && typeof row.day === "string") byDay.set(row.day, row);
    }
  }
  return WEEK_DAYS.map((day) => byDay.get(day) ?? { day, closed: false, h24: false, open: "", close: "" });
}

/** Resolve a `select` field's options from a sibling list in the root content,
 *  e.g. the dish "category" dropdown reads the "groups" list. */
function selectOptions(root: Content, field: FieldDef): { value: string; label: string }[] {
  const list = getPath(root, field.optionsFrom ?? "");
  if (!Array.isArray(list)) return [];
  const vk = field.optionValue ?? "id";
  const lk = field.optionLabel ?? "label";
  return list
    .map((row) => {
      const r = row as Content;
      const value = typeof r[vk] === "string" ? (r[vk] as string) : "";
      const label = typeof r[lk] === "string" && r[lk] ? (r[lk] as string) : value;
      return { value, label };
    })
    .filter((o) => o.value);
}

/** Upload an image to the pre-site staging folder; returns its URL. */
export async function uploadStaging(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`حجم الصورة كبير — أقصى حجم ${maxSizeLabel(MAX_IMAGE_BYTES)}`);
  }
  const fd = new FormData();
  fd.append("file", file);
  const { url } = await api.post<{ url: string }>("/api/uploads/staging", fd);
  return url;
}

export function FieldForm({
  fields,
  content,
  onChange,
  upload,
}: {
  fields: FieldDef[];
  content: Content;
  onChange: (next: Content) => void;
  upload: Upload;
}) {
  const set = (path: string, value: unknown) => onChange(setPath(content, path, value));
  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <FieldRow key={f.key} field={f} content={content} root={content} set={set} onRoot={onChange} upload={upload} />
      ))}
    </div>
  );
}

function FieldRow({
  field,
  content,
  root,
  set,
  onRoot,
  upload,
}: {
  field: FieldDef;
  content: Content;
  root: Content;
  set: (path: string, value: unknown) => void;
  onRoot: (next: Content) => void;
  upload: Upload;
}) {
  if (field.type === "categories") {
    return <CategoriesEditor field={field} root={root} onChange={(next) => onRoot(next)} />;
  }

  if (field.type === "weekhours") {
    return (
      <WeekHoursEditor
        field={field}
        value={getPath(content, field.key)}
        onChange={(next) => set(field.key, next)}
      />
    );
  }

  if (field.type === "list") {
    const items = getPath(content, field.key);
    return (
      <ListEditor
        field={field}
        items={Array.isArray(items) ? (items as Content[]) : []}
        onItems={(next) => set(field.key, next)}
        root={root}
        upload={upload}
      />
    );
  }

  const value = typeof getPath(content, field.key) === "string" ? (getPath(content, field.key) as string) : "";
  if (field.type === "select") {
    const options = selectOptions(root, field);
    return (
      <Field label={field.label} info={field.help}>
        <Select value={value} onChange={(e) => set(field.key, e.target.value)}>
          <option value="">{field.placeholder ?? "اختر"}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </Field>
    );
  }
  if (field.type === "image") {
    return (
      <div>
        <p className="mb-1.5 text-xs font-medium text-faint">{field.label}</p>
        <ImageInput value={value} onChange={(url) => set(field.key, url)} upload={upload} />
        {field.help && <p className="mt-1 text-xs text-faint">{field.help}</p>}
      </div>
    );
  }

  return (
    <Field label={field.label} info={field.help}>
      {field.type === "textarea" ? (
        <Textarea
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => set(field.key, e.target.value)}
          rows={3}
        />
      ) : field.type === "phone" ? (
        <PhoneInput value={value} onChange={(v) => set(field.key, v)} placeholder={field.placeholder} />
      ) : (
        <Input
          value={value}
          placeholder={field.placeholder}
          dir={field.ltr ? "ltr" : undefined}
          className={field.ltr ? "text-start font-mono text-[13px]" : undefined}
          onChange={(e) => set(field.key, e.target.value)}
        />
      )}
    </Field>
  );
}

/** Weekly opening hours: a fixed row per day, each toggled open/closed, with our
 *  own from/to dropdowns (not native <select>). Writes the whole 7-day array. */
function WeekHoursEditor({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (next: DayHours[]) => void;
}) {
  const week = normalizeWeek(value);
  const setDay = (i: number, patch: Partial<DayHours>) =>
    onChange(week.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-faint">{field.label}</p>
      <div className="space-y-2">
        {week.map((d, i) => (
          <div key={d.day} className="rounded-lg border border-line p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-ink">{d.day}</span>
              <SegmentedControl
                size="sm"
                value={d.closed ? "closed" : d.h24 ? "h24" : "open"}
                onChange={(v) => setDay(i, { closed: v === "closed", h24: v === "h24" })}
                options={[
                  { value: "open", label: "مفتوح" },
                  { value: "h24", label: "٢٤ ساعة" },
                  { value: "closed", label: "مغلق" },
                ]}
              />
            </div>
            {!d.closed && !d.h24 && (
              <div className="mt-2 flex items-center gap-2">
                <MenuSelect
                  className="min-w-0 flex-1"
                  ariaLabel={`فتح ${d.day}`}
                  placeholder="من"
                  value={d.open ?? ""}
                  options={TIME_OPTIONS}
                  onChange={(v) => setDay(i, { open: v })}
                />
                <span className="shrink-0 text-xs text-faint">–</span>
                <MenuSelect
                  className="min-w-0 flex-1"
                  ariaLabel={`إغلاق ${d.day}`}
                  placeholder="إلى"
                  value={d.close ?? ""}
                  options={TIME_OPTIONS}
                  onChange={(v) => setDay(i, { close: v })}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      {field.help && <p className="mt-1.5 text-xs text-faint">{field.help}</p>}
    </div>
  );
}

/** A repeatable record list (services, barbers, hours, …). Manages the array
 *  wholesale so nested content paths never index into arrays. */
function ListEditor({
  field,
  items,
  onItems,
  root,
  upload,
}: {
  field: FieldDef;
  items: Content[];
  onItems: (next: Content[]) => void;
  root: Content;
  upload: Upload;
}) {
  const itemLabel = field.itemLabel ?? "عنصر";
  const setItem = (i: number, key: string, val: unknown) =>
    onItems(items.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  const add = () => onItems([...items, { ...(field.blank ?? {}) }]);
  const remove = (i: number) => onItems(items.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onItems(next);
  };

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-faint">{field.label}</p>
      <div className="space-y-2.5">
        {items.map((row, i) => (
          <div key={i} className="rounded-lg border border-line p-3">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">
                {itemLabel} {i + 1}
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-1 text-faint hover:text-ink disabled:opacity-30 cursor-pointer"
                  title="أعلى"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  className="p-1 text-faint hover:text-ink disabled:opacity-30 cursor-pointer"
                  title="أسفل"
                >
                  <ChevronDown className="size-4" />
                </button>
                <button
                  onClick={() => remove(i)}
                  className="p-1 text-faint hover:text-danger cursor-pointer"
                  title="حذف"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {(field.item ?? []).map((sub) => (
                <ItemField
                  key={sub.key}
                  sub={sub}
                  value={row[sub.key]}
                  onChange={(v) => setItem(i, sub.key, v)}
                  root={root}
                  upload={upload}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-accent cursor-pointer"
      >
        <Plus className="size-4" /> إضافة {itemLabel}
      </button>
    </div>
  );
}

/** Stable, human-invisible id for a new category. */
function newCategoryId(): string {
  return "c" + Math.random().toString(36).slice(2, 8);
}

/** Category manager: the owner types only the Arabic name; the id is generated
 *  and kept stable across renames so dishes stay linked. Removing a category
 *  reassigns its orphaned rows (in `dependents.list`) to the first remaining
 *  category. Mirrors the onboarding wizard's editor inside the builder. */
function CategoriesEditor({
  field,
  root,
  onChange,
}: {
  field: FieldDef;
  root: Content;
  onChange: (next: Content) => void;
}) {
  const vk = field.optionValue ?? "id";
  const lk = field.optionLabel ?? "label";
  const cats = Array.isArray(getPath(root, field.key)) ? (getPath(root, field.key) as Content[]) : [];
  const dep = field.dependents;

  // Apply a new category list — and, when categories are removed, remap any
  // dependent rows that referenced a gone id onto `fallback` — in one update.
  const commit = (nextCats: Content[], removedIds?: string[], fallback?: string) => {
    let next = setPath(root, field.key, nextCats);
    if (dep && removedIds?.length) {
      const rows = Array.isArray(getPath(root, dep.list)) ? (getPath(root, dep.list) as Content[]) : [];
      const remapped = rows.map((r) =>
        removedIds.includes(r[dep.key] as string) ? { ...r, [dep.key]: fallback ?? "" } : r,
      );
      next = setPath(next, dep.list, remapped);
    }
    onChange(next);
  };

  const rename = (i: number, label: string) =>
    commit(cats.map((c, idx) => (idx === i ? { ...c, [lk]: label } : c)));
  const add = () => commit([...cats, { [vk]: newCategoryId(), [lk]: "" }]);
  const remove = (i: number) => {
    const gone = cats[i]?.[vk] as string;
    const rest = cats.filter((_, idx) => idx !== i);
    commit(rest, gone ? [gone] : [], (rest[0]?.[vk] as string) ?? "");
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= cats.length) return;
    const next = [...cats];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-faint">{field.label}</p>
      <div className="space-y-2">
        {cats.map((c, i) => (
          <div key={(c[vk] as string) || i} className="flex items-center gap-1.5">
            <Input
              value={(c[lk] as string) ?? ""}
              placeholder={field.placeholder ?? "اسم القسم"}
              onChange={(e) => rename(i, e.target.value)}
              className="flex-1"
            />
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="p-1 text-faint hover:text-ink disabled:opacity-30 cursor-pointer"
                title="أعلى"
              >
                <ChevronUp className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === cats.length - 1}
                className="p-1 text-faint hover:text-ink disabled:opacity-30 cursor-pointer"
                title="أسفل"
              >
                <ChevronDown className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-1 text-faint hover:text-danger cursor-pointer"
                title="حذف القسم"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-accent cursor-pointer"
      >
        <Plus className="size-4" /> إضافة {field.itemLabel ?? "قسم"}
      </button>
    </div>
  );
}

/** One sub-field inside a list row (no nested lists). */
function ItemField({
  sub,
  value,
  onChange,
  root,
  upload,
}: {
  sub: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  root: Content;
  upload: Upload;
}) {
  const str = typeof value === "string" ? value : "";
  if (sub.type === "image") {
    return (
      <div>
        <p className="mb-1.5 text-xs font-medium text-faint">{sub.label}</p>
        <ImageInput value={str} onChange={onChange} upload={upload} />
      </div>
    );
  }
  if (sub.type === "select") {
    const options = selectOptions(root, sub);
    return (
      <Field label={sub.label}>
        <Select value={str} onChange={(e) => onChange(e.target.value)}>
          <option value="">{sub.placeholder ?? "اختر"}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </Field>
    );
  }
  return (
    <Field label={sub.label}>
      {sub.type === "textarea" ? (
        <Textarea value={str} placeholder={sub.placeholder} rows={2} onChange={(e) => onChange(e.target.value)} />
      ) : sub.type === "phone" ? (
        <PhoneInput value={str} onChange={onChange} placeholder={sub.placeholder} />
      ) : (
        <Input value={str} placeholder={sub.placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

/** Image preview + upload/replace/remove. Uploads to staging, stores the URL. */
function ImageInput({
  value,
  onChange,
  upload,
}: {
  value: string;
  onChange: (url: string) => void;
  upload: Upload;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await upload(file));
    } catch (err) {
      setError(
        err instanceof ApiClientError || err instanceof Error ? err.message : "تعذّر رفع الصورة",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-bg">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- uploaded storage URL preview
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-5 text-faint" />
          )}
          {busy && (
            <span className="absolute inset-0 grid place-items-center bg-surface/70">
              <Loader2 className="size-4 animate-spin text-accent" />
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:border-accent disabled:opacity-50 cursor-pointer"
          >
            {value ? "استبدال" : "رفع صورة"}
          </button>
          {value && (
            <button
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1 text-xs text-faint hover:text-danger cursor-pointer"
            >
              <X className="size-3.5" /> إزالة
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
    </div>
  );
}
