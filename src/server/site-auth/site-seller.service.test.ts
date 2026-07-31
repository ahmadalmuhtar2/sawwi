import { beforeEach, describe, expect, it, vi } from "vitest";

// authorContext (the can-author gate) is unit-tested in site-auth.service.test.ts;
// here we mock it to a signed-in seller and focus on OWN-ROW scoping.
vi.mock("./site-auth.service", () => ({ authorContext: vi.fn() }));
vi.mock("@/server/listings/listings.repository", () => ({
  listingsRepository: { findById: vi.fn(), listBySiteAndAuthor: vi.fn() },
}));
vi.mock("@/server/listings/listings.service", () => ({
  createListingForSite: vi.fn(),
  updateListingForSite: vi.fn(),
  deleteListingForSite: vi.fn(),
}));

import { authorContext } from "./site-auth.service";
import { listingsRepository } from "@/server/listings/listings.repository";
import { createListingForSite, updateListingForSite } from "@/server/listings/listings.service";
import { sellerCreate, sellerUpdate, sellerDelete } from "./site-seller.service";

const HOST = "shop.localhost";
const TOKEN = "tok-seller";
const ctx = { site: { id: "s1" }, caller: { id: "seller1", email: "s@b.com", name: null, role: "contributor" } };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authorContext).mockResolvedValue(ctx as never);
});

describe("sellerCreate", () => {
  it("stamps the caller as the listing's author", async () => {
    const input = { vertical: "car", title: "كامري" } as never;
    await sellerCreate(HOST, TOKEN, input);
    expect(createListingForSite).toHaveBeenCalledWith("s1", input, "seller1");
  });
});

describe("sellerUpdate — own-row scoping", () => {
  it("updates a listing the seller authored", async () => {
    vi.mocked(listingsRepository.findById).mockResolvedValue({ id: "l1", siteId: "s1", authorSiteUserId: "seller1" } as never);
    await sellerUpdate(HOST, TOKEN, "l1", { title: "جديد" } as never);
    expect(updateListingForSite).toHaveBeenCalledWith("s1", "l1", { title: "جديد" });
  });

  it("404s for a listing authored by someone else", async () => {
    vi.mocked(listingsRepository.findById).mockResolvedValue({ id: "l1", siteId: "s1", authorSiteUserId: "OTHER" } as never);
    await expect(sellerUpdate(HOST, TOKEN, "l1", {} as never)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(updateListingForSite).not.toHaveBeenCalled();
  });

  it("404s for a listing on another site", async () => {
    vi.mocked(listingsRepository.findById).mockResolvedValue({ id: "l1", siteId: "OTHER", authorSiteUserId: "seller1" } as never);
    await expect(sellerUpdate(HOST, TOKEN, "l1", {} as never)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("404s for an owner-authored listing (null author)", async () => {
    vi.mocked(listingsRepository.findById).mockResolvedValue({ id: "l1", siteId: "s1", authorSiteUserId: null } as never);
    await expect(sellerUpdate(HOST, TOKEN, "l1", {} as never)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("sellerDelete — own-row scoping", () => {
  it("404s for another author's listing", async () => {
    vi.mocked(listingsRepository.findById).mockResolvedValue({ id: "l1", siteId: "s1", authorSiteUserId: "OTHER" } as never);
    await expect(sellerDelete(HOST, TOKEN, "l1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
