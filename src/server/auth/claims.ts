// Derive the trusted SessionClaims for a user from the database. This is the
// REAL, production logic: given a userId (whoever the auth layer says is signed
// in), look up their platform role, ALL workspace memberships, and site-scoped
// grants. Better Auth provides the userId; this derivation stays unchanged.

import { getPrisma } from "@/lib/db";
import type { SessionClaims } from "@/server/access/access.rules";

/**
 * @param activeWorkspaceId  the workspace the user last switched to (cookie).
 *   When it matches a membership it becomes `claims.workspace`; otherwise the
 *   first membership is used. Permissions span ALL memberships regardless.
 */
export async function deriveClaims(
  userId: string,
  activeWorkspaceId?: string,
): Promise<SessionClaims | null> {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      // include the workspace so claims carry its kind (reseller|direct) — drives
      // caps + nav gating without an extra query.
      memberships: { orderBy: { joinedAt: "asc" }, include: { workspace: { select: { kind: true } } } },
      siteAccess: { where: { revokedAt: null, acceptedAt: { not: null } } },
    },
  });
  if (!user) return null;

  // Auto-accept: link any pending invites addressed to this verified email.
  // Better Auth verifies the email, so matching invitedEmail is trustworthy.
  const email = user.email.toLowerCase();
  const pending = await prisma.siteAccess.findMany({
    where: { invitedEmail: email, userId: null, revokedAt: null },
    select: { id: true, siteId: true, level: true, builderAccess: true },
  });
  if (pending.length) {
    await prisma.siteAccess.updateMany({
      where: { id: { in: pending.map((g) => g.id) } },
      data: { userId: user.id, acceptedAt: new Date() },
    });
  }

  const workspaces = user.memberships.map((m) => ({
    id: m.workspaceId,
    role: m.role,
    kind: m.workspace.kind,
  }));
  const active =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];

  // Combine already-accepted grants with the just-adopted pending ones.
  const grants = [
    ...user.siteAccess.map((g) => ({
      siteId: g.siteId,
      level: g.level,
      builderAccess: g.builderAccess,
    })),
    ...pending.map((g) => ({
      siteId: g.siteId,
      level: g.level,
      builderAccess: g.builderAccess,
    })),
  ];

  return {
    userId: user.id,
    platformRole: user.platformRole,
    workspace: active,
    workspaces,
    siteAccess: grants,
  };
}
