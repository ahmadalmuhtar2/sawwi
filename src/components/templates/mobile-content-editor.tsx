"use client";

// Mobile layout for the content editor (rendered below the `lg` breakpoint by
// ContentEditor). The desktop two-pane layout doesn't fit a phone, so here the
// screen shows ONE thing at a time — the live editable preview OR the content
// form — toggled by a bottom bar. All state (content, undo/redo, autosave,
// theme, publish) lives in ContentEditor and is passed down; this file is layout
// only. Inline editing works by TAP on touch (see inline-edit.tsx).

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Eye, Loader2, Pencil, Redo2, Rocket, Undo2 } from "lucide-react";
import { FieldForm, uploadStaging } from "./fields";
import { AppearancePanel } from "./editor-shared";
import { TemplateHost } from "@/components/public/template-host";
import type { TemplateModule } from "@/templates/types";
import type { TemplateTheme } from "@/server/sites/template-data";
import { cn } from "@/lib/cn";

type Content = Record<string, unknown>;

export interface EditorLayoutProps {
  tpl: TemplateModule;
  siteId: string;
  templateKey: string;
  tabs: string[];
  tab: number;
  setTab: (i: number) => void;
  isAppearance: boolean;
  content: Content;
  applyContent: (next: Content) => void;
  theme: TemplateTheme;
  saveTheme: (next: TemplateTheme) => void;
  saving: boolean;
  saved: boolean;
  publish: () => void;
  publishing: boolean;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function MobileContentEditor({
  tpl,
  templateKey,
  tabs,
  tab,
  setTab,
  isAppearance,
  content,
  applyContent,
  theme,
  saveTheme,
  saving,
  saved,
  publish,
  publishing,
  undo,
  redo,
  canUndo,
  canRedo,
}: EditorLayoutProps) {
  const [mode, setMode] = React.useState<"preview" | "edit">("preview");

  return (
    <div className="-m-6 flex h-[calc(100dvh-4rem)] flex-col bg-neutral-100">
      {/* top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/dashboard/sites" aria-label="رجوع" className="shrink-0 text-muted hover:text-ink">
            <ArrowRight className="size-5" />
          </Link>
          <span className="truncate text-sm font-bold text-ink">{tpl.label}</span>
          <span className="shrink-0 text-[11px] text-faint">
            {saving ? "جارٍ الحفظ…" : saved ? "تم الحفظ" : "…"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            aria-label="تراجع"
            className="rounded-md p-1.5 text-muted transition hover:bg-neutral-200 hover:text-ink disabled:opacity-30 cursor-pointer disabled:cursor-default"
          >
            <Undo2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            aria-label="إعادة"
            className="rounded-md p-1.5 text-muted transition hover:bg-neutral-200 hover:text-ink disabled:opacity-30 cursor-pointer disabled:cursor-default"
          >
            <Redo2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={publishing}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-700 disabled:opacity-50 cursor-pointer"
          >
            {publishing ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
            نشر
          </button>
        </div>
      </div>

      {/* body — preview OR the content form (one at a time) */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {mode === "preview" ? (
          <div className="flex h-full flex-col">
            <p className="shrink-0 border-b border-line bg-surface px-3 py-1.5 text-center text-[11px] text-faint">
              ✎ انقر على أي نص لتعديله · اضغط صورة لتغييرها
            </p>
            {/* the phone IS mobile-width, so the template renders its own mobile
                layout directly — no iframe needed. Live + inline-editable. */}
            <div className="sw-no-scrollbar min-h-0 flex-1 touch-manipulation overflow-y-auto bg-white">
              <TemplateHost
                templateKey={templateKey}
                content={content}
                theme={theme}
                currency="ل.س"
                edit={{ onChange: applyContent }}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col bg-surface">
            {/* step chips (scroll horizontally) */}
            <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-line p-3 [-webkit-overflow-scrolling:touch]">
              {tabs.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(i)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer",
                    i === tab ? "bg-accent-100 text-accent-900" : "text-muted hover:bg-neutral-200 hover:text-ink",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-8">
              {isAppearance ? (
                <AppearancePanel tpl={tpl} theme={theme} saveTheme={saveTheme} />
              ) : (
                <FieldForm
                  fields={tpl.steps[tab].fields}
                  content={content}
                  onChange={applyContent}
                  upload={uploadStaging}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* bottom mode switch */}
      <div className="flex shrink-0 items-stretch border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={() => setMode("preview")}
          aria-current={mode === "preview"}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition cursor-pointer",
            mode === "preview" ? "text-accent" : "text-muted",
          )}
        >
          <Eye className="size-5" /> المعاينة
        </button>
        <button
          type="button"
          onClick={() => setMode("edit")}
          aria-current={mode === "edit"}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition cursor-pointer",
            mode === "edit" ? "text-accent" : "text-muted",
          )}
        >
          <Pencil className="size-5" /> المحتوى
        </button>
      </div>
    </div>
  );
}
