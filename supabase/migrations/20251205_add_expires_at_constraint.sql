-- Make expires_at NOT NULL to ensure all tokens have an expiration date
ALTER TABLE "public"."share_tokens" 
ALTER COLUMN "expires_at" SET NOT NULL;

-- Set a default expiration date for existing tokens without one
UPDATE "public"."share_tokens" 
SET "expires_at" = NOW() + INTERVAL '7 days' 
WHERE "expires_at" IS NULL;

-- Add a check constraint to ensure expires_at is in the future
ALTER TABLE "public"."share_tokens" 
ADD CONSTRAINT "share_tokens_expires_at_future" 
CHECK ("expires_at" > NOW());