import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionClaims } from "@/server/access/access.rules";

vi.mock("./listings.repository", () => ({
  listingsRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countBySite: vi.fn().mockResolvedValue(0),
    listBySite: vi.fn(),
    listPublished: vi.fn(),
  },
}));
vi.mock("@/server/sites/sites.repository", () => ({
  sitesRepository: { findById: vi.fn() },
}));
// Storage cleanup would try to reach R2 — stub it out.
vi.mock("@/lib/storage-cleanup", () => ({ deleteRemovedObjects: vi.fn() }));

import { listingsRepository } from "./listings.repository";
import { sitesRepository } from "@/server/sites/sites.repository";
import {
  createListing,
  updateListing,
  deleteListing,
  setListingPublished,
} from "./listings.service";

const member: SessionClaims = {
  userId: "u1",
  platformRole: "user",
  workspace: { id: "ws1", role: "member", kind: "reseller" },
  workspaces: [{ id: "ws1", role: "member", kind: "reseller" }],
  siteAccess: [],
};
const viewer: SessionClaims = {
  userId: "u2",
  platformRole: "user",
  workspaces: [],
  siteAccess: [{ siteId: "s1", level: "viewer", builderAccess: false }],
};

const input = { vertical: "car" as const, title: "BMW 320d", images: [], features: [], specs: {} };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listingsRepository.countBySite).mockResolvedValue(0);
  vi.mocked(sitesRepository.findById).mockResolvedValue({ id: "s1", workspaceId: "ws1" } as never);
});

describe("createListing", () => {
  it("forbids a read-only viewer", async () => {
    await expect(createListing(viewer, "s1", input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(listingsRepository.create).not.toHaveBeenCalled();
  });

  it("rejects creation past the per-site cap", async () => {
    vi.mocked(listingsRepository.countBySite).mockResolvedValue(500);
    await expect(createListing(member, "s1", input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(listingsRepository.create).not.toHaveBeenCalled();
  });

  it("creates a listing for an authorized member (unpublished by default)", async () => {
    vi.mocked(listingsRepository.create).mockResolvedValue({ id: "l1" } as never);
    await createListing(member, "s1", input);
    const data = vi.mocked(listingsRepository.create).mock.calls[0][0];
    expect(data.siteId).toBe("s1");
    expect(data.published).toBe(false);
  });
});

describe("cross-site safety", () => {
  it("update 404s when the listing belongs to another site", async () => {
    vi.mocked(listingsRepository.findById).mockResolvedValue({ id: "l1", siteId: "OTHER" } as never);
    await expect(updateListing(member, "s1", "l1", { title: "x" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(listingsRepository.update).not.toHaveBeenCalled();
  });

  it("delete 404s when the listing belongs to another site", async () => {
    vi.mocked(listingsRepository.findById).mockResolvedValue({ id: "l1", siteId: "OTHER" } as never);
    await expect(deleteListing(member, "s1", "l1")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(listingsRepository.delete).not.toHaveBeenCalled();
  });
});

describe("setListingPublished", () => {
  it("forbids a viewer from publishing", async () => {
    await expect(setListingPublished(viewer, "s1", "l1", true)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(listingsRepository.update).not.toHaveBeenCalled();
  });
});
