<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Sawwi

**Read [`AGENT_GUIDE.md`](AGENT_GUIDE.md) before doing any work** — it is the authoritative
build guide (architecture, locked stack decisions, domain model, conventions, milestones).
The full product spec is in [`docs/PRD.md`](docs/PRD.md). The guide overrides the PRD on
stack & architecture.

Quick orientation: Sawwi is an Arabic-first (RTL), template-based website **configurator**
for the Syrian market — assembly, not design. It is **one Next.js 16 app** (front + back),
Better Auth, Prisma/Postgres, Cloudflare R2, served behind Caddy. No microservices, no Redis,
no BullMQ in v1.
