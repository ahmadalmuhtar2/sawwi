import { describe, expect, it } from "vitest";
import { canPublish, nextSnapshotVersion } from "./publishing.rules";

describe("canPublish", () => {
  it("allows when permitted AND subscription active", () => {
    expect(canPublish({ canPublish: true }, "active")).toEqual({ ok: true });
  });

  it("blocks when the caller lacks publish permission", () => {
    expect(canPublish({ canPublish: false }, "active")).toEqual({
      ok: false,
      reason: "not_permitted",
    });
  });

  it("blocks a draft site with no subscription", () => {
    expect(canPublish({ canPublish: true }, null)).toEqual({
      ok: false,
      reason: "no_active_subscription",
    });
  });

  it("blocks when in grace or suspended (only active may publish)", () => {
    expect(canPublish({ canPublish: true }, "grace").ok).toBe(false);
    expect(canPublish({ canPublish: true }, "suspended").ok).toBe(false);
  });

  it("permission failure takes precedence over subscription", () => {
    expect(canPublish({ canPublish: false }, null)).toEqual({
      ok: false,
      reason: "not_permitted",
    });
  });
});

describe("nextSnapshotVersion", () => {
  it("starts at 1 for the first publish", () => {
    expect(nextSnapshotVersion(null)).toBe(1);
  });

  it("increments monotonically", () => {
    expect(nextSnapshotVersion(1)).toBe(2);
    expect(nextSnapshotVersion(41)).toBe(42);
  });

  it("rejects invalid latest versions", () => {
    expect(() => nextSnapshotVersion(-1)).toThrow(RangeError);
    expect(() => nextSnapshotVersion(1.5)).toThrow(RangeError);
  });
});
