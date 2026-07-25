// Configurator DTOs: pages and their section instances. Section TYPE/variant
// legality is enforced in the service via server/sections rules; these schemas
// just validate shape.

import { z } from "zod";
import { pageSeoSchema } from "@/shared/seo";

export const PAGE_TYPES = ["landing", "about", "contact", "services", "custom"] as const;
const COLOR_SCHEMES = ["primary", "bold", "dark", "light", "muted", "accent", "soft"] as const;

export const CreatePageInput = z.object({
  path: z
    .string()
    .trim()
    .regex(/^\/[a-z0-9\-/]*$/, { message: "مسار غير صالح" })
    .max(80),
  pageType: z.enum(PAGE_TYPES).default("custom"),
  title: z.string().trim().min(1).max(120),
  seo: pageSeoSchema.default({}),
});
export type CreatePageInput = z.infer<typeof CreatePageInput>;

export const UpdatePageInput = CreatePageInput.partial();
export type UpdatePageInput = z.infer<typeof UpdatePageInput>;

export const AddSectionInput = z.object({
  sectionType: z.string(),
  variant: z.string().default("A"),
  colorScheme: z.enum(COLOR_SCHEMES).default("primary"),
  content: z.record(z.string(), z.unknown()).default({}),
  dataSource: z.record(z.string(), z.unknown()).default({}),
});
export type AddSectionInput = z.infer<typeof AddSectionInput>;

export const UpdateSectionInput = z.object({
  variant: z.string().optional(),
  colorScheme: z.enum(COLOR_SCHEMES).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  dataSource: z.record(z.string(), z.unknown()).optional(),
});
export type UpdateSectionInput = z.infer<typeof UpdateSectionInput>;

export const ReorderInput = z.object({ orderedIds: z.array(z.string()).min(1) });
export type ReorderInput = z.infer<typeof ReorderInput>;
