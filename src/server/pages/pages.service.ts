// Configurator business logic. Enforces the UX contract (AGENT_GUIDE §5): you
// may only add sections allowed for the page type, switch variant/scheme, edit
// fields, and reorder. No free layout.

import type { SessionClaims } from "@/server/access/access.rules";
import { requireSiteBuilderEdit } from "@/server/sites/sites.service";
import { isSectionAllowed } from "@/server/sections/sections.rules";
import { designsForSection } from "@/sections/designs";
import { deleteRemovedObjects } from "@/lib/storage-cleanup";
import { errors } from "@/shared/errors";
import type {
  AddSectionInput,
  CreatePageInput,
  UpdatePageInput,
  UpdateSectionInput,
} from "./pages.schema";
import { pagesRepository } from "./pages.repository";

// ---- Pages ----
export async function listPages(claims: SessionClaims, siteId: string) {
  await requireSiteBuilderEdit(claims, siteId);
  return pagesRepository.listPages(siteId);
}

export async function createPage(
  claims: SessionClaims,
  siteId: string,
  input: CreatePageInput,
) {
  await requireSiteBuilderEdit(claims, siteId);
  const clash = await pagesRepository.findPageByPath(siteId, input.path);
  if (clash) {
    throw errors.validation("المسار مستخدم مسبقًا", {
      path: "توجد صفحة بهذا المسار بالفعل",
    });
  }
  return pagesRepository.createPage(siteId, input);
}

export async function reorderPages(
  claims: SessionClaims,
  siteId: string,
  orderedIds: string[],
) {
  await requireSiteBuilderEdit(claims, siteId);
  const pages = await pagesRepository.listPages(siteId);
  const valid = new Set(pages.map((p) => p.id));
  if (orderedIds.length !== pages.length || !orderedIds.every((id) => valid.has(id))) {
    throw errors.validation("قائمة الترتيب يجب أن تشمل كل الصفحات");
  }
  await pagesRepository.reorderPages(orderedIds);
  return { ok: true };
}

async function requirePage(siteId: string, pageId: string) {
  const page = await pagesRepository.findPageInSite(siteId, pageId);
  if (!page) throw errors.notFound("الصفحة غير موجودة");
  return page;
}

export async function updatePage(
  claims: SessionClaims,
  siteId: string,
  pageId: string,
  input: UpdatePageInput,
) {
  await requireSiteBuilderEdit(claims, siteId);
  await requirePage(siteId, pageId);
  if (input.path !== undefined) {
    const clash = await pagesRepository.findPageByPath(siteId, input.path);
    if (clash && clash.id !== pageId) {
      throw errors.validation("المسار مستخدم مسبقًا", {
        path: "توجد صفحة بهذا المسار بالفعل",
      });
    }
  }
  return pagesRepository.updatePage(pageId, input);
}

export async function deletePage(
  claims: SessionClaims,
  siteId: string,
  pageId: string,
) {
  await requireSiteBuilderEdit(claims, siteId);
  const page = await requirePage(siteId, pageId);
  if (page.path === "/") {
    throw errors.validation("لا يمكن حذف الصفحة الرئيسية");
  }
  const total = await pagesRepository.countPages(siteId);
  if (total <= 1) {
    throw errors.validation("يجب أن يبقى للموقع صفحة واحدة على الأقل");
  }
  await pagesRepository.deletePage(pageId);
  return { id: pageId, deleted: true };
}

// ---- Section instances ----
export async function listSections(
  claims: SessionClaims,
  siteId: string,
  pageId: string,
) {
  await requireSiteBuilderEdit(claims, siteId);
  await requirePage(siteId, pageId);
  return pagesRepository.listSections(pageId);
}

export async function addSection(
  claims: SessionClaims,
  siteId: string,
  pageId: string,
  input: AddSectionInput,
) {
  await requireSiteBuilderEdit(claims, siteId);
  const page = await requirePage(siteId, pageId);

  if (!isSectionAllowed(page.pageType, input.sectionType)) {
    throw errors.validation("هذا القسم غير مسموح في هذه الصفحة", {
      sectionType: `${input.sectionType} غير مسموح في صفحة ${page.pageType}`,
    });
  }
  if (!isKnownDesign(input.sectionType, input.variant)) {
    throw errors.validation("تصميم غير صالح", { variant: "تصميم غير معروف لهذا القسم" });
  }
  return pagesRepository.addSection(pageId, input);
}

/** Is `variant` a design registered for this section type? (server-side gate) */
function isKnownDesign(sectionType: string, variant: string): boolean {
  return designsForSection(sectionType).some((d) => d.key === variant);
}

async function requireSection(pageId: string, sectionId: string) {
  const section = await pagesRepository.findSectionInPage(pageId, sectionId);
  if (!section) throw errors.notFound("القسم غير موجود");
  return section;
}

export async function updateSection(
  claims: SessionClaims,
  siteId: string,
  pageId: string,
  sectionId: string,
  input: UpdateSectionInput,
) {
  await requireSiteBuilderEdit(claims, siteId);
  await requirePage(siteId, pageId);
  const section = await requireSection(pageId, sectionId);
  if (input.variant !== undefined && !isKnownDesign(section.sectionType, input.variant)) {
    throw errors.validation("تصميم غير صالح", { variant: "تصميم غير معروف لهذا القسم" });
  }
  const updated = await pagesRepository.updateSection(sectionId, input);
  // Free any images this edit removed or replaced (e.g. cleared/replaced photos).
  // Fire-and-forget: it's best-effort cleanup, so don't add S3 latency to the save.
  if (input.content !== undefined) {
    void deleteRemovedObjects(section.content, input.content).catch(() => {});
  }
  return updated;
}

export async function deleteSection(
  claims: SessionClaims,
  siteId: string,
  pageId: string,
  sectionId: string,
) {
  await requireSiteBuilderEdit(claims, siteId);
  await requirePage(siteId, pageId);
  const section = await requireSection(pageId, sectionId);
  await pagesRepository.deleteSection(sectionId);
  // Delete every image this section owned (best-effort, non-blocking).
  void deleteRemovedObjects(section.content, {}).catch(() => {});
  return { id: sectionId, deleted: true };
}

export async function reorderSections(
  claims: SessionClaims,
  siteId: string,
  pageId: string,
  orderedIds: string[],
) {
  await requireSiteBuilderEdit(claims, siteId);
  await requirePage(siteId, pageId);
  const sections = await pagesRepository.listSections(pageId);
  const valid = new Set(sections.map((s) => s.id));
  if (orderedIds.length !== sections.length || !orderedIds.every((id) => valid.has(id))) {
    throw errors.validation("قائمة الترتيب يجب أن تشمل كل الأقسام");
  }
  await pagesRepository.reorderSections(orderedIds);
  return { ok: true };
}
