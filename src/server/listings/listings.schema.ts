// Zod DTOs for marketplace listings. The per-vertical FIELD set is owned by the
// template module (not the server) and lands in `specs`; here we only bound the
// generic shape so a malformed/oversized payload can't be stored.

import { z } from "zod";

/** A single spec value — the template's fields are strings, numbers, or flags. */
const SpecValue = z.union([z.string().max(200), z.number(), z.boolean()]);

/** Create shape: vertical + title are the minimum a listing needs. */
export const CreateListingInput = z.object({
  vertical: z.enum(["car", "home"]),
  title: z.string().trim().min(1, "العنوان مطلوب").max(140, "العنوان طويل جدًا"),
  price: z.number().nonnegative("السعر غير صالح").nullable().optional(),
  offer: z.string().max(20).nullable().optional(),
  place: z.string().trim().max(80).nullable().optional(),
  description: z.string().max(4000, "الوصف طويل جدًا").nullable().optional(),
  images: z.array(z.string().max(600)).max(12, "الحد الأقصى ١٢ صورة").default([]),
  features: z.array(z.string().trim().max(60)).max(40).default([]),
  specs: z.record(z.string().max(40), SpecValue).default({}),
  published: z.boolean().optional(),
});
export type CreateListingInput = z.infer<typeof CreateListingInput>;

/** Update shape: everything optional; the vertical is immutable after create. */
export const UpdateListingInput = CreateListingInput.omit({ vertical: true }).partial();
export type UpdateListingInput = z.infer<typeof UpdateListingInput>;

export const PublishListingInput = z.object({ published: z.boolean() });
export type PublishListingInput = z.infer<typeof PublishListingInput>;
