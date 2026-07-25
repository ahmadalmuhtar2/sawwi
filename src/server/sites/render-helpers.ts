// Pure helpers shared by the public renderer and the dashboard preview: map
// catch-all URL segments to a page path, pick the matching page, and build the
// auto-nav list. No DB, no React — just data shaping.

import type { RenderPage } from "./site-data";

/** ["about"] -> "/about"; [] / undefined -> "/". */
export function pathFromSegments(segments?: string[]): string {
  if (!segments || segments.length === 0) return "/";
  return "/" + segments.join("/");
}

/**
 * Resolve a page by path. Exact match wins; the root path falls back to the
 * first page by order (the landing), so "/" always resolves if any page exists.
 */
export function pickPage(pages: RenderPage[], path: string): RenderPage | undefined {
  const exact = pages.find((p) => p.path === path);
  if (exact) return exact;
  if (path === "/") return [...pages].sort((a, b) => a.order - b.order)[0];
  return undefined;
}

/** Nav entries in display order (skip untitled pages). */
export function buildNav(pages: RenderPage[]): { path: string; title: string }[] {
  return [...pages]
    .sort((a, b) => a.order - b.order)
    .filter((p) => p.title)
    .map((p) => ({ path: p.path, title: p.title }));
}
