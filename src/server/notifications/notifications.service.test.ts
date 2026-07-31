import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionClaims } from "@/server/access/access.rules";

vi.mock("./notifications.repository", () => ({
  notificationsRepository: {
    recipientsForSite: vi.fn(),
    createMany: vi.fn(),
    listForUser: vi.fn(),
    countUnread: vi.fn(),
    markRead: vi.fn(),
  },
}));

import { notificationsRepository } from "./notifications.repository";
import { notifySiteMessage, markNotificationsRead } from "./notifications.service";

const claims: SessionClaims = {
  userId: "u1",
  platformRole: "user",
  workspaces: [],
  siteAccess: [],
};

beforeEach(() => vi.clearAllMocks());

describe("notifySiteMessage", () => {
  it("does nothing when the site has no recipients (no rows written)", async () => {
    vi.mocked(notificationsRepository.recipientsForSite).mockResolvedValue([]);
    await expect(notifySiteMessage("s1", { name: "زائر", body: "مرحبا" })).resolves.toBe(0);
    expect(notificationsRepository.createMany).not.toHaveBeenCalled();
  });

  it("fans one notification out to every recipient, each linked to the inbox", async () => {
    vi.mocked(notificationsRepository.recipientsForSite).mockResolvedValue(["a", "b", "c"]);
    vi.mocked(notificationsRepository.createMany).mockResolvedValue({ count: 3 });
    const n = await notifySiteMessage("s1", { name: "سامر", body: "أريد حجز موعد" });
    expect(n).toBe(3);
    const rows = vi.mocked(notificationsRepository.createMany).mock.calls[0][0];
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.userId)).toEqual(["a", "b", "c"]);
    expect(rows.every((r) => r.type === "site_message")).toBe(true);
    expect(rows.every((r) => r.link === "/dashboard/sites/s1/messages")).toBe(true);
    expect(rows.every((r) => r.siteId === "s1")).toBe(true);
  });
});

describe("markNotificationsRead", () => {
  it("scopes the read to the caller's own userId (never another user's rows)", async () => {
    vi.mocked(notificationsRepository.countUnread).mockResolvedValue(0);
    await markNotificationsRead(claims, "n9");
    expect(notificationsRepository.markRead).toHaveBeenCalledWith("u1", "n9", expect.any(Date));
  });
});
