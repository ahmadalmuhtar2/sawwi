// Data access for per-site end-user auth — the ONLY layer that touches Prisma.

import { getPrisma } from "@/lib/db";
import type { SiteUserRole } from "@/generated/prisma/enums";

export interface CreateSiteUserData {
  siteId: string;
  email: string;
  name: string | null;
  passwordHash: string;
  role: SiteUserRole;
}

export interface CreateSessionData {
  siteId: string;
  siteUserId: string;
  token: string;
  expiresAt: Date;
}

export const siteAuthRepository = {
  /** Serve-gate fields for a slug + whether the site enabled end-user auth. */
  siteGateBySlug(slug: string) {
    return getPrisma().site.findUnique({
      where: { slug },
      select: {
        id: true,
        status: true,
        maintenanceMode: true,
        subscription: { select: { expiry: true } },
        settings: { select: { authEnabled: true, roleLabels: true } },
      },
    });
  },

  findUser(siteId: string, email: string) {
    return getPrisma().siteUser.findUnique({ where: { siteId_email: { siteId, email } } });
  },

  findUserById(id: string) {
    return getPrisma().siteUser.findUnique({ where: { id } });
  },

  createUser(data: CreateSiteUserData) {
    return getPrisma().siteUser.create({ data });
  },

  createSession(data: CreateSessionData) {
    return getPrisma().siteUserSession.create({ data });
  },

  findSession(token: string) {
    return getPrisma().siteUserSession.findUnique({ where: { token }, include: { siteUser: true } });
  },

  deleteSession(token: string) {
    return getPrisma().siteUserSession.deleteMany({ where: { token } });
  },

  listUsers(siteId: string) {
    return getPrisma().siteUser.findMany({ where: { siteId }, orderBy: { createdAt: "desc" } });
  },

  updateRole(id: string, role: SiteUserRole) {
    return getPrisma().siteUser.update({ where: { id }, data: { role }, select: { id: true, role: true } });
  },

  deleteUser(id: string) {
    return getPrisma().siteUser.delete({ where: { id } });
  },

  countRecentBySite(siteId: string, since: Date): Promise<number> {
    return getPrisma().siteUser.count({ where: { siteId, createdAt: { gte: since } } });
  },
};
