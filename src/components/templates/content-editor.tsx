"use client";

// Post-creation content editor. Same schema-driven forms as the onboarding
// wizard, plus an appearance tab (the template's themeable tokens + font) and a
// live preview. Autosaves content (debounced) and theme to the server.

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Eye, Loader2, Monitor, RotateCw, Smartphone, Rocket } from "lucide-react";
import { getTemplate } from "@/templates/registry";
import { deepMerge } from "@/templates/content";
import { FieldForm, uploadStaging } from "./fields";
import { TemplateHost } from "@/components/public/template-host";
import type { TemplateTheme } from "@/server/sites/template-data";
import { api, ApiClientError } from "@/lib/api-client";
import { Field, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { FONTS } from "@/lib/palette";
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
  // Bumped after each successful autosave → reloads the mobile preview iframe so
  // it reflects the latest draft (the iframe reads the saved draft, not the live
  // in-memory content the desktop inline preview uses).
  const [rev, setRev] = React.useState(0);
  const firstRun = React.useRef(true);

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
        setRev((r) => r + 1);
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
  const preview = deepMerge(tpl.defaults, content);

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
              <div className="space-y-4">
                {tpl.tokens.map((tok) => (
                  <Field key={tok.key} label={tok.label}>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={toHex((theme[tok.key as keyof TemplateTheme] as string) || tok.default)}
                        onChange={(e) => saveTheme({ ...theme, [tok.key]: e.target.value })}
                        className="size-9 shrink-0 cursor-pointer rounded-md border border-line bg-surface p-0.5"
                      />
                      <button
                        onClick={() => saveTheme({ ...theme, [tok.key]: null })}
                        className="text-xs text-faint hover:text-ink cursor-pointer"
                      >
                        الافتراضي
                      </button>
                    </div>
                  </Field>
                ))}
                {tpl.themeFont && (
                  <Field label="الخط">
                    <Select
                      value={theme.fontKey ?? "readex"}
                      onChange={(e) => saveTheme({ ...theme, fontKey: e.target.value })}
                    >
                      {FONTS.map((f) => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </Select>
                  </Field>
                )}
              </div>
            ) : (
              <FieldForm
                fields={tpl.steps[tab].fields}
                content={content}
                onChange={setContent}
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
            {device === "mobile" && (
              <>
                <span className="text-[11px] text-faint">تعرض آخر نسخة محفوظة</span>
                <button type="button" onClick={() => setRev((r) => r + 1)} title="تحديث المعاينة"
                  className="ms-auto inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-muted hover:text-ink cursor-pointer">
                  <RotateCw className="size-3.5" /> تحديث
                </button>
              </>
            )}
          </div>

          {device === "desktop" ? (
            // inline, live (instant) — but always desktop layout (viewport width)
            <div className="sw-no-scrollbar min-w-0 flex-1 overflow-y-auto">
              <TemplateHost templateKey={templateKey} content={preview} theme={theme} currency="ل.س" />
            </div>
          ) : (
            // iframe → real mobile layout (its own viewport); reads the saved
            // draft. The phone fills the available height so the OUTER panel never
            // scrolls — only the site inside the phone does.
            <div className="flex min-h-0 flex-1 items-center justify-center p-4">
              <div className="flex h-full max-h-195 w-97.5 max-w-full overflow-hidden rounded-[28px] border-4 border-ink bg-black shadow-xl">
                <iframe
                  key={rev}
                  src={`/preview/${siteId}`}
                  title="معاينة الجوال"
                  className="size-full border-0 bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// <input type="color"> only accepts #rrggbb. Pass hex through; if the stored
// value is a non-hex (e.g. an oklch default), fall back to a neutral so the
// swatch still renders (the real default is applied by the template anyway).
function toHex(v: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : "#2b3a55";
}
