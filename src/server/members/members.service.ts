// Collaborator management (site-scoped invites via SiteAccess). Only workspace
// members/admins (canManageAccess) may invite/revoke; collaborators cannot.
// Invites are auto-accepted when the invited (verified) email signs in — see
// src/server/auth/claims.ts.

import type { SessionClaims } from "@/server/access/access.rules";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { getPrisma } from "@/lib/db";
import { sitesRepository } from "@/server/sites/sites.repository";
import { sendMail } from "@/lib/mailer";
import { buildEmail } from "@/constants/emails";
import { errors } from "@/shared/errors";
import type { InviteCollaboratorInput, UpdateCollaboratorInput } from "./members.schema";
import { membersRepository } from "./members.repository";

/** Ensure the caller may manage access on a site; returns the site. */
async function requireManageAccess(claims: SessionClaims, siteId: string) {
  const site = await sitesRepository.findById(siteId);
  if (!site) throw errors.notFound("الموقع غير موجود");
  if (!resolveSiteAccess(claims, site).canManageAccess) {
    throw errors.forbidden("لا تملك صلاحية إدارة الأعضاء");
  }
  return site;
}

/** Collaborators + sites for the caller's ACTIVE workspace. */
export async function listCollaborators(claims: SessionClaims) {
  if (!claims.workspace) throw errors.forbidden("لا توجد مساحة عمل نشطة");
  const sites = await sitesRepository.listByWorkspace(claims.workspace.id);
  const siteIds = sites.map((s) => s.id);
  const grants = siteIds.length
    ? await membersRepository.listGrantsForSites(siteIds)
    : [];
  return {
    sites: sites.map((s) => ({ id: s.id, businessName: s.businessName })),
    grants,
  };
}

export async function inviteCollaborator(
  claims: SessionClaims,
  input: InviteCollaboratorInput,
) {
  // Every target site must be manageable by the caller (and thus in one of their
  // workspaces). Validate all before writing anything.
  const sites = await Promise.all(
    input.siteIds.map((id) => requireManageAccess(claims, id)),
  );

  // You can't collaborate with yourself.
  const me = await getPrisma().user.findUnique({
    where: { id: claims.userId },
    select: { email: true, name: true },
  });
  if (me?.email?.toLowerCase() === input.email) {
    throw errors.validation("لا يمكنك دعوة نفسك", { email: "أدخل بريدًا مختلفًا" });
  }

  for (const siteId of input.siteIds) {
    const existing = await membersRepository.findGrant(siteId, input.email);
    if (existing) {
      await membersRepository.updateGrant(existing.id, {
        builderAccess: input.builderAccess,
        revokedAt: null,
        invitedBy: claims.userId,
      });
    } else {
      await membersRepository.createGrant({
        siteId,
        invitedEmail: input.email,
        builderAccess: input.builderAccess,
        invitedBy: claims.userId,
      });
    }
  }

  // One invite email listing the businesses.
  const businesses = sites.map((s) => s.businessName).join("، ");
  const base =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  await sendMail({
    to: input.email,
    ...buildEmail("collaboratorInvite", {
      inviter: me?.name || me?.email || "أحد مستخدمي سوّي",
      businesses,
      url: `${base}/login`,
    }),
  });

  return { invited: input.email, sites: input.siteIds.length };
}

export async function updateCollaborator(
  claims: SessionClaims,
  accessId: string,
  input: UpdateCollaboratorInput,
) {
  const grant = await membersRepository.findById(accessId);
  if (!grant || grant.revokedAt) throw errors.notFound("العضو غير موجود");
  await requireManageAccess(claims, grant.siteId);
  await membersRepository.updateGrant(accessId, { builderAccess: input.builderAccess });
  return { id: accessId, builderAccess: input.builderAccess };
}

export async function revokeCollaborator(claims: SessionClaims, accessId: string) {
  const grant = await membersRepository.findById(accessId);
  if (!grant) throw errors.notFound("العضو غير موجود");
  await requireManageAccess(claims, grant.siteId);
  await membersRepository.revoke(accessId);
  return { id: accessId, revoked: true };
}
