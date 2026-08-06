import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionClaims } from "@/server/access/access.rules";

vi.mock("./leads.repository", () => ({
  leadsRepository: {
    create: vi.fn(),
    list: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countRecentByIp: vi.fn(),
    countRecentGlobal: vi.fn(),
    countsByStatus: vi.fn(),
  },
}));
// Stub the admin notification so createLead never touches the DB/push layer.
vi.mock("@/server/notifications/notifications.service", () => ({
  notifyNewLead: vi.fn().mockResolvedValue(1),
}));

import { leadsRepository } from "./leads.repository";
import { notifyNewLead } from "@/server/notifications/notifications.service";
import { MAX_LEADS_GLOBAL, MAX_LEADS_PER_IP } from "./leads.rules";
import { createLead, listLeads, updateLead, deleteLead } from "./leads.service";

const admin: SessionClaims = { userId: "a1", platformRole: "admin", workspaces: [], siteAccess: [] };
const user: SessionClaims = { userId: "u1", platformRole: "user", workspaces: [], siteAccess: [] };

const okInput = { businessName: "صالون تاج", whatsapp: "0912345678", email: "" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(leadsRepository.countRecentByIp).mockResolvedValue(0);
  vi.mocked(leadsRepository.countRecentGlobal).mockResolvedValue(0);
  vi.mocked(leadsRepository.create).mockResolvedValue({
    id: "l1",
    businessName: "صالون تاج",
    whatsapp: "963912345678",
  } as never);
});

describe("createLead (public)", () => {
  it("drops honeypot hits silently — nothing stored, no notification", async () => {
    await expect(
      createLead({ ...okInput, company: "bot corp" }, "ip"),
    ).resolves.toEqual({ ok: true });
    expect(leadsRepository.create).not.toHaveBeenCalled();
    expect(notifyNewLead).not.toHaveBeenCalled();
  });

  it("rejects a non-Syrian / malformed WhatsApp number", async () => {
    await expect(createLead({ ...okInput, whatsapp: "12" }, "ip")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    expect(leadsRepository.create).not.toHaveBeenCalled();
  });

  it("normalizes the number, stores the lead, and notifies admins", async () => {
    await expect(createLead(okInput, "iphash")).resolves.toEqual({ ok: true });
    expect(leadsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ whatsapp: "963912345678", email: null, ipHash: "iphash" }),
    );
    expect(notifyNewLead).toHaveBeenCalledOnce();
  });

  it("rate-limits per IP once the window cap is hit", async () => {
    vi.mocked(leadsRepository.countRecentByIp).mockResolvedValue(MAX_LEADS_PER_IP);
    await expect(createLead(okInput, "iphash")).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(leadsRepository.create).not.toHaveBeenCalled();
  });

  it("rate-limits globally even when the IP is unknown", async () => {
    vi.mocked(leadsRepository.countRecentGlobal).mockResolvedValue(MAX_LEADS_GLOBAL);
    await expect(createLead(okInput, null)).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(leadsRepository.countRecentByIp).not.toHaveBeenCalled(); // skipped when ip is null
  });
});

describe("admin gate", () => {
  it("forbids a non-admin from listing leads", async () => {
    await expect(listLeads(user)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(leadsRepository.list).not.toHaveBeenCalled();
  });

  it("forbids a non-admin from updating a lead", async () => {
    await expect(updateLead(user, "l1", { status: "contacted" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("404s when updating a lead that doesn't exist", async () => {
    vi.mocked(leadsRepository.findById).mockResolvedValue(null);
    await expect(updateLead(admin, "nope", { status: "contacted" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(leadsRepository.update).not.toHaveBeenCalled();
  });

  it("404s when deleting a lead that doesn't exist", async () => {
    vi.mocked(leadsRepository.findById).mockResolvedValue(null);
    await expect(deleteLead(admin, "nope")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(leadsRepository.delete).not.toHaveBeenCalled();
  });
});

describe("updateLead field edits", () => {
  beforeEach(() => vi.mocked(leadsRepository.findById).mockResolvedValue({ id: "l1" } as never));

  it("normalizes the WhatsApp number on edit", async () => {
    await updateLead(admin, "l1", { whatsapp: "0912345678" });
    expect(leadsRepository.update).toHaveBeenCalledWith(
      "l1",
      expect.objectContaining({ whatsapp: "963912345678" }),
    );
  });

  it("rejects a malformed WhatsApp number on edit", async () => {
    await expect(updateLead(admin, "l1", { whatsapp: "12" })).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    expect(leadsRepository.update).not.toHaveBeenCalled();
  });

  it("clears the email when set to an empty string", async () => {
    await updateLead(admin, "l1", { email: "" });
    expect(leadsRepository.update).toHaveBeenCalledWith(
      "l1",
      expect.objectContaining({ email: null }),
    );
  });
});
