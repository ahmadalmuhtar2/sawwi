-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "authorSiteUserId" TEXT;

-- CreateIndex
CREATE INDEX "listings_siteId_authorSiteUserId_idx" ON "listings"("siteId", "authorSiteUserId");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_authorSiteUserId_fkey" FOREIGN KEY ("authorSiteUserId") REFERENCES "site_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
