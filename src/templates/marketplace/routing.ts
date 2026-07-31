// URL routing for the marketplace template (this template only). Maps the site's
// path segments ↔ an in-app view. Pure functions — no React, no DOM — so both the
// server (initial render from `route` params) and the client (pushState/popstate)
// share one source of truth.
//
//   /              → browse the first available vertical
//   /cars          → browse cars          · /cars/<id>        → a car's detail
//   /properties    → browse homes         · /properties/<id>  → a home's detail
//   /admin         → manager area (users + listings)
//   /seller/<id>   → one seller's public listings
//   /account       → the signed-in user's account settings

import type { Vertical } from "./schema";

export type MView =
  | { kind: "browse"; vertical: Vertical }
  | { kind: "detail"; vertical: Vertical; id: string }
  | { kind: "admin"; vertical: Vertical }
  | { kind: "sell"; vertical: Vertical }
  | { kind: "sellerPage"; vertical: Vertical; id: string }
  | { kind: "account"; vertical: Vertical };

/** The URL word per vertical (the homes vertical is internally "home"). */
export const VERTICAL_PATH: Record<Vertical, string> = { car: "cars", home: "properties" };
const PATH_VERTICAL: Record<string, Vertical> = { cars: "car", properties: "home" };

/** Build the address-bar path for a view. */
export function viewToPath(view: MView): string {
  if (view.kind === "admin") return "/admin";
  if (view.kind === "sell") return "/sell";
  if (view.kind === "account") return "/account";
  if (view.kind === "sellerPage") return `/seller/${view.id}`;
  const base = `/${VERTICAL_PATH[view.vertical]}`;
  return view.kind === "detail" ? `${base}/${view.id}` : base;
}

/** Derive the view from path segments, clamped to the verticals actually present. */
export function parseRoute(segments: string[] | undefined, verticals: Vertical[]): MView {
  const home: Vertical = verticals[0] ?? "car";
  const segs = (segments ?? []).filter(Boolean);
  if (segs[0] === "admin") return { kind: "admin", vertical: home };
  if (segs[0] === "sell") return { kind: "sell", vertical: home };
  if (segs[0] === "account") return { kind: "account", vertical: home };
  if (segs[0] === "seller" && segs[1]) return { kind: "sellerPage", vertical: home, id: segs[1] };

  const mapped = PATH_VERTICAL[segs[0]];
  const vertical = mapped && verticals.includes(mapped) ? mapped : home;
  if (mapped && segs[1]) return { kind: "detail", vertical, id: segs[1] };
  return { kind: "browse", vertical };
}

/** The current path segments from the browser (client-only). */
export function segmentsFromLocation(): string[] {
  return window.location.pathname.split("/").filter(Boolean);
}
