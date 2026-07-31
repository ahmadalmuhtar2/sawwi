-- CreateEnum
CREATE TYPE "SiteMessageStatus" AS ENUM ('unread', 'read', 'archived');

-- CreateTable
CREATE TABLE "site_messages" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "body" TEXT NOT NULL,
    "status" "SiteMessageStatus" NOT NULL DEFAULT 'unread',
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_messages_siteId_status_idx" ON "site_messages"("siteId", "status");

-- CreateIndex
CREATE INDEX "site_messages_siteId_createdAt_idx" ON "site_messages"("siteId", "createdAt");

-- AddForeignKey
ALTER TABLE "site_messages" ADD CONSTRAINT "site_messages_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
