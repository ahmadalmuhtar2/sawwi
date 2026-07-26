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

type TokenColors = Record<string, string | null>;

export function TemplateHost({
  templateKey,
  content,
  theme,
  currency,
}: {
  templateKey: string | null;
  content: Record<string, unknown>;
  theme: TemplateTheme;
  currency: string;
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

  // data-theme="light": templates are always light and own their palette; this
  // stops the dashboard's dark chrome from bleeding into the builder preview.
  return (
    <div data-theme="light" className="sw-tpl-scope" style={style}>
      <Component {...merged} currency={currency} />
    </div>
  );
}
