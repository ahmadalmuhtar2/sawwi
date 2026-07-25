import { describe, expect, it } from "vitest";
import {
  isSectionAllowed,
  isSectionType,
  isValidVariant,
  normalizeOrders,
  PAGE_TYPE_SECTIONS,
  reorder,
  SECTION_TYPES,
} from "./sections.rules";

describe("section library", () => {
  it("is frozen at 13 types", () => {
    expect(SECTION_TYPES).toHaveLength(13);
  });

  it("recognises known types and rejects unknown / auto ones", () => {
    expect(isSectionType("Hero")).toBe(true);
    expect(isSectionType("PriceList")).toBe(true);
    expect(isSectionType("Header")).toBe(false); // auto, not addable
    expect(isSectionType("Footer")).toBe(false);
    expect(isSectionType("Carousel")).toBe(false);
  });

  it("validates variants A/B/C only", () => {
    expect(isValidVariant("A")).toBe(true);
    expect(isValidVariant("C")).toBe(true);
    expect(isValidVariant("D")).toBe(false);
    expect(isValidVariant("a")).toBe(false);
  });
});

describe("isSectionAllowed", () => {
  it("allows any known section on landing/custom pages", () => {
    for (const type of SECTION_TYPES) {
      expect(isSectionAllowed("landing", type)).toBe(true);
      expect(isSectionAllowed("custom", type)).toBe(true);
    }
  });

  it("enforces the per-page-type allow list", () => {
    expect(isSectionAllowed("contact", "MapAddress")).toBe(true);
    expect(isSectionAllowed("contact", "PriceList")).toBe(false);
    expect(isSectionAllowed("services", "ServicesGrid")).toBe(true);
    expect(isSectionAllowed("about", "Team")).toBe(true);
    expect(isSectionAllowed("about", "ServicesGrid")).toBe(false);
  });

  it("rejects unknown section types everywhere", () => {
    expect(isSectionAllowed("landing", "Nope")).toBe(false);
  });

  it("every allow-list entry is a real section type", () => {
    for (const list of Object.values(PAGE_TYPE_SECTIONS)) {
      for (const type of list) expect(isSectionType(type)).toBe(true);
    }
  });
});

describe("reorder", () => {
  const list = ["a", "b", "c", "d"];

  it("moves an item down", () => {
    expect(reorder(list, 0, 2)).toEqual(["b", "c", "a", "d"]);
  });

  it("moves an item up", () => {
    expect(reorder(list, 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("is a no-op when from === to and does not mutate the input", () => {
    const copy = [...list];
    expect(reorder(list, 2, 2)).toEqual(list);
    expect(list).toEqual(copy);
  });

  it("throws on out-of-range or non-integer indices", () => {
    expect(() => reorder(list, -1, 0)).toThrow(RangeError);
    expect(() => reorder(list, 0, 4)).toThrow(RangeError);
    expect(() => reorder(list, 1.5, 0)).toThrow(RangeError);
  });
});

describe("normalizeOrders", () => {
  it("assigns contiguous 0..n-1 order values", () => {
    const result = normalizeOrders([{ id: "x" }, { id: "y" }, { id: "z" }]);
    expect(result).toEqual([
      { id: "x", order: 0 },
      { id: "y", order: 1 },
      { id: "z", order: 2 },
    ]);
  });
});
