import type { SessionClaims } from "@/server/access/access.rules";
import { canManageWorkspace } from "@/server/access/access.rules";
import { errors } from "@/shared/errors";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "./workspaces.schema";
import { workspacesRepository } from "./workspaces.repository";

/** Create a new workspace; the caller becomes its owner. Unlimited per user. */
export async function createWorkspace(
  claims: SessionClaims,
  input: CreateWorkspaceInput,
) {
  return workspacesRepository.createWithOwner(claims.userId, input);
}

/** All workspaces the caller belongs to (for the switcher). */
export async function listMyWorkspaces(claims: SessionClaims) {
  const ids = claims.workspaces.map((w) => w.id);
  if (!ids.length) return [];
  return workspacesRepository.listByIds(ids);
}

/** The caller's own workspace. */
export async function getMyWorkspace(claims: SessionClaims) {
  if (!claims.workspace) throw errors.notFound("لا توجد مساحة عمل");
  const workspace = await workspacesRepository.findById(claims.workspace.id);
  if (!workspace) throw errors.notFound("لا توجد مساحة عمل");
  return workspace;
}

/** Update the caller's workspace details (owner only). */
export async function updateWorkspace(
  claims: SessionClaims,
  input: UpdateWorkspaceInput,
) {
  if (!claims.workspace || !canManageWorkspace(claims, claims.workspace.id)) {
    throw errors.forbidden("فقط المالك يمكنه تعديل مساحة العمل");
  }
  return workspacesRepository.update(claims.workspace.id, input);
}

/** Permanently delete the caller's active workspace (owner only). Refuses while
 *  it still owns any sites — the owner must delete those first, so a workspace is
 *  never removed out from under live websites (and the Site cascade never fires).
 *  Members and pending invites cascade away with it. */
export async function deleteWorkspace(claims: SessionClaims) {
  if (!claims.workspace || !canManageWorkspace(claims, claims.workspace.id)) {
    throw errors.forbidden("فقط المالك يمكنه حذف مساحة العمل");
  }
  const siteCount = await workspacesRepository.countSites(claims.workspace.id);
  if (siteCount > 0) {
    throw errors.conflict("لا يمكن حذف مساحة عمل تحتوي على مواقع. احذف كل المواقع أولًا.");
  }
  await workspacesRepository.delete(claims.workspace.id);
  return { id: claims.workspace.id };
}

/** Members of the caller's workspace (owner only — members list is management). */
export async function listMembers(claims: SessionClaims) {
  if (!claims.workspace || !canManageWorkspace(claims, claims.workspace.id)) {
    throw errors.forbidden("فقط المالك يمكنه عرض الأعضاء");
  }
  return workspacesRepository.listMembers(claims.workspace.id);
}
