// BullMQ job queues — the ONLY place producers enqueue work. Queues are created
// lazily and share the app's Redis connection. Payloads are typed per queue, so
// `enqueue("media", …)` is checked at compile time. Processors live in
// src/worker (the separate worker container consumes these).

import { Queue, type JobsOptions } from "bullmq";
import { getRedis } from "./redis";

export const QUEUE_NAMES = {
  media: "media",
  billing: "billing",
  analytics: "analytics",
} as const;

export type QueueName = keyof typeof QUEUE_NAMES;

// Typed payloads — extend the unions as real jobs land per milestone.
export type MediaJob = { type: "process-image"; siteId: string; mediaId: string };
export type BillingJob = { type: "expiry-sweep" } | { type: "renewal-alerts" };
export type AnalyticsJob = { type: "flush" };

export interface JobPayloads {
  media: MediaJob;
  billing: BillingJob;
  analytics: AnalyticsJob;
}

const DEFAULT_OPTS: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};

const queues = new Map<QueueName, Queue>();

function getQueue<K extends QueueName>(name: K): Queue<JobPayloads[K]> {
  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(QUEUE_NAMES[name], { connection: getRedis() });
    queues.set(name, queue);
  }
  return queue as Queue<JobPayloads[K]>;
}

/** Enqueue a typed job onto one of the known queues. */
export async function enqueue<K extends QueueName>(
  name: K,
  payload: JobPayloads[K],
  opts?: JobsOptions,
) {
  // Cast to the base Queue for `add`: BullMQ's name param is a conditional type
  // TS can't resolve through the generic K. Payload types are already enforced
  // by this function's signature.
  const queue = getQueue(name) as Queue;
  return queue.add(payload.type, payload, { ...DEFAULT_OPTS, ...opts });
}
