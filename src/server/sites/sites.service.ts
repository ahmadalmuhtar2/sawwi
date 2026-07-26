// Sites business logic — orchestration only. No HTTP, no raw SQL. Authorization
// is derived from server-side session claims (NEVER from client input).

import type { SessionClaims } from "@/server/access/access.rules";
import {
  accessibleSiteIds,
  canManageWorkspace,
  resolveSiteAccess,
} from "@/server/access/access.rules";
import { validateOpeningHours, type OpeningHours } from "@/server/settings/hours.rules";
import { deleteRemovedObjects, deleteSiteAssets } from "@/lib/storage-cleanup";
import type { SiteSeo } from "@/shared/seo";
import { errors } from "@/shared/errors";
import type {
  CreateSiteInput,
  UpdateSettingsInput,
  UpdateSiteBasicsInput,
  UpdateThemeInput,
} from "./sites.schema";
import { assertSlugValid } from "./sites.rules";
import { sitesRepository } from "./sites.repository";
import { applyTemplate } from "@/server/templates/templates.service";

export async function createSite(claims: SessionClaims, input: CreateSiteInput) {
  const workspace = claims.workspace;
  if (!workspace) {
    throw errors.forbidden("فقط أعضاء مساحة العمل يمكنهم إنشاء المواقع");
  }
  assertSlugValid(input.slug); // defense in depth (schema already checked format)
  if (await sitesRepository.slugExists(input.slug)) {
    throw errors.conflict("هذا الرابط مستخدم بالفعل، اختر رابطًا آخر");
  }
  const site = await sitesRepository.create({
    workspaceId: workspace.id, // from trusted claims, not the request body
    slug: input.slug,
    businessName: input.businessName,
    verticalKey: input.verticalKey,
    templateKey: input.templateKey ?? null,
    language: input.language,
  });

  // Instantiate the chosen template into real pages/sections/content rows.
  if (input.templateKey) {
    await applyTemplate(site.id, input.templateKey);
  }
  return site;
}

/** Sites the caller can see: their workspace's sites, or their invited sites. */
export async function listSites(claims: SessionClaims) {
  if (claims.workspace) {
    return sitesRepository.listByWorkspace(claims.workspace.id);
  }
  const ids = accessibleSiteIds(claims);
  return ids.length ? sitesRepository.listByIds(ids) : [];
}

/** Load a site the caller may view, or throw. Returns the site + permissions. */
async function loadViewable(claims: SessionClaims, siteId: string) {
  const site = await sitesRepository.findById(siteId);
  if (!site) throw errors.notFound("الموقع غير موجود");
  const permissions = resolveSiteAccess(claims, site);
  if (!permissions.canView) throw errors.notFound("الموقع غير موجود"); // don't leak existence
  return { site, permissions };
}

export async function getSite(claims: SessionClaims, siteId: string) {
  const { site } = await loadViewable(claims, siteId);
  return site;
}

/**
 * Guard for settings-level edits (content, contact info, hours, SEO, theme,
 * basics, logo). Collaborators have this by default.
 */
export async function requireSiteSettingsEdit(claims: SessionClaims, siteId: string) {
  const { site, permissions } = await loadViewable(claims, siteId);
  if (!permissions.canEditSettings) throw errors.forbidden("لا تملك صلاحية التعديل");
  return site;
}

/**
 * Guard for the page/section builder (configurator). Requires an explicit
 * builder grant for collaborators; workspace members/admins always have it.
 */
export async function requireSiteBuilderEdit(claims: SessionClaims, siteId: string) {
  const { site, permissions } = await loadViewable(claims, siteId);
  if (!permissions.canEditBuilder) {
    throw errors.forbidden("لا تملك صلاحية استخدام المُنشئ");
  }
  return site;
}

/** Guard: caller may publish this site (subscription gating is applied separately). */
export async function requireSitePublish(claims: SessionClaims, siteId: string) {
  const { site, permissions } = await loadViewable(claims, siteId);
  if (!permissions.canPublish) throw errors.forbidden("لا تملك صلاحية النشر");
  return site;
}

/** Guard: caller may manage billing for this site (reseller/workspace or admin). */
export async function requireSiteBilling(claims: SessionClaims, siteId: string) {
  const { site, permissions } = await loadViewable(claims, siteId);
  if (!permissions.canManageBilling) {
    throw errors.forbidden("لا تملك صلاحية إدارة الفوترة");
  }
  return site;
}

export async function updateSettings(
  claims: SessionClaims,
  siteId: string,
  input: UpdateSettingsInput,
) {
  const { permissions } = await loadViewable(claims, siteId);
  if (!permissions.canEditSettings) throw errors.forbidden("لا تملك صلاحية التعديل");

  const hours = validateOpeningHours(input.openingHours as OpeningHours);
  if (!hours.ok) {
    throw errors.validation("مواعيد العمل غير صحيحة", {
      openingHours: hours.errors.map((e) => `${e.day}: ${e.error}`).join(", "),
    });
  }
  return sitesRepository.upsertSettings(siteId, input);
}

export async function deleteSite(claims: SessionClaims, siteId: string) {
  // Deleting a whole site is an agency-level action: workspace owner or admin
  // only. Site-scoped editors (invited business owners) may edit but not delete.
  const { site } = await loadViewable(claims, siteId); // exists + canView, or NOT_FOUND
  if (!canManageWorkspace(claims, site.workspaceId)) {
    throw errors.forbidden("حذف الموقع يتطلب صلاحية مالك مساحة العمل");
  }
  await sitesRepository.delete(siteId);
  // Free all of the site's stored media (logos, favicons, OG, section images).
  await deleteSiteAssets(siteId);
  return { id: siteId, deleted: true };
}

export async function updateSiteBasics(
  claims: SessionClaims,
  siteId: string,
  input: UpdateSiteBasicsInput,
) {
  const { permissions } = await loadViewable(claims, siteId);
  if (!permissions.canEditSettings) throw errors.forbidden("لا تملك صلاحية التعديل");

  if (input.slug && (await sitesRepository.slugTakenByOther(input.slug, siteId))) {
    throw errors.validation("الرابط مستخدم", { slug: "هذا الرابط محجوز، اختر غيره" });
  }
  return sitesRepository.updateBasics(siteId, input);
}

export async function updateTheme(
  claims: SessionClaims,
  siteId: string,
  input: UpdateThemeInput,
) {
  const { permissions } = await loadViewable(claims, siteId);
  if (!permissions.canEditSettings) throw errors.forbidden("لا تملك صلاحية التعديل");
  return sitesRepository.upsertTheme(siteId, input);
}

/** Update the site-wide SEO defaults (Site.seo). */
export async function updateSeo(
  claims: SessionClaims,
  siteId: string,
  input: SiteSeo,
) {
  const { site, permissions } = await loadViewable(claims, siteId);
  if (!permissions.canEditSettings) throw errors.forbidden("لا تملك صلاحية التعديل");
  const updated = await sitesRepository.updateSeo(siteId, input);
  // Free the favicon/OG image if it was removed or replaced by this edit.
  await deleteRemovedObjects(site.seo, input);
  return updated;
}
