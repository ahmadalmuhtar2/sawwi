// Structured logging (pino). Plain JSON — no transport worker threads, which
// keep it safe inside Next's server bundle. Pipe through `pino-pretty` in dev if
// you want colours: `pnpm dev | pino-pretty`.

import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: undefined, // omit pid/hostname noise
});

/** Child logger carrying a request id (or any bindings) for traceability. */
export function withRequestId(requestId: string) {
  return logger.child({ requestId });
}
