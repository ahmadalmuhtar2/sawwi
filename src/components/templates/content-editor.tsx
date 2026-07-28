"use client";

// Post-creation content editor. Same schema-driven forms as the onboarding
// wizard, plus an appearance tab (the template's themeable tokens + font) and a
// live preview. Autosaves content (debounced) and theme to the server.

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, Eye, Loader2, Monitor, Smartphone, Rocket, Undo2, Redo2 } from "lucide-react";
import { getTemplate } from "@/templates/registry";
import { deepMerge } from "@/templates/content";
import { FieldForm, uploadStaging } from "./fields";
import { AppearancePanel, useIsMobile } from "./editor-shared";
import { MobileContentEditor } from "./mobile-content-editor";
import { TemplateHost } from "@/components/public/template-host";
import type { TemplateTheme } from "@/server/sites/template-data";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

type Content = Record<string, unknown>;
const clone = (v: unknown): Content => JSON.parse(JSON.stringify(v ?? {}));

export function ContentEditor({
  siteId,
  templateKey,
  initialContent,
  initialTheme,
}: {
  siteId: string;
  templateKey: string;
  slug: string;
  status: string;
  initialContent: Content;
  initialTheme: TemplateTheme;
}) {
  const tpl = getTemplate(templateKey);
  const toast = useToast();
  const [content, setContent] = React.useState<Content>(() =>
    tpl ? deepMerge(clone(tpl.defaults), initialContent) : clone(initialContent),
  );
  const [theme, setTheme] = React.useState<TemplateTheme>(initialTheme);
  const [tab, setTab] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(true);
  const [publishing, setPublishing] = React.useState(false);
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");
  const isMobile = useIsMobile();
  const firstRun = React.useRef(true);

  // In-session undo/redo. History holds content snapshots; every edit (inline or
  // side-panel) goes through applyContent so it can be undone. The callbacks
  // close over the current `content`; a state bump re-renders so the buttons'
  // enabled state and the live preview reflect the change.
  const [past, setPast] = React.useState<Content[]>([]);
  const [future, setFuture] = React.useState<Content[]>([]);

  const applyContent = (next: Content) => {
    setPast((p) => [...p, content].slice(-100));
    setFuture([]);
    setContent(next);
  };
  const undo = () => {
    if (past.length === 0) return;
    setContent(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [...f, content]);
  };
  const redo = () => {
    if (future.length === 0) return;
    setContent(future[future.length - 1]);
    setFuture((f) => f.slice(0, -1));
    setPast((p) => [...p, content]);
  };

  // Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl+Y redo — unless a text field is
  // focused (then the browser's own field-level undo applies). A ref holds the
  // latest handlers so the listener subscribes once.
  const histRef = React.useRef({ undo, redo });
  React.useEffect(() => {
    histRef.current = { undo, redo };
  });
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if ((e.target as HTMLElement | null)?.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        histRef.current.undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        histRef.current.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced content autosave.
  React.useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setSaved(false);
    setSaving(true);
    const t = setTimeout(async () => {
      try {
        await api.put(`/api/sites/${siteId}/content`, content);
        setSaved(true);
      } catch {
        /* keep dirty; a later edit retries */
      } finally {
        setSaving(false);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [content, siteId]);

  async function saveTheme(next: TemplateTheme) {
    setTheme(next);
    try {
      await api.put(`/api/sites/${siteId}/theme`, {
        primaryColor: next.accent,
        bgColor: next.ground,
        secondaryColor: next.ink,
        fontKey: next.fontKey ?? "readex",
      });
    } catch {
      /* non-blocking */
    }
  }

  async function publish() {
    setPublishing(true);
    try {
      await api.post(`/api/sites/${siteId}/publish`);
      toast("تم نشر الموقع بنجاح", "success");
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر النشر", "error");
    } finally {
      setPublishing(false);
    }
  }

  if (!tpl) {
    return <p className="p-6 text-center text-muted">قالب غير معروف لهذا الموقع.</p>;
  }

  const tabs = [...tpl.steps.map((s) => s.title), "المظهر"];
  const isAppearance = tab === tpl.steps.length;
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  // Below `lg` the two-pane layout doesn't fit — hand off to the mobile editor
  // (same state + callbacks, phone-friendly one-pane layout).
  if (isMobile) {
    return (
      <MobileContentEditor
        tpl={tpl}
        siteId={siteId}
        templateKey={templateKey}
        tabs={tabs}
        tab={tab}
        setTab={setTab}
        isAppearance={isAppearance}
        content={content}
        applyContent={applyContent}
        theme={theme}
        saveTheme={saveTheme}
        saving={saving}
        saved={saved}
        publish={publish}
        publishing={publishing}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    );
  }

  return (
    <div className="-m-6 flex h-[calc(100dvh-4rem)] flex-col">
      {/* top bar */}
      <div className="flex h-14 items-center justify-between gap-3 border-b border-line bg-surface px-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/sites" className="text-muted hover:text-ink">
            <ArrowRight className="size-5" />
          </Link>
          <span className="text-sm font-bold text-ink">{tpl.label}</span>
          <span className="text-xs text-faint">
            {saving ? "جارٍ الحفظ…" : saved ? "تم الحفظ" : "…"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 pe-1">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              title="تراجع (Ctrl+Z)"
              aria-label="تراجع"
              className="rounded-md p-1.5 text-muted transition hover:bg-neutral-200 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
            >
              <Undo2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              title="إعادة (Ctrl+Shift+Z)"
              aria-label="إعادة"
              className="rounded-md p-1.5 text-muted transition hover:bg-neutral-200 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
            >
              <Redo2 className="size-4" />
            </button>
          </div>
          <Link
            href={`/preview/${siteId}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-muted transition hover:text-ink"
          >
            <Eye className="size-4" /> معاينة
          </Link>
          <button
            onClick={publish}
            disabled={publishing}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:opacity-50 cursor-pointer"
          >
            {publishing ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
            نشر
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* editor column */}
        <aside className="flex w-[380px] shrink-0 flex-col border-e border-line bg-surface">
          <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer",
                  i === tab ? "bg-accent-100 text-accent-900" : "text-muted hover:bg-neutral-200 hover:text-ink",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
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
        </aside>

        {/* live preview with a device toggle */}
        <div className="flex min-w-0 flex-1 flex-col bg-neutral-100">
          <div className="flex items-center gap-2 border-b border-line bg-surface px-3 py-2">
            <span className="inline-flex items-center gap-1 rounded-lg border border-line bg-neutral-100 p-1">
              <button type="button" onClick={() => setDevice("desktop")} aria-pressed={device === "desktop"}
                className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer",
                  device === "desktop" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}>
                <Monitor className="size-4" /> كمبيوتر
              </button>
              <button type="button" onClick={() => setDevice("mobile")} aria-pressed={device === "mobile"}
                className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer",
                  device === "mobile" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}>
                <Smartphone className="size-4" /> موبايل
              </button>
            </span>
            <span className="text-[11px] text-faint">✎ انقر مرتين على أي نص لتعديله</span>
          </div>

          {device === "desktop" ? (
            // inline, live (instant), and INLINE-EDITABLE — double-click text in the
            // preview to edit it in place. Always desktop layout (viewport width).
            <div className="sw-no-scrollbar min-w-0 flex-1 overflow-y-auto">
              <TemplateHost
                templateKey={templateKey}
                content={content}
                theme={theme}
                currency="ل.س"
                edit={{ onChange: applyContent }}
              />
            </div>
          ) : (
            // iframe → REAL mobile viewport (so `lg:` breakpoints go phone), but
            // the editable TemplateHost is portaled INTO it — same live, inline-
            // editable tree as desktop, not the static /preview page. The phone
            // fills the height so only the site inside it scrolls.
            <div className="flex min-h-0 flex-1 items-center justify-center p-4">
              <div className="flex h-full max-h-195 w-97.5 max-w-full overflow-hidden rounded-[28px] border-4 border-ink bg-white shadow-xl">
                <IframeCanvas title="معاينة الجوال" className="size-full border-0 bg-white">
                  <TemplateHost
                    templateKey={templateKey}
                    content={content}
                    theme={theme}
                    currency="ل.س"
                    edit={{ onChange: applyContent }}
                  />
                </IframeCanvas>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * A same-origin iframe that gives its contents a REAL narrow viewport (so the
 * template's responsive `lg:` breakpoints switch to the phone layout), while
 * rendering `children` INTO it via a portal — so the mobile preview is the same
 * live, inline-EDITABLE React tree as desktop (not the static /preview page).
 * The app's stylesheets are cloned into the frame so utilities/fonts apply.
 */
function IframeCanvas({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  const [doc, setDoc] = React.useState<Document | null>(null);

  // Prepare the frame's own document (RTL, no margin) and clone the parent's
  // styles into it (Turbopack <style> in dev, <link> in prod) so utilities and
  // @font-face apply. Works on the LOCAL document from the event/ref, never the
  // state value, then publishes it as the portal target.
  const mount = React.useCallback((d: Document | null | undefined) => {
    if (!d || d === doc) return;
    d.documentElement.setAttribute("dir", "rtl");
    d.documentElement.setAttribute("lang", "ar");
    d.body.style.margin = "0";
    d.head.querySelectorAll("[data-cloned]").forEach((n) => n.remove());
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.setAttribute("data-cloned", "");
      d.head.appendChild(clone);
    });
    setDoc(d);
  }, [doc]);

  return (
    <iframe
      ref={(el) => mount(el?.contentDocument)}
      onLoad={(e) => mount(e.currentTarget.contentDocument)}
      title={title}
      className={className}
    >
      {doc ? createPortal(children, doc.body) : null}
    </iframe>
  );
}
