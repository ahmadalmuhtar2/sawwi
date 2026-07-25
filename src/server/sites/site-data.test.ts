import { describe, it, expect } from "vitest";
import { toRenderData } from "./site-data";

// Breaking scenarios only: what must never regress in the render mapper.
describe("toRenderData", () => {
  it("excludes hidden services so they never leak into a rendered/published site", () => {
    const data = toRenderData({
      businessName: "متجر",
      services: [
        { id: "a", name: "ظاهرة", visible: true },
        { id: "b", name: "مخفية", visible: false },
      ],
    });
    expect(data.services.map((s) => s.id)).toEqual(["a"]);
  });

  it("tolerates a missing settings block without throwing (nulls + empty maps)", () => {
    const data = toRenderData({ businessName: "متجر" });
    expect(data.settings.whatsappNumber).toBeNull();
    expect(data.settings.openingHours).toEqual({});
    expect(data.settings.socials).toEqual({});
    expect(data.services).toEqual([]);
    expect(data.team).toEqual([]);
  });
});
