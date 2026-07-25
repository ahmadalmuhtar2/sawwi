import { describe, expect, it } from "vitest";
import { isValidTime, validateOpeningHours, type OpeningHours } from "./hours.rules";

describe("isValidTime", () => {
  it("accepts valid 24h HH:MM", () => {
    expect(isValidTime("00:00")).toBe(true);
    expect(isValidTime("09:30")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
  });

  it("rejects malformed or out-of-range times", () => {
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("9:30")).toBe(false); // needs leading zero
    expect(isValidTime("12:60")).toBe(false);
    expect(isValidTime("noon")).toBe(false);
  });
});

describe("validateOpeningHours", () => {
  it("accepts a well-formed week with open days and closed days", () => {
    const hours: OpeningHours = {
      mon: { open: "09:00", close: "17:00" },
      fri: { closed: true },
      // other days unspecified
    };
    expect(validateOpeningHours(hours)).toEqual({ ok: true });
  });

  it("accepts an empty object (nothing specified yet)", () => {
    expect(validateOpeningHours({})).toEqual({ ok: true });
  });

  it("flags bad time formats", () => {
    const result = validateOpeningHours({ mon: { open: "9am", close: "17:00" } });
    expect(result).toEqual({
      ok: false,
      errors: [{ day: "mon", error: "bad_time" }],
    });
  });

  it("flags close not strictly after open (incl. equal)", () => {
    const result = validateOpeningHours({
      tue: { open: "17:00", close: "09:00" },
      wed: { open: "10:00", close: "10:00" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContainEqual({
        day: "tue",
        error: "close_not_after_open",
      });
      expect(result.errors).toContainEqual({
        day: "wed",
        error: "close_not_after_open",
      });
    }
  });

  it("does not validate times for closed days", () => {
    // A closed day carries no open/close, so it can never error.
    expect(validateOpeningHours({ sun: { closed: true } })).toEqual({ ok: true });
  });
});
