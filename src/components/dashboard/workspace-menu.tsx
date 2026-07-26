"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, Check, Plus, ChevronDown, Loader2 } from "lucide-react";
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

// Tinted monogram tints (low chroma, never saturated) — keyed by workspace order
// so each workspace keeps a stable colour. Literal classes for the JIT scanner.
const TINTS = [
  "bg-[oklch(0.93_0.02_262)] text-[oklch(0.38_0.055_262)]",
  "bg-[oklch(0.93_0.02_150)] text-[oklch(0.40_0.06_150)]",
  "bg-[oklch(0.94_0.025_70)] text-[oklch(0.42_0.06_60)]",
  "bg-[oklch(0.93_0.02_20)] text-[oklch(0.45_0.07_25)]",
  "bg-[oklch(0.93_0.015_310)] text-[oklch(0.42_0.05_310)]",
];
const tintFor = (i: number) => TINTS[i % TINTS.length];
const monogram = (name: string) => name.trim().charAt(0) || "؟";

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

  const activeIndex = workspaces.findIndex((w) => w.id === activeId);
  const active = workspaces[activeIndex];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
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
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-2 py-1.5 text-sm transition hover:border-neutral-400 hover:bg-neutral-100 cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md font-display text-[13px] font-bold", tintFor(Math.max(activeIndex, 0)))}>
          {monogram(active?.name ?? "؟")}
        </span>
        <span className="max-w-40 truncate font-medium text-ink">{active?.name ?? "مساحة العمل"}</span>
        <ChevronDown className={cn("size-4 text-faint transition", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute start-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-line bg-surface shadow-lg animate-[fade-down_.14s_ease]"
        >
          <div className="max-h-72 overflow-y-auto p-1.5">
            <p className="px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-faint">مساحات العمل</p>
            {workspaces.map((w, i) => {
              const isActive = w.id === activeId;
              const isSwitching = switching === w.id;
              return (
                <button
                  key={w.id}
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => switchTo(w.id)}
                  disabled={switching !== null}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition disabled:opacity-60 cursor-pointer",
                    isActive ? "bg-accent-50 text-accent-900" : "text-ink hover:bg-neutral-100",
                  )}
                >
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-md font-display text-sm font-bold", tintFor(i))}>
                    {monogram(w.name)}
                  </span>
                  <span className="flex-1 truncate text-start font-medium">{w.name}</span>
                  {isSwitching ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-accent" />
                  ) : isActive ? (
                    <Check className="size-4 shrink-0 text-accent" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="border-t border-line p-1.5">
            <button
              onClick={() => { setOpen(false); setCreateOpen(true); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink transition hover:bg-neutral-100 cursor-pointer"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-dashed border-line text-muted">
                <Plus className="size-4" />
              </span>
              مساحة عمل جديدة
            </button>
            {isOwner && (
              <Link
                href="/dashboard/workspace"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink transition hover:bg-neutral-100"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted">
                  <Settings className="size-4" />
                </span>
                إعدادات مساحة العمل
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
