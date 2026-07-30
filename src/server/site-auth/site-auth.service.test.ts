import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionClaims } from "@/server/access/access.rules";

// Deterministic crypto — no real scrypt in unit tests.
vi.mock("better-auth/crypto", () => ({
  hashPassword: vi.fn(async (p: string) => `H(${p})`),
  verifyPassword: vi.fn(async ({ hash, password }: { hash: string; password: string }) => hash === `H(${password})`),
  generateRandomString: vi.fn(() => "tok-123"),
}));
vi.mock("./site-auth.repository", () => ({
  siteAuthRepository: {
    siteGateBySlug: vi.fn(),
    findUser: vi.fn(),
    findUserById: vi.fn(),
    createUser: vi.fn(),
    createSession: vi.fn(),
    findSession: vi.fn(),
    deleteSession: vi.fn(),
    listUsers: vi.fn(),
    updateRole: vi.fn(),
    deleteUser: vi.fn(),
    countRecentBySite: vi.fn().mockResolvedValue(0),
  },
}));
vi.mock("@/server/sites/sites.repository", () => ({
  sitesRepository: { findById: vi.fn() },
}));

import { siteAuthRepository } from "./site-auth.repository";
import { sitesRepository } from "@/server/sites/sites.repository";
import { register, login, currentUser, setSiteUserRole } from "./site-auth.service";

const HOST = "shop.localhost"; // → slug "shop" (ROOT_HOST=localhost in tests)
const served = {
  id: "s1",
  status: "published" as const,
  maintenanceMode: false,
  subscription: null,
  settings: { authEnabled: true, roleLabels: {} },
};
const reg = { email: "a@b.com", password: "password123", name: "زائر" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(siteAuthRepository.countRecentBySite).mockResolvedValue(0);
  vi.mocked(siteAuthRepository.createUser).mockResolvedValue({ id: "u1", email: reg.email, name: reg.name, role: "member" } as never);
  vi.mocked(siteAuthRepository.siteGateBySlug).mockResolvedValue(served as never);
});

describe("register (public)", () => {
  it("silently drops a honeypot hit (no gate, no create)", async () => {
    await expect(register(HOST, { ...reg, company: "ACME" }, "1.2.3.4")).resolves.toEqual({ user: null, token: null });
    expect(siteAuthRepository.createUser).not.toHaveBeenCalled();
  });

  it("404s when auth is disabled for the site", async () => {
    vi.mocked(siteAuthRepository.siteGateBySlug).mockResolvedValue({ ...served, settings: { authEnabled: false, roleLabels: {} } } as never);
    await expect(register(HOST, reg, "1.2.3.4")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(siteAuthRepository.createUser).not.toHaveBeenCalled();
  });

  it("404s for a draft (unserved) site", async () => {
    vi.mocked(siteAuthRepository.siteGateBySlug).mockResolvedValue({ ...served, status: "draft" } as never);
    await expect(register(HOST, reg, "1.2.3.4")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("conflicts on a duplicate email", async () => {
    vi.mocked(siteAuthRepository.findUser).mockResolvedValue({ id: "existing" } as never);
    await expect(register(HOST, reg, "1.2.3.4")).rejects.toMatchObject({ code: "CONFLICT" });
    expect(siteAuthRepository.createUser).not.toHaveBeenCalled();
  });

  it("creates a MEMBER + mints a session on success", async () => {
    vi.mocked(siteAuthRepository.findUser).mockResolvedValue(null);
    const res = await register(HOST, reg, "1.2.3.4");
    expect(res.token).toBe("tok-123");
    expect(res.user?.role).toBe("member");
    expect(vi.mocked(siteAuthRepository.createUser).mock.calls[0][0]).toMatchObject({ siteId: "s1", role: "member" });
    expect(siteAuthRepository.createSession).toHaveBeenCalled();
  });
});

describe("login (public)", () => {
  it("rejects a wrong password uniformly (UNAUTHORIZED)", async () => {
    vi.mocked(siteAuthRepository.findUser).mockResolvedValue({ id: "u1", passwordHash: "H(correct)" } as never);
    await expect(login(HOST, { email: "a@b.com", password: "wrong" }, "1.2.3.4")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(siteAuthRepository.createSession).not.toHaveBeenCalled();
  });

  it("signs in with the correct password", async () => {
    vi.mocked(siteAuthRepository.findUser).mockResolvedValue({ id: "u1", email: "a@b.com", name: null, role: "member", passwordHash: "H(password123)" } as never);
    const res = await login(HOST, { email: "a@b.com", password: "password123" }, "1.2.3.4");
    expect(res.token).toBe("tok-123");
  });
});

describe("currentUser — cross-site isolation", () => {
  it("rejects a session minted for a DIFFERENT site", async () => {
    vi.mocked(siteAuthRepository.findSession).mockResolvedValue({
      siteId: "OTHER",
      expiresAt: new Date(Date.now() + 1000),
      siteUser: { id: "u1", email: "a@b.com", name: null, role: "member" },
    } as never);
    const { user } = await currentUser(HOST, "tok-123");
    expect(user).toBeNull();
  });
});

describe("setSiteUserRole (owner authz)", () => {
  const member: SessionClaims = {
    userId: "o1", platformRole: "user",
    workspace: { id: "ws1", role: "member", kind: "reseller" },
    workspaces: [{ id: "ws1", role: "member", kind: "reseller" }],
    siteAccess: [],
  };
  const viewer: SessionClaims = {
    userId: "o2", platformRole: "user", workspaces: [],
    siteAccess: [{ siteId: "s1", level: "viewer", builderAccess: false }],
  };

  it("forbids a read-only viewer", async () => {
    vi.mocked(sitesRepository.findById).mockResolvedValue({ id: "s1", workspaceId: "ws1" } as never);
    await expect(setSiteUserRole(viewer, "s1", "u1", "manager")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(siteAuthRepository.updateRole).not.toHaveBeenCalled();
  });

  it("404s for a user belonging to another site", async () => {
    vi.mocked(sitesRepository.findById).mockResolvedValue({ id: "s1", workspaceId: "ws1" } as never);
    vi.mocked(siteAuthRepository.findUserById).mockResolvedValue({ id: "u1", siteId: "OTHER" } as never);
    await expect(setSiteUserRole(member, "s1", "u1", "manager")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(siteAuthRepository.updateRole).not.toHaveBeenCalled();
  });
});
