"use client";

import { useState } from "react";
import { Trash2, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";

export interface ContentFieldDef {
  key: string;
  label: string;
  textarea?: boolean;
  placeholder?: string;
  required?: boolean;
}

type Item = { id: string } & Record<string, unknown>;
type Values = Record<string, string>;

/**
 * One reusable CRUD editor for every structured-content type (services, team,
 * testimonials, faq). They all share the `/api/sites/:id/content/:type` API, so
 * a single field-config-driven component covers all four.
 */
export function ContentListEditor({
  siteId,
  type,
  fields,
  initial,
  itemNoun,
  addLabel,
}: {
  siteId: string;
  type: string;
  fields: ContentFieldDef[];
  initial: Item[];
  itemNoun: string;
  addLabel: string;
}) {
  const toast = useToast();
  const [items, setItems] = useState<Item[]>(initial);
  const [draft, setDraft] = useState<Values>({});
  const [adding, setAdding] = useState(false);
  const base = `/api/sites/${siteId}/content/${type}`;

  const missingRequired = fields.some((f) => f.required && !draft[f.key]?.trim());

  async function add() {
    if (missingRequired) return;
    setAdding(true);
    try {
      const payload = Object.fromEntries(
        fields.map((f) => [f.key, draft[f.key]?.trim() || undefined]),
      );
      const created = await api.post<Item>(base, payload);
      setItems((prev) => [...prev, created]);
      setDraft({});
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّرت الإضافة", "error");
    }
    setAdding(false);
  }

  async function remove(id: string) {
    const prev = items;
    setItems((cur) => cur.filter((x) => x.id !== id));
    try {
      await api.del(`${base}/${id}`);
    } catch {
      setItems(prev);
      toast("تعذّر الحذف", "error");
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = items.findIndex((x) => x.id === id);
    const to = idx + dir;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[idx], next[to]] = [next[to], next[idx]];
    setItems(next);
    try {
      await api.put(`${base}/reorder`, { orderedIds: next.map((x) => x.id) });
    } catch {
      setItems(items);
      toast("تعذّر إعادة الترتيب", "error");
    }
  }

  function patchItem(id: string, next: Item) {
    setItems((prev) => prev.map((x) => (x.id === id ? next : x)));
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <ItemRow
          key={item.id}
          base={base}
          fields={fields}
          item={item}
          first={i === 0}
          last={i === items.length - 1}
          onMove={move}
          onRemove={remove}
          onSaved={patchItem}
        />
      ))}
      {items.length === 0 && (
        <p className="rounded-lg border border-dashed border-line py-8 text-center text-sm text-faint">
          لا {itemNoun} بعد — أضِف الأول أدناه.
        </p>
      )}

      {/* Add new */}
      <div className="rounded-lg border border-line bg-bg/40 p-4">
        <p className="mb-3 text-sm font-bold text-ink">{addLabel}</p>
        <div className="space-y-3">
          {fields.map((f) => (
            <Field key={f.key} label={f.label + (f.required ? " *" : "")}>
              {f.textarea ? (
                <Textarea
                  value={draft[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                />
              ) : (
                <Input
                  value={draft[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                />
              )}
            </Field>
          ))}
          <Button onClick={add} loading={adding} disabled={missingRequired} className="gap-1.5">
            <Plus className="size-4" /> إضافة
          </Button>
        </div>
      </div>
    </div>
  );
}

function ItemRow({
  base,
  fields,
  item,
  first,
  last,
  onMove,
  onRemove,
  onSaved,
}: {
  base: string;
  fields: ContentFieldDef[];
  item: Item;
  first: boolean;
  last: boolean;
  onMove: (id: string, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
  onSaved: (id: string, next: Item) => void;
}) {
  const toast = useToast();
  const [values, setValues] = useState<Values>(() =>
    Object.fromEntries(fields.map((f) => [f.key, (item[f.key] as string) ?? ""])),
  );
  const [saving, setSaving] = useState(false);

  const dirty = fields.some((f) => (values[f.key] ?? "") !== ((item[f.key] as string) ?? ""));
  const invalid = fields.some((f) => f.required && !values[f.key]?.trim());

  async function save() {
    if (invalid) return;
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        fields.map((f) => [f.key, values[f.key]?.trim() || null]),
      );
      await api.put(`${base}/${item.id}`, payload);
      onSaved(item.id, { ...item, ...payload });
      toast("تم الحفظ ✓");
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر الحفظ", "error");
    }
    setSaving(false);
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <button
            onClick={() => onMove(item.id, -1)}
            disabled={first}
            className="text-faint hover:text-ink disabled:opacity-25"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            onClick={() => onMove(item.id, 1)}
            disabled={last}
            className="text-faint hover:text-ink disabled:opacity-25"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="text-faint transition hover:text-danger"
          title="حذف"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="space-y-3">
        {fields.map((f) => (
          <Field key={f.key} label={f.label}>
            {f.textarea ? (
              <Textarea
                value={values[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            ) : (
              <Input
                value={values[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            )}
          </Field>
        ))}
      </div>
      <div className={cn("mt-3 flex justify-end transition", !dirty && "opacity-0 pointer-events-none")}>
        <Button size="sm" onClick={save} loading={saving} disabled={invalid}>
          حفظ
        </Button>
      </div>
    </div>
  );
}
