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
    updatePassword: vi.fn(),
    updateProfile: vi.fn(),
    deleteSessionsForUser: vi.fn(),
    deleteUser: vi.fn(),
    countRecentBySite: vi.fn().mockResolvedValue(0),
  },
}));
vi.mock("@/server/sites/sites.repository", () => ({
  sitesRepository: { findById: vi.fn() },
}));

import { siteAuthRepository } from "./site-auth.repository";
import { sitesRepository } from "@/server/sites/sites.repository";
import { register, login, currentUser, setSiteUserRole, resetSiteUserPassword, adminContext, authorContext, updateOwnProfile } from "./site-auth.service";

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

  it("allows an auth-by-default template (marketplace) even with the toggle OFF", async () => {
    vi.mocked(siteAuthRepository.siteGateBySlug).mockResolvedValue(
      { ...served, templateKey: "marketplace", settings: { authEnabled: false, roleLabels: {} } } as never,
    );
    vi.mocked(siteAuthRepository.findUser).mockResolvedValue(null);
    const res = await register(HOST, reg, "1.2.3.4");
    expect(res.user?.role).toBe("member");
    expect(siteAuthRepository.createUser).toHaveBeenCalled();
  });

  it("creates a MEMBER + mints a session on success", async () => {
    vi.mocked(siteAuthRepository.findUser).mockResolvedValue(null);
    const res = await register(HOST, reg, "1.2.3.4");
    expect(res.token).toBe("tok-123");
    expect(res.user?.role).toBe("member");
    expect(vi.mocked(siteAuthRepository.createUser).mock.calls[0][0]).toMatchObject({ siteId: "s1", role: "member" });
    expect(siteAuthRepository.createSession).toHaveBeenCalled();
  });

  it("maps accountType 'seller' → contributor role", async () => {
    vi.mocked(siteAuthRepository.findUser).mockResolvedValue(null);
    await register(HOST, { ...reg, accountType: "seller" }, "1.2.3.4");
    expect(vi.mocked(siteAuthRepository.createUser).mock.calls[0][0]).toMatchObject({ role: "contributor" });
  });

  it("maps accountType 'buyer' → member role (never manager)", async () => {
    vi.mocked(siteAuthRepository.findUser).mockResolvedValue(null);
    await register(HOST, { ...reg, accountType: "buyer" }, "1.2.3.4");
    expect(vi.mocked(siteAuthRepository.createUser).mock.calls[0][0]).toMatchObject({ role: "member" });
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

describe("resetSiteUserPassword (owner authz)", () => {
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
    await expect(resetSiteUserPassword(viewer, "s1", "u1")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(siteAuthRepository.updatePassword).not.toHaveBeenCalled();
  });

  it("404s for a user belonging to another site", async () => {
    vi.mocked(sitesRepository.findById).mockResolvedValue({ id: "s1", workspaceId: "ws1" } as never);
    vi.mocked(siteAuthRepository.findUserById).mockResolvedValue({ id: "u1", siteId: "OTHER" } as never);
    await expect(resetSiteUserPassword(member, "s1", "u1")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(siteAuthRepository.updatePassword).not.toHaveBeenCalled();
  });

  it("resets: hashes a new temp password, revokes sessions, returns it once", async () => {
    vi.mocked(sitesRepository.findById).mockResolvedValue({ id: "s1", workspaceId: "ws1" } as never);
    vi.mocked(siteAuthRepository.findUserById).mockResolvedValue({ id: "u1", siteId: "s1" } as never);
    const res = await resetSiteUserPassword(member, "s1", "u1");
    expect(res.tempPassword).toBe("tok-123");
    expect(vi.mocked(siteAuthRepository.updatePassword).mock.calls[0]).toEqual(["u1", "H(tok-123)"]);
    expect(siteAuthRepository.deleteSessionsForUser).toHaveBeenCalledWith("u1");
  });
});

describe("adminContext — on-site manager gate", () => {
  const managerSession = {
    siteId: "s1",
    expiresAt: new Date(Date.now() + 1000),
    siteUser: { id: "m1", email: "m@b.com", name: "مدير", role: "manager" },
  };

  it("returns the caller for a manager session on the served site", async () => {
    vi.mocked(siteAuthRepository.findSession).mockResolvedValue(managerSession as never);
    const { site, caller } = await adminContext(HOST, "tok-123");
    expect(site.id).toBe("s1");
    expect(caller).toEqual({ id: "m1", email: "m@b.com", name: "مدير", phone: null, role: "manager" });
  });

  it("401s when there is no token", async () => {
    await expect(adminContext(HOST, null)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("401s for a session minted for another site", async () => {
    vi.mocked(siteAuthRepository.findSession).mockResolvedValue({ ...managerSession, siteId: "OTHER" } as never);
    await expect(adminContext(HOST, "tok-123")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("403s for a non-manager (member/contributor) session", async () => {
    vi.mocked(siteAuthRepository.findSession).mockResolvedValue(
      { ...managerSession, siteUser: { ...managerSession.siteUser, role: "contributor" } } as never,
    );
    await expect(adminContext(HOST, "tok-123")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("404s (uniformly) when the host's site has auth disabled", async () => {
    vi.mocked(siteAuthRepository.siteGateBySlug).mockResolvedValue({ ...served, settings: { authEnabled: false, roleLabels: {} } } as never);
    await expect(adminContext(HOST, "tok-123")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("authorContext — seller/manager (can-author) gate", () => {
  const sess = (role: string) => ({ siteId: "s1", expiresAt: new Date(Date.now() + 1000), siteUser: { id: "u1", email: "u@b.com", name: null, role } });

  it("allows a contributor (seller)", async () => {
    vi.mocked(siteAuthRepository.findSession).mockResolvedValue(sess("contributor") as never);
    await expect(authorContext(HOST, "tok-123")).resolves.toMatchObject({ caller: { role: "contributor" } });
  });

  it("allows a manager", async () => {
    vi.mocked(siteAuthRepository.findSession).mockResolvedValue(sess("manager") as never);
    await expect(authorContext(HOST, "tok-123")).resolves.toMatchObject({ caller: { role: "manager" } });
  });

  it("403s a member (buyer) — buyers can't author", async () => {
    vi.mocked(siteAuthRepository.findSession).mockResolvedValue(sess("member") as never);
    await expect(authorContext(HOST, "tok-123")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("updateOwnProfile — self-service profile", () => {
  const session = { siteId: "s1", expiresAt: new Date(Date.now() + 1000), siteUser: { id: "u1", email: "u@b.com", name: "قديم", phone: null, role: "member" } };
  beforeEach(() => {
    vi.mocked(siteAuthRepository.findSession).mockResolvedValue(session as never);
  });

  it("updates name+phone and hashes a new password (any role, own row)", async () => {
    vi.mocked(siteAuthRepository.updateProfile).mockResolvedValue({ id: "u1", email: "u@b.com", name: "جديد", phone: "0999", role: "member" } as never);
    const user = await updateOwnProfile(HOST, "tok-123", { name: "جديد", phone: "0999", password: "newpass12" });
    expect(siteAuthRepository.updateProfile).toHaveBeenCalledWith("u1", { name: "جديد", phone: "0999", passwordHash: "H(newpass12)" });
    expect(user).toEqual({ id: "u1", email: "u@b.com", name: "جديد", phone: "0999", role: "member" });
  });

  it("clears the phone when passed null and leaves the password untouched", async () => {
    vi.mocked(siteAuthRepository.updateProfile).mockResolvedValue({ id: "u1", email: "u@b.com", name: "قديم", phone: null, role: "member" } as never);
    await updateOwnProfile(HOST, "tok-123", { phone: null });
    expect(siteAuthRepository.updateProfile).toHaveBeenCalledWith("u1", { phone: null });
  });

  it("401s without a session token", async () => {
    await expect(updateOwnProfile(HOST, null, { name: "x2" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(siteAuthRepository.updateProfile).not.toHaveBeenCalled();
  });
});
