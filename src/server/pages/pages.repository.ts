// Data access for pages and section instances — the only Prisma layer here.

import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type {
  AddSectionInput,
  CreatePageInput,
  UpdatePageInput,
  UpdateSectionInput,
} from "./pages.schema";

const json = (v: unknown) => v as Prisma.InputJsonValue;

export const pagesRepository = {
  // ---- Pages ----
  listPages(siteId: string) {
    return getPrisma().page.findMany({
      where: { siteId },
      orderBy: { order: "asc" },
    });
  },

  findPageInSite(siteId: string, pageId: string) {
    return getPrisma().page.findFirst({ where: { id: pageId, siteId } });
  },

  findPageByPath(siteId: string, path: string) {
    return getPrisma().page.findFirst({ where: { siteId, path } });
  },

  countPages(siteId: string) {
    return getPrisma().page.count({ where: { siteId } });
  },

  async createPage(siteId: string, data: CreatePageInput) {
    const order = await getPrisma().page.count({ where: { siteId } });
    return getPrisma().page.create({
      data: {
        siteId,
        path: data.path,
        pageType: data.pageType,
        title: data.title,
        seo: json(data.seo),
        order,
      },
    });
  },

  updatePage(pageId: string, data: UpdatePageInput) {
    return getPrisma().page.update({
      where: { id: pageId },
      data: {
        path: data.path,
        pageType: data.pageType,
        title: data.title,
        seo: data.seo === undefined ? undefined : json(data.seo),
      },
    });
  },

  deletePage(pageId: string) {
    return getPrisma().page.delete({ where: { id: pageId } });
  },

  reorderPages(orderedIds: string[]) {
    return getPrisma().$transaction(
      orderedIds.map((id, order) =>
        getPrisma().page.update({ where: { id }, data: { order } }),
      ),
    );
  },

  // ---- Section instances ----
  listSections(pageId: string) {
    return getPrisma().sectionInstance.findMany({
      where: { pageId },
      orderBy: { order: "asc" },
    });
  },

  findSectionInPage(pageId: string, sectionId: string) {
    return getPrisma().sectionInstance.findFirst({
      where: { id: sectionId, pageId },
    });
  },

  async addSection(pageId: string, data: AddSectionInput) {
    const order = await getPrisma().sectionInstance.count({ where: { pageId } });
    return getPrisma().sectionInstance.create({
      data: {
        pageId,
        sectionType: data.sectionType,
        variant: data.variant,
        colorScheme: data.colorScheme,
        content: json(data.content),
        dataSource: json(data.dataSource),
        order,
      },
    });
  },

  updateSection(sectionId: string, data: UpdateSectionInput) {
    return getPrisma().sectionInstance.update({
      where: { id: sectionId },
      data: {
        variant: data.variant,
        colorScheme: data.colorScheme,
        content: data.content === undefined ? undefined : json(data.content),
        dataSource:
          data.dataSource === undefined ? undefined : json(data.dataSource),
      },
    });
  },

  deleteSection(sectionId: string) {
    return getPrisma().sectionInstance.delete({ where: { id: sectionId } });
  },

  reorderSections(orderedIds: string[]) {
    return getPrisma().$transaction(
      orderedIds.map((id, order) =>
        getPrisma().sectionInstance.update({ where: { id }, data: { order } }),
      ),
    );
  },
};
