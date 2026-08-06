-- allow-destructive: visits table carries no shipped data yet; cleared to add NOT NULL key.
-- Re-key site visits from hashed-IP (+2h window) to BROWSER SESSION: one visit
-- per (site, session) via a unique constraint. The table carries no shipped data
-- yet (this and add_site_visits deploy together, before any release reads it), so
-- clearing it first makes the NOT NULL column addition safe. Guards keep the step
-- idempotent regardless of partial local state.
DELETE FROM "site_visits";

ALTER TABLE "site_visits" DROP COLUMN IF EXISTS "ipHash";
ALTER TABLE "site_visits" ADD COLUMN IF NOT EXISTS "sessionKey" TEXT NOT NULL;

DROP INDEX IF EXISTS "site_visits_siteId_ipHash_createdAt_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "site_visits_siteId_sessionKey_key" ON "site_visits"("siteId", "sessionKey");
