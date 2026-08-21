-- Customers — the demand-side mirror of providers. Fully additive: a new enum, a
-- new table, and one new nullable column + FK on jobs. Nothing renamed or dropped,
-- so the currently-deployed code keeps running unchanged during the deploy overlap.

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "customerId" TEXT;

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "submissionId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneRaw" TEXT NOT NULL,
    "area" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'DRAFT',
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_submissionId_key" ON "customers"("submissionId");

-- CreateIndex
CREATE INDEX "customers_siteId_status_idx" ON "customers"("siteId", "status");

-- CreateIndex
CREATE INDEX "jobs_customerId_idx" ON "jobs"("customerId");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
