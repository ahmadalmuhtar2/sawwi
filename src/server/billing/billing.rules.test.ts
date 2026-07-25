import { describe, expect, it } from "vitest";
import {
  addYears,
  applyPayment,
  computeCommission,
  computeSubscriptionStatus,
  daysUntil,
  displayStatus,
  dueRenewalAlert,
  GRACE_DAYS,
  isServable,
  isSiteLive,
  canPublishWithSubscription,
} from "./billing.rules";

const DAY = 24 * 60 * 60 * 1000;
const expiry = new Date("2026-06-01T00:00:00.000Z");

describe("computeSubscriptionStatus", () => {
  it("is active up to and including the expiry instant", () => {
    expect(computeSubscriptionStatus(expiry, new Date("2026-05-31T00:00:00Z"))).toBe("active");
    expect(computeSubscriptionStatus(expiry, expiry)).toBe("active");
  });

  it("is grace within the 7-day window after expiry (inclusive boundary)", () => {
    expect(computeSubscriptionStatus(expiry, new Date(expiry.getTime() + DAY))).toBe("grace");
    expect(
      computeSubscriptionStatus(expiry, new Date(expiry.getTime() + GRACE_DAYS * DAY)),
    ).toBe("grace");
  });

  it("is suspended once past the grace window", () => {
    expect(
      computeSubscriptionStatus(expiry, new Date(expiry.getTime() + GRACE_DAYS * DAY + 1)),
    ).toBe("suspended");
  });
});

describe("isSiteLive / canPublishWithSubscription", () => {
  it("active and grace are live; suspended is not", () => {
    expect(isSiteLive("active")).toBe(true);
    expect(isSiteLive("grace")).toBe(true);
    expect(isSiteLive("suspended")).toBe(false);
  });

  it("only active may publish new snapshots", () => {
    expect(canPublishWithSubscription("active")).toBe(true);
    expect(canPublishWithSubscription("grace")).toBe(false);
    expect(canPublishWithSubscription("suspended")).toBe(false);
  });
});

describe("addYears", () => {
  it("adds a calendar year", () => {
    expect(addYears(new Date("2026-06-01T00:00:00Z"), 1).toISOString()).toBe(
      "2027-06-01T00:00:00.000Z",
    );
  });

  it("clamps Feb 29 to Feb 28 on a non-leap target year", () => {
    expect(addYears(new Date("2024-02-29T00:00:00Z"), 1).toISOString()).toBe(
      "2025-02-28T00:00:00.000Z",
    );
  });
});

describe("applyPayment", () => {
  it("stacks a year onto a still-active subscription", () => {
    const now = new Date("2026-05-01T00:00:00Z"); // before expiry
    expect(applyPayment(expiry, now).toISOString()).toBe("2027-06-01T00:00:00.000Z");
  });

  it("extends from now when the subscription already lapsed", () => {
    const now = new Date("2026-09-01T00:00:00Z"); // after expiry
    expect(applyPayment(expiry, now).toISOString()).toBe("2027-09-01T00:00:00.000Z");
  });
});

describe("computeCommission", () => {
  it("computes a percentage rounded to 2 decimals", () => {
    expect(computeCommission(100000, 15)).toBe(15000);
    expect(computeCommission(0, 20)).toBe(0);
    expect(computeCommission(50000, 100)).toBe(50000);
    expect(computeCommission(333, 10)).toBe(33.3);
  });

  it("rejects out-of-range pct and negative amounts", () => {
    expect(() => computeCommission(100, -1)).toThrow();
    expect(() => computeCommission(100, 101)).toThrow();
    expect(() => computeCommission(-1, 10)).toThrow();
    expect(() => computeCommission(Number.NaN, 10)).toThrow();
  });
});

describe("dueRenewalAlert", () => {
  it("fires the 7-day alert entering the window", () => {
    expect(dueRenewalAlert(expiry, new Date(expiry.getTime() - 7 * DAY))).toBe(7);
    expect(dueRenewalAlert(expiry, new Date(expiry.getTime() - 5 * DAY))).toBe(7);
  });

  it("upgrades to the 3-day then 1-day alert (most urgent wins)", () => {
    expect(dueRenewalAlert(expiry, new Date(expiry.getTime() - 3 * DAY))).toBe(3);
    expect(dueRenewalAlert(expiry, new Date(expiry.getTime() - 2 * DAY))).toBe(3);
    expect(dueRenewalAlert(expiry, new Date(expiry.getTime() - 1 * DAY))).toBe(1);
  });

  it("is null well before the window and after expiry", () => {
    expect(dueRenewalAlert(expiry, new Date(expiry.getTime() - 8 * DAY))).toBeNull();
    expect(dueRenewalAlert(expiry, new Date(expiry.getTime() + DAY))).toBeNull();
  });
});

describe("serving gate — stop exactly on the expiry date (no grace)", () => {
  it("is servable up to and including expiry, not after", () => {
    expect(isServable(expiry, new Date(expiry.getTime() - DAY))).toBe(true);
    expect(isServable(expiry, expiry)).toBe(true);
    expect(isServable(expiry, new Date(expiry.getTime() + 1))).toBe(false);
  });
});

describe("daysUntil / displayStatus", () => {
  it("counts whole days remaining", () => {
    expect(daysUntil(expiry, new Date(expiry.getTime() - 3 * DAY))).toBe(3);
    expect(daysUntil(expiry, new Date(expiry.getTime() + 2 * DAY))).toBe(-2);
  });

  it("maps to active / expiring (≤7d) / expired", () => {
    expect(displayStatus(expiry, new Date(expiry.getTime() - 30 * DAY))).toBe("active");
    expect(displayStatus(expiry, new Date(expiry.getTime() - 5 * DAY))).toBe("expiring");
    expect(displayStatus(expiry, new Date(expiry.getTime() + DAY))).toBe("expired");
  });
});
