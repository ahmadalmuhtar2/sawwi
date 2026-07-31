// Server-side, URL-reflected filtering for the marketplace (pure — no React/DOM).
// The served page parses the request's search params into filter VALUES, filters
// + sorts the published inventory here, and hands the component the finished
// results plus the active values (so the rail renders the URL state). Toggling a
// filter in the UI just builds a new URL via `filterHref` and navigates — the
// server re-runs this. Same predicate powers the gallery/preview demo client-side.

import {
  FILTERS, SORTS, VERTICAL_LABEL,
  type MarketplaceListing, type Vertical, type SortKey, type FilterDef,
} from "./schema";
import { VERTICAL_PATH, parseRoute, type MView } from "./routing";

export type FilterValues = Record<string, string | string[] | number>;
export type SearchParams = Record<string, string | string[] | undefined>;

const AR = "٠١٢٣٤٥٦٧٨٩";
function num(v: unknown): number | null {
  if (v == null) return null;
  const latin = String(v).replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
  const n = parseFloat(latin.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function fieldValue(l: MarketplaceListing, key: string): unknown {
  if (key === "price") return l.price;
  if (key === "offer") return l.offer;
  if (key === "place") return l.place;
  if (key === "features") return l.features;
  return l.specs[key];
}

/** A "nice" round upper bound + step for a money slider derived from the data. */
export function moneyBounds(prices: number[]): { max: number; step: number } {
  const peak = Math.max(1000, ...prices);
  const pow = Math.pow(10, Math.floor(Math.log10(peak)) - 1);
  const max = Math.ceil(peak / pow) * pow;
  return { max, step: Math.max(pow, Math.round(max / 50)) };
}

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

/** Parse the request's search params into typed filter values for a vertical.
 *  Only keys that exist in FILTERS[vertical] are honoured (unknown params ignored). */
export function parseFilterParams(sp: SearchParams, vertical: Vertical): FilterValues {
  const out: FilterValues = {};
  for (const def of FILTERS[vertical]) {
    const raw = first(sp[def.k]);
    if (raw == null || raw === "") continue;
    if (def.kind === "range") {
      const n = num(raw);
      if (n != null) out[def.k] = n;
    } else if (def.kind === "multi") {
      const arr = raw.split(",").map((s) => s.trim()).filter(Boolean);
      if (arr.length) out[def.k] = arr;
    } else {
      out[def.k] = raw; // chips (incl. seatsMin/roomsMin "min" chips)
    }
  }
  return out;
}

/** Does a listing satisfy the active filter values? (the ported `matches`, minus search) */
export function matchesFilters(l: MarketplaceListing, vertical: Vertical, f: FilterValues): boolean {
  for (const [k, v] of Object.entries(f)) {
    if (k === "price") { if (l.price == null || l.price > (v as number)) return false; continue; }
    if (k === "km") { const n = num(l.specs.km); if (n == null || n > (v as number)) return false; continue; }
    if (k === "sizeMin") { const n = num(l.specs.size); if (n == null || n < (v as number)) return false; continue; }
    if (k === "seatsMin") { const n = num(l.specs.seats); if (n == null || n < (num(v as string) ?? 0)) return false; continue; }
    if (k === "roomsMin") { const n = num(l.specs.rooms); if (n == null || n < (num(v as string) ?? 0)) return false; continue; }
    if (k === "features") { if (!(v as string[]).every((x) => l.features.includes(x))) return false; continue; }
    if (String(fieldValue(l, k) ?? "") !== String(v)) return false; // plain chips equality
  }
  return true;
}

/** The set of filter VALUES actually present in a vertical's published inventory,
 *  per enum filter key — so the rail only offers options that return results.
 *  Range + "min"-threshold chips are excluded (kept static). The dependent `model`
 *  facet respects the active `make` (only models of that make). */
export function computeFacets(
  listings: MarketplaceListing[],
  vertical: Vertical,
  filters: FilterValues,
): Record<string, string[]> {
  const items = listings.filter((l) => l.vertical === vertical);
  const facets: Record<string, string[]> = {};
  for (const def of FILTERS[vertical]) {
    if (def.kind === "range" || def.k.endsWith("Min")) continue;
    const set = new Set<string>();
    for (const l of items) {
      if (def.k === "model" && filters.make && String(l.specs.make ?? "") !== String(filters.make)) continue;
      if (def.k === "features") { l.features.forEach((ft) => set.add(ft)); continue; }
      if (def.k === "offer") { if (l.offer) set.add(String(l.offer)); continue; }
      const v = l.specs[def.k];
      if (v != null && v !== "") set.add(String(v));
    }
    facets[def.k] = [...set];
  }
  return facets;
}

/** The listing's numeric value for a given range filter key. */
function rangeValue(l: MarketplaceListing, k: string): number | null {
  if (k === "price") return l.price ?? null;
  if (k === "km") return num(l.specs.km);
  if (k === "sizeMin") return num(l.specs.size);
  return null;
}

export interface RangeBound { min: number; max: number; step: number }

/** Slider bounds for every range filter, derived from the ACTUAL published
 *  inventory (backend), so the handles span the real data — money keys get a
 *  round upper bound + step, others round up to their step. */
export function computeRanges(
  listings: MarketplaceListing[],
  vertical: Vertical,
): Record<string, RangeBound> {
  const items = listings.filter((l) => l.vertical === vertical);
  const out: Record<string, RangeBound> = {};
  for (const def of FILTERS[vertical]) {
    if (def.kind !== "range") continue;
    const vals = items.map((l) => rangeValue(l, def.k)).filter((n): n is number => n != null && n > 0);
    if (def.money) {
      const b = moneyBounds(vals.length ? vals : [100000]);
      out[def.k] = { min: 0, max: b.max, step: b.step };
    } else {
      const step = def.step ?? 1;
      const rawMax = vals.length ? Math.max(...vals) : (def.max ?? 100);
      out[def.k] = { min: def.min ?? 0, max: Math.max(step, Math.ceil(rawMax / step) * step), step };
    }
  }
  return out;
}

const SORT_KEYS = new Set(SORTS.map((s) => s.k));
export function parseSort(sp: SearchParams): SortKey {
  const s = first(sp.sort);
  return s && SORT_KEYS.has(s as SortKey) ? (s as SortKey) : "new";
}

/** Featured first, then by sort (price asc/desc, else newest by model year). */
export function sortResults(list: MarketplaceListing[], sort: SortKey): MarketplaceListing[] {
  const dir = sort === "asc" ? 1 : sort === "desc" ? -1 : 0;
  return [...list].sort((a, b) => {
    if (!!b.featured !== !!a.featured) return b.featured ? 1 : -1;
    if (dir) return ((a.price ?? 0) - (b.price ?? 0)) * dir;
    const ay = num(a.specs.year ?? a.specs.built) ?? 0;
    const by = num(b.specs.year ?? b.specs.built) ?? 0;
    return by - ay;
  });
}

/** Build the address-bar path+query for a vertical's browse with the given filters. */
export function filterHref(vertical: Vertical, f: FilterValues, sort: SortKey): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v == null || v === "" || (Array.isArray(v) && !v.length)) continue;
    qs.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  if (sort !== "new") qs.set("sort", sort);
  const q = qs.toString();
  return `/${VERTICAL_PATH[vertical]}${q ? `?${q}` : ""}`;
}

/* ─────────────────── server payload the component consumes ───────────────── */

export interface MarketplaceData {
  /** Verticals present in the published inventory (drives the header tabs). */
  verticals: Vertical[];
  /** Slider bounds for the CURRENT vertical's range filters, from the actual
   *  (unfiltered) inventory. Keyed by filter key. */
  ranges: Record<string, RangeBound>;
  /** Filtered + sorted results for the CURRENT browse vertical. */
  results: MarketplaceListing[];
  /** The active filter values (from the URL) — the rail reflects these. */
  filters: FilterValues;
  /** Enum filter values actually present in the inventory (the rail offers only
   *  these, so every option returns results). Keyed by filter key. */
  facets: Record<string, string[]>;
  sort: SortKey;
  /** The listing for a detail route (`/cars/<id>`), else null. */
  detail: MarketplaceListing | null;
  /** The current view derived from the path (browse/detail/admin/sell). */
  view: MView;
}

/** Build everything the served marketplace needs, entirely server-side. */
export function buildMarketplaceData(
  published: MarketplaceListing[],
  route: string[] | undefined,
  sp: SearchParams,
): MarketplaceData {
  const present = new Set(published.map((l) => l.vertical));
  const verticals = (["car", "home"] as Vertical[]).filter((v) => present.has(v));
  const effectiveVerticals = verticals.length ? verticals : (["car", "home"] as Vertical[]);

  const view = parseRoute(route, effectiveVerticals);
  const sort = parseSort(sp);

  // A seller's public page: all of THAT author's published listings (both
  // verticals), newest/featured first. No filter rail here.
  if (view.kind === "sellerPage") {
    const results = sortResults(published.filter((l) => l.authorId === view.id), sort);
    return { verticals: effectiveVerticals, ranges: {}, results, filters: {}, facets: {}, sort, detail: null, view };
  }

  const vertical = view.vertical;
  const filters = parseFilterParams(sp, vertical);
  const facets = computeFacets(published, vertical, filters);
  const ranges = computeRanges(published, vertical);

  const results = sortResults(
    published.filter((l) => l.vertical === vertical && matchesFilters(l, vertical, filters)),
    sort,
  );
  const detail = view.kind === "detail" ? published.find((l) => l.id === view.id) ?? null : null;

  return { verticals: effectiveVerticals, ranges, results, filters, facets, sort, detail, view };
}

/** Active-filter chips (label + the value to clear) for the rail summary. */
export function activeChipList(
  vertical: Vertical,
  f: FilterValues,
  fmtMoney: (n: number) => string,
  currency: string,
): { key: string; label: string; value?: string }[] {
  const defs = FILTERS[vertical];
  const chips: { key: string; label: string; value?: string }[] = [];
  const toAr = (v: string | number) => String(v).replace(/[0-9]/g, (d) => AR[+d]);
  for (const [k, v] of Object.entries(f)) {
    const def = defs.find((d) => d.k === k);
    if (!def) continue;
    if (def.kind === "range") {
      const label = def.money ? `${def.label} ${fmtMoney(v as number)} ${currency}` : `${def.label} ${toAr(v as number)}${def.unit ?? ""}`;
      chips.push({ key: k, label });
    } else if (Array.isArray(v)) {
      for (const item of v) chips.push({ key: k, label: item, value: item });
    } else {
      chips.push({ key: k, label: String(v) });
    }
  }
  return chips;
}

export { VERTICAL_LABEL, type FilterDef };
