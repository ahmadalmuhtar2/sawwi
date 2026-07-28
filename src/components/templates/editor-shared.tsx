"use client";

// Shared building blocks for the content editor's two layouts (desktop two-pane
// and the mobile stacked editor). Keeping the appearance/palette UI and the
// viewport hook here lets both layouts render identical controls without a
// circular import between content-editor.tsx and mobile-content-editor.tsx.

import * as React from "react";
import type { TemplateModule, TemplatePalette } from "@/templates/types";
import type { TemplateTheme } from "@/server/sites/template-data";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/cn";

export const normColor = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim().toLowerCase();

// <input type="color"> only accepts #rrggbb. Pass hex through; if the stored
// value is a non-hex (e.g. an oklch default), fall back to a neutral so the
// swatch still renders (the real default is applied by the template anyway).
export function toHex(v: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : "#2b3a55";
}

/** True below the `lg` breakpoint (phones/small tablets) — picks the mobile
 *  editor layout. Starts false on the server so SSR matches, then syncs on mount. */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

/** One colorway card in the appearance tab (swatch preview + name + mood). The
 *  fill is the template's DOMINANT surface token (`surface`, default "ground"),
 *  and the thin liner is the other of ground/ink — so the swatch reads the same
 *  way the site does (e.g. foul-fatteh previews its cream menu, not the chrome). */
export function PaletteCard({ p, active, onSelect, surface = "ground" }: { p: TemplatePalette; active: boolean; onSelect: () => void; surface?: string }) {
  const fill = p.colors[surface] ?? p.colors.ground;
  const liner = p.colors[surface === "ground" ? "ink" : "ground"] ?? p.colors.ink;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-2.5 text-start transition cursor-pointer",
        active ? "border-accent ring-2 ring-accent/25" : "border-line hover:border-accent/50",
      )}
    >
      <span className="flex h-11 items-center gap-1.5 rounded-md px-2" style={{ background: fill }}>
        <span className="size-5 shrink-0 rounded-full" style={{ background: p.colors.accent }} />
        <span className="h-1.5 flex-1 rounded-full" style={{ background: liner }} />
      </span>
      <span className="flex items-baseline justify-between gap-1">
        <span className="text-[13px] font-semibold text-ink">{p.label}</span>
        {p.mood && <span className="truncate text-[11px] text-faint">{p.mood}</span>}
      </span>
    </button>
  );
}

/** The appearance tab: named palettes (grouped الافتراضي / داكنة / فاتحة) or, when
 *  a template ships no palettes, raw token color pickers. Shared by both layouts. */
export function AppearancePanel({
  tpl,
  theme,
  saveTheme,
}: {
  tpl: TemplateModule;
  theme: TemplateTheme;
  saveTheme: (next: TemplateTheme) => void;
}) {
  if (!tpl.palettes?.length) {
    return (
      <div className="space-y-5">
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
      </div>
    );
  }

  const isActive = (p: TemplatePalette) =>
    tpl.tokens.every(
      (tok) =>
        normColor(theme[tok.key as keyof TemplateTheme] ?? tok.default) ===
        normColor(p.colors[tok.key] ?? tok.default),
    );
  const select = (p: TemplatePalette) =>
    saveTheme({
      ...theme,
      accent: p.colors.accent ?? null,
      ground: p.colors.ground ?? null,
      ink: p.colors.ink ?? null,
    });
  const defaults = tpl.palettes.filter((p) => p.isDefault);
  const groups = [
    { tone: "dark" as const, label: "ألوان داكنة" },
    { tone: "light" as const, label: "ألوان فاتحة" },
  ];

  return (
    <div className="space-y-4">
      {defaults.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">الافتراضي</p>
          <div className="grid grid-cols-2 gap-2.5">
            {defaults.map((p) => (
              <PaletteCard key={p.key} p={p} active={isActive(p)} onSelect={() => select(p)} surface={tpl.surfaceToken} />
            ))}
          </div>
        </div>
      )}
      {groups.map(({ tone, label }) => {
        const list = tpl.palettes!.filter((p) => p.tone === tone && !p.isDefault);
        if (!list.length) return null;
        return (
          <div key={tone}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">{label}</p>
            <div className="grid grid-cols-2 gap-2.5">
              {list.map((p) => (
                <PaletteCard key={p.key} p={p} active={isActive(p)} onSelect={() => select(p)} surface={tpl.surfaceToken} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
