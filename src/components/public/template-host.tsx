// Renders a site's chosen ready-made template: looks up the template module,
// merges the site's editable content over the template defaults, applies the
// small themeable token overrides (accent/ground/ink + font) on a wrapper, and
// renders the self-contained template component. Shared by the published site,
// the draft preview, and the builder's live preview.

import type { CSSProperties } from "react";
import { getTemplate } from "@/templates/registry";
import { deepMerge } from "@/templates/content";
import { getFont } from "@/lib/palette";
import type { TemplateTheme } from "@/server/sites/template-data";
import { EditProvider } from "@/components/templates/inline-edit";

type TokenColors = Record<string, string | null>;

export function TemplateHost({
  templateKey,
  content,
  theme,
  currency,
  edit,
}: {
  templateKey: string | null;
  content: Record<string, unknown>;
  theme: TemplateTheme;
  currency: string;
  /** Builder only: enables inline editing. Commits call onChange with the next
   *  content. Omitted on the published site → the template renders inert. */
  edit?: { onChange: (next: Record<string, unknown>) => void };
}) {
  const tpl = getTemplate(templateKey);
  if (!tpl) {
    return (
      <div className="grid min-h-dvh place-items-center bg-neutral-100 p-6 text-center text-muted">
        لم يتم اختيار قالب لهذا الموقع بعد.
      </div>
    );
  }

  // Map the site's stored theme colors onto the template's declared tokens by key
  // (accent/ground/ink). Unset → the template's design default.
  const chosen: TokenColors = {
    accent: theme.accent,
    ground: theme.ground,
    ink: theme.ink,
  };
  const style: CSSProperties & Record<string, string> = {};
  for (const tok of tpl.tokens) {
    style[tok.cssVar] = chosen[tok.key] || tok.default;
  }
  if (tpl.themeFont && theme.fontKey) {
    const fam = getFont(theme.fontKey)?.family;
    if (fam) style.fontFamily = fam;
  }

  const merged = deepMerge(tpl.defaults, content);
  const Component = tpl.Component;
  const rendered = <Component {...merged} currency={currency} />;

  // data-theme="light": templates are always light and own their palette; this
  // stops the dashboard's dark chrome from bleeding into the builder preview.
  return (
    // `isolate` gives the template its own stacking context so its internal
    // z-indexes (sticky header, bottom nav, sheet) stay contained and never
    // overlay the dashboard chrome (e.g. the profile dropdown) in the builder.
    <div data-theme="light" data-tpl={templateKey ?? undefined} className="sw-tpl-scope isolate" style={style}>
      {edit ? (
        <EditProvider content={content} onChange={edit.onChange}>
          {rendered}
        </EditProvider>
      ) : (
        rendered
      )}
    </div>
  );
}
