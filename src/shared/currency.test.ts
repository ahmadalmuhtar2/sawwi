import { describe, expect, it } from "vitest";
import { priceNumber, formatArabicAmount } from "./currency";

describe("priceNumber", () => {
  it("reads Arabic-Indic amounts with a thousands separator", () => {
    expect(priceNumber("٢٥٬٠٠٠")).toBe(25000);
    expect(priceNumber("١٬٠٠٠")).toBe(1000);
  });

  it("reads Latin digits and strips currency + separators", () => {
    expect(priceNumber("25,000")).toBe(25000);
    expect(priceNumber("١٥٠٠٠ ل.س")).toBe(15000);
    expect(priceNumber("$50")).toBe(50);
  });

  it("returns null when there is no number (e.g. a quote price)", () => {
    expect(priceNumber("حسب الطلب")).toBeNull();
    expect(priceNumber("")).toBeNull();
    expect(priceNumber(null)).toBeNull();
    expect(priceNumber(undefined)).toBeNull();
  });
});

describe("formatArabicAmount", () => {
  it("groups thousands with the Arabic separator and localizes digits", () => {
    expect(formatArabicAmount(65000)).toBe("٦٥٬٠٠٠");
    expect(formatArabicAmount(1000)).toBe("١٬٠٠٠");
    expect(formatArabicAmount(250)).toBe("٢٥٠");
    expect(formatArabicAmount(0)).toBe("٠");
  });

  it("rounds fractional sums (prices are whole units)", () => {
    expect(formatArabicAmount(1499.6)).toBe("١٬٥٠٠");
  });
});
