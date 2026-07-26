// Templates gallery — the backend for browsing the template catalog. A template
// is a React component in code (src/templates), so the catalog is the code
// registry; this module does the SEARCH, TAG FILTER, TAG RANKING, and CURSOR
// PAGINATION over it, server-side. The client passes params and renders pages —
// it never filters or searches locally.
//
// The catalog is small and static, so we operate in memory. Everything below is
// pure over `TEMPLATES`, which keeps it trivially testable and DB-free. If the
// catalog ever moves to Postgres, only the `catalog()` source changes.

import { TEMPLATES } from "@/templates/registry";
import type { ListTemplatesQuery, ListTagsQuery } from "./templates.schema";

/** One card in the gallery grid. */
export interface TemplateCard {
  key: string;
  name: string;
  description: string;
  vertical: string;
  tags: string[];
  /** The real full-page site (public). */
  previewUrl: string;
  /** Catalog cover image, or null → the card renders a branded fallback. */
  coverUrl: string | null;
}

export interface TemplatePage {
  items: TemplateCard[];
  /** Pass back as `cursor` to fetch the next page; null → last page. */
  nextCursor: string | null;
  /** Total matches for the current query+tags (before pagination). */
  total: number;
}

export interface TagCount {
  label: string;
  count: number;
}

/* ── Arabic-aware normalization for matching (length is irrelevant here; unlike
 *    the client highlighter this need not be length-preserving). ── */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "") // diacritics + tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[ةه]/g, "ه")
    .trim();
}

/** The catalog, projected to cards in a stable (curated) order. */
function catalog(): TemplateCard[] {
  return TEMPLATES.map((t) => ({
    key: t.key,
    name: t.label,
    description: t.description,
    vertical: t.vertical,
    tags: t.tags,
    previewUrl: `/templates/${t.key}`,
    coverUrl: t.cover ?? null,
  }));
}

function matchesQuery(card: TemplateCard, q: string): boolean {
  if (!q) return true;
  const nq = normalize(q);
  return [card.name, card.description, ...card.tags].some((f) =>
    normalize(f).includes(nq),
  );
}

function matchesTags(card: TemplateCard, tags: string[]): boolean {
  if (tags.length === 0) return true;
  const have = new Set(card.tags.map(normalize));
  // AND: every selected tag must be present (narrowing).
  return tags.every((t) => have.has(normalize(t)));
}

/**
 * List templates matching `query` (AND) `tags`, one page at a time. The cursor
 * is the key of the last item on the previous page; paging resumes right after
 * it in the stable filtered order (and restarts from the top if the cursor is
 * no longer in the result set, e.g. the filters changed).
 */
export function listTemplates(input: ListTemplatesQuery): TemplatePage {
  const matched = catalog().filter(
    (c) => matchesQuery(c, input.query) && matchesTags(c, input.tags),
  );

  let start = 0;
  if (input.cursor) {
    const idx = matched.findIndex((c) => c.key === input.cursor);
    start = idx >= 0 ? idx + 1 : 0;
  }

  const items = matched.slice(start, start + input.limit);
  const end = start + items.length;
  const nextCursor = end < matched.length ? (items.at(-1)?.key ?? null) : null;

  return { items, nextCursor, total: matched.length };
}

/**
 * Tags ranked by popularity (how many templates carry each), for the suggested
 * chips and the "all tags" panel. `query` filters the tag labels; `limit` caps
 * the count (default 10 → "suggest first 10 tags"). Ranking is over the WHOLE
 * catalog, so suggestions are stable regardless of the current filter.
 */
export function listTags(input: ListTagsQuery): TagCount[] {
  const counts = new Map<string, { label: string; count: number }>();
  for (const t of catalog()) {
    for (const raw of t.tags) {
      const key = normalize(raw);
      if (!key) continue;
      const hit = counts.get(key);
      if (hit) hit.count += 1;
      else counts.set(key, { label: raw, count: 1 });
    }
  }

  const nq = normalize(input.query);
  const ranked = [...counts.values()]
    .filter((t) => !nq || normalize(t.label).includes(nq))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ar"));

  return ranked.slice(0, input.limit).map(({ label, count }) => ({ label, count }));
}
