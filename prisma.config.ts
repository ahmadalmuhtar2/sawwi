import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

// Prisma 7 no longer auto-loads .env. Load it here so host CLI runs (generate/
// migrate/studio, and `pnpm check`) see DATABASE_URL. In CI/Docker there is no
// .env file — the vars are already in the environment — so this is a no-op.
if (existsSync(".env")) process.loadEnvFile(".env");

// Prisma 7 config. The connection URL lives here (for migrate/studio) instead
// of in schema.prisma. Runtime access uses the driver adapter in src/lib/db.ts.
//
// To run migrations from the host, expose Postgres (uncomment the 5432 port in
// compose.yaml) and point DATABASE_URL at localhost:5432, then:
//   pnpm prisma migrate dev --name init
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
