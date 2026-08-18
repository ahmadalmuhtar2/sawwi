import { beforeEach, describe, expect, it, vi } from "vitest";

// Authorize + resolve access without hitting the DB.
vi.mock("@/server/sites/sites.service", () => ({ getSite: vi.fn(async () => ({ id: "site1", workspaceId: "w1" })) }));
vi.mock("@/server/access/access.rules", () => ({ resolveSiteAccess: () => ({ canEditSettings: true, canView: true }) }));
vi.mock("@/server/providers/providers.service", () => ({ providerExistsInSite: vi.fn(async () => true) }));
vi.mock("./jobs.repository", () => ({ PAGE_SIZE: 50, jobsRepository: { getById: vi.fn() } }));

import { jobsRepository as repo } from "./jobs.repository";
import { recordRating } from "./jobs.service";

const claims = { userId: "u1" } as never;
const baseInput = { score: 5, source: "FOLLOW_UP_CALL" as const };

async function code(fn: () => Promise<unknown>): Promise<string | undefined> {
  try {
    await fn();
  } catch (e) {
    return (e as { code?: string }).code;
  }
  return undefined;
}

beforeEach(() => vi.clearAllMocks());

describe("recordRating integrity rules", () => {
  it("404s an unknown job", async () => {
    vi.mocked(repo.getById).mockResolvedValue(null as never);
    expect(await code(() => recordRating(claims, "site1", "nope", baseInput))).toBe("NOT_FOUND");
  });

  it("rejects a job that is not COMPLETED", async () => {
    vi.mocked(repo.getById).mockResolvedValue({ status: "IN_PROGRESS", followedUpAt: new Date(), providerId: "p1", rating: null } as never);
    expect(await code(() => recordRating(claims, "site1", "j1", baseInput))).toBe("VALIDATION_ERROR");
  });

  it("rejects a COMPLETED job whose follow-up never happened", async () => {
    vi.mocked(repo.getById).mockResolvedValue({ status: "COMPLETED", followedUpAt: null, providerId: "p1", rating: null } as never);
    expect(await code(() => recordRating(claims, "site1", "j1", baseInput))).toBe("VALIDATION_ERROR");
  });

  it("rejects a second rating for the same job", async () => {
    vi.mocked(repo.getById).mockResolvedValue({ status: "COMPLETED", followedUpAt: new Date(), providerId: "p1", rating: { id: "r1" } } as never);
    expect(await code(() => recordRating(claims, "site1", "j1", baseInput))).toBe("CONFLICT");
  });
});
