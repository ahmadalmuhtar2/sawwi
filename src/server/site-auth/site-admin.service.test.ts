import { beforeEach, describe, expect, it, vi } from "vitest";

// adminContext (the manager gate) is unit-tested in site-auth.service.test.ts;
// here we mock it to a successful manager and focus on the GUARDRAILS.
vi.mock("./site-auth.service", () => ({
  adminContext: vi.fn(),
  issueTempPassword: vi.fn(async () => "temp-xyz"),
}));
vi.mock("./site-auth.repository", () => ({
  siteAuthRepository: {
    listUsers: vi.fn(),
    findUserById: vi.fn(),
    updateRole: vi.fn(),
    deleteUser: vi.fn(),
  },
}));
vi.mock("@/server/listings/listings.service", () => ({
  createListingForSite: vi.fn(),
  updateListingForSite: vi.fn(),
  deleteListingForSite: vi.fn(),
}));
vi.mock("@/server/listings/listings.repository", () => ({
  listingsRepository: { listBySite: vi.fn() },
}));

import { adminContext } from "./site-auth.service";
import { siteAuthRepository } from "./site-auth.repository";
import { createListingForSite } from "@/server/listings/listings.service";
import {
  adminSetRole,
  adminResetPassword,
  adminDeleteUser,
  adminCreateListing,
} from "./site-admin.service";

const HOST = "shop.localhost";
const TOKEN = "tok-mgr";
// The signed-in manager doing the managing.
const ctx = { site: { id: "s1" }, caller: { id: "m1", email: "m@b.com", name: null, role: "manager" } };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(adminContext).mockResolvedValue(ctx as never);
});

describe("adminSetRole guardrails", () => {
  it("changes a member's role to contributor", async () => {
    vi.mocked(siteAuthRepository.findUserById).mockResolvedValue({ id: "u2", siteId: "s1", role: "member" } as never);
    await adminSetRole(HOST, TOKEN, "u2", "contributor");
    expect(siteAuthRepository.updateRole).toHaveBeenCalledWith("u2", "contributor");
  });

  it("refuses to promote anyone to manager (owner-only)", async () => {
    await expect(adminSetRole(HOST, TOKEN, "u2", "manager")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(siteAuthRepository.findUserById).not.toHaveBeenCalled();
    expect(siteAuthRepository.updateRole).not.toHaveBeenCalled();
  });

  it("refuses to modify another manager", async () => {
    vi.mocked(siteAuthRepository.findUserById).mockResolvedValue({ id: "u2", siteId: "s1", role: "manager" } as never);
    await expect(adminSetRole(HOST, TOKEN, "u2", "member")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(siteAuthRepository.updateRole).not.toHaveBeenCalled();
  });

  it("refuses to modify oneself", async () => {
    vi.mocked(siteAuthRepository.findUserById).mockResolvedValue({ id: "m1", siteId: "s1", role: "manager" } as never);
    await expect(adminSetRole(HOST, TOKEN, "m1", "member")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("404s for a user from another site", async () => {
    vi.mocked(siteAuthRepository.findUserById).mockResolvedValue({ id: "u2", siteId: "OTHER", role: "member" } as never);
    await expect(adminSetRole(HOST, TOKEN, "u2", "member")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("adminResetPassword guardrails", () => {
  it("resets a member's password, returning the temp once", async () => {
    vi.mocked(siteAuthRepository.findUserById).mockResolvedValue({ id: "u2", siteId: "s1", role: "member" } as never);
    await expect(adminResetPassword(HOST, TOKEN, "u2")).resolves.toEqual({ id: "u2", tempPassword: "temp-xyz" });
  });

  it("refuses to reset another manager", async () => {
    vi.mocked(siteAuthRepository.findUserById).mockResolvedValue({ id: "u2", siteId: "s1", role: "manager" } as never);
    await expect(adminResetPassword(HOST, TOKEN, "u2")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("adminDeleteUser guardrails", () => {
  it("refuses to delete oneself", async () => {
    vi.mocked(siteAuthRepository.findUserById).mockResolvedValue({ id: "m1", siteId: "s1", role: "manager" } as never);
    await expect(adminDeleteUser(HOST, TOKEN, "m1")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(siteAuthRepository.deleteUser).not.toHaveBeenCalled();
  });

  it("deletes a contributor", async () => {
    vi.mocked(siteAuthRepository.findUserById).mockResolvedValue({ id: "u2", siteId: "s1", role: "contributor" } as never);
    await expect(adminDeleteUser(HOST, TOKEN, "u2")).resolves.toEqual({ id: "u2", deleted: true });
  });
});

describe("adminCreateListing", () => {
  it("delegates to the shared site-scoped core with the manager's site id", async () => {
    const input = { vertical: "car", title: "كامري" } as never;
    await adminCreateListing(HOST, TOKEN, input);
    expect(createListingForSite).toHaveBeenCalledWith("s1", input);
  });

  it("propagates an authorization failure from adminContext", async () => {
    vi.mocked(adminContext).mockRejectedValueOnce(Object.assign(new Error("no"), { code: "FORBIDDEN" }));
    await expect(adminCreateListing(HOST, TOKEN, {} as never)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(createListingForSite).not.toHaveBeenCalled();
  });
});
