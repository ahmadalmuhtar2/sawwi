-- CreateEnum
CREATE TYPE "ListingVertical" AS ENUM ('car', 'home');

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "vertical" "ListingVertical" NOT NULL,
    "title" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "offer" TEXT,
    "place" TEXT,
    "description" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]',
    "features" JSONB NOT NULL DEFAULT '[]',
    "specs" JSONB NOT NULL DEFAULT '{}',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listings_siteId_vertical_published_idx" ON "listings"("siteId", "vertical", "published");

-- CreateIndex
CREATE INDEX "listings_siteId_createdAt_idx" ON "listings"("siteId", "createdAt");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
