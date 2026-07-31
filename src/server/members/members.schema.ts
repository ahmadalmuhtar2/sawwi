import { z } from "zod";

export const UpdateCollaboratorInput = z.object({
  builderAccess: z.boolean(),
});
export type UpdateCollaboratorInput = z.infer<typeof UpdateCollaboratorInput>;

// Invite one email to a SINGLE site (the per-site Collaborators tab). The site is
// taken from the route, so only the email + builder flag are in the body.
export const InviteSiteCollaboratorInput = z.object({
  email: z.email().transform((e) => e.trim().toLowerCase()),
  builderAccess: z.boolean().default(false),
});
export type InviteSiteCollaboratorInput = z.infer<typeof InviteSiteCollaboratorInput>;
