// Data access for structured content. Dispatches on ContentType to the matching
// Prisma model. Explicit switches keep it type-safe and readable (no `any`).

import { getPrisma } from "@/lib/db";
import type { ContentType, ContentInputs } from "./content.schema";

const orderedBySite = (siteId: string) => ({
  where: { siteId },
  orderBy: { order: "asc" as const },
});

export const contentRepository = {
  list(siteId: string, type: ContentType) {
    const p = getPrisma();
    switch (type) {
      case "services":
        return p.service.findMany(orderedBySite(siteId));
      case "team":
        return p.teamMember.findMany(orderedBySite(siteId));
      case "testimonials":
        return p.testimonial.findMany(orderedBySite(siteId));
      case "faq":
        return p.faqItem.findMany(orderedBySite(siteId));
    }
  },

  async findInSite(siteId: string, type: ContentType, id: string) {
    const p = getPrisma();
    const where = { id, siteId };
    switch (type) {
      case "services":
        return p.service.findFirst({ where });
      case "team":
        return p.teamMember.findFirst({ where });
      case "testimonials":
        return p.testimonial.findFirst({ where });
      case "faq":
        return p.faqItem.findFirst({ where });
    }
  },

  async create(siteId: string, type: ContentType, data: ContentInputs[ContentType]) {
    const p = getPrisma();
    const order = await this.count(siteId, type); // append to the end
    switch (type) {
      case "services":
        return p.service.create({
          data: { siteId, order, ...(data as ContentInputs["services"]) },
        });
      case "team":
        return p.teamMember.create({
          data: { siteId, order, ...(data as ContentInputs["team"]) },
        });
      case "testimonials":
        return p.testimonial.create({
          data: { siteId, order, ...(data as ContentInputs["testimonials"]) },
        });
      case "faq":
        return p.faqItem.create({
          data: { siteId, order, ...(data as ContentInputs["faq"]) },
        });
    }
  },

  count(siteId: string, type: ContentType) {
    const p = getPrisma();
    switch (type) {
      case "services":
        return p.service.count({ where: { siteId } });
      case "team":
        return p.teamMember.count({ where: { siteId } });
      case "testimonials":
        return p.testimonial.count({ where: { siteId } });
      case "faq":
        return p.faqItem.count({ where: { siteId } });
    }
  },

  update(type: ContentType, id: string, data: Partial<ContentInputs[ContentType]>) {
    const p = getPrisma();
    switch (type) {
      case "services":
        return p.service.update({ where: { id }, data: data as Partial<ContentInputs["services"]> });
      case "team":
        return p.teamMember.update({ where: { id }, data: data as Partial<ContentInputs["team"]> });
      case "testimonials":
        return p.testimonial.update({ where: { id }, data: data as Partial<ContentInputs["testimonials"]> });
      case "faq":
        return p.faqItem.update({ where: { id }, data: data as Partial<ContentInputs["faq"]> });
    }
  },

  remove(type: ContentType, id: string) {
    const p = getPrisma();
    switch (type) {
      case "services":
        return p.service.delete({ where: { id } });
      case "team":
        return p.teamMember.delete({ where: { id } });
      case "testimonials":
        return p.testimonial.delete({ where: { id } });
      case "faq":
        return p.faqItem.delete({ where: { id } });
    }
  },

  /** Persist a new order: item at index i gets order = i. */
  reorder(type: ContentType, orderedIds: string[]) {
    const p = getPrisma();
    const updates = orderedIds.map((id, order) => {
      switch (type) {
        case "services":
          return p.service.update({ where: { id }, data: { order } });
        case "team":
          return p.teamMember.update({ where: { id }, data: { order } });
        case "testimonials":
          return p.testimonial.update({ where: { id }, data: { order } });
        case "faq":
          return p.faqItem.update({ where: { id }, data: { order } });
      }
    });
    return p.$transaction(updates);
  },
};
