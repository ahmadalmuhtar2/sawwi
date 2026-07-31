import { z } from "zod";

// A browser PushSubscription as serialized by subscription.toJSON().
export const PushSubscriptionInput = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
export type PushSubscriptionInput = z.infer<typeof PushSubscriptionInput>;

export const PushUnsubscribeInput = z.object({
  endpoint: z.string().min(1),
});
export type PushUnsubscribeInput = z.infer<typeof PushUnsubscribeInput>;
