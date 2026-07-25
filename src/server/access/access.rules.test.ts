import { describe, expect, it } from "vitest";
import {
  accessibleSiteIds,
  canAccessWorkspace,
  canManageWorkspace,
  resolveSiteAccess,
  type SessionClaims,
} from "./access.rules";

const site = { id: "site_1", workspaceId: "ws_1" };
const otherSite = { id: "site_2", workspaceId: "ws_2" };

function claims(overrides: Partial<SessionClaims> = {}): SessionClaims {
  return {
    userId: "u_1",
    platformRole: "user",
    siteAccess: [],
    ...overrides,
    // Permissions span all memberships; default to the single `workspace` given.
    workspaces:
      overrides.workspaces ?? (overrides.workspace ? [overrides.workspace] : []),
  };
}

describe("resolveSiteAccess — platform admin", () => {
  it("can do everything on any site", () => {
    const perms = resolveSiteAccess(claims({ platformRole: "admin" }), site);
    expect(perms).toEqual({
      canView: true,
      canEditSettings: true,
      canEditBuilder: true,
      canPublish: true,
      canManageAccess: true,
      canDelete: true,
      canManageBilling: true,
    });
  });
});

describe("resolveSiteAccess — workspace user", () => {
  const owner = claims({ workspace: { id: "ws_1", role: "owner" } });
  const member = claims({ workspace: { id: "ws_1", role: "member" } });

  it("owner/member can edit, publish, manage access, delete within their workspace", () => {
    for (const c of [owner, member]) {
      const perms = resolveSiteAccess(c, site);
      expect(perms.canView).toBe(true);
      expect(perms.canEditSettings).toBe(true);
      expect(perms.canEditBuilder).toBe(true);
      expect(perms.canPublish).toBe(true);
      expect(perms.canManageAccess).toBe(true);
      expect(perms.canDelete).toBe(true);
    }
  });

  it("the reseller (workspace) can manage billing; collaborators cannot", () => {
    expect(resolveSiteAccess(owner, site).canManageBilling).toBe(true);
    expect(resolveSiteAccess(member, site).canManageBilling).toBe(true);
    const collab = claims({
      siteAccess: [{ siteId: "site_1", level: "editor", builderAccess: true }],
    });
    expect(resolveSiteAccess(collab, site).canManageBilling).toBe(false);
  });

  it("gets NOTHING on a site in another workspace", () => {
    const perms = resolveSiteAccess(owner, otherSite);
    expect(perms).toEqual({
      canView: false,
      canEditSettings: false,
      canEditBuilder: false,
      canPublish: false,
      canManageAccess: false,
      canDelete: false,
      canManageBilling: false,
    });
  });
});

describe("resolveSiteAccess — site-scoped grants", () => {
  it("collaborator WITHOUT builder grant: settings only, no builder/publish", () => {
    const editor = claims({
      siteAccess: [{ siteId: "site_1", level: "editor", builderAccess: false }],
    });
    const perms = resolveSiteAccess(editor, site);
    expect(perms.canView).toBe(true);
    expect(perms.canEditSettings).toBe(true);
    expect(perms.canEditBuilder).toBe(false);
    expect(perms.canPublish).toBe(false);
    expect(perms.canManageAccess).toBe(false);
    expect(perms.canDelete).toBe(false);
    expect(perms.canManageBilling).toBe(false);
  });

  it("collaborator WITH builder grant: also builder + publish", () => {
    const editor = claims({
      siteAccess: [{ siteId: "site_1", level: "editor", builderAccess: true }],
    });
    const perms = resolveSiteAccess(editor, site);
    expect(perms.canEditSettings).toBe(true);
    expect(perms.canEditBuilder).toBe(true);
    expect(perms.canPublish).toBe(true);
    expect(perms.canManageAccess).toBe(false); // still can't manage members
    expect(perms.canDelete).toBe(false);
  });

  it("viewer can only view", () => {
    const viewer = claims({
      siteAccess: [{ siteId: "site_1", level: "viewer", builderAccess: false }],
    });
    const perms = resolveSiteAccess(viewer, site);
    expect(perms.canView).toBe(true);
    expect(perms.canEditSettings).toBe(false);
    expect(perms.canEditBuilder).toBe(false);
    expect(perms.canPublish).toBe(false);
  });

  it("a grant for one site does not leak to another site", () => {
    const editor = claims({
      siteAccess: [{ siteId: "site_1", level: "editor", builderAccess: true }],
    });
    expect(resolveSiteAccess(editor, otherSite).canView).toBe(false);
  });

  it("no claims at all -> no access", () => {
    expect(resolveSiteAccess(claims(), site).canView).toBe(false);
  });
});

describe("workspace-level checks", () => {
  it("canAccessWorkspace: member yes, outsider no, admin always", () => {
    const member = claims({ workspace: { id: "ws_1", role: "member" } });
    expect(canAccessWorkspace(member, "ws_1")).toBe(true);
    expect(canAccessWorkspace(member, "ws_2")).toBe(false);
    expect(canAccessWorkspace(claims({ platformRole: "admin" }), "ws_9")).toBe(
      true,
    );
  });

  it("canManageWorkspace: only owner or admin", () => {
    const owner = claims({ workspace: { id: "ws_1", role: "owner" } });
    const member = claims({ workspace: { id: "ws_1", role: "member" } });
    expect(canManageWorkspace(owner, "ws_1")).toBe(true);
    expect(canManageWorkspace(member, "ws_1")).toBe(false);
    expect(canManageWorkspace(claims({ platformRole: "admin" }), "ws_1")).toBe(
      true,
    );
  });
});

describe("multi-workspace — permissions span ALL memberships, not just active", () => {
  // Active workspace is ws_1, but the user also owns/belongs to ws_2.
  const multi = claims({
    workspace: { id: "ws_1", role: "owner" },
    workspaces: [
      { id: "ws_1", role: "owner" },
      { id: "ws_2", role: "member" },
    ],
  });

  it("grants full site perms on a site in a NON-active workspace", () => {
    const perms = resolveSiteAccess(multi, otherSite); // otherSite is in ws_2
    expect(perms.canView).toBe(true);
    expect(perms.canEditSettings).toBe(true);
    expect(perms.canEditBuilder).toBe(true);
    expect(perms.canPublish).toBe(true);
  });

  it("canManageWorkspace is true only where the user is owner", () => {
    expect(canManageWorkspace(multi, "ws_1")).toBe(true); // owner
    expect(canManageWorkspace(multi, "ws_2")).toBe(false); // member
    expect(canAccessWorkspace(multi, "ws_2")).toBe(true);
    expect(canAccessWorkspace(multi, "ws_3")).toBe(false);
  });
});

describe("accessibleSiteIds", () => {
  it("lists exactly the invited sites", () => {
    const c = claims({
      siteAccess: [
        { siteId: "site_1", level: "editor", builderAccess: false },
        { siteId: "site_9", level: "viewer", builderAccess: false },
      ],
    });
    expect(accessibleSiteIds(c)).toEqual(["site_1", "site_9"]);
  });
});
