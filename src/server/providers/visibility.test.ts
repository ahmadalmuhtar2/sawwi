import { describe, expect, it } from "vitest";
import { MIN_RATINGS_TO_SHOW_SCORE, isProfilePublic, isRatingVisible } from "./visibility";

const activeVerified = {
  profilePublic: true,
  status: "ACTIVE",
  verifiedAt: new Date("2026-01-01"),
  ratingCount: 0,
};

describe("isProfilePublic", () => {
  it("is public only when the flag, opt-in, ACTIVE status, and verification all hold", () => {
    expect(isProfilePublic({ publicProfilesEnabled: true }, activeVerified)).toBe(true);
  });

  it("is hidden when the site master switch is off", () => {
    expect(isProfilePublic({ publicProfilesEnabled: false }, activeVerified)).toBe(false);
  });

  it("is hidden when the provider hasn't opted in", () => {
    expect(isProfilePublic({ publicProfilesEnabled: true }, { ...activeVerified, profilePublic: false })).toBe(false);
  });

  it("is hidden when not ACTIVE", () => {
    for (const status of ["DRAFT", "PAUSED", "REMOVED"]) {
      expect(isProfilePublic({ publicProfilesEnabled: true }, { ...activeVerified, status })).toBe(false);
    }
  });

  it("is hidden when unverified", () => {
    expect(isProfilePublic({ publicProfilesEnabled: true }, { ...activeVerified, verifiedAt: null })).toBe(false);
  });
});

describe("isRatingVisible", () => {
  it(`hides the score below ${MIN_RATINGS_TO_SHOW_SCORE} ratings`, () => {
    for (let n = 0; n < MIN_RATINGS_TO_SHOW_SCORE; n++) {
      expect(isRatingVisible({ ratingCount: n })).toBe(false);
    }
  });

  it(`shows the score at ${MIN_RATINGS_TO_SHOW_SCORE}+ ratings`, () => {
    expect(isRatingVisible({ ratingCount: MIN_RATINGS_TO_SHOW_SCORE })).toBe(true);
    expect(isRatingVisible({ ratingCount: MIN_RATINGS_TO_SHOW_SCORE + 10 })).toBe(true);
  });
});
