-- Enhance leads table and create related tables for 26 status flow

-- 1. Create status_history table to track status changes
CREATE TABLE IF NOT EXISTS "status_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "record_id" uuid NOT NULL,
  "record_type" varchar(50) NOT NULL,
  "old_status" varchar(50) NULL,
  "new_status" varchar(50) NOT NULL,
  "changed_by_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "changed_at" timestamptz NOT NULL DEFAULT now(),
  "comment" text NULL,
  "required_attachments" jsonb NULL,
  "attached_files" jsonb NULL
);

-- Create index for status_history
CREATE INDEX IF NOT EXISTS idx_status_history_record_id ON "status_history"("record_id", "record_type");
CREATE INDEX IF NOT EXISTS idx_status_history_changed_at ON "status_history"("changed_at");

-- 2. Create lead_follow_up_records table
CREATE TABLE IF NOT EXISTS "lead_follow_up_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "follow_up_type" varchar(50) NOT NULL DEFAULT 'text',
  "content" text NOT NULL,
  "result" varchar(50) NOT NULL DEFAULT 'follow-up',
  "note" text NULL,
  "next_follow_up_time" timestamptz NULL,
  "appointment_time" timestamptz NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "created_by_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create index for lead_follow_up_records
CREATE INDEX IF NOT EXISTS idx_lead_follow_up_records_lead_id ON "lead_follow_up_records"("lead_id");
CREATE INDEX IF NOT EXISTS idx_lead_follow_up_records_created_at ON "lead_follow_up_records"("created_at");

-- 3. Create lead_measurement_records table
CREATE TABLE IF NOT EXISTS "lead_measurement_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "measurement_order_id" uuid NULL,
  "measurement_date" timestamptz NULL,
  "measurement_result" jsonb NULL,
  "measurement_photos" jsonb NULL,
  "measurement_report_url" varchar(255) NULL,
  "status" varchar(50) NOT NULL DEFAULT 'pending',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Create index for lead_measurement_records
CREATE INDEX IF NOT EXISTS idx_lead_measurement_records_lead_id ON "lead_measurement_records"("lead_id");

-- 4. Create lead_quote_records table
CREATE TABLE IF NOT EXISTS "lead_quote_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "quote_id" uuid NULL,
  "quote_number" varchar(50) NOT NULL,
  "quote_version" integer NOT NULL DEFAULT 1,
  "quote_total" numeric NOT NULL DEFAULT 0,
  "quote_details" jsonb NOT NULL,
  "quote_files" jsonb NULL,
  "status" varchar(50) NOT NULL DEFAULT 'draft',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Create index for lead_quote_records
CREATE INDEX IF NOT EXISTS idx_lead_quote_records_lead_id ON "lead_quote_records"("lead_id");
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_quote_records_quote_number ON "lead_quote_records"("quote_number");

-- 4. Create lead_installation_records table
CREATE TABLE IF NOT EXISTS "lead_installation_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "installation_order_id" uuid NULL,
  "installation_date" timestamptz NULL,
  "installation_result" jsonb NULL,
  "installation_photos" jsonb NULL,
  "installation_report_url" varchar(255) NULL,
  "status" varchar(50) NOT NULL DEFAULT 'pending',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Create index for lead_installation_records
CREATE INDEX IF NOT EXISTS idx_lead_installation_records_lead_id ON "lead_installation_records"("lead_id");

-- 5. Create lead_attachment_records table
CREATE TABLE IF NOT EXISTS "lead_attachment_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "file_name" varchar(255) NOT NULL,
  "file_path" varchar(255) NOT NULL,
  "file_type" varchar(50) NOT NULL,
  "file_size" bigint NOT NULL,
  "uploaded_by_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "uploaded_at" timestamptz NOT NULL DEFAULT now(),
  "attachment_type" varchar(50) NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'active'
);

-- Create index for lead_attachment_records
CREATE INDEX IF NOT EXISTS idx_lead_attachment_records_lead_id ON "lead_attachment_records"("lead_id");
CREATE INDEX IF NOT EXISTS idx_lead_attachment_records_attachment_type ON "lead_attachment_records"("attachment_type");

-- 6. Create lead_approval_records table
CREATE TABLE IF NOT EXISTS "lead_approval_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "approval_type" varchar(50) NOT NULL,
  "approval_status" varchar(50) NOT NULL DEFAULT 'pending',
  "approver_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "approval_date" timestamptz NULL,
  "approval_comment" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Create index for lead_approval_records
CREATE INDEX IF NOT EXISTS idx_lead_approval_records_lead_id ON "lead_approval_records"("lead_id");
CREATE INDEX IF NOT EXISTS idx_lead_approval_records_approval_status ON "lead_approval_records"("approval_status");

-- 7. Add additional columns to leads table
ALTER TABLE "leads" 
ADD COLUMN IF NOT EXISTS "quote_versions" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "measurement_completed" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "installation_completed" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "financial_status" varchar(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "expected_measurement_date" date,
ADD COLUMN IF NOT EXISTS "expected_installation_date" date,
ADD COLUMN IF NOT EXISTS "total_quote_amount" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "last_status_change_at" timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS "last_status_change_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "is_cancelled" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "cancellation_reason" text NULL,
ADD COLUMN IF NOT EXISTS "is_paused" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "pause_reason" text NULL;

-- 8. Create trigger to update last_status_change_at and last_status_change_by_id when status changes
CREATE OR REPLACE FUNCTION update_lead_status_metadata()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    NEW.last_status_change_at := now();
    
    -- Insert into status_history only if changed_by_id is available
    IF NEW.last_status_change_by_id IS NOT NULL THEN
      INSERT INTO "status_history" (
        record_id, 
        record_type, 
        old_status, 
        new_status, 
        changed_by_id, 
        comment
      ) VALUES (
        NEW.id, 
        'lead', 
        OLD.status, 
        NEW.status, 
        NEW.last_status_change_by_id, 
        'Status changed via lead update'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leads table
DROP TRIGGER IF EXISTS trg_update_lead_status_metadata ON "leads";
CREATE TRIGGER trg_update_lead_status_metadata
BEFORE UPDATE ON "leads"
FOR EACH ROW
EXECUTE FUNCTION update_lead_status_metadata();

-- 9. Create function to get lead status history
CREATE OR REPLACE FUNCTION get_lead_status_history(lead_id uuid)
RETURNS TABLE (
  status_change_id uuid,
  old_status varchar(50),
  new_status varchar(50),
  changed_by_name varchar(100),
  changed_at timestamptz,
  comment text,
  required_attachments jsonb,
  attached_files jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sh.id as status_change_id,
    sh.old_status,
    sh.new_status,
    u.name as changed_by_name,
    sh.changed_at,
    sh.comment,
    sh.required_attachments,
    sh.attached_files
  FROM "status_history" sh
  JOIN "users" u ON sh.changed_by_id = u.id
  WHERE sh.record_id = lead_id AND sh.record_type = 'lead'
  ORDER BY sh.changed_at DESC;
END;
$$;

-- 10. Create function to validate status transition
CREATE OR REPLACE FUNCTION validate_lead_status_transition(
  lead_id uuid,
  new_status varchar(50),
  current_user_id uuid
)
RETURNS TABLE (
  is_valid boolean,
  error_message text,
  required_attachments jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
  current_status varchar(50);
  user_role varchar(20);
BEGIN
  -- Get current status and user role
  SELECT l.status, u.role INTO current_status, user_role
  FROM "leads" l
  JOIN "users" u ON current_user_id = u.id
  WHERE l.id = lead_id;
  
  -- Basic validation logic
  IF current_status = new_status THEN
    RETURN QUERY SELECT false, 'Status is already ' || new_status, NULL::jsonb;
    RETURN;
  END IF;
  
  -- Define valid status transitions based on 26 status flow
  IF current_status = 'PENDING_ASSIGNMENT' THEN
    -- 待分配 -> 待跟踪, 已取消
    IF new_status NOT IN ('PENDING_FOLLOW_UP', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from PENDING_ASSIGNMENT to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'PENDING_FOLLOW_UP' THEN
    -- 待跟踪 -> 跟踪中, 待分配, 已失效, 已取消
    IF new_status NOT IN ('FOLLOWING_UP', 'PENDING_ASSIGNMENT', 'EXPIRED', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from PENDING_FOLLOW_UP to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'FOLLOWING_UP' THEN
    -- 跟踪中 -> 草签, 已失效, 已取消
    IF new_status NOT IN ('DRAFT_SIGNED', 'EXPIRED', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from FOLLOWING_UP to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'DRAFT_SIGNED' THEN
    -- 草签 -> 待测量, 已取消
    IF new_status NOT IN ('PENDING_MEASUREMENT', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from DRAFT_SIGNED to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'PENDING_MEASUREMENT' THEN
    -- 待测量 -> 测量中-待分配, 已取消
    IF new_status NOT IN ('MEASURING_PENDING_ASSIGNMENT', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from PENDING_MEASUREMENT to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'MEASURING_PENDING_ASSIGNMENT' THEN
    -- 测量中-待分配 -> 测量中-分配中, 已取消
    IF new_status NOT IN ('MEASURING_ASSIGNING', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from MEASURING_PENDING_ASSIGNMENT to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'MEASURING_ASSIGNING' THEN
    -- 测量中-分配中 -> 测量中-待上门, 测量中-待分配, 已取消
    IF new_status NOT IN ('MEASURING_PENDING_VISIT', 'MEASURING_PENDING_ASSIGNMENT', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from MEASURING_ASSIGNING to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'MEASURING_PENDING_VISIT' THEN
    -- 测量中-待上门 -> 测量中-待确认, 已取消
    IF new_status NOT IN ('MEASURING_PENDING_CONFIRMATION', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from MEASURING_PENDING_VISIT to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'MEASURING_PENDING_CONFIRMATION' THEN
    -- 测量中-待确认 -> 方案待确认, 测量中-待分配, 已取消
    IF new_status NOT IN ('PLAN_PENDING_CONFIRMATION', 'MEASURING_PENDING_ASSIGNMENT', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from MEASURING_PENDING_CONFIRMATION to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'PLAN_PENDING_CONFIRMATION' THEN
    -- 方案待确认 -> 待推单, 测量中-待确认, 已取消
    IF new_status NOT IN ('PENDING_PUSH', 'MEASURING_PENDING_CONFIRMATION', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from PLAN_PENDING_CONFIRMATION to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'PENDING_PUSH' THEN
    -- 待推单 -> 待下单, 已取消
    IF new_status NOT IN ('PENDING_ORDER', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from PENDING_PUSH to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'PENDING_ORDER' THEN
    -- 待下单 -> 生产中, 已取消
    IF new_status NOT IN ('IN_PRODUCTION', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from PENDING_ORDER to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'IN_PRODUCTION' THEN
    -- 生产中 -> 备货完成, 已取消
    IF new_status NOT IN ('STOCK_PREPARED', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from IN_PRODUCTION to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'STOCK_PREPARED' THEN
    -- 备货完成 -> 待发货, 已取消
    IF new_status NOT IN ('PENDING_SHIPMENT', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from STOCK_PREPARED to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'PENDING_SHIPMENT' THEN
    -- 待发货 -> 安装中-待分配, 已取消
    IF new_status NOT IN ('INSTALLING_PENDING_ASSIGNMENT', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from PENDING_SHIPMENT to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'INSTALLING_PENDING_ASSIGNMENT' THEN
    -- 安装中-待分配 -> 安装中-分配中, 已取消
    IF new_status NOT IN ('INSTALLING_ASSIGNING', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from INSTALLING_PENDING_ASSIGNMENT to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'INSTALLING_ASSIGNING' THEN
    -- 安装中-分配中 -> 安装中-待上门, 安装中-待分配, 已取消
    IF new_status NOT IN ('INSTALLING_PENDING_VISIT', 'INSTALLING_PENDING_ASSIGNMENT', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from INSTALLING_ASSIGNING to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'INSTALLING_PENDING_VISIT' THEN
    -- 安装中-待上门 -> 安装中-待确认, 已取消
    IF new_status NOT IN ('INSTALLING_PENDING_CONFIRMATION', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from INSTALLING_PENDING_VISIT to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'INSTALLING_PENDING_CONFIRMATION' THEN
    -- 安装中-待确认 -> 待对账, 安装中-待分配, 已取消
    IF new_status NOT IN ('PENDING_RECONCILIATION', 'INSTALLING_PENDING_ASSIGNMENT', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from INSTALLING_PENDING_CONFIRMATION to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'PENDING_RECONCILIATION' THEN
    -- 待对账 -> 待开发票, 已取消
    IF new_status NOT IN ('PENDING_INVOICE', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from PENDING_RECONCILIATION to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'PENDING_INVOICE' THEN
    -- 待开发票 -> 待回款, 已取消
    IF new_status NOT IN ('PENDING_PAYMENT', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from PENDING_INVOICE to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status = 'PENDING_PAYMENT' THEN
    -- 待回款 -> 已完成, 已取消
    IF new_status NOT IN ('COMPLETED', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from PENDING_PAYMENT to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  ELSIF current_status IN ('COMPLETED', 'CANCELLED', 'EXPIRED', 'PAUSED', 'ABNORMAL') THEN
    -- 这些状态是终点或特殊状态，只能转换到特定状态
    IF current_status = 'COMPLETED' AND new_status != 'CANCELLED' THEN
      RETURN QUERY SELECT false, 'Invalid transition from COMPLETED to ' || new_status, NULL::jsonb;
      RETURN;
    ELSIF current_status = 'CANCELLED' THEN
      RETURN QUERY SELECT false, 'CANCELLED status cannot be changed', NULL::jsonb;
      RETURN;
    ELSIF current_status = 'EXPIRED' AND new_status NOT IN ('PENDING_ASSIGNMENT', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from EXPIRED to ' || new_status, NULL::jsonb;
      RETURN;
    ELSIF current_status = 'PAUSED' AND new_status NOT IN ('FOLLOWING_UP', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from PAUSED to ' || new_status, NULL::jsonb;
      RETURN;
    ELSIF current_status = 'ABNORMAL' AND new_status NOT IN ('FOLLOWING_UP', 'CANCELLED') THEN
      RETURN QUERY SELECT false, 'Invalid transition from ABNORMAL to ' || new_status, NULL::jsonb;
      RETURN;
    END IF;
  END IF;
  
  -- Define required attachments for certain transitions
  IF current_status = 'MEASURING_PENDING_CONFIRMATION' AND new_status = 'PLAN_PENDING_CONFIRMATION' THEN
    RETURN QUERY SELECT true, '', '{"measurement_report": true, "measurement_photos": true}'::jsonb;
    RETURN;
  ELSIF current_status = 'INSTALLING_PENDING_CONFIRMATION' AND new_status = 'PENDING_RECONCILIATION' THEN
    RETURN QUERY SELECT true, '', '{"installation_photos": true}'::jsonb;
    RETURN;
  END IF;
  
  -- All validations passed
  RETURN QUERY SELECT true, '', NULL::jsonb;
END;
$$;