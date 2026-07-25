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

/** Members of the caller's workspace (owner only — members list is management). */
export async function listMembers(claims: SessionClaims) {
  if (!claims.workspace || !canManageWorkspace(claims, claims.workspace.id)) {
    throw errors.forbidden("فقط المالك يمكنه عرض الأعضاء");
  }
  return workspacesRepository.listMembers(claims.workspace.id);
}
