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
export type FieldType = "text" | "textarea" | "phone" | "image" | "list" | "select" | "categories";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
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
  /** Small themeable color set surfaced as pickers. */
  tokens: TemplateToken[];
  /** True if a font picker applies (maps to --tpl-font). */
  themeFont?: boolean;
}
