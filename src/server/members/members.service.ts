// Collaborator management (site-scoped invites via SiteAccess). Only workspace
// members/admins (canManageAccess) may invite/revoke; collaborators cannot.
// Invites are auto-accepted when the invited (verified) email signs in — see
// src/server/auth/claims.ts.

import type { SessionClaims } from "@/server/access/access.rules";
import { resolveSiteAccess, canManageWorkspace } from "@/server/access/access.rules";
import { getPrisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sitesRepository } from "@/server/sites/sites.repository";
import { sendMail } from "@/lib/mailer";
import { buildEmail } from "@/constants/emails";
import { errors } from "@/shared/errors";
import type {
  InviteSiteCollaboratorInput,
  UpdateCollaboratorInput,
} from "./members.schema";
import { membersRepository } from "./members.repository";

type SiteLite = { id: string; businessName: string };

/** Ensure the caller is the OWNER of the site's workspace (or a platform admin) —
 *  the person who first created the site / first granted access. Only the owner
 *  manages a single site's collaborators (per-site Collaborators tab), which is
 *  STRICTER than canManageAccess (that also allows ordinary workspace members). */
async function requireSiteOwner(claims: SessionClaims, siteId: string) {
  const site = await sitesRepository.findById(siteId);
  if (!site) throw errors.notFound("الموقع غير موجود");
  if (!canManageWorkspace(claims, site.workspaceId)) {
    throw errors.forbidden("إدارة المتعاونين متاحة لمالك الموقع فقط");
  }
  return site;
}

/** Upsert a per-site grant for each site and email the invitee — the shared core
 *  of both the workspace-wide invite and the per-site invite. The CALLER is
 *  responsible for authorizing every site in `sites` first. */
async function grantAndInvite(
  claims: SessionClaims,
  sites: SiteLite[],
  email: string,
  builderAccess: boolean,
) {
  // You can't collaborate with yourself.
  const me = await getPrisma().user.findUnique({
    where: { id: claims.userId },
    select: { email: true, name: true },
  });
  if (me?.email?.toLowerCase() === email) {
    throw errors.validation("لا يمكنك دعوة نفسك", { email: "أدخل بريدًا مختلفًا" });
  }

  for (const site of sites) {
    const existing = await membersRepository.findGrant(site.id, email);
    if (existing) {
      await membersRepository.updateGrant(existing.id, {
        builderAccess,
        revokedAt: null,
        invitedBy: claims.userId,
      });
    } else {
      await membersRepository.createGrant({
        siteId: site.id,
        invitedEmail: email,
        builderAccess,
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
    where: { email },
    select: { id: true, accounts: { where: { password: { not: null } }, select: { id: true }, take: 1 } },
  });

  if (existingUser && existingUser.accounts.length > 0) {
    await sendMail({
      to: email,
      ...buildEmail("collaboratorInvite", { inviter, businesses, url: `${base}/login` }),
    });
  } else {
    if (!existingUser) {
      await getPrisma().user.create({
        data: { email, emailVerified: true, platformRole: "user" },
      });
    }
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
    });
  }

  return { invited: email, sites: sites.length };
}

/* ─────────────────────── per-site Collaborators tab ────────────────────── */

/** All active collaborators on ONE site, plus whether the caller may manage them
 *  (owner-only). Any user who can VIEW the site can see the list. */
export async function listSiteCollaborators(claims: SessionClaims, siteId: string) {
  const site = await sitesRepository.findById(siteId);
  if (!site || !resolveSiteAccess(claims, site).canView) {
    throw errors.notFound("الموقع غير موجود"); // don't leak existence
  }
  const grants = await membersRepository.listGrantsForSites([siteId]);
  return { canManage: canManageWorkspace(claims, site.workspaceId), grants };
}

/** Invite one email as a collaborator on a single site — owner only. */
export async function inviteSiteCollaborator(
  claims: SessionClaims,
  siteId: string,
  input: InviteSiteCollaboratorInput,
) {
  const site = await requireSiteOwner(claims, siteId);
  return grantAndInvite(claims, [site], input.email, input.builderAccess);
}

/** Toggle a single-site collaborator's builder access — owner only. */
export async function updateSiteCollaborator(
  claims: SessionClaims,
  siteId: string,
  accessId: string,
  input: UpdateCollaboratorInput,
) {
  await requireSiteOwner(claims, siteId);
  const grant = await membersRepository.findById(accessId);
  if (!grant || grant.revokedAt || grant.siteId !== siteId) throw errors.notFound("المتعاون غير موجود");
  await membersRepository.updateGrant(accessId, { builderAccess: input.builderAccess });
  return { id: accessId, builderAccess: input.builderAccess };
}

/** Revoke a single-site collaborator's access — owner only. */
export async function revokeSiteCollaborator(
  claims: SessionClaims,
  siteId: string,
  accessId: string,
) {
  await requireSiteOwner(claims, siteId);
  const grant = await membersRepository.findById(accessId);
  if (!grant || grant.siteId !== siteId) throw errors.notFound("المتعاون غير موجود");
  await membersRepository.revoke(accessId);
  return { id: accessId, revoked: true };
}
