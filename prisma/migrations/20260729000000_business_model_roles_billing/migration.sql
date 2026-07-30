-- CreateEnum
CREATE TYPE "WorkspaceKind" AS ENUM ('reseller', 'direct');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'checked', 'stopped', 'refunded');

-- AlterTable
ALTER TABLE "payment_records" ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "site_access" ADD COLUMN     "token" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "endDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactWhatsapp" TEXT,
ADD COLUMN     "kind" "WorkspaceKind" NOT NULL DEFAULT 'reseller';

-- CreateIndex
CREATE UNIQUE INDEX "site_access_token_key" ON "site_access"("token");

