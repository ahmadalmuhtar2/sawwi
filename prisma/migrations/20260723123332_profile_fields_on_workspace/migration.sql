-- allow-destructive: misplaced contact columns moved off users; already shipped.
/*
  Warnings:

  - You are about to drop the column `address` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "address",
DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "address" TEXT;
