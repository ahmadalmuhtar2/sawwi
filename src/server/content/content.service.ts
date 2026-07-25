// Structured content business logic. Every operation is guarded by site-edit
// permission (reusing sites' requireSiteSettingsEdit) and scoped to the site.

import type { SessionClaims } from "@/server/access/access.rules";
import { requireSiteSettingsEdit } from "@/server/sites/sites.service";
import { errors } from "@/shared/errors";
import type { ContentInputs, ContentType } from "./content.schema";
import { contentRepository } from "./content.repository";

export async function listContent(
  claims: SessionClaims,
  siteId: string,
  type: ContentType,
) {
  await requireSiteSettingsEdit(claims, siteId);
  return contentRepository.list(siteId, type);
}

export async function createContent(
  claims: SessionClaims,
  siteId: string,
  type: ContentType,
  data: ContentInputs[ContentType],
) {
  await requireSiteSettingsEdit(claims, siteId);
  return contentRepository.create(siteId, type, data);
}

export async function updateContent(
  claims: SessionClaims,
  siteId: string,
  type: ContentType,
  itemId: string,
  data: Partial<ContentInputs[ContentType]>,
) {
  await requireSiteSettingsEdit(claims, siteId);
  const existing = await contentRepository.findInSite(siteId, type, itemId);
  if (!existing) throw errors.notFound("العنصر غير موجود");
  return contentRepository.update(type, itemId, data);
}

export async function deleteContent(
  claims: SessionClaims,
  siteId: string,
  type: ContentType,
  itemId: string,
) {
  await requireSiteSettingsEdit(claims, siteId);
  const existing = await contentRepository.findInSite(siteId, type, itemId);
  if (!existing) throw errors.notFound("العنصر غير موجود");
  await contentRepository.remove(type, itemId);
  return { id: itemId, deleted: true };
}

export async function reorderContent(
  claims: SessionClaims,
  siteId: string,
  type: ContentType,
  orderedIds: string[],
) {
  await requireSiteSettingsEdit(claims, siteId);
  const items = await contentRepository.list(siteId, type);
  const validIds = new Set(items.map((i) => i.id));
  if (
    orderedIds.length !== items.length ||
    !orderedIds.every((id) => validIds.has(id))
  ) {
    throw errors.validation("قائمة الترتيب يجب أن تشمل كل العناصر");
  }
  await contentRepository.reorder(type, orderedIds);
  return { ok: true };
}
