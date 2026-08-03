// The template contract. A "template" is a ready-made, self-contained design
// (one React component + its own curated look) plus a declarative description of
// the few things a shop owner fills in. That description drives BOTH the
// onboarding wizard (pre-creation) and the post-creation content editor — add a
// template, get both surfaces for free, with zero editor code.
//
// Split (see any template module): FROZEN house content lives inside the
// component; the EDITABLE data is a plain JSON object whose shape is `defaults`.
// Because it's plain JSON it serializes straight to localStorage (wizard
// autosave) and to Site.content (persisted).

import type * as React from "react";

/** A single editable field. `image` stores a storage URL; `list` is a repeatable
 *  record whose per-row fields are `item`; `select` is a dropdown whose options
 *  come from a sibling list in the content (see `optionsFrom`). Keys are relative
 *  to their container (top level for a step field; item-relative for a list's
 *  item fields). */
export type FieldType = "text" | "textarea" | "phone" | "image" | "list" | "select" | "categories" | "weekhours";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  /** render the input left-to-right (URLs, latin handles) even in the RTL form. */
  ltr?: boolean;
  /** list only */
  itemLabel?: string;
  item?: FieldDef[];
  min?: number;
  max?: number;
  /** list only: a blank row template appended on "add" */
  blank?: Record<string, unknown>;
  /** select only: a top-level content key holding the option list (e.g. the
   *  "groups" list). Each option's value/label are read from `optionValue`
   *  (default "id") and `optionLabel` (default "label"). This keeps a dish's
   *  category a dropdown of the owner's ACTUAL categories in both surfaces. */
  optionsFrom?: string;
  /** select + categories: the value/label keys on each option/category row
   *  (default "id"/"label"). For `categories`, the id is auto-generated so the
   *  owner only ever types the label. */
  optionValue?: string;
  optionLabel?: string;
  /** categories only: the list this category set governs, so removing a
   *  category can reassign its orphaned rows. `list` is the top-level content
   *  key of the dependent rows (e.g. "items"); `key` is the field on each row
   *  that references the category value (e.g. "group"). */
  dependents?: { list: string; key: string };
}

/** One wizard step == one editor group. */
export interface StepDef {
  key: string;
  title: string;
  hint?: string;
  fields: FieldDef[];
}

/** A named, ready-made colorway. Instead of picking raw accent/ground/ink, the
 *  owner chooses one of these; `colors` maps each token key (accent/ground/ink)
 *  to its value. Keeps every site tasteful and on-brand. */
export interface TemplatePalette {
  key: string;
  label: string;
  /** groups the palette under a heading in the appearance tab. */
  tone: "dark" | "light";
  /** A template marks TWO palettes as defaults — one `dark`, one `light` — shown
   *  pinned at the top of the appearance tab as the recommended starting points.
   *  The `dark` default should equal the token defaults (the untouched site). */
  isDefault?: boolean;
  /** short mood tag shown under the name, e.g. "داكن دافئ" / "مرِح". */
  mood?: string;
  /** value per token key (accent/ground/ink) — must cover the template's tokens. */
  colors: Record<string, string>;
}

/** A themeable color the template reads from a CSS variable. Kept to a SMALL set
 *  (accent / ground / ink) so a template stays "ready" — the rest of the look is
 *  curated and fixed. */
export interface TemplateToken {
  key: string;
  label: string;
  /** CSS custom property the template's styles read, e.g. "--tpl-accent". */
  cssVar: string;
  /** design default (oklch/hex), used when the site hasn't overridden it. */
  default: string;
}

/** Props the rendered template receives: the merged editable data is SPREAD, so
 *  a template's own typed props (shop, services, …) are its top-level content
 *  keys. `house` and `currency` are provided by the host. */
export type TemplateRenderProps = Record<string, unknown> & {
  currency?: string;
};

export interface TemplateModule {
  key: string;
  label: string;
  vertical: string;
  description: string;
  /** Short searchable keywords surfaced as chips in the picker (Arabic). */
  tags: string[];
  /** Optional catalog cover image (storage URL). The gallery card shows a
   *  branded fallback when absent — no poster frames exist yet. */
  cover?: string;
  /** The ready design. Rendered as `<Component {...defaults} {...content} />`. */
  Component: React.ComponentType<TemplateRenderProps>;
  /** Editable-data defaults — also the canonical shape of Site.content. */
  defaults: Record<string, unknown>;
  /** Dot-path in `content` holding the business name (used for Site.businessName
   *  + slug suggestions), e.g. "shop.name". */
  nameKey?: string;
  /** Onboarding steps (== editor groups) covering every editable field. */
  steps: StepDef[];
  /** Small themeable color set (the token→cssVar mapping the host applies). */
  tokens: TemplateToken[];
  /** Named colorways shown in the appearance tab. When present, the owner picks
   *  a palette instead of raw colors. Each palette's `colors` cover `tokens`. */
  palettes?: TemplatePalette[];
  /** Which token is the template's DOMINANT page surface — used to draw the
   *  palette-card preview faithfully. Defaults to "ground" (the usual page
   *  background). Templates whose main surface is a different token set it (e.g.
   *  foul-fatteh's menu sits on `ink`, so its cards preview that as the fill). */
  surfaceToken?: string;
  /** The template's default site currency KEY (see shared/currency `CURRENCIES`,
   *  e.g. "SYP" → ل.س, "SYP_NEW" → ل.س.ج). Used as the starting unit for a new
   *  site and whenever the owner hasn't chosen one in settings; still overridable
   *  per site. Omit to fall back to the platform default (SYP). */
  defaultCurrency?: string;
  /** True if a font picker applies (maps to --tpl-font). */
  themeFont?: boolean;
  /** Whitelist of font keys (from lib/palette FONTS) offered for this template.
   *  Omit to offer all. The template's own font is always the default option. */
  fontKeys?: string[];
  /** The template renders its OWN end-user auth UI (a mandatory in-page gate),
   *  so the host must NOT also render the floating SiteAuthWidget. Auth-first
   *  templates (marketplace) set this. */
  ownsAuthUI?: boolean;
  /** Optional: offer a starting-variant choice in the create wizard (e.g. site
   *  LANGUAGE for a bilingual template). The chosen option's `seed` becomes the
   *  new site's initial content, with the typed name/logo merged over it. When
   *  omitted, the wizard behaves normally (seeds only name/logo). */
  create?: {
    /** label shown above the segmented choice, e.g. "لغة الموقع". */
    label: string;
    /** default option value (falls back to the first option). */
    default?: string;
    options: { value: string; label: string; seed: Record<string, unknown> }[];
  };
}
