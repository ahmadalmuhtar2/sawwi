// Structured content: Services, Team, Testimonials, FAQ. All are site-scoped,
// ordered lists reused across sections. One type-dispatched API handles all four
// to avoid four near-identical route trees.

import { z } from "zod";

export const CONTENT_TYPES = ["services", "team", "testimonials", "faq"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value);
}

// Create schemas per type. Update = the same fields, all optional (.partial()).
export const CONTENT_CREATE = {
  services: z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().max(1000).nullish(),
    price: z.string().max(60).nullish(),
    duration: z.string().max(60).nullish(),
    imageMediaId: z.string().nullish(),
    visible: z.boolean().default(true),
  }),
  team: z.object({
    name: z.string().trim().min(1).max(120),
    roleTitle: z.string().max(120).nullish(),
    photoMediaId: z.string().nullish(),
  }),
  testimonials: z.object({
    author: z.string().trim().min(1).max(120),
    text: z.string().trim().min(1).max(1000),
  }),
  faq: z.object({
    question: z.string().trim().min(1).max(300),
    answer: z.string().trim().min(1).max(2000),
  }),
} as const;

export const ReorderInput = z.object({
  orderedIds: z.array(z.string()).min(1),
});
export type ReorderInput = z.infer<typeof ReorderInput>;

export type ContentInputs = {
  [K in ContentType]: z.infer<(typeof CONTENT_CREATE)[K]>;
};
export type CreateContentInput = ContentInputs[ContentType];

// Parse helpers centralize the type-dispatch cast so routes stay clean. Invalid
// bodies throw ZodError -> the route wrapper turns it into VALIDATION_ERROR.
export function parseContentCreate(
  type: ContentType,
  body: unknown,
): ContentInputs[ContentType] {
  return (CONTENT_CREATE[type] as z.ZodType).parse(body) as ContentInputs[ContentType];
}

export function parseContentUpdate(
  type: ContentType,
  body: unknown,
): Partial<ContentInputs[ContentType]> {
  return (CONTENT_CREATE[type] as z.ZodObject<z.ZodRawShape>)
    .partial()
    .parse(body) as Partial<ContentInputs[ContentType]>;
}
