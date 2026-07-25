import { z } from "zod";

// Invite one email as a collaborator on one or more sites. Collaborators edit
// settings; builderAccess additionally grants the page/section builder + publish.
export const InviteCollaboratorInput = z.object({
  email: z.email().transform((e) => e.trim().toLowerCase()),
  siteIds: z.array(z.string().min(1)).min(1),
  builderAccess: z.boolean().default(false),
});
export type InviteCollaboratorInput = z.infer<typeof InviteCollaboratorInput>;

export const UpdateCollaboratorInput = z.object({
  builderAccess: z.boolean(),
});
export type UpdateCollaboratorInput = z.infer<typeof UpdateCollaboratorInput>;
