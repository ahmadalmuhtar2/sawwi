-- Provider profiles, jobs, and ratings — the data foundation for the (initially
-- hidden) provider directory. Fully additive: new enums, new tables, one new
-- nullable-with-default column. Nothing renamed or dropped; the currently-deployed
-- code keeps running unchanged while both versions overlap during a deploy.

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'REMOVED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('MATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "RatingSource" AS ENUM ('FOLLOW_UP_CALL', 'WHATSAPP', 'IN_PERSON');

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "publicProfilesEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "submissionId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "phone" TEXT NOT NULL,
    "phoneRaw" TEXT NOT NULL,
    "categories" TEXT[],
    "areas" TEXT[],
    "bio" TEXT,
    "status" "ProviderStatus" NOT NULL DEFAULT 'DRAFT',
    "verifiedAt" TIMESTAMP(3),
    "profilePublic" BOOLEAN NOT NULL DEFAULT false,
    "jobsCompleted" INTEGER NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "ratingSum" INTEGER NOT NULL DEFAULT 0,
    "ratingAvg" DECIMAL(3,2),
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_photos" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "provider_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "customerSubmissionId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "description" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'MATCHED',
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "followedUpAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "publicComment" TEXT,
    "commentApproved" BOOLEAN NOT NULL DEFAULT false,
    "privateNote" TEXT,
    "source" "RatingSource" NOT NULL,
    "recordedByUserId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_submissionId_key" ON "providers"("submissionId");

-- CreateIndex
CREATE INDEX "providers_siteId_status_idx" ON "providers"("siteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "providers_siteId_slug_key" ON "providers"("siteId", "slug");

-- CreateIndex
CREATE INDEX "provider_photos_providerId_sortOrder_idx" ON "provider_photos"("providerId", "sortOrder");

-- CreateIndex
CREATE INDEX "jobs_siteId_status_matchedAt_idx" ON "jobs"("siteId", "status", "matchedAt");

-- CreateIndex
CREATE INDEX "jobs_providerId_status_idx" ON "jobs"("providerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_jobId_key" ON "ratings"("jobId");

-- CreateIndex
CREATE INDEX "ratings_providerId_recordedAt_idx" ON "ratings"("providerId", "recordedAt");

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_photos" ADD CONSTRAINT "provider_photos_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
