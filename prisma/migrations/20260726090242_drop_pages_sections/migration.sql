/*
  Warnings:

  - You are about to drop the `page_locks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `section_instances` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "page_locks" DROP CONSTRAINT "page_locks_lockedById_fkey";

-- DropForeignKey
ALTER TABLE "page_locks" DROP CONSTRAINT "page_locks_pageId_fkey";

-- DropForeignKey
ALTER TABLE "pages" DROP CONSTRAINT "pages_siteId_fkey";

-- DropForeignKey
ALTER TABLE "section_instances" DROP CONSTRAINT "section_instances_pageId_fkey";

-- DropTable
DROP TABLE "page_locks";

-- DropTable
DROP TABLE "pages";

-- DropTable
DROP TABLE "section_instances";

-- DropEnum
DROP TYPE "ColorScheme";

-- DropEnum
DROP TYPE "PageType";
