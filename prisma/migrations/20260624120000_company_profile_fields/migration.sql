-- AlterTable: add public-profile fields to Company
ALTER TABLE "Company" ADD COLUMN     "slug" TEXT,
ADD COLUMN     "banner" TEXT,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "foundedYear" TEXT,
ADD COLUMN     "companySize" TEXT,
ADD COLUMN     "techStack" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- Backfill a unique slug for any existing companies (name slug + short id suffix
-- so collisions on duplicate names can't violate the unique index).
UPDATE "Company"
SET "slug" = lower(regexp_replace(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'))
             || '-' || substring("id" from 1 for 6)
WHERE "slug" IS NULL;

-- CreateIndex: unique slug (nullable; Postgres allows multiple NULLs)
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");
