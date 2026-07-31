<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Git discipline — ASK FIRST

**NEVER `git push`, open/merge a PR, or otherwise deploy without the user's explicit
approval in the current message.** Committing locally and preparing a branch is fine, but
the push/PR/merge step must be approved first, every time. Do not infer approval from earlier
messages or from the task being "ready" — ask, then wait.

## Database migrations — NEVER break production

Railway ships the new code on every push to `main`, but it does **not** run migrations.
Prod's schema is kept in lockstep by CI: after the `CI` workflow passes on `main`, the
`Deploy migrations (production)` workflow (`.github/workflows/deploy-migrations.yml`) runs
`prisma migrate deploy` against the prod DB (secret `PRODUCTION_DATABASE_URL`). Rules:

1. **Every schema change ships as a migration file.** Never hand-edit `schema.prisma` without
   generating a matching migration (`pnpm prisma migrate dev --name <what>`). CI's `migrate
   status` fails the build if the schema and migration history drift apart.
2. **Migrations must be additive / backward-compatible (expand → contract).** The old code and
   the new code both run against the DB during the deploy window, so a migration that *removes*
   or *renames* a column the currently-live code still reads will 500 prod. To drop/rename:
   ship the additive change first (add new column, backfill, dual-write), deploy, and only
   remove the old column in a *later* migration once nothing reads it.
3. **Never point local `prisma migrate dev` at the prod DB.** Author migrations against a local
   Postgres; prod is migrated only by the CI workflow above (or, in an incident, a deliberate
   `prisma migrate deploy` with the prod `DATABASE_URL`).

Symptom of a skipped migration: `The column X does not exist in the current database` (Prisma
`P2022`) — the code is ahead of the DB. Fix by applying the pending migrations to prod.

# Sawwi

**Read [`AGENT_GUIDE.md`](AGENT_GUIDE.md) before doing any work** — it is the authoritative
build guide (architecture, locked stack decisions, domain model, conventions, milestones).
The full product spec is in [`docs/PRD.md`](docs/PRD.md). The guide overrides the PRD on
stack & architecture.

Quick orientation: Sawwi is an Arabic-first (RTL), template-based website **configurator**
for the Syrian market — assembly, not design. It is **one Next.js 16 app** (front + back),
Better Auth, Prisma/Postgres, Cloudflare R2, served behind Caddy. No microservices, no Redis,
no BullMQ in v1.
