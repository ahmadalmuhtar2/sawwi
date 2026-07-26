// Zod DTOs for the templates gallery API. Query params arrive as strings on the
// URL; these coerce/clamp them. The service does all searching/filtering/paging
// (backend-side by contract — the client only passes these params through).

import { z } from "zod";

/** GET /api/templates — server-side search + tag filter + cursor pagination. */
export const ListTemplatesQuery = z.object({
  /** Free text: matched against name + description + tags on the server. */
  query: z.string().trim().max(120).default(""),
  /** Comma-separated tags; a template must carry ALL of them (AND / narrow). */
  tags: z
    .string()
    .optional()
    .transform((s) =>
      (s ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  /** Opaque cursor: the key of the last item from the previous page. */
  cursor: z.string().trim().min(1).optional(),
  /** Page size. */
  limit: z.coerce.number().int().min(1).max(48).default(12),
});
export type ListTemplatesQuery = z.infer<typeof ListTemplatesQuery>;

/** GET /api/templates/tags — top-N tags by popularity, or search-in-tags. */
export const ListTagsQuery = z.object({
  /** Optional filter for the "all tags" panel; empty → the popular tags. */
  query: z.string().trim().max(60).default(""),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
export type ListTagsQuery = z.infer<typeof ListTagsQuery>;

/** Build a validated query object from a URL's search params. */
export function parseListTemplatesQuery(url: string): ListTemplatesQuery {
  const p = new URL(url).searchParams;
  return ListTemplatesQuery.parse({
    query: p.get("query") ?? undefined,
    tags: p.get("tags") ?? undefined,
    cursor: p.get("cursor") ?? undefined,
    limit: p.get("limit") ?? undefined,
  });
}

export function parseListTagsQuery(url: string): ListTagsQuery {
  const p = new URL(url).searchParams;
  return ListTagsQuery.parse({
    query: p.get("query") ?? undefined,
    limit: p.get("limit") ?? undefined,
  });
}
