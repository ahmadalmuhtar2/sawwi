"use client";

// Post-creation content editor. Same schema-driven forms as the onboarding
// wizard, plus an appearance tab (the template's themeable tokens + font) and a
// live preview. Autosaves content (debounced) and theme to the server.

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2, Monitor, Smartphone, Rocket, SlidersHorizontal, Pause, Play, Undo2, Redo2, X } from "lucide-react";
import { getTemplate } from "@/templates/registry";
import { deepMerge } from "@/templates/content";
import { FieldForm, uploadStaging } from "./fields";
import { AppearancePanel } from "./editor-shared";
import { ExpiryBanner } from "@/components/dashboard/expiry-banner";
import { TemplateHost } from "@/components/public/template-host";
import type { TemplateTheme } from "@/server/sites/template-data";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

type Content = Record<string, unknown>;
const clone = (v: unknown): Content => JSON.parse(JSON.stringify(v ?? {}));

export function ContentEditor({
  siteId,
  templateKey,
  status,
  currency = "ل.س",
  initialContent,
  initialTheme,
  canManageBilling = false,
  canEditBuilder = true,
  canPublish = true,
  initialMaintenance = false,
}: {
  siteId: string;
  templateKey: string;
  slug: string;
  status: string;
  /** Site's currency SYMBOL (shared source) — appended to preview prices. */
  currency?: string;
  initialContent: Content;
  initialTheme: TemplateTheme;
  /** Admin/reseller can pause public serving (hidden from business owners). */
  canManageBilling?: boolean;
  /** Builder grant: edit appearance (المظهر). Content-only editors lack it. */
  canEditBuilder?: boolean;
  /** Publish/unpublish permission (builder grant for site-scoped collaborators). */
  canPublish?: boolean;
  initialMaintenance?: boolean;
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
  const [published, setPublished] = React.useState(status === "published");
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");
  // Mobile only (< lg): the settings sidebar collapses into a drawer toggled by
  // a small floating button. Purely CSS-gated so it never depends on JS width
  // detection (which proved unreliable across mobile emulators).
  const [panelOpen, setPanelOpen] = React.useState(false);
  // Admin/reseller "pause": serve the branded holding page instead of the site.
  const [maintenance, setMaintenance] = React.useState(initialMaintenance);
  const [pausing, setPausing] = React.useState(false);
  const firstRun = React.useRef(true);

  async function toggleMaintenance() {
    const next = !maintenance;
    setPausing(true);
    try {
      await api.patch(`/api/sites/${siteId}/maintenance`, { on: next });
      setMaintenance(next);
      toast(next ? "تم إيقاف الموقع مؤقتًا — يظهر للزوّار أنه قيد الصيانة" : "تمّت إعادة تشغيل الموقع");
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر تغيير حالة الموقع", "error");
    } finally {
      setPausing(false);
    }
  }

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
      setPublished(true);
      toast("تم نشر الموقع بنجاح", "success");
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر النشر", "error");
    } finally {
      setPublishing(false);
    }
  }

  async function unpublish() {
    setPublishing(true);
    try {
      await api.post(`/api/sites/${siteId}/unpublish`);
      setPublished(false);
      toast("تم إلغاء نشر الموقع — أصبح خارج الخدمة");
    } catch (e) {
      toast(e instanceof ApiClientError ? e.message : "تعذّر إلغاء النشر", "error");
    } finally {
      setPublishing(false);
    }
  }

  if (!tpl) {
    return <p className="p-6 text-center text-muted">قالب غير معروف لهذا الموقع.</p>;
  }

  // Appearance (المظهر) is a builder-grant feature — content-only editors don't see it.
  const tabs = [...tpl.steps.map((s) => s.title), ...(canEditBuilder ? ["المظهر"] : [])];
  const isAppearance = canEditBuilder && tab === tpl.steps.length;
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  // The settings panel (section chips + fields OR appearance) — shared by the
  // desktop sidebar and the mobile drawer so both render identical controls.
  const settingsBody = (
    <>
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
      <div className="flex-1 overflow-y-auto p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
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
    </>
  );

  return (
    <div className="-m-6 flex h-[calc(100dvh-4rem)] flex-col">
      {/* Owner-facing expiry warning (renders only when expiring/expired). */}
      <ExpiryBanner siteId={siteId} />
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
            <Tooltip label="تراجع (Ctrl+Z)">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                aria-label="تراجع"
                className="rounded-md p-1.5 text-muted transition hover:bg-neutral-200 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
              >
                <Undo2 className="size-4" />
              </button>
            </Tooltip>
            <Tooltip label="إعادة (Ctrl+Shift+Z)">
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                aria-label="إعادة"
                className="rounded-md p-1.5 text-muted transition hover:bg-neutral-200 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
              >
                <Redo2 className="size-4" />
              </button>
            </Tooltip>
          </div>
          {canManageBilling && (
            <Tooltip label={maintenance ? "إعادة تشغيل الموقع" : "إيقاف الموقع مؤقتًا (صيانة)"}>
            <button
              onClick={toggleMaintenance}
              disabled={pausing}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition cursor-pointer disabled:opacity-50",
                maintenance
                  ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "border-line text-muted hover:text-ink",
              )}
            >
              {pausing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : maintenance ? (
                <Play className="size-4" />
              ) : (
                <Pause className="size-4" />
              )}
              {maintenance ? "تشغيل" : "إيقاف مؤقت"}
            </button>
            </Tooltip>
          )}
          <Link
            href={`/preview/${siteId}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-muted transition hover:text-ink"
          >
            <Eye className="size-4" /> معاينة
          </Link>
          {canPublish && published && (
            <Tooltip label="إلغاء النشر — إعادة الموقع إلى وضع الإنشاء">
              <button
                onClick={unpublish}
                disabled={publishing}
                className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-muted transition hover:border-danger/40 hover:text-danger disabled:opacity-50 cursor-pointer"
              >
                <EyeOff className="size-4" /> إلغاء النشر
              </button>
            </Tooltip>
          )}
          {canPublish && (
            <button
              onClick={publish}
              disabled={publishing}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:opacity-50 cursor-pointer"
            >
              {publishing ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
              {published ? "إعادة النشر" : "نشر"}
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* editor column — pinned sidebar on desktop; a drawer on mobile (below) */}
        <aside className="hidden w-[380px] shrink-0 flex-col border-e border-line bg-surface lg:flex">
          {settingsBody}
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
                currency={currency}
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
                    currency={currency}
                    edit={{ onChange: applyContent }}
                  />
                </IframeCanvas>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── mobile only (< lg): small button opens the settings drawer ─────── */}
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        className="fixed bottom-4 start-4 z-40 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-accent-700 cursor-pointer lg:hidden"
      >
        <SlidersHorizontal className="size-4" />
        تعديل
      </button>

      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-200 lg:hidden",
          panelOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!panelOpen}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setPanelOpen(false)} />
        <aside
          className={cn(
            "absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-2xl bg-surface shadow-2xl transition-transform duration-300",
            panelOpen ? "translate-y-0" : "translate-y-full",
          )}
          role="dialog"
          aria-modal="true"
          aria-label="تعديل البيانات والمظهر"
        >
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-3">
            <span className="text-sm font-bold text-ink">تعديل البيانات والمظهر</span>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              aria-label="إغلاق"
              className="rounded-md p-1.5 text-muted transition hover:bg-neutral-200 hover:text-ink cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
          {settingsBody}
        </aside>
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
