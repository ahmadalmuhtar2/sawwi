// The section library contract (AGENT_GUIDE §6, PRD §4.3). The configurator may
// only: add sections from the allowed list per page type, reorder them, and
// switch variant/scheme. These pure helpers enforce that contract; visuals live
// in src/sections/.

import type { PageType } from "@/shared/domain";

/** Section library v1 — FROZEN at 13 types (AGENT_GUIDE §6). */
export const SECTION_TYPES = [
  "Hero",
  "About",
  "ServicesGrid",
  "PriceList",
  "Gallery",
  "Testimonials",
  "Team",
  "OpeningHours",
  "MapAddress",
  "WhatsAppCTA",
  "Faq",
  "AnnouncementBanner",
  "ContactBlock",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

/** Header & Footer are generated automatically — never added via the section list. */
export const AUTO_SECTIONS = ["Header", "Footer"] as const;

const SECTION_SET: ReadonlySet<string> = new Set(SECTION_TYPES);

/** Allowed style variants per section (AGENT_GUIDE §6: 2–3 designed variants). */
export const VARIANTS = ["A", "B", "C"] as const;
export type Variant = (typeof VARIANTS)[number];
const VARIANT_SET: ReadonlySet<string> = new Set(VARIANTS);

/** Which section types a page of each type may contain. */
export const PAGE_TYPE_SECTIONS: Record<PageType, ReadonlyArray<SectionType>> = {
  landing: [...SECTION_TYPES],
  about: [
    "Hero",
    "About",
    "Team",
    "Testimonials",
    "Gallery",
    "Faq",
    "AnnouncementBanner",
    "ContactBlock",
    "WhatsAppCTA",
  ],
  contact: ["Hero", "MapAddress", "OpeningHours", "ContactBlock", "WhatsAppCTA"],
  services: [
    "Hero",
    "ServicesGrid",
    "PriceList",
    "Faq",
    "ContactBlock",
    "WhatsAppCTA",
  ],
  custom: [...SECTION_TYPES],
};

export function isSectionType(value: string): value is SectionType {
  return SECTION_SET.has(value);
}

export function isValidVariant(value: string): value is Variant {
  return VARIANT_SET.has(value);
}

/** Is `sectionType` allowed to be added to a page of `pageType`? */
export function isSectionAllowed(
  pageType: PageType,
  sectionType: string,
): boolean {
  if (!isSectionType(sectionType)) return false;
  return PAGE_TYPE_SECTIONS[pageType].includes(sectionType);
}

/**
 * Move the item at `from` to `to`, returning a NEW array. Throws on
 * out-of-range indices so callers can't silently corrupt ordering.
 */
export function reorder<T>(list: ReadonlyArray<T>, from: number, to: number): T[] {
  const n = list.length;
  if (!Number.isInteger(from) || !Number.isInteger(to)) {
    throw new RangeError("indices must be integers");
  }
  if (from < 0 || from >= n || to < 0 || to >= n) {
    throw new RangeError("index out of range");
  }
  const next = list.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Reassign contiguous `order` values 0..n-1 in the array's current sequence. */
export function normalizeOrders<T>(items: ReadonlyArray<T>): Array<T & { order: number }> {
  return items.map((item, index) => ({ ...item, order: index }));
}
