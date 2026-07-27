import { getPrisma } from "@/lib/db";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "./workspaces.schema";

export const workspacesRepository = {
  /** Create a workspace and its owner membership in one transaction. */
  createWithOwner(userId: string, data: CreateWorkspaceInput) {
    return getPrisma().workspace.create({
      data: {
        name: data.name,
        members: { create: { userId, role: "owner" } },
      },
    });
  },

  findById(id: string) {
    return getPrisma().workspace.findUnique({ where: { id } });
  },

  listByIds(ids: string[]) {
    return getPrisma().workspace.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    });
  },

  update(id: string, data: UpdateWorkspaceInput) {
    return getPrisma().workspace.update({
      where: { id },
      data: { name: data.name },
    });
  },

  listMembers(workspaceId: string) {
    return getPrisma().workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: "asc" },
    });
  },

  /** How many sites this workspace owns — gates deletion (must be empty). */
  countSites(workspaceId: string) {
    return getPrisma().site.count({ where: { workspaceId } });
  },

  /** Delete the workspace. Members + invites cascade (see schema.prisma). Only
   *  ever called for an EMPTY workspace — the service guards on countSites so the
   *  Site cascade never fires. */
  delete(id: string) {
    return getPrisma().workspace.delete({ where: { id } });
  },
};
