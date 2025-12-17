-- Enhance sales_orders table for 27-status flow system
-- This migration adds all required fields for the complete status flow

-- 1. Add push order fields (推单相关)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "budget_quote_file_url" text,
ADD COLUMN IF NOT EXISTS "budget_quote_uploaded_at" timestamptz,
ADD COLUMN IF NOT EXISTS "push_order_screenshot_url" text,
ADD COLUMN IF NOT EXISTS "push_order_uploaded_at" timestamptz,
ADD COLUMN IF NOT EXISTS "push_order_confirmed_at" timestamptz,
ADD COLUMN IF NOT EXISTS "push_order_confirmed_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

-- 2. Add production fields (生产相关)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "production_order_nos" jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "all_production_completed_at" timestamptz;

-- 3. Add partner fields (好伙伴相关)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "designer_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "guide_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

-- 4. Add plan confirmation fields (方案确认)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "plan_confirmed_photo_urls" jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "plan_confirmed_at" timestamptz,
ADD COLUMN IF NOT EXISTS "plan_confirmed_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

-- 5. Add installation fields (安装相关)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "installation_notes" text,
ADD COLUMN IF NOT EXISTS "installation_photo_urls" jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "installation_confirmed_at" timestamptz,
ADD COLUMN IF NOT EXISTS "installation_confirmed_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

-- 6. Add invoice and payment fields (发票回款)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "invoice_no" varchar(100),
ADD COLUMN IF NOT EXISTS "invoice_issued_at" timestamptz,
ADD COLUMN IF NOT EXISTS "invoice_issued_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "payment_proof_urls" jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "payment_confirmed_at" timestamptz,
ADD COLUMN IF NOT EXISTS "payment_confirmed_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

-- 7. Add status tracking fields (状态跟踪)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "last_status_change_at" timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS "last_status_change_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

-- 8. Add cancellation fields (取消相关)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "is_cancelled" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "cancellation_reason" text,
ADD COLUMN IF NOT EXISTS "cancelled_at" timestamptz,
ADD COLUMN IF NOT EXISTS "cancelled_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

-- 9. Add pause/abnormal fields (暂停/异常)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "is_paused" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "pause_reason" text,
ADD COLUMN IF NOT EXISTS "is_abnormal" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "abnormal_reason" text;

-- 10. Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_orders_designer_id ON "sales_orders"("designer_id");
CREATE INDEX IF NOT EXISTS idx_sales_orders_guide_id ON "sales_orders"("guide_id");
CREATE INDEX IF NOT EXISTS idx_sales_orders_last_status_change_at ON "sales_orders"("last_status_change_at");
CREATE INDEX IF NOT EXISTS idx_sales_orders_is_cancelled ON "sales_orders"("is_cancelled");

-- 11. Create status transitions table
CREATE TABLE IF NOT EXISTS "sales_order_status_transitions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sales_order_id" uuid NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
  "from_status" varchar(100),
  "to_status" varchar(100) NOT NULL,
  "changed_by_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "changed_at" timestamptz NOT NULL DEFAULT now(),
  "comment" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_order_status_transitions_order_id 
  ON "sales_order_status_transitions"("sales_order_id");
CREATE INDEX IF NOT EXISTS idx_sales_order_status_transitions_changed_at 
  ON "sales_order_status_transitions"("changed_at");

-- 12. Create trigger to record status changes
CREATE OR REPLACE FUNCTION record_sales_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.last_status_change_at := now();
    
    INSERT INTO "sales_order_status_transitions" (
      sales_order_id,
      from_status,
      to_status,
      changed_by_id,
      changed_at,
      comment
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(NEW.last_status_change_by_id, NEW.updated_by_id),
      now(),
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_record_sales_order_status_change ON "sales_orders";
CREATE TRIGGER trg_record_sales_order_status_change
BEFORE UPDATE ON "sales_orders"
FOR EACH ROW
EXECUTE FUNCTION record_sales_order_status_change();

-- 13. Drop old function if exists and create new one
DROP FUNCTION IF EXISTS get_sales_order_status_history(uuid);

CREATE FUNCTION get_sales_order_status_history(p_sales_order_id uuid)
RETURNS TABLE (
  transition_id uuid,
  from_status varchar(100),
  to_status varchar(100),
  changed_by_name varchar(100),
  changed_at timestamptz,
  comment text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.id as transition_id,
    st.from_status,
    st.to_status,
    u.real_name as changed_by_name,
    st.changed_at,
    st.comment
  FROM "sales_order_status_transitions" st
  LEFT JOIN "users" u ON st.changed_by_id = u.id
  WHERE st.sales_order_id = p_sales_order_id
  ORDER BY st.changed_at DESC;
END;
$$;
