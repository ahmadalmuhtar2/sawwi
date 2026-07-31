"use client";

// Shared mk-styled form primitives for the marketplace's on-site authoring (the
// seller stepper + the manager admin): the schema-driven Field renderer, the photo
// uploader, a labelled Row, and a small modal. One implementation so the seller and
// admin flows look and behave identically. Colors come from the mk-* tokens.

import * as React from "react";
import type { FieldDef } from "./schema";
import { modelsForMake } from "./car-data";
import { adminApi } from "./admin-client";
import { MkSelect } from "./mk-select";

// Display = Cairo (headings/prices); "MONO" now names the small-label sans (Readex)
// — the mono-Arabic look was dropped for a cleaner, more professional feel.
export const DISPLAY = "var(--font-mk-display, 'Cairo Variable', system-ui, sans-serif)";
export const MONO = "var(--font-mk-label, 'Readex Pro Variable', system-ui, sans-serif)";

export const inputCls =
  "h-11 w-full rounded-[10px] border border-mk-line bg-mk-surface px-3.5 text-[14.5px] text-mk-ink outline-none transition focus:border-mk-accent";
export const btnPrimary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-mk-accent px-4 text-[14px] font-semibold text-white shadow-sm transition hover:bg-mk-strong disabled:opacity-60";
export const btnGhost =
  "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-mk-line bg-mk-surface px-3.5 text-[13.5px] font-semibold text-mk-ink transition hover:bg-mk-track disabled:opacity-50";

export type FormMap = Record<string, string | string[]>;

export type MkTheme = "light" | "dark";

/** The light/dark switch shown in the header + seller area. Presentational — the
 *  state + persistence live at the template root (data-mk-theme drives the tokens). */
export function ThemeToggle({ theme, onToggle }: { theme: MkTheme; onToggle: () => void }) {
  const label = theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن";
  return (
    <button type="button" onClick={onToggle} aria-label={label} title={label} className="inline-flex size-10 items-center justify-center rounded-[10px] border border-mk-line bg-mk-surface text-[15px] text-mk-ink transition hover:bg-mk-track">
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}

export function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] text-mk-faint" style={{ fontFamily: MONO }}>{label}</span>
      {children}
      {hint && <span className="text-[11.5px] text-mk-faint">{hint}</span>}
    </div>
  );
}

/** One schema field rendered by its type (text/number/select/chips/multi/area/phone/photos). */
export function Field({ fd, value, onChange, currency, invalid, form }: {
  fd: FieldDef;
  value: string | string[] | undefined;
  onChange: (v: string | string[] | null) => void;
  currency: string;
  invalid?: boolean;
  /** The whole form map — only needed for fields whose options depend on another
   *  field (e.g. model ← make). */
  form?: FormMap;
}) {
  const label = fd.label + (fd.req ? " *" : "");
  const s = typeof value === "string" ? value : "";
  const arr = Array.isArray(value) ? value : [];
  const ring = invalid ? " border-mk-danger" : "";

  if (fd.type === "photos") return <Row label={label} hint={fd.hint}><PhotoField value={arr} onChange={(v) => onChange(v.length ? v : null)} /></Row>;
  if (fd.type === "area")
    return <Row label={label} hint={fd.hint}><textarea value={s} onChange={(e) => onChange(e.target.value || null)} rows={3} placeholder={fd.placeholder} maxLength={4000} className={"resize-none rounded-[10px] border border-mk-line bg-mk-surface px-3.5 py-2.5 text-[14.5px] text-mk-ink outline-none focus:border-mk-accent" + ring} /></Row>;
  // A select whose options depend on another field (model ← make): a native
  // dropdown just like the make select, with a "طراز آخر…" escape that reveals a
  // text input so an unlisted model can still be entered.
  if (fd.type === "select" && fd.depends) {
    const dep = typeof form?.[fd.depends] === "string" ? (form[fd.depends] as string) : "";
    return (
      <Row label={label} hint={fd.hint}>
        <DependentSelect fd={fd} value={s} dep={dep} onChange={onChange} ring={ring} />
      </Row>
    );
  }
  if (fd.type === "select")
    return (
      <Row label={label} hint={fd.hint}>
        <MkSelect
          value={s || null}
          onChange={(v) => onChange(v)}
          options={(fd.opts ?? []).map((o) => ({ value: o, label: o }))}
          placeholder={fd.placeholder || "اختر"}
          invalid={invalid}
          triggerClass={inputCls}
        />
      </Row>
    );
  if (fd.type === "chips" || fd.type === "multi") {
    const multi = fd.type === "multi";
    const on = (o: string) => (multi ? arr.includes(o) : s === o);
    const toggle = (o: string) => {
      if (multi) { const next = arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o]; onChange(next.length ? next : null); }
      else onChange(s === o ? null : o);
    };
    return (
      <Row label={label} hint={fd.hint}>
        <span className="flex flex-wrap gap-1.5">
          {fd.opts?.map((o) => (
            <button key={o} type="button" onClick={() => toggle(o)} className={"h-9 rounded-full px-3.5 text-[13px] font-medium transition " + (on(o) ? "border border-mk-accent/30 bg-mk-soft text-mk-strong" : "border border-mk-line bg-mk-surface text-mk-muted hover:text-mk-ink")}>{o}</button>
          ))}
        </span>
      </Row>
    );
  }
  // text · number · phone
  const isNum = fd.type === "number";
  // Numeric/phone inputs read LTR; the wrapper matches so the unit label sits at
  // the input's inline-end (same side as the padding) instead of overlapping the
  // LTR placeholder. Longer units (e.g. "ل/١٠٠كم") get extra padding.
  const ltr = isNum || fd.type === "phone";
  const unitLabel = fd.unit === "" ? currency : fd.unit;
  const pad = unitLabel ? (unitLabel.length > 3 ? " pe-[4.75rem]" : " pe-14") : "";
  return (
    <Row label={label} hint={fd.hint}>
      <span dir={ltr ? "ltr" : undefined} className="relative flex items-center">
        <input
          value={s}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={fd.placeholder}
          inputMode={isNum ? "decimal" : fd.type === "phone" ? "tel" : undefined}
          dir={ltr ? "ltr" : undefined}
          maxLength={fd.type === "phone" ? 30 : 140}
          className={inputCls + pad + ring}
        />
        {unitLabel && <span className="pointer-events-none absolute end-3 text-[12px] text-mk-faint" style={{ fontFamily: MONO }}>{unitLabel}</span>}
      </span>
    </Row>
  );
}

/** The dependent model dropdown: same MkSelect look as the make field.
 *  Options come from the chosen make; a trailing "طراز آخر…" reveals a free-text
 *  input so an unlisted model still works. When the make has no known model list
 *  (or "أخرى"), it degrades to a plain text input. */
function DependentSelect({ fd, value, dep, onChange, ring }: {
  fd: FieldDef;
  value: string;
  dep: string;
  onChange: (v: string | null) => void;
  ring: string;
}) {
  const opts = modelsForMake(dep);
  const OTHER = "__other__";
  const [other, setOther] = React.useState(() => !!value && !opts.includes(value));

  React.useEffect(() => {
    // Reset the manual "other" toggle whenever the parent (make) changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting on a dependency change
    setOther(false);
  }, [dep]);

  if (!dep) {
    return (
      <MkSelect value={null} onChange={() => {}} options={[]} placeholder="اختر الشركة أولاً" disabled triggerClass={inputCls} />
    );
  }
  if (opts.length === 0) {
    return <input value={value} onChange={(e) => onChange(e.target.value || null)} placeholder={fd.placeholder} maxLength={140} className={inputCls + ring} />;
  }

  const usingOther = other || (!!value && !opts.includes(value));
  return (
    <>
      <MkSelect
        value={usingOther ? OTHER : (value || null)}
        onChange={(v) => {
          if (v === OTHER) { setOther(true); onChange(null); }
          else { setOther(false); onChange(v); }
        }}
        options={[...opts.map((o) => ({ value: o, label: o })), { value: OTHER, label: "طراز آخر…" }]}
        placeholder={fd.placeholder || "اختر"}
        invalid={!!ring}
        triggerClass={inputCls}
      />
      {usingOther && (
        <input value={value} onChange={(e) => onChange(e.target.value || null)} placeholder="اكتب الطراز" maxLength={140} className={inputCls + " mt-2" + ring} />
      )}
    </>
  );
}

export function PhotoField({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setErr(null);
    const urls = [...value];
    try {
      for (const f of Array.from(files).slice(0, 12 - value.length)) urls.push(await adminApi.uploadImage(f));
      onChange(urls);
    } catch (e) { setErr(e instanceof Error ? e.message : "تعذّر الرفع"); }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2.5">
        {value.map((src, i) => (
          <span key={i} className="relative size-20 overflow-hidden rounded-[10px] border border-mk-line-soft">
            {/* eslint-disable-next-line @next/next/no-img-element -- uploaded storage URL */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute end-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-[11px] text-white">✕</button>
            {i === 0 && <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[10px] text-white">الغلاف</span>}
          </span>
        ))}
        {value.length < 12 && (
          <label className="flex size-20 cursor-pointer items-center justify-center rounded-[10px] border border-dashed border-mk-line text-[13px] text-mk-muted hover:border-mk-accent hover:text-mk-strong">
            {busy ? "…" : "+ صورة"}
            <input type="file" accept="image/*" multiple onChange={(e) => add(e.target.files)} className="hidden" />
          </label>
        )}
      </div>
      {err && <span className="text-[12px] text-mk-danger">{err}</span>}
    </div>
  );
}

export function MkModal({ title, children, footer, onClose }: {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[400px] overflow-hidden rounded-2xl bg-mk-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-mk-line-soft px-5 py-3.5">
          <span className="text-[16px] font-semibold text-mk-ink">{title}</span>
          <button onClick={onClose} aria-label="إغلاق" className="rounded-md p-1 text-mk-muted hover:text-mk-ink">✕</button>
        </div>
        <div className="px-5 py-4">{children}</div>
        <div className="flex items-center justify-end gap-2.5 border-t border-mk-line-soft px-5 py-3.5">{footer}</div>
      </div>
    </div>
  );
}
