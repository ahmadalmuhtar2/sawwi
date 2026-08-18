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
import { SiteAuthProvider, SiteAuthWidget, type RoleLabels, type SiteUser } from "@/components/public/site-auth";

type TokenColors = Record<string, string | null>;

export function TemplateHost({
  templateKey,
  content,
  theme,
  currency,
  edit,
  listings,
  data,
  slug,
  siteId,
  route,
  logoUrl,
  authEnabled,
  roleLabels,
  initialUser = null,
}: {
  templateKey: string | null;
  content: Record<string, unknown>;
  theme: TemplateTheme;
  currency: string;
  /** Builder only: enables inline editing. Commits call onChange with the next
   *  content. Omitted on the published site → the template renders inert. */
  edit?: { onChange: (next: Record<string, unknown>) => void };
  /** Data-backed templates (marketplace) get their live rows here. Undefined for
   *  content-only templates and for the gallery (→ the template shows its demo). */
  listings?: unknown[];
  /** Template-specific server payload (e.g. the marketplace's filtered results +
   *  facets + parsed URL filters). Opaque to the host; the template narrows it. */
  data?: unknown;
  /** The public slug — forwarded so a template's enquiry form can reach the API. */
  slug?: string;
  /** The Site id — forwarded so a template's form can POST to a site-scoped
   *  endpoint (e.g. /api/sites/[siteId]/submissions). Undefined in the gallery. */
  siteId?: string;
  /** URL path segments after the site root (e.g. ["properties","<id>"]). Only
   *  URL-routed templates (marketplace) read it; others ignore it. Undefined in
   *  the gallery/builder → the template uses its own internal-state navigation. */
  route?: string[];
  /** The site's uploaded logo (Site.logoUrl). Templates that show a brand logo in
   *  their header read it; others ignore it. Undefined in the gallery. */
  logoUrl?: string | null;
  /** End-user auth: when enabled, every template gets the auth context + widget.
   *  Off in the gallery/builder (→ inert). */
  authEnabled?: boolean;
  roleLabels?: Partial<RoleLabels>;
  /** Server-resolved current site-user — seeds the auth context (avoids a gate flash
   *  on auth-first templates). */
  initialUser?: SiteUser | null;
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
  // `listings`/`slug` are extra props only data-backed templates read; others
  // ignore them. `listings` stays undefined for the gallery so those templates
  // fall back to their own demo data.
  const rendered = <Component {...merged} currency={currency} listings={listings} data={data} slug={slug} siteId={siteId} route={route} logoUrl={logoUrl} />;

  // data-theme="light": templates are always light and own their palette; this
  // stops the dashboard's dark chrome from bleeding into the builder preview.
  return (
    // `isolate` gives the template its own stacking context so its internal
    // z-indexes (sticky header, bottom nav, sheet) stay contained and never
    // overlay the dashboard chrome (e.g. the profile dropdown) in the builder.
    <div data-theme="light" data-tpl={templateKey ?? undefined} className="sw-tpl-scope isolate" style={style}>
      {/* Site-user auth wraps every template so any of them can useSiteAuth();
          the floating widget + modal render here too (only when enabled & not in
          the builder). */}
      <SiteAuthProvider enabled={!edit && !!authEnabled} labels={roleLabels} initialUser={initialUser}>
        {edit ? (
          <EditProvider content={content} onChange={edit.onChange}>
            {rendered}
          </EditProvider>
        ) : (
          rendered
        )}
        {/* Floating widget only for templates that DON'T own their auth UI. Auth-first
            templates (marketplace) render their own mandatory gate instead. */}
        {!edit && authEnabled && !tpl.ownsAuthUI ? <SiteAuthWidget /> : null}
      </SiteAuthProvider>
      {/* Platform attribution at the complete bottom of every template — served
          site + draft preview, but NOT the builder (edit) where it'd clutter
          editing. Rendered centrally here so it's automatic for all templates. */}
      {!edit && <PoweredBySawwi />}
    </div>
  );
}

/** A subtle, self-contained "powered by سوّي" footer bar with a clickable link
 *  back to the platform — free advertising on every published customer site. Has
 *  its own light background so it reads under any template's palette. Both the
 *  link and the shown host follow NEXT_PUBLIC_APP_URL (inlined at build), so it
 *  points at whatever domain this deployment serves. */
function PoweredBySawwi() {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://sawwi.online").replace(/\/+$/, "");
  return (
    <div className="w-full border-t border-black/10 bg-white py-3 text-center">
      <a
        href={appUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500 transition hover:text-neutral-800"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
        <img src="/brand/mark-primary.svg" alt="سوّي" width={16} height={16} className="rounded-[4px]" />
        أنشئ موقعك مع <span className="font-semibold text-neutral-700">سوّي</span>
      </a>
    </div>
  );
}
