// Shared ioredis connection. Reused across hot reloads in dev. BullMQ needs
// `maxRetriesPerRequest: null` on connections it drives, so we use that here and
// share the single instance for both cache use and the queue system.

import { Redis } from "ioredis";
import { getEnv } from "./env";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export function getRedis(): Redis {
  if (!globalForRedis.redis) {
    globalForRedis.redis = new Redis(getEnv().REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
  return globalForRedis.redis;
}
