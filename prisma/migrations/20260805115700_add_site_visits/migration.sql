-- CreateTable
CREATE TABLE "site_visits" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_visits_siteId_ipHash_createdAt_idx" ON "site_visits"("siteId", "ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "site_visits_siteId_idx" ON "site_visits"("siteId");

-- AddForeignKey
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
