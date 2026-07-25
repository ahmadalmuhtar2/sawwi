import path from "node:path";
import { defineConfig, env } from "prisma/config";

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
