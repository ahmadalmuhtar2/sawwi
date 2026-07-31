# syntax=docker/dockerfile:1
#
# Sawwi — images for the Next.js app AND the BullMQ worker (same codebase).
# Stages: deps -> builder -> worker -> app. The `app` stage is LAST so Railway
# (which builds the final stage of the default Dockerfile) produces the web app
# with no extra config. The worker uses Dockerfile.worker. Local compose selects
# stages explicitly via `target:` (compose.yaml), so stage order is irrelevant
# there.

# ---- Base -------------------------------------------------------------------
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

# ---- Dependencies -----------------------------------------------------------
# --ignore-scripts: skip the `postinstall` (prisma generate) here — the schema
# isn't in this layer yet. We run generate explicitly once the source is copied.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---- Builder (Next.js standalone) -------------------------------------------
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# PUBLIC build-time vars: NEXT_PUBLIC_* are INLINED into the client bundle by
# `next build`, so their real values must be present HERE (not just at runtime).
# Pass them as build args (compose: build.args; Railway/`docker build`:
# --build-arg). They default to localhost so a bare `docker build` still works.
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ARG NEXT_PUBLIC_ROOT_DOMAIN="localhost:3000"
# The VAPID public key is inlined into the client so the browser can subscribe to
# Web Push. Empty by default (push simply disabled); Railway passes the real value
# as a build arg. Without this, `next build` bakes `undefined` and the client
# reports "notifications not configured" no matter the runtime env.
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
# Server-only placeholder env: `prisma generate` needs DATABASE_URL to load
# prisma.config.ts, and `next build` constructs the Better Auth instance +
# collects route data (which can touch the Prisma client). None of these connect
# at build, and none are inlined; the REAL values are injected at runtime.
# `export` so they apply to BOTH commands in the chain.
RUN export DATABASE_URL="postgresql://build:build@localhost:5432/build" \
      REDIS_URL="redis://localhost:6379" \
      ROOT_DOMAIN="localhost" \
      BETTER_AUTH_SECRET="build-time-placeholder-not-used-at-runtime" \
      BETTER_AUTH_URL="http://localhost:3000" \
      CRON_SECRET="build-time-placeholder" \
 && pnpm prisma generate && pnpm build

# ---- Worker: the BullMQ job processor ---------------------------------------
# Runs TypeScript directly via tsx (present in the installed devDependencies).
# Carries full node_modules + source + generated Prisma client. Selected by
# compose (`target: worker`) and by Dockerfile.worker for Railway.
FROM base AS worker
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Throwaway URL for generate only (see the builder stage note).
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" pnpm prisma generate
CMD ["pnpm", "tsx", "src/worker/index.ts"]

# ---- Runner: the Next.js app (LAST stage → Railway default) -----------------
FROM base AS app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
