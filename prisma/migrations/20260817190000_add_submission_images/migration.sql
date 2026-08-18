-- Additive: uploaded image URLs for a submission (e.g. a provider's work samples).
-- Backward-compatible — existing rows default to an empty array; old code ignores it.
ALTER TABLE "submissions" ADD COLUMN     "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
