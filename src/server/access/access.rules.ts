// Tenancy resolution — the security core (AGENT_GUIDE §9).
// Access is ALWAYS derived from server-side session claims, never from a
// client-supplied workspace/site id. These are pure functions over claims.

import type { AccessLevel, MemberRole, PlatformRole } from "@/shared/domain";

/** The trusted, server-derived identity for a request. */
export interface SessionClaims {
  userId: string;
  platformRole: PlatformRole;
  /**
   * The ACTIVE workspace (chosen via the switcher cookie) — drives UI scope:
   * which workspace new sites/members belong to and which sites are listed.
   * Undefined for users who own no workspace (pure collaborators).
   */
  workspace?: { id: string; role: MemberRole };
  /** ALL workspaces the user is a member of. Permission checks span these. */
  workspaces: ReadonlyArray<{ id: string; role: MemberRole }>;
  /** Site-scoped grants for invited collaborators/viewers. */
  siteAccess: ReadonlyArray<{
    siteId: string;
    level: AccessLevel;
    /** Editor grant may also use the page/section builder + publish. */
    builderAccess: boolean;
  }>;
}

/** Minimal site shape needed to decide access. */
export interface SiteRef {
  id: string;
  workspaceId: string;
}

export interface SitePermissions {
  canView: boolean;
  /** Edit the settings tabs (info, content, hours, SEO, theme, basics, logo). */
  canEditSettings: boolean;
  /** Use the page/section builder (configurator). */
  canEditBuilder: boolean;
  canPublish: boolean;
  canManageAccess: boolean;
  canDelete: boolean;
  /** Billing beyond expiry status is workspace/admin only (PRD §4.4, §8). */
  canManageBilling: boolean;
}

const NONE: SitePermissions = {
  canView: false,
  canEditSettings: false,
  canEditBuilder: false,
  canPublish: false,
  canManageAccess: false,
  canDelete: false,
  canManageBilling: false,
};

function isAdmin(claims: SessionClaims): boolean {
  return claims.platformRole === "admin";
}

/** True if the user belongs to the given workspace (or is a platform admin). */
export function canAccessWorkspace(
  claims: SessionClaims,
  workspaceId: string,
): boolean {
  if (isAdmin(claims)) return true;
  return claims.workspaces.some((w) => w.id === workspaceId);
}

/** Workspace-management actions (members, commissions) — owner or admin. */
export function canManageWorkspace(
  claims: SessionClaims,
  workspaceId: string,
): boolean {
  if (isAdmin(claims)) return true;
  return claims.workspaces.some((w) => w.id === workspaceId && w.role === "owner");
}

/**
 * Resolve exactly what the caller may do to a specific site.
 * Precedence: platform admin > owning-workspace member > site-scoped grant.
 * A site-scoped grant NEVER leaks workspace-level abilities.
 */
export function resolveSiteAccess(
  claims: SessionClaims,
  site: SiteRef,
): SitePermissions {
  if (isAdmin(claims)) {
    return {
      canView: true,
      canEditSettings: true,
      canEditBuilder: true,
      canPublish: true,
      canManageAccess: true,
      canDelete: true,
      canManageBilling: true,
    };
  }

  // Workspace users can act on every site in ANY of their workspaces.
  if (claims.workspaces.some((w) => w.id === site.workspaceId)) {
    return {
      canView: true,
      canEditSettings: true,
      canEditBuilder: true,
      canPublish: true,
      canManageAccess: true,
      canDelete: true,
      // The reseller (workspace) owns billing: set/extend expiry, record
      // payments. Site-scoped collaborators never see billing.
      canManageBilling: true,
    };
  }

  // Site-scoped invite. Ignore revoked grants (caller must not include them,
  // but we also match strictly on siteId).
  const grant = claims.siteAccess.find((g) => g.siteId === site.id);
  if (grant) {
    if (grant.level === "editor") {
      // Collaborators edit settings by default. The builder + publish require an
      // explicit builderAccess grant from the reseller (owner decision).
      return {
        ...NONE,
        canView: true,
        canEditSettings: true,
        canEditBuilder: grant.builderAccess,
        canPublish: grant.builderAccess, // subscription gating applied separately
      };
    }
    // viewer
    return { ...NONE, canView: true };
  }

  return NONE;
}

/** Sites a site-scoped user was invited to — drives their "My sites" list. */
export function accessibleSiteIds(claims: SessionClaims): string[] {
  return claims.siteAccess.map((g) => g.siteId);
}
