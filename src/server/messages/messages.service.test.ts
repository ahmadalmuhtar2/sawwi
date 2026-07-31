import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionClaims } from "@/server/access/access.rules";

// Mock both repositories the service composes — no DB, no Prisma client load.
vi.mock("./messages.repository", () => ({
  messagesRepository: {
    siteGateBySlug: vi.fn(),
    create: vi.fn(),
    countRecentByIp: vi.fn().mockResolvedValue(0),
    countRecentBySite: vi.fn().mockResolvedValue(0),
    findById: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock("@/server/sites/sites.repository", () => ({
  sitesRepository: { findById: vi.fn() },
}));

import { messagesRepository } from "./messages.repository";
import { sitesRepository } from "@/server/sites/sites.repository";
import { submitMessage, setMessageStatus } from "./messages.service";

// A published, un-paused, paid-through site → accepts messages.
const servedSite = {
  id: "s1",
  status: "published" as const,
  maintenanceMode: false,
  subscription: { expiry: new Date(Date.now() + 86_400_000) },
};

const submit = { slug: "cafe", name: "زائر", contact: "0999", body: "مرحبا", company: "" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(messagesRepository.countRecentByIp).mockResolvedValue(0);
  vi.mocked(messagesRepository.countRecentBySite).mockResolvedValue(0);
});

describe("submitMessage (public)", () => {
  it("silently drops a honeypot hit without storing anything", async () => {
    await expect(submitMessage({ ...submit, company: "ACME" }, "1.2.3.4")).resolves.toEqual({
      ok: true,
    });
    expect(messagesRepository.siteGateBySlug).not.toHaveBeenCalled();
    expect(messagesRepository.create).not.toHaveBeenCalled();
  });

  it("404s for an unknown slug and never stores", async () => {
    vi.mocked(messagesRepository.siteGateBySlug).mockResolvedValue(null);
    await expect(submitMessage(submit, "1.2.3.4")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(messagesRepository.create).not.toHaveBeenCalled();
  });

  it("404s for a draft (unserved) site", async () => {
    vi.mocked(messagesRepository.siteGateBySlug).mockResolvedValue({
      ...servedSite,
      status: "draft",
    });
    await expect(submitMessage(submit, "1.2.3.4")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(messagesRepository.create).not.toHaveBeenCalled();
  });

  it("404s for an expired subscription", async () => {
    vi.mocked(messagesRepository.siteGateBySlug).mockResolvedValue({
      ...servedSite,
      subscription: { expiry: new Date(Date.now() - 1000) },
    });
    await expect(submitMessage(submit, "1.2.3.4")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rate-limits once a single IP passes the window cap", async () => {
    vi.mocked(messagesRepository.siteGateBySlug).mockResolvedValue(servedSite);
    vi.mocked(messagesRepository.countRecentByIp).mockResolvedValue(5);
    await expect(submitMessage(submit, "1.2.3.4")).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(messagesRepository.create).not.toHaveBeenCalled();
  });

  it("stores a valid lead for a served site (with a hashed IP, never the raw IP)", async () => {
    vi.mocked(messagesRepository.siteGateBySlug).mockResolvedValue(servedSite);
    await expect(submitMessage(submit, "1.2.3.4")).resolves.toEqual({ ok: true });
    expect(messagesRepository.create).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(messagesRepository.create).mock.calls[0][0];
    expect(arg.siteId).toBe("s1");
    expect(arg.ipHash).toBeTruthy();
    expect(arg.ipHash).not.toBe("1.2.3.4"); // stored as a hash, not the address
  });
});

describe("setMessageStatus (dashboard authz)", () => {
  const viewer: SessionClaims = {
    userId: "u_view",
    platformRole: "user",
    workspaces: [],
    siteAccess: [{ siteId: "s1", level: "viewer", builderAccess: false }],
  };
  const member: SessionClaims = {
    userId: "u_mem",
    platformRole: "user",
    workspace: { id: "ws1", role: "member", kind: "reseller" },
    workspaces: [{ id: "ws1", role: "member", kind: "reseller" }],
    siteAccess: [],
  };

  it("forbids a read-only viewer from mutating a message", async () => {
    vi.mocked(sitesRepository.findById).mockResolvedValue({ id: "s1", workspaceId: "ws1" } as never);
    await expect(setMessageStatus(viewer, "s1", "m1", "read")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(messagesRepository.updateStatus).not.toHaveBeenCalled();
  });

  it("404s when the message belongs to a different site (no cross-site writes)", async () => {
    vi.mocked(sitesRepository.findById).mockResolvedValue({ id: "s1", workspaceId: "ws1" } as never);
    vi.mocked(messagesRepository.findById).mockResolvedValue({ id: "m1", siteId: "OTHER" } as never);
    await expect(setMessageStatus(member, "s1", "m1", "read")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(messagesRepository.updateStatus).not.toHaveBeenCalled();
  });
});
