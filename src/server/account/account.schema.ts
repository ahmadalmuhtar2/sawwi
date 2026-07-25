import { z } from "zod";

// The signed-in user's personal profile (avatar has its own upload route).
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جدًا").max(120, "الاسم طويل جدًا"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
