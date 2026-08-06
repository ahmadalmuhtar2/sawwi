import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./visits.repository", () => ({
  visitsRepository: {
    recordSession: vi.fn(),
    countBySites: vi.fn(),
  },
}));

import { visitsRepository } from "./visits.repository";
import { recordVisit, visitCountsForSites } from "./visits.service";

beforeEach(() => vi.clearAllMocks());

describe("recordVisit", () => {
  it("records a visit for a (site, session) and reports it as new", async () => {
    vi.mocked(visitsRepository.recordSession).mockResolvedValue(true);
    await expect(recordVisit("s1", "sess-abc")).resolves.toBe(true);
    expect(visitsRepository.recordSession).toHaveBeenCalledWith("s1", "sess-abc");
  });

  it("does NOT recount a repeat pageview in the same session", async () => {
    vi.mocked(visitsRepository.recordSession).mockResolvedValue(false);
    await expect(recordVisit("s1", "sess-abc")).resolves.toBe(false);
  });

  it("counts distinct sessions independently", async () => {
    vi.mocked(visitsRepository.recordSession).mockResolvedValue(true);
    await recordVisit("s1", "sess-1");
    await recordVisit("s1", "sess-2");
    expect(visitsRepository.recordSession).toHaveBeenNthCalledWith(1, "s1", "sess-1");
    expect(visitsRepository.recordSession).toHaveBeenNthCalledWith(2, "s1", "sess-2");
  });
});

describe("visitCountsForSites", () => {
  it("delegates to the repository", async () => {
    vi.mocked(visitsRepository.countBySites).mockResolvedValue({ s1: 3 });
    await expect(visitCountsForSites(["s1"])).resolves.toEqual({ s1: 3 });
  });
});
