"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, Settings, Check, Plus, ChevronDown } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";

interface WorkspaceLite {
  id: string;
  name: string;
}

export function WorkspaceMenu({
  workspaces,
  activeId,
  isOwner,
}: {
  workspaces: WorkspaceLite[];
  activeId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);

  const active = workspaces.find((w) => w.id === activeId);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function switchTo(id: string) {
    if (id === activeId) { setOpen(false); return; }
    setSwitching(id);
    try {
      await api.post("/api/workspaces/active", { workspaceId: id });
      setOpen(false);
      router.refresh();
    } catch {
      toast("تعذّر التبديل", "error");
    } finally {
      setSwitching(null);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/workspaces", { name: name.trim() });
      setCreateOpen(false);
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "تعذّر الإنشاء");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm transition hover:bg-black/[0.03] cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Store className="size-4 text-muted" />
        <span className="max-w-40 truncate font-medium text-ink">{active?.name ?? "مساحة العمل"}</span>
        <ChevronDown className={cn("size-4 text-faint transition", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute start-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
        >
          <div className="max-h-64 overflow-y-auto p-1">
            <p className="px-3 py-1.5 text-xs font-medium text-faint">مساحات العمل</p>
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => switchTo(w.id)}
                disabled={switching !== null}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink transition hover:bg-black/[0.04] disabled:opacity-60 cursor-pointer"
              >
                <Store className="size-4 text-muted" />
                <span className="flex-1 truncate text-start">{w.name}</span>
                {w.id === activeId && <Check className="size-4 text-accent" />}
              </button>
            ))}
          </div>

          <div className="border-t border-line p-1">
            <button
              onClick={() => { setOpen(false); setCreateOpen(true); }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink transition hover:bg-black/[0.04] cursor-pointer"
            >
              <Plus className="size-4 text-muted" /> مساحة عمل جديدة
            </button>
            {isOwner && (
              <Link
                href="/dashboard/workspace"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink transition hover:bg-black/[0.04]"
              >
                <Settings className="size-4 text-muted" /> إعدادات مساحة العمل
              </Link>
            )}
          </div>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => !busy && setCreateOpen(false)}
        title="مساحة عمل جديدة"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={busy}>إلغاء</Button>
            <Button onClick={create} loading={busy}>إنشاء</Button>
          </>
        }
      >
        <form onSubmit={create}>
          <Field label="اسم مساحة العمل" error={error ?? undefined}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: وكالة النور" autoFocus />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
