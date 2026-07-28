"use client";

// Inline visual editing for templates. A template renders the SAME markup on the
// published site and in the builder; these primitives are inert on the published
// site (no provider) and become editable in the builder (wrapped in EditProvider).
//
//   <EditableText path="shop.heroLine" value={shop.heroLine ?? "…"} as="span" .. />
//
// In the builder: hover shows a dashed outline, double-click turns the element
// into a contentEditable field, Enter/blur commits (Escape cancels). Commits
// write to the site's content JSON at `path`; the builder owns undo/redo +
// autosave, so nothing here touches the server or the DB.

import * as React from "react";
import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { setPath } from "@/templates/content";
import { uploadStaging } from "./fields";
import { cn } from "@/lib/cn";

type Content = Record<string, unknown>;

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
/** Map Western digits 0-9 → Arabic-Indic ٠-٩ (the whole site reads in ٠-٩). */
export const toArabicDigits = (s: string) => s.replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);

interface EditApi {
  editing: boolean;
  /** Write a value at a dot-path in the site content (creates the override). */
  set: (path: string, value: unknown) => void;
  /** Write several dot-paths in ONE commit (e.g. drop a category AND its rows). */
  setMany: (updates: Record<string, unknown>) => void;
  /** Remove item `index` from the list at `listPath` (operates on merged data). */
  removeAt: (listPath: string, list: unknown[], index: number) => void;
  /** Append `blank` to the list at `listPath` (operates on merged data). */
  addItem: (listPath: string, list: unknown[], blank: unknown) => void;
}

const EditCtx = React.createContext<EditApi | null>(null);

/** Null on the published site (no provider); the API in the builder. */
export function useEdit(): EditApi | null {
  return React.useContext(EditCtx);
}

/**
 * Editing helpers for a list of records (services, stats, barbers…). Writes the
 * WHOLE array back at `path` on every change — item-level paths can't be used
 * because a list sourced from the template defaults would be partially
 * overwritten (arrays replace wholesale on merge). `editing` gates the add/trash
 * affordances in the template.
 */
export function useEditList<T>(path: string, items: T[]) {
  const api = useEdit();
  return {
    editing: Boolean(api?.editing),
    setField: (index: number, field: string, value: unknown) =>
      api?.set(
        path,
        items.map((it, i) => (i === index ? { ...(it as object), [field]: value } : it)),
      ),
    remove: (index: number) => api?.set(path, items.filter((_, i) => i !== index)),
    add: (blank: T) => api?.set(path, [...items, blank]),
  };
}

/**
 * Same as {@link useEditList} but for a list of plain strings (hygiene rules,
 * etiquette lines…). `setAt` replaces the string at an index; add/remove work on
 * the whole array. Writes the WHOLE array back (same reason as useEditList).
 */
export function useEditStrings(path: string, items: string[]) {
  const api = useEdit();
  return {
    editing: Boolean(api?.editing),
    setAt: (index: number, value: string) =>
      api?.set(path, items.map((it, i) => (i === index ? value : it))),
    remove: (index: number) => api?.set(path, items.filter((_, i) => i !== index)),
    add: (blank: string) => api?.set(path, [...items, blank]),
  };
}

export function EditProvider({
  content,
  onChange,
  children,
}: {
  content: Content;
  onChange: (next: Content) => void;
  children: React.ReactNode;
}) {
  // Recompute when content or onChange changes so the callbacks always close
  // over the current content. Identity changing on content edits is fine — the
  // content changed anyway, so consumers re-render regardless.
  const api = React.useMemo<EditApi>(
    () => ({
      editing: true,
      set: (path, value) => onChange(setPath(content as never, path, value)),
      setMany: (updates) => {
        let next = content;
        for (const [path, value] of Object.entries(updates)) next = setPath(next as never, path, value);
        onChange(next);
      },
      removeAt: (listPath, list, index) =>
        onChange(setPath(content as never, listPath, list.filter((_, i) => i !== index))),
      addItem: (listPath, list, blank) =>
        onChange(setPath(content as never, listPath, [...list, blank])),
    }),
    [onChange, content],
  );

  return <EditCtx.Provider value={api}>{children}</EditCtx.Provider>;
}

/* ─────────────────────────── EditableImage ────────────────────────── */

/**
 * Wraps a rendered image (e.g. the template's <Photo>) with builder-only
 * controls: hover to reveal "change" (upload → staging) and "remove" (clears
 * the path → the template shows its own empty state). Inert on the published
 * site — renders the children unchanged. Place inside a sized element.
 */
export function EditableImage({
  path,
  onChange,
  className,
  children,
}: {
  /** dot-path in content this image writes to (e.g. "shop.heroPhoto") */
  path?: string;
  /** custom write, used instead of `path` (e.g. a list item's photo). */
  onChange?: (url: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const api = useEdit();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const write = onChange ?? (path && api ? (url: string) => api.set(path, url) : undefined);
  if (!api?.editing || !write) return <>{children}</>;

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      write(await uploadStaging(file));
    } catch {
      setError("تعذّر رفع الصورة");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className={cn("group/img relative block touch-manipulation", className)}>
      {children}
      {/* controls: hover-reveal on desktop; always shown (lighter scrim) on
          touch/coarse pointers, since there's no hover to reveal them. */}
      <span className="absolute inset-0 z-20 flex items-center justify-center gap-1.5 bg-black/45 opacity-0 transition-opacity group-hover/img:opacity-100 pointer-coarse:bg-black/25 pointer-coarse:opacity-100">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          title="تغيير الصورة"
          aria-label="تغيير الصورة"
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/95 text-neutral-900 shadow disabled:opacity-70"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
        </button>
        <button
          type="button"
          onClick={() => write("")}
          title="إزالة الصورة"
          aria-label="إزالة الصورة"
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/95 text-red-600 shadow"
        >
          <Trash2 className="size-3.5" />
        </button>
      </span>
      {error && (
        <span className="absolute inset-x-0 bottom-0 z-20 bg-red-600/90 px-2 py-1 text-center text-[11px] text-white">
          {error}
        </span>
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
    </span>
  );
}

/* ─────────────────────────── EditableText ─────────────────────────── */

type TextProps = {
  /** the value to display (already merged over defaults) */
  value: string;
  /** dot-path in content this text writes to, e.g. "shop.heroLine". Omit when
   *  using `onCommit` (e.g. list-item fields that write the whole array). */
  path?: string;
  /** custom write, used instead of `path` (e.g. via useEditList.setField). */
  onCommit?: (text: string) => void;
  /** rendered element (span by default) */
  as?: React.ElementType;
  className?: string;
  /** allow line breaks (Enter inserts a newline instead of committing) */
  multiline?: boolean;
  /** shown faded (and editable) when the value is empty — so optional fields
   *  still have a click target. */
  placeholder?: string;
  /** keep Western digits as typed (e.g. Latin names / URLs). By default any
   *  0-9 the owner types is converted to Arabic-Indic ٠-٩ on commit. */
  keepLatinDigits?: boolean;
};

export function EditableText({ path, value, onCommit, as, className, multiline, placeholder, keepLatinDigits }: TextProps) {
  const api = useEdit();
  const Tag = (as ?? "span") as React.ElementType;
  const write = onCommit ?? (path && api ? (t: string) => api.set(path, t) : undefined);
  // Arabic-first site: normalise typed digits to ٠-٩ unless the field opts out.
  const commit = write && (keepLatinDigits ? write : (t: string) => write(toArabicDigits(t)));
  // Published site (or no writer): render the value, and nothing when empty.
  if (!api?.editing || !commit) return value ? <Tag className={className}>{value}</Tag> : null;
  return (
    <InlineText
      Tag={Tag}
      className={className}
      value={value}
      multiline={multiline ?? false}
      placeholder={placeholder}
      onCommit={commit}
    />
  );
}

function InlineText({
  Tag,
  className,
  value,
  multiline,
  placeholder,
  onCommit,
}: {
  Tag: React.ElementType;
  className?: string;
  value: string;
  multiline: boolean;
  placeholder?: string;
  onCommit: (text: string) => void;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const [active, setActive] = React.useState(false);

  const start = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActive(true);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      if (!value) el.innerText = ""; // clear the placeholder before typing
      el.focus();
      // Use the element's OWN document/window so selection works whether the
      // node lives in the main page (desktop preview) or inside the mobile
      // preview iframe (portaled there).
      const d = el.ownerDocument;
      const range = d.createRange();
      range.selectNodeContents(el);
      const sel = d.defaultView?.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  };

  // Touch/coarse pointers: a single TAP edits (mobile has no reliable
  // double-click, and double-tap zooms). Mouse keeps double-click (below), so
  // desktop text selection isn't hijacked by a stray single click.
  const startTap = (e: React.MouseEvent) => {
    if (active) return;
    const coarse = ref.current?.ownerDocument.defaultView?.matchMedia?.("(pointer: coarse)").matches;
    if (coarse) start(e);
  };

  const commit = () => {
    setActive(false);
    const text = (ref.current?.innerText ?? "").trim();
    if (text !== value) onCommit(text);
    else if (ref.current) ref.current.innerText = value; // restore if unchanged
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (ref.current) ref.current.innerText = value;
      setActive(false);
      ref.current?.blur();
    } else if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      ref.current?.blur();
    }
  };

  const empty = !value && !active;
  return (
    <Tag
      ref={ref}
      // touch-manipulation: kill the browser's double-tap-to-zoom on editable
      // text (mobile) while keeping pinch-zoom + scroll. Single-tap edits (above).
      className={cn(className, "sw-edit touch-manipulation", active && "sw-edit-active", empty && "opacity-45 italic")}
      contentEditable={active}
      suppressContentEditableWarning
      role="textbox"
      title={active ? undefined : "انقر مرتين للتعديل"}
      onClick={startTap}
      onDoubleClick={start}
      onBlur={commit}
      onKeyDown={onKeyDown}
    >
      {value || (active ? "" : placeholder ?? "")}
    </Tag>
  );
}
