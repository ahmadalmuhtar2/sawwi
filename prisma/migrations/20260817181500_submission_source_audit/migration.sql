-- Additive: marketplace submission source + utm attribution + lightweight status audit.
ALTER TABLE "submissions" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'web';
ALTER TABLE "submissions" ADD COLUMN     "utmSource" TEXT;
ALTER TABLE "submissions" ADD COLUMN     "statusById" TEXT;
ALTER TABLE "submissions" ADD COLUMN     "statusAt" TIMESTAMP(3);
