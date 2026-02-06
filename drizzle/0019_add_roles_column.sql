ALTER TABLE "users" ADD COLUMN "roles" jsonb DEFAULT '[]' NOT NULL;

-- Data Migration: Copy existing single role to roles array
UPDATE "users" SET "roles" = jsonb_build_array("role") WHERE "role" IS NOT NULL;
