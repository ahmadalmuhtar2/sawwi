import { describe, it, expect } from "vitest";
import { computeSplit, type SplitInput } from "./engine";

const diners = [
  { id: "a", name: "أحمد" },
  { id: "b", name: "لمى" },
  { id: "c", name: "خالد" },
];

describe("computeSplit", () => {
  it("splits shared items among sharers and individual items to their owner", () => {
    const input: SplitInput = {
      diners,
      items: [
        { id: "1", name: "حمّص", price: 20000, qty: 1, sharers: "all" }, // 3-way
        { id: "2", name: "دجاج", price: 50000, qty: 1, sharers: ["a"] },
        { id: "3", name: "كباب", price: 60000, qty: 1, sharers: ["b"] },
        { id: "4", name: "سلطة", price: 15000, qty: 1, sharers: ["a", "c"] }, // 2-way
      ],
      surcharges: [],
      roundTo: 1,
    };
    const r = computeSplit(input);
    expect(r.subtotal).toBe(145000);
    // a: 20000/3 + 50000 + 15000/2 = 6666.67 + 50000 + 7500
    expect(r.perDiner[0].itemsSubtotal).toBeCloseTo(20000 / 3 + 50000 + 7500, 4);
    expect(r.perDiner[1].itemsSubtotal).toBeCloseTo(20000 / 3 + 60000, 4);
    expect(r.perDiner[2].itemsSubtotal).toBeCloseTo(20000 / 3 + 7500, 4);
    // item-share components sum to subtotal
    const sum = r.perDiner.reduce((s, d) => s + d.itemsSubtotal, 0);
    expect(sum).toBeCloseTo(145000, 4);
  });

  it("splits surcharges equally per head, not by consumption", () => {
    const input: SplitInput = {
      diners,
      items: [
        { id: "1", name: "غالي", price: 90000, qty: 1, sharers: ["a"] },
        { id: "2", name: "رخيص", price: 30000, qty: 1, sharers: ["b"] },
        { id: "3", name: "وسط", price: 30000, qty: 1, sharers: ["c"] },
      ],
      surcharges: [
        { key: "service", label: "خدمة", rate: 0.1 },
        { key: "tax", label: "ضريبة", rate: 0.05 },
      ],
      roundTo: 1,
    };
    const r = computeSplit(input);
    expect(r.subtotal).toBe(150000);
    expect(r.surchargeTotal).toBeCloseTo(150000 * 0.15, 4); // 22500
    // per-head charge identical for everyone regardless of what they ate
    const perHead = (150000 * 0.15) / 3;
    for (const d of r.perDiner) expect(d.surcharge).toBeCloseTo(perHead, 4);
  });

  it("reconciles rounded shares to exactly the grand total (exact mode)", () => {
    const input: SplitInput = {
      diners,
      items: [
        { id: "1", name: "مازة", price: 100000, qty: 1, sharers: "all" }, // 33333.33 each
        { id: "2", name: "طبق", price: 55000, qty: 1, sharers: ["a"] },
      ],
      surcharges: [{ key: "service", label: "خدمة", rate: 0.1 }],
      roundTo: 500,
      mode: "exact",
    };
    const r = computeSplit(input);
    // every share is a multiple of 500
    for (const d of r.perDiner) expect(d.total % 500).toBe(0);
    // and they sum to the grand total rounded to the unit
    expect(r.collected).toBe(Math.round(r.grandTotal / 500) * 500);
    expect(r.tip).toBe(0);
  });

  it("cash mode rounds each share up and books the surplus as tip", () => {
    const input: SplitInput = {
      diners,
      items: [{ id: "1", name: "مازة", price: 100000, qty: 1, sharers: "all" }],
      surcharges: [],
      roundTo: 500,
      mode: "cash",
    };
    const r = computeSplit(input);
    // 33333.33 → ceil to 33500 each
    for (const d of r.perDiner) expect(d.total).toBe(33500);
    expect(r.collected).toBe(100500);
    expect(r.tip).toBe(500); // 100500 − 100000
  });

  it("charges service/tax only to people who ordered (non-orderers pay 0)", () => {
    const r = computeSplit({
      diners, // a, b, c
      items: [
        { id: "1", name: "طبق", price: 100000, qty: 1, sharers: ["a"] },
        { id: "2", name: "طبق", price: 100000, qty: 1, sharers: ["b"] },
        // c ordered nothing
      ],
      surcharges: [{ key: "service", label: "خدمة", rate: 0.1 }],
      roundTo: 1,
    });
    // 20000 total service split over the 2 payers = 10000 each; c pays nothing
    expect(r.perDiner[0].surcharge).toBeCloseTo(10000, 4);
    expect(r.perDiner[1].surcharge).toBeCloseTo(10000, 4);
    expect(r.perDiner[2].surcharge).toBe(0);
    expect(r.perDiner[2].total).toBe(0);
  });

  it("supports a fixed-amount charge (not just a percentage)", () => {
    const r = computeSplit({
      diners,
      items: [
        { id: "1", name: "طبق", price: 50000, qty: 1, sharers: ["a"] },
        { id: "2", name: "طبق", price: 50000, qty: 1, sharers: ["b"] },
      ],
      surcharges: [{ key: "cover", label: "خدمة", amount: 30000 }],
      roundTo: 1,
    });
    // 30000 fixed split over 2 payers = 15000 each
    expect(r.surchargeTotal).toBe(30000);
    expect(r.perDiner[0].surcharge).toBeCloseTo(15000, 4);
    expect(r.perDiner[2].surcharge).toBe(0);
  });

  it("treats an unassigned item as shared by the whole table", () => {
    const r = computeSplit({
      diners,
      items: [{ id: "1", name: "ماء", price: 9000, qty: 1, sharers: [] }],
      surcharges: [],
      roundTo: 1,
    });
    for (const d of r.perDiner) expect(d.itemsSubtotal).toBeCloseTo(3000, 4);
  });

  it("handles qty > 1 via unit price × quantity", () => {
    const r = computeSplit({
      diners,
      items: [{ id: "1", name: "ماء", price: 5000, qty: 4, sharers: "all" }],
      surcharges: [],
      roundTo: 1,
    });
    expect(r.subtotal).toBe(20000);
  });

  it("returns an empty result for zero diners", () => {
    const r = computeSplit({ diners: [], items: [], surcharges: [], roundTo: 1 });
    expect(r.perDiner).toHaveLength(0);
    expect(r.grandTotal).toBe(0);
  });
});
