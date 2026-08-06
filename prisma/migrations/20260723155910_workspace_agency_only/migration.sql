-- allow-destructive: contact info moved to SiteSettings; already shipped.
-- Workspace is the agency/account only; business contact info lives on each
-- website (SiteSettings). Drop the misplaced contact columns.
ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "phone";
ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "city";
ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "address";
