-- CreateEnum
CREATE TYPE "SubmissionKind" AS ENUM ('PROVIDER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('NEW', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'CONTACTED');

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "kind" "SubmissionKind" NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'NEW',
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneRaw" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "details" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submissions_siteId_kind_status_createdAt_idx" ON "submissions"("siteId", "kind", "status", "createdAt");

-- CreateIndex
CREATE INDEX "submissions_siteId_phone_idx" ON "submissions"("siteId", "phone");

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
