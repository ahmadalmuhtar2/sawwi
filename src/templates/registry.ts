// Template registry — the catalog of ready-made templates. Adding a template is
// a one-line import here; the wizard, editor, and renderer are all driven off
// its module (see ./types) with no further wiring.

import type { TemplateModule } from "./types";
import { barbershopFiveStar } from "./barbershop-five-star";
import { restaurant } from "./restaurant";
import { foulFatteh } from "./foul-fatteh";

export const TEMPLATES: TemplateModule[] = [barbershopFiveStar, restaurant, foulFatteh];

const BY_KEY = new Map(TEMPLATES.map((t) => [t.key, t]));

export function getTemplate(key: string | null | undefined): TemplateModule | null {
  return key ? (BY_KEY.get(key) ?? null) : null;
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
