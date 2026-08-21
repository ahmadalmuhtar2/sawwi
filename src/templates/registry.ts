// Template registry — the catalog of ready-made templates. Adding a template is
// a one-line import here; the wizard, editor, and renderer are all driven off
// its module (see ./types) with no further wiring.

import type { TemplateModule } from "./types";
import { DEFAULT_CURRENCY } from "@/shared/currency";
import { barbershopFiveStar } from "./barbershop-five-star";
import { restaurant } from "./restaurant";
import { foulFatteh } from "./foul-fatteh";
import { marketplace } from "./marketplace";
import { portfolio } from "./portfolio";
import { restaurantSplit } from "./restaurant-split";
import { shaghleh } from "./shaghleh";
import { zeitElDar } from "./zeit-eldar";

export const TEMPLATES: TemplateModule[] = [barbershopFiveStar, restaurant, restaurantSplit, foulFatteh, marketplace, portfolio, shaghleh, zeitElDar];

const BY_KEY = new Map(TEMPLATES.map((t) => [t.key, t]));

export function getTemplate(key: string | null | undefined): TemplateModule | null {
  return key ? (BY_KEY.get(key) ?? null) : null;
}

/** The default currency KEY for a template (falls back to the platform default).
 *  Used by the render/publish layer so a site with no explicit currency shows
 *  its template's chosen unit on every page. */
export function defaultCurrencyOf(key: string | null | undefined): string {
  return getTemplate(key)?.defaultCurrency ?? DEFAULT_CURRENCY;
}

/** Does this site's template collect form submissions (→ show the «الطلبات»
 *  inbox nav + NEW badge)? Sites whose template has no forms show nothing. */
export function templateCollectsSubmissions(key: string | null | undefined): boolean {
  return !!getTemplate(key)?.collectsSubmissions;
}

/** Lightweight list for pickers (no component/defaults payload). */
export function listTemplates() {
  return TEMPLATES.map(({ key, label, vertical, description, tags }) => ({
    key,
    label,
    vertical,
    description,
    tags,
  }));
}

export type TemplateSummary = ReturnType<typeof listTemplates>[number];
