// Collaborator management (site-scoped invites via SiteAccess). Only workspace
// members/admins (canManageAccess) may invite/revoke; collaborators cannot.
// Invites are auto-accepted when the invited (verified) email signs in — see
// src/server/auth/claims.ts.

import type { SessionClaims } from "@/server/access/access.rules";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { getPrisma } from "@/lib/db";
import { auth } from "@/lib/auth";
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

/** Collaborators for the caller's ACTIVE workspace. Site names are joined into
 *  each grant, so the manager never loads every workspace site — the invite
 *  picker searches sites on the server instead (see searchSites). */
export async function listCollaborators(claims: SessionClaims) {
  if (!claims.workspace) throw errors.forbidden("لا توجد مساحة عمل نشطة");
  const workspaceId = claims.workspace.id;
  const [siteCount, grants] = await Promise.all([
    sitesRepository.countByWorkspace(workspaceId),
    membersRepository.listGrantsForWorkspace(workspaceId),
  ]);
  return { hasSites: siteCount > 0, grants };
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

  // Email the invitee. Public self-serve signup is disabled, so a NEW person
  // can't "create an account" on their own — instead we create their account
  // (no password, no workspace) and email a set-password link. On setting their
  // password they sign in and the pending SiteAccess grant auto-accepts
  // (src/server/auth/claims.ts). An EXISTING user just gets a login link.
  const businesses = sites.map((s) => s.businessName).join("، ");
  const base = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const inviter = me?.name || me?.email || "أحد مستخدمي سوّي";

  const existingUser = await getPrisma().user.findUnique({
    where: { email: input.email },
    select: { id: true, accounts: { where: { password: { not: null } }, select: { id: true }, take: 1 } },
  });

  if (existingUser && existingUser.accounts.length > 0) {
    // Registered WITH a password → just a login link; the grant auto-accepts.
    await sendMail({
      to: input.email,
      ...buildEmail("collaboratorInvite", { inviter, businesses, url: `${base}/login` }),
    });
  } else {
    // Brand-new person, or invited before but never set a password → create the
    // account if needed (emailVerified: true — they prove control via this link)
    // and email a set-password link. sendResetPassword detects "no password yet"
    // and sends the welcome/set-password email, not a reset email.
    if (!existingUser) {
      await getPrisma().user.create({
        data: { email: input.email, emailVerified: true, platformRole: "user" },
      });
    }
    await auth.api.requestPasswordReset({
      body: { email: input.email, redirectTo: "/reset-password" },
    });
  }

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
