// Bill-split engine — pure, framework-free, fully unit-tested. This is the heart
// of the "قسّم الفاتورة" template: it turns a table of people + items + charges
// into a fair, provably-reconciled per-person total.
//
// The two cost types (see the product logic):
//   • ITEMS  → split among the people who actually shared each item (price ÷ |S|).
//   • CHARGES (service, tax) → split EQUALLY per head (total ÷ n) — the house rule.
//
// The subtle part is rounding: dividing by |S| and by n makes fractions, so naive
// rounding makes the per-person shares NOT add up to the real bill. We fix that
// with largest-remainder allocation so the shares ALWAYS sum to the bill, each
// person within one rounding unit. Amounts are whole Syrian Pounds (no subunit).

export interface Diner {
  id: string;
  name: string;
}

/** One ordered line. `price` is the UNIT price; the line total is price × qty.
 *  `sharers` is the set of diner ids who split it, or "all" for shared-by-table
 *  (mezze). An empty/unknown set is treated as shared by all (safe default). */
export interface LineItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  sharers: string[] | "all";
}

/** A charge split equally among the people who ORDERED (not per every seat).
 *  Either a percentage of the subtotal (`rate`, a fraction: 0.10 = ١٠٪) or an
 *  absolute `amount`; `amount` wins when both are present. */
export interface Surcharge {
  key: string;
  label: string;
  rate?: number;
  amount?: number;
}

export type RoundMode = "exact" | "cash";

export interface SplitInput {
  diners: Diner[];
  items: LineItem[];
  surcharges: Surcharge[];
  /** Rounding step in currency units (e.g. 500 SYP). 0/1 = whole pounds. */
  roundTo?: number;
  /** exact = shares sum to the precise bill (largest-remainder). cash = round
   *  each share UP to the step; the surplus becomes the tip. */
  mode?: RoundMode;
}

export interface DinerLine {
  name: string;
  share: number;
}

export interface DinerResult {
  id: string;
  name: string;
  /** the person's itemized shares (raw, before rounding) */
  lines: DinerLine[];
  itemsSubtotal: number;
  surcharge: number;
  /** unrounded total = itemsSubtotal + surcharge */
  rawTotal: number;
  /** final amount this person pays (rounded per mode; sums to the bill) */
  total: number;
}

export interface SplitResult {
  perDiner: DinerResult[];
  subtotal: number;
  surchargeTotal: number;
  /** subtotal + surchargeTotal, exact */
  grandTotal: number;
  /** Σ per-diner totals — equals grandTotal in exact mode; ≥ it in cash mode */
  collected: number;
  /** cash-mode surplus (collected − grandTotal), i.e. the rounding tip */
  tip: number;
}

const lineTotal = (i: LineItem) => Math.max(0, i.price) * Math.max(0, i.qty);

/** Largest-remainder allocation: split `total` across `n` weights so each result
 *  is a multiple of `unit`, the parts sum EXACTLY to `total` rounded to `unit`,
 *  and the rounding is distributed to the largest fractional remainders. */
function allocate(raw: number[], total: number, unit: number): number[] {
  const u = Math.max(1, Math.round(unit));
  const targetUnits = Math.round(total / u);
  const floors = raw.map((r) => Math.floor(r / u));
  const used = floors.reduce((a, b) => a + b, 0);
  const leftover = targetUnits - used;
  const out = floors.slice();
  // Distribute remaining whole units to the largest remainders first. If leftover
  // is negative (over-allocated by flooring — rare), trim from the smallest.
  const order = raw
    .map((r, i) => ({ rem: r / u - floors[i], i }))
    .sort((a, b) => b.rem - a.rem)
    .map((x) => x.i);
  if (leftover >= 0) {
    for (let k = 0; k < leftover; k++) out[order[k % order.length]] += 1;
  } else {
    for (let k = 0; k < -leftover; k++) out[order[order.length - 1 - (k % order.length)]] -= 1;
  }
  return out.map((n) => n * u);
}

export function computeSplit(input: SplitInput): SplitResult {
  const { diners, items, surcharges } = input;
  const unit = input.roundTo && input.roundTo > 0 ? input.roundTo : 1;
  const mode: RoundMode = input.mode ?? "exact";
  const n = diners.length;

  const empty: SplitResult = {
    perDiner: diners.map((d) => ({ id: d.id, name: d.name, lines: [], itemsSubtotal: 0, surcharge: 0, rawTotal: 0, total: 0 })),
    subtotal: 0,
    surchargeTotal: 0,
    grandTotal: 0,
    collected: 0,
    tip: 0,
  };
  if (n === 0) return { ...empty, perDiner: [] };

  const allIds = diners.map((d) => d.id);
  const idIndex = new Map(allIds.map((id, i) => [id, i]));

  // ── item shares ──────────────────────────────────────────────────────────
  const itemsSubtotal = new Array(n).fill(0);
  const lines: DinerLine[][] = diners.map(() => []);
  let subtotal = 0;

  for (const it of items) {
    const lt = lineTotal(it);
    subtotal += lt;
    if (lt <= 0) continue;
    let sharerIds = it.sharers === "all" ? allIds : it.sharers.filter((id) => idIndex.has(id));
    if (sharerIds.length === 0) sharerIds = allIds; // unassigned → shared by table
    const share = lt / sharerIds.length;
    for (const id of sharerIds) {
      const k = idIndex.get(id)!;
      itemsSubtotal[k] += share;
      lines[k].push({ name: it.name, share });
    }
  }

  // ── charges: split equally, but ONLY among people who actually ordered ─────
  // Someone who ate nothing pays no service/tax. The full charge is still
  // collected — divided across the payers.
  const surchargeTotal = surcharges.reduce(
    (sum, s) => sum + (s.amount != null ? Math.max(0, s.amount) : subtotal * Math.max(0, s.rate ?? 0)),
    0,
  );
  const payerCount = itemsSubtotal.filter((v) => v > 0).length;
  const perHead = payerCount > 0 ? surchargeTotal / payerCount : 0;

  const rawTotals = itemsSubtotal.map((s) => s + (s > 0 ? perHead : 0));
  const grandTotal = subtotal + surchargeTotal;

  // ── rounding / reconciliation ──────────────────────────────────────────────
  let totals: number[];
  if (mode === "cash") {
    totals = rawTotals.map((r) => Math.ceil(r / unit) * unit);
  } else {
    totals = allocate(rawTotals, grandTotal, unit);
  }
  const collected = totals.reduce((a, b) => a + b, 0);

  return {
    perDiner: diners.map((d, k) => ({
      id: d.id,
      name: d.name,
      lines: lines[k],
      itemsSubtotal: itemsSubtotal[k],
      surcharge: itemsSubtotal[k] > 0 ? perHead : 0,
      rawTotal: rawTotals[k],
      total: totals[k],
    })),
    subtotal,
    surchargeTotal,
    grandTotal,
    collected,
    tip: Math.max(0, collected - grandTotal),
  };
}
