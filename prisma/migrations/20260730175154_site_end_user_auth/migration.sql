-- CreateEnum
CREATE TYPE "SiteUserRole" AS ENUM ('manager', 'contributor', 'member');

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "authEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "roleLabels" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "site_users" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "SiteUserRole" NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_user_sessions" (
    "id" TEXT NOT NULL,
    "siteUserId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_users_siteId_idx" ON "site_users"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "site_users_siteId_email_key" ON "site_users"("siteId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "site_user_sessions_token_key" ON "site_user_sessions"("token");

-- CreateIndex
CREATE INDEX "site_user_sessions_siteId_idx" ON "site_user_sessions"("siteId");

-- CreateIndex
CREATE INDEX "site_user_sessions_siteUserId_idx" ON "site_user_sessions"("siteUserId");

-- AddForeignKey
ALTER TABLE "site_users" ADD CONSTRAINT "site_users_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_user_sessions" ADD CONSTRAINT "site_user_sessions_siteUserId_fkey" FOREIGN KEY ("siteUserId") REFERENCES "site_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
