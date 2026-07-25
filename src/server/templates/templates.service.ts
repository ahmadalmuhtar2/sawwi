// Instantiate a template into a site: create real Page / SectionInstance /
// Service / SiteSettings / SiteTheme rows in one transaction.

import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getTemplate, listTemplates } from "./registry";

const json = (v: unknown) => v as Prisma.InputJsonValue;

export { listTemplates };

export async function applyTemplate(siteId: string, templateKey: string): Promise<void> {
  const template = getTemplate(templateKey);
  if (!template) return;

  await getPrisma().$transaction(async (tx) => {
    for (const [pageIndex, page] of template.pages.entries()) {
      const createdPage = await tx.page.create({
        data: {
          siteId,
          path: page.path,
          pageType: page.pageType,
          title: page.title,
          seo: json({}),
          order: pageIndex,
        },
      });
      for (const [sectionIndex, section] of page.sections.entries()) {
        await tx.sectionInstance.create({
          data: {
            pageId: createdPage.id,
            sectionType: section.type,
            variant: section.variant ?? "A",
            colorScheme: section.scheme ?? "primary",
            content: json(section.content ?? {}),
            dataSource: json({}),
            order: sectionIndex,
          },
        });
      }
    }

    for (const [i, svc] of (template.services ?? []).entries()) {
      await tx.service.create({
        data: {
          siteId,
          name: svc.name,
          price: svc.price ?? null,
          duration: svc.duration ?? null,
          description: svc.description ?? null,
          order: i,
          visible: true,
        },
      });
    }

    if (template.settings) {
      await tx.siteSettings.upsert({
        where: { siteId },
        create: {
          siteId,
          whatsappNumber: template.settings.whatsappNumber ?? null,
          phone: template.settings.phone ?? null,
          address: template.settings.address ?? null,
          googleMapsUrl: template.settings.googleMapsUrl ?? null,
          openingHours: json(template.settings.openingHours ?? {}),
          socials: json({}),
        },
        update: {},
      });
    }

    await tx.siteTheme.upsert({
      where: { siteId },
      create: {
        siteId,
        fontKey: "readex",
        headerVariant: template.theme?.headerVariant ?? null,
        headerScheme: template.theme?.headerScheme ?? null,
        footerVariant: template.theme?.footerVariant ?? null,
        footerScheme: template.theme?.footerScheme ?? null,
      },
      update: {},
    });
  });
}
