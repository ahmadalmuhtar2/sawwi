import { describe, expect, it } from "vitest";
import { isAppError } from "@/shared/errors";
import { assertSlugValid, isValidSlug, normalizeSlug } from "./sites.rules";

// Breaking scenarios only — the ways a slug can be wrong or dangerous.
describe("slug validation", () => {
  it("rejects the breakers (length, chars, edge/double hyphen, reserved)", () => {
    for (const bad of ["ab", "a".repeat(41), "Abu_Ali", "-shop", "shop-", "ab--cd", "app"]) {
      expect(isValidSlug(bad)).toBe(false);
    }
  });

  it("normalized output can still be invalid — callers must re-validate", () => {
    expect(isValidSlug(normalizeSlug("!!!"))).toBe(false);
  });

  it("assertSlugValid throws a field-scoped VALIDATION_ERROR", () => {
    try {
      assertSlugValid("app");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(isAppError(err)).toBe(true);
      if (isAppError(err)) {
        expect(err.code).toBe("VALIDATION_ERROR");
        expect(err.fields?.slug).toBeTruthy();
      }
    }
  });
});
