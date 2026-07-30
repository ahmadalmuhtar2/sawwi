import { getPrisma } from "@/lib/db";

export const membersRepository = {
  /** Active (non-revoked) grants for the given sites. */
  listGrantsForSites(siteIds: string[]) {
    return getPrisma().siteAccess.findMany({
      where: { siteId: { in: siteIds }, revokedAt: null },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        siteId: true,
        invitedEmail: true,
        level: true,
        builderAccess: true,
        acceptedAt: true,
        // join the business name so the collaborators list resolves names
        // WITHOUT loading every workspace site into the client.
        site: { select: { businessName: true } },
      },
    });
  },

  /** Active grants across ALL sites in a workspace (with each site's name).
   *  Only invited collaborators produce rows, so this stays small regardless of
   *  how many sites the workspace owns. */
  listGrantsForWorkspace(workspaceId: string) {
    return getPrisma().siteAccess.findMany({
      where: { revokedAt: null, site: { workspaceId } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        siteId: true,
        invitedEmail: true,
        level: true,
        builderAccess: true,
        acceptedAt: true,
        site: { select: { businessName: true } },
      },
    });
  },

  findGrant(siteId: string, invitedEmail: string) {
    return getPrisma().siteAccess.findFirst({ where: { siteId, invitedEmail } });
  },

  findById(id: string) {
    return getPrisma().siteAccess.findUnique({ where: { id } });
  },

  createGrant(data: {
    siteId: string;
    invitedEmail: string;
    builderAccess: boolean;
    invitedBy: string;
  }) {
    return getPrisma().siteAccess.create({
      data: { ...data, level: "editor" },
    });
  },

  /** Re-activate / update an existing grant (re-invite or toggle builder). */
  updateGrant(id: string, data: { builderAccess?: boolean; revokedAt?: Date | null; invitedBy?: string }) {
    return getPrisma().siteAccess.update({ where: { id }, data });
  },

  revoke(id: string) {
    return getPrisma().siteAccess.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },
};
