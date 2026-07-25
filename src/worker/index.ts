// The BullMQ worker process — runs as its own container (compose service
// `worker`, Dockerfile `worker` target). It consumes the queues declared in
// src/lib/jobs and idles until jobs arrive. Processors are stubs today; real
// logic is filled per milestone (media, billing, analytics).

import { Worker, Queue, type Job } from "bullmq";
import { Redis } from "ioredis";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { QUEUE_NAMES, type JobPayloads } from "@/lib/jobs";
import { runRenewalAlerts } from "@/server/billing/reminders";

// A worker needs its OWN blocking connection (not the shared producer one).
const connection = new Redis(getEnv().REDIS_URL, { maxRetriesPerRequest: null });

function register<K extends keyof JobPayloads>(
  name: K,
  handler: (job: Job<JobPayloads[K]>) => Promise<void>,
): Worker<JobPayloads[K]> {
  const worker = new Worker<JobPayloads[K]>(QUEUE_NAMES[name], handler, {
    connection,
  });
  worker.on("failed", (job, err) =>
    logger.error({ queue: name, jobId: job?.id, err: err.message }, "job failed"),
  );
  worker.on("completed", (job) =>
    logger.info({ queue: name, jobId: job.id }, "job completed"),
  );
  return worker;
}

const workers = [
  register("media", async (job) => {
    logger.info({ type: job.data.type }, "media job received");
    // TODO(media milestone): sharp pipeline — WebP + variants, blurhash, EXIF strip.
  }),
  register("billing", async (job) => {
    logger.info({ type: job.data.type }, "billing job received");
    if (job.data.type === "renewal-alerts") {
      await runRenewalAlerts();
    }
    // "expiry-sweep": status is computed on read + gated at serve time, so no
    // stored-status flip is needed today.
  }),
  register("analytics", async (job) => {
    logger.info({ type: job.data.type }, "analytics job received");
    // TODO(analytics milestone): daily per-site aggregate flush.
  }),
];

// Daily scheduler: enqueue the renewal-alerts sweep every day at 08:00. A
// separate (non-blocking) connection is used for the producer-side Queue.
const scheduler = new Queue(QUEUE_NAMES.billing, {
  connection: new Redis(getEnv().REDIS_URL),
});
void scheduler.upsertJobScheduler(
  "renewal-alerts-daily",
  { pattern: "0 8 * * *" },
  { name: "renewal-alerts", data: { type: "renewal-alerts" } },
);

logger.info(
  { queues: Object.values(QUEUE_NAMES) },
  "Sawwi worker started",
);

async function shutdown(signal: string) {
  logger.info({ signal }, "worker shutting down");
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
