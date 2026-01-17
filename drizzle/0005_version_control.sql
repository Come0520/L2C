
ALTER TABLE "quotes" ADD COLUMN "root_quote_id" uuid;

-- Backfill V1 (Roots)
UPDATE "quotes" SET "root_quote_id" = "id" WHERE "parent_quote_id" IS NULL;

-- Backfill Children (Assumes depth 1 for now, or repeat if needed)
UPDATE "quotes" 
SET "root_quote_id" = (
    SELECT "p"."root_quote_id" 
    FROM "quotes" "p" 
    WHERE "p"."id" = "quotes"."parent_quote_id"
)
WHERE "parent_quote_id" IS NOT NULL;

-- Fallback for orphans or deep chains not caught: set to self if still null
UPDATE "quotes" SET "root_quote_id" = "id" WHERE "root_quote_id" IS NULL;

-- Add Constraint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_version" ON "quotes" ("root_quote_id") WHERE "is_active" = true;
