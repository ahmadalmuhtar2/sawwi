// Zod DTOs for the visitor-messages (lead inbox) feature. The submit input is
// PUBLIC (an unauthenticated visitor posts it), so every field is tightly
// bounded here — this is the trust boundary for the public endpoint.

import { z } from "zod";

export const SubmitMessageInput = z.object({
  // Which published site the form belongs to (the visitor only knows the slug).
  slug: z.string().min(1).max(64),
  name: z.string().trim().min(1, "الاسم مطلوب").max(80, "الاسم طويل جدًا"),
  // Optional phone / WhatsApp / email — free text so the owner can reply.
  contact: z.string().trim().max(60, "معلومات التواصل طويلة جدًا").optional(),
  body: z.string().trim().min(1, "الرسالة مطلوبة").max(1000, "الرسالة طويلة جدًا"),
  // Honeypot: a hidden field real users never see. Bots fill it; the service
  // silently drops those. Lenient here so we can 200 without tipping the bot off.
  company: z.string().max(200).optional(),
});
export type SubmitMessageInput = z.infer<typeof SubmitMessageInput>;

export const MessageStatusInput = z.object({
  status: z.enum(["unread", "read", "archived"]),
});
export type MessageStatusInput = z.infer<typeof MessageStatusInput>;

/** Inbox filter — the three real statuses plus an "all" pseudo-filter. */
export const MessageFilter = z.enum(["all", "unread", "read", "archived"]);
export type MessageFilter = z.infer<typeof MessageFilter>;
