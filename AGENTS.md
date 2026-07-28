<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Git discipline — ASK FIRST

**NEVER `git push`, open/merge a PR, or otherwise deploy without the user's explicit
approval in the current message.** Committing locally and preparing a branch is fine, but
the push/PR/merge step must be approved first, every time. Do not infer approval from earlier
messages or from the task being "ready" — ask, then wait.

# Sawwi

**Read [`AGENT_GUIDE.md`](AGENT_GUIDE.md) before doing any work** — it is the authoritative
build guide (architecture, locked stack decisions, domain model, conventions, milestones).
The full product spec is in [`docs/PRD.md`](docs/PRD.md). The guide overrides the PRD on
stack & architecture.

Quick orientation: Sawwi is an Arabic-first (RTL), template-based website **configurator**
for the Syrian market — assembly, not design. It is **one Next.js 16 app** (front + back),
Better Auth, Prisma/Postgres, Cloudflare R2, served behind Caddy. No microservices, no Redis,
no BullMQ in v1.
