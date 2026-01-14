-- Rollback: Revert changes from 0003_faithful_wasp.sql

-- 1. Drop constraints (optional if dropping columns handles it, but good practice)
-- (Drizzle names might vary, relying on DROP COLUMN CASCADE usually works for simple alters)

-- 2. Drop audit_logs table
DROP TABLE IF EXISTS "audit_logs";

-- 3. Revert measure_tasks changes
ALTER TABLE "measure_tasks" DROP COLUMN IF EXISTS "sales_brief";
ALTER TABLE "measure_tasks" DROP COLUMN IF EXISTS "type";
ALTER TABLE "measure_tasks" DROP COLUMN IF EXISTS "order_id";

-- 4. Revert quote_items changes
ALTER TABLE "quote_items" DROP COLUMN IF EXISTS "measure_window_id";

-- 5. Drop Enum
DROP TYPE IF EXISTS "public"."measure_type";
