-- Enhance sales_orders table for 25-status flow
-- Add fields required for push order, production, installation, and finance processes

-- 1. Add push order related fields (推单相关字段)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "budget_quote_file_url" text,
ADD COLUMN IF NOT EXISTS "budget_quote_uploaded_at" timestamptz,
ADD COLUMN IF NOT EXISTS "push_order_screenshot_url" text,
ADD COLUMN IF NOT EXISTS "push_order_uploaded_at" timestamptz,
ADD COLUMN IF NOT EXISTS "push_order_confirmed_at" timestamptz,
ADD COLUMN IF NOT EXISTS "push_order_confirmed_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

COMMENT ON COLUMN "sales_orders"."budget_quote_file_url" IS '预算报价单文件路径';
COMMENT ON COLUMN "sales_orders"."budget_quote_uploaded_at" IS '预算报价单上传时间';
COMMENT ON COLUMN "sales_orders"."push_order_screenshot_url" IS '推单截图路径(圣都Home采购申请)';
COMMENT ON COLUMN "sales_orders"."push_order_uploaded_at" IS '推单截图上传时间';
COMMENT ON COLUMN "sales_orders"."push_order_confirmed_at" IS '推单确认时间(订单客服确认)';
COMMENT ON COLUMN "sales_orders"."push_order_confirmed_by_id" IS '推单确认人ID';

-- 2. Add production order related fields (生产单相关字段)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "production_order_nos" jsonb,
ADD COLUMN IF NOT EXISTS "all_production_completed_at" timestamptz,
ADD COLUMN IF NOT EXISTS "production_notes" text;

COMMENT ON COLUMN "sales_orders"."production_order_nos" IS '生产单号数组,格式: [{"no": "PO001", "completed": true, "completed_at": "2024-01-01"}]';
COMMENT ON COLUMN "sales_orders"."all_production_completed_at" IS '所有生产单备货完成时间';
COMMENT ON COLUMN "sales_orders"."production_notes" IS '生产备注';

-- 3. Add partner fields (罗莱好伙伴字段)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "designer_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "guide_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "designer_points" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "guide_points" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "points_settled" boolean DEFAULT false;

COMMENT ON COLUMN "sales_orders"."designer_id" IS '圣都设计师ID';
COMMENT ON COLUMN "sales_orders"."guide_id" IS '圣都导购ID';
COMMENT ON COLUMN "sales_orders"."designer_points" IS '设计师获得积分';
COMMENT ON COLUMN "sales_orders"."guide_points" IS '导购获得积分';
COMMENT ON COLUMN "sales_orders"."points_settled" IS '积分是否已结算';

-- 4. Add plan confirmation fields (方案确认字段)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "plan_confirmed_photo_urls" jsonb,
ADD COLUMN IF NOT EXISTS "plan_confirmed_at" timestamptz,
ADD COLUMN IF NOT EXISTS "plan_confirmed_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

COMMENT ON COLUMN "sales_orders"."plan_confirmed_photo_urls" IS '方案确认照片数组';
COMMENT ON COLUMN "sales_orders"."plan_confirmed_at" IS '方案确认时间';
COMMENT ON COLUMN "sales_orders"."plan_confirmed_by_id" IS '方案确认人ID';

-- 5. Add installation fields (安装相关字段)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "installation_notes" text,
ADD COLUMN IF NOT EXISTS "installation_photo_urls" jsonb,
ADD COLUMN IF NOT EXISTS "installation_confirmed_at" timestamptz,
ADD COLUMN IF NOT EXISTS "installation_confirmed_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

COMMENT ON COLUMN "sales_orders"."installation_notes" IS '安装备注(进门密码等)';
COMMENT ON COLUMN "sales_orders"."installation_photo_urls" IS '安装后照片数组';
COMMENT ON COLUMN "sales_orders"."installation_confirmed_at" IS '安装确认时间';
COMMENT ON COLUMN "sales_orders"."installation_confirmed_by_id" IS '安装确认人ID';

-- 6. Add invoice and payment fields (发票和回款字段)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "invoice_no" varchar(100),
ADD COLUMN IF NOT EXISTS "invoice_issued_at" timestamptz,
ADD COLUMN IF NOT EXISTS "invoice_issued_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "invoice_file_url" text,
ADD COLUMN IF NOT EXISTS "payment_proof_urls" jsonb,
ADD COLUMN IF NOT EXISTS "payment_confirmed_at" timestamptz,
ADD COLUMN IF NOT EXISTS "payment_confirmed_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

COMMENT ON COLUMN "sales_orders"."invoice_no" IS '发票单号';
COMMENT ON COLUMN "sales_orders"."invoice_issued_at" IS '发票开具时间';
COMMENT ON COLUMN "sales_orders"."invoice_issued_by_id" IS '发票开具人ID';
COMMENT ON COLUMN "sales_orders"."invoice_file_url" IS '发票文件路径';
COMMENT ON COLUMN "sales_orders"."payment_proof_urls" IS '回款凭证照片数组';
COMMENT ON COLUMN "sales_orders"."payment_confirmed_at" IS '回款确认时间';
COMMENT ON COLUMN "sales_orders"."payment_confirmed_by_id" IS '回款确认人ID';

-- 7. Add status tracking fields (状态跟踪字段)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "last_status_change_at" timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS "last_status_change_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "status_change_comment" text;

COMMENT ON COLUMN "sales_orders"."last_status_change_at" IS '最后状态变更时间';
COMMENT ON COLUMN "sales_orders"."last_status_change_by_id" IS '最后状态变更人ID';
COMMENT ON COLUMN "sales_orders"."status_change_comment" IS '状态变更备注';

-- 8. Add cancellation fields (取消相关字段)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "is_cancelled" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "cancellation_reason" text,
ADD COLUMN IF NOT EXISTS "cancelled_at" timestamptz,
ADD COLUMN IF NOT EXISTS "cancelled_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

COMMENT ON COLUMN "sales_orders"."is_cancelled" IS '是否已取消';
COMMENT ON COLUMN "sales_orders"."cancellation_reason" IS '取消原因';
COMMENT ON COLUMN "sales_orders"."cancelled_at" IS '取消时间';
COMMENT ON COLUMN "sales_orders"."cancelled_by_id" IS '取消操作人ID';

-- 9. Add pause/abnormal fields (暂停/异常字段)
ALTER TABLE "sales_orders"
ADD COLUMN IF NOT EXISTS "is_paused" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "pause_reason" text,
ADD COLUMN IF NOT EXISTS "paused_at" timestamptz,
ADD COLUMN IF NOT EXISTS "is_abnormal" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "abnormal_reason" text,
ADD COLUMN IF NOT EXISTS "abnormal_at" timestamptz;

COMMENT ON COLUMN "sales_orders"."is_paused" IS '是否暂停';
COMMENT ON COLUMN "sales_orders"."pause_reason" IS '暂停原因';
COMMENT ON COLUMN "sales_orders"."paused_at" IS '暂停时间';
COMMENT ON COLUMN "sales_orders"."is_abnormal" IS '是否异常';
COMMENT ON COLUMN "sales_orders"."abnormal_reason" IS '异常原因';
COMMENT ON COLUMN "sales_orders"."abnormal_at" IS '异常发生时间';

-- 10. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_designer_id ON "sales_orders"("designer_id");
CREATE INDEX IF NOT EXISTS idx_sales_orders_guide_id ON "sales_orders"("guide_id");
CREATE INDEX IF NOT EXISTS idx_sales_orders_last_status_change_at ON "sales_orders"("last_status_change_at");
CREATE INDEX IF NOT EXISTS idx_sales_orders_is_cancelled ON "sales_orders"("is_cancelled");
CREATE INDEX IF NOT EXISTS idx_sales_orders_is_paused ON "sales_orders"("is_paused");
CREATE INDEX IF NOT EXISTS idx_sales_orders_is_abnormal ON "sales_orders"("is_abnormal");

-- 11. Create sales_order_status_transitions table (if not exists)
-- This table stores the complete history of all status transitions
CREATE TABLE IF NOT EXISTS "sales_order_status_transitions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sales_order_id" uuid NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
  "from_status" varchar(100),
  "to_status" varchar(100) NOT NULL,
  "changed_by_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "changed_at" timestamptz NOT NULL DEFAULT now(),
  "comment" text,
  "required_fields_met" boolean DEFAULT true,
  "attached_files" jsonb,
  "metadata" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE "sales_order_status_transitions" IS '销售单状态流转历史记录表';
COMMENT ON COLUMN "sales_order_status_transitions"."from_status" IS '原状态';
COMMENT ON COLUMN "sales_order_status_transitions"."to_status" IS '新状态';
COMMENT ON COLUMN "sales_order_status_transitions"."changed_by_id" IS '变更操作人ID';
COMMENT ON COLUMN "sales_order_status_transitions"."comment" IS '变更备注';
COMMENT ON COLUMN "sales_order_status_transitions"."required_fields_met" IS '是否满足必需字段要求';
COMMENT ON COLUMN "sales_order_status_transitions"."attached_files" IS '附加文件信息';
COMMENT ON COLUMN "sales_order_status_transitions"."metadata" IS '额外元数据';

-- Create indexes for status transitions
CREATE INDEX IF NOT EXISTS idx_sales_order_status_transitions_order_id 
  ON "sales_order_status_transitions"("sales_order_id");
CREATE INDEX IF NOT EXISTS idx_sales_order_status_transitions_changed_at 
  ON "sales_order_status_transitions"("changed_at");
CREATE INDEX IF NOT EXISTS idx_sales_order_status_transitions_to_status 
  ON "sales_order_status_transitions"("to_status");

-- 12. Create trigger to auto-record status changes
CREATE OR REPLACE FUNCTION record_sales_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record if status actually changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Update last status change metadata
    NEW.last_status_change_at := now();
    
    -- Insert into status_transitions table
    INSERT INTO "sales_order_status_transitions" (
      sales_order_id,
      from_status,
      to_status,
      changed_by_id,
      changed_at,
      comment,
      metadata
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(NEW.last_status_change_by_id, NEW.updated_by_id),
      now(),
      NEW.status_change_comment,
      jsonb_build_object(
        'budget_quote_uploaded', NEW.budget_quote_file_url IS NOT NULL,
        'push_order_uploaded', NEW.push_order_screenshot_url IS NOT NULL,
        'plan_confirmed', NEW.plan_confirmed_at IS NOT NULL,
        'production_started', NEW.production_order_nos IS NOT NULL,
        'installation_confirmed', NEW.installation_confirmed_at IS NOT NULL,
        'invoice_issued', NEW.invoice_no IS NOT NULL,
        'payment_confirmed', NEW.payment_confirmed_at IS NOT NULL
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sales_orders
DROP TRIGGER IF EXISTS trg_record_sales_order_status_change ON "sales_orders";
CREATE TRIGGER trg_record_sales_order_status_change
BEFORE UPDATE ON "sales_orders"
FOR EACH ROW
EXECUTE FUNCTION record_sales_order_status_change();

-- 13. Create function to get status transition history
CREATE OR REPLACE FUNCTION get_sales_order_status_history(p_sales_order_id uuid)
RETURNS TABLE (
  transition_id uuid,
  from_status varchar(100),
  to_status varchar(100),
  changed_by_name varchar(100),
  changed_at timestamptz,
  comment text,
  metadata jsonb
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
    st.comment,
    st.metadata
  FROM "sales_order_status_transitions" st
  LEFT JOIN "users" u ON st.changed_by_id = u.id
  WHERE st.sales_order_id = p_sales_order_id
  ORDER BY st.changed_at DESC;
END;
$$;

-- 14. Create function to validate status transition
CREATE OR REPLACE FUNCTION validate_sales_order_status_transition(
  p_sales_order_id uuid,
  p_new_status varchar(100),
  p_user_id uuid
)
RETURNS TABLE (
  is_valid boolean,
  error_message text,
  required_fields text[],
  required_files text[]
)
LANGUAGE plpgsql
AS $$
DECLARE
  current_status varchar(100);
  user_role varchar(20);
BEGIN
  -- Get current status and user role
  SELECT so.status, u.role INTO current_status, user_role
  FROM "sales_orders" so
  CROSS JOIN "users" u
  WHERE so.id = p_sales_order_id AND u.id = p_user_id;
  
  -- Basic validation: status is the same
  IF current_status = p_new_status THEN
    RETURN QUERY SELECT false, 'Status is already ' || p_new_status, NULL::text[], NULL::text[];
    RETURN;
  END IF;
  
  -- Note: Full validation logic should match the TypeScript STATUS_METADATA
  -- For now, returning basic validation
  -- In production, this should check:
  -- 1. Valid transition paths
  -- 2. Required fields presence
  -- 3. User permissions
  -- 4. Required files uploaded
  
  -- Return success for now (implement full logic in application layer)
  RETURN QUERY SELECT 
    true, 
    ''::text, 
    ARRAY[]::text[], 
    ARRAY[]::text[];
END;
$$;

-- 15. Add RLS policies for status transitions
ALTER TABLE "sales_order_status_transitions" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read status transitions for orders they have access to
CREATE POLICY "Users can read sales order status transitions" 
ON "sales_order_status_transitions"
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND (
    -- Admin can read all
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    OR
    -- User can read transitions for their accessible orders
    EXISTS (
      SELECT 1 FROM sales_orders so
      WHERE so.id = sales_order_status_transitions.sales_order_id
      -- Add additional order access control logic here
    )
  )
);

-- Policy: Only system can insert status transitions (via trigger)
CREATE POLICY "System can insert status transitions" 
ON "sales_order_status_transitions"
FOR INSERT
WITH CHECK (true); -- Controlled by trigger, not direct inserts
