-- Enhance lead tags system for complete tag management
-- This migration adds tag categories, auto tags, and enhances the tag assignment tracking

-- 1. Add category and type fields to lead_tags table
ALTER TABLE "lead_tags" 
ADD COLUMN IF NOT EXISTS "tag_category" varchar(50) NOT NULL DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS "tag_type" varchar(50),
ADD COLUMN IF NOT EXISTS "is_auto" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "is_system" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "color" varchar(20) DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS "description" text,
ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;

-- Add comments
COMMENT ON COLUMN "lead_tags"."tag_category" IS '标签分类: product(产品类), stage(装修阶段), intention(意愿强度), system(系统自动), custom(自定义)';
COMMENT ON COLUMN "lead_tags"."tag_type" IS '标签类型，用于更细分的分类';
COMMENT ON COLUMN "lead_tags"."is_auto" IS '是否自动标签(系统自动添加)';
COMMENT ON COLUMN "lead_tags"."is_system" IS '是否系统标签(不可删除)';

-- 2. Enhance lead_tag_assignments table
ALTER TABLE "lead_tag_assignments"
ADD COLUMN IF NOT EXISTS "assigned_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "assigned_at" timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS "removed_at" timestamptz,
ADD COLUMN IF NOT EXISTS "removed_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;

-- Add unique constraint to prevent duplicate tag assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_tag_assignments_unique 
ON "lead_tag_assignments"("lead_id", "tag_id") 
WHERE "is_active" = true;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_lead_id ON "lead_tag_assignments"("lead_id");
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_tag_id ON "lead_tag_assignments"("tag_id");
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_assigned_by ON "lead_tag_assignments"("assigned_by_id");

-- 3. Insert predefined system tags based on requirements

-- Product category tags (产品类标签)
INSERT INTO "lead_tags" ("name", "tag_category", "tag_type", "is_system", "color", "description", "sort_order")
VALUES 
  ('窗帘', 'product', 'curtain', true, '#10B981', '窗帘产品', 1),
  ('墙布', 'product', 'wallpaper', true, '#3B82F6', '墙布产品', 2),
  ('墙咔', 'product', 'wallboard', true, '#8B5CF6', '墙咔产品', 3)
ON CONFLICT DO NOTHING;

-- Decoration stage tags (装修阶段标签)
INSERT INTO "lead_tags" ("name", "tag_category", "tag_type", "is_system", "color", "description", "sort_order")
VALUES 
  ('硬装阶段', 'stage', 'hard_decoration', true, '#F59E0B', '硬装施工阶段', 11),
  ('软装阶段', 'stage', 'soft_decoration', true, '#EC4899', '软装设计阶段', 12),
  ('已入住', 'stage', 'moved_in', true, '#6B7280', '已入住状态', 13)
ON CONFLICT DO NOTHING;

-- Intention level tags (意愿强度标签)
INSERT INTO "lead_tags" ("name", "tag_category", "tag_type", "is_system", "color", "description", "sort_order")
VALUES 
  ('高意向', 'intention', 'high', true, '#EF4444', '高购买意向', 21),
  ('中意向', 'intention', 'medium', true, '#F59E0B', '中等购买意向', 22),
  ('低意向', 'intention', 'low', true, '#6B7280', '低购买意向', 23)
ON CONFLICT DO NOTHING;

-- System auto tags (系统自动标签)
INSERT INTO "lead_tags" ("name", "tag_category", "tag_type", "is_system", "is_auto", "color", "description", "sort_order")
VALUES 
  ('quoted', 'system', 'quoted', true, true, '#8B5CF6', '已报价(90天有效期)', 31),
  ('需维护', 'system', 'need_maintenance', true, true, '#F97316', 'quoted标签>10天未转化', 32),
  ('即将过期', 'system', 'expiring_soon', true, true, '#DC2626', '线索即将过期(60-90天)', 33),
  ('已过期', 'system', 'expired', true, true, '#991B1B', '线索已过期(>90天)', 34),
  ('重点客户', 'system', 'vip', true, false, '#7C3AED', 'VIP重点客户', 35),
  ('首次跟进', 'system', 'first_followup', true, true, '#0EA5E9', '首次跟进完成', 36)
ON CONFLICT DO NOTHING;

-- 4. Create function to auto-assign tags based on business rules
CREATE OR REPLACE FUNCTION auto_assign_lead_tags()
RETURNS TRIGGER AS $$
DECLARE
  quoted_tag_id uuid;
  need_maintenance_tag_id uuid;
  expiring_soon_tag_id uuid;
  expired_tag_id uuid;
  first_followup_tag_id uuid;
  days_since_creation integer;
  days_since_quoted integer;
BEGIN
  -- Get system tag IDs
  SELECT id INTO quoted_tag_id FROM "lead_tags" WHERE "tag_type" = 'quoted' AND "is_system" = true LIMIT 1;
  SELECT id INTO need_maintenance_tag_id FROM "lead_tags" WHERE "tag_type" = 'need_maintenance' AND "is_system" = true LIMIT 1;
  SELECT id INTO expiring_soon_tag_id FROM "lead_tags" WHERE "tag_type" = 'expiring_soon' AND "is_system" = true LIMIT 1;
  SELECT id INTO expired_tag_id FROM "lead_tags" WHERE "tag_type" = 'expired' AND "is_system" = true LIMIT 1;
  SELECT id INTO first_followup_tag_id FROM "lead_tags" WHERE "tag_type" = 'first_followup' AND "is_system" = true LIMIT 1;

  -- Calculate days since creation
  days_since_creation := EXTRACT(DAY FROM (now() - NEW.created_at));

  -- Auto-assign "quoted" tag when quote_files is uploaded
  IF NEW.quote_files IS NOT NULL AND OLD.quote_files IS NULL AND quoted_tag_id IS NOT NULL THEN
    INSERT INTO "lead_tag_assignments" ("lead_id", "tag_id", "is_active")
    VALUES (NEW.id, quoted_tag_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Auto-assign "需维护" tag if quoted > 10 days and not converted
  IF NEW.quote_files IS NOT NULL THEN
    days_since_quoted := EXTRACT(DAY FROM (now() - (NEW.updated_at - interval '10 days')));
    IF days_since_quoted > 10 AND NEW.status != 'DRAFT_SIGNED' AND need_maintenance_tag_id IS NOT NULL THEN
      INSERT INTO "lead_tag_assignments" ("lead_id", "tag_id", "is_active")
      VALUES (NEW.id, need_maintenance_tag_id, true)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Auto-assign expiration tags based on creation date
  IF expiring_soon_tag_id IS NOT NULL AND days_since_creation >= 60 AND days_since_creation < 90 THEN
    INSERT INTO "lead_tag_assignments" ("lead_id", "tag_id", "is_active")
    VALUES (NEW.id, expiring_soon_tag_id, true)
    ON CONFLICT DO NOTHING;
  ELSIF expired_tag_id IS NOT NULL AND days_since_creation >= 90 THEN
    INSERT INTO "lead_tag_assignments" ("lead_id", "tag_id", "is_active")
    VALUES (NEW.id, expired_tag_id, true)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto tag assignment
DROP TRIGGER IF EXISTS trg_auto_assign_lead_tags ON "leads";
CREATE TRIGGER trg_auto_assign_lead_tags
AFTER INSERT OR UPDATE ON "leads"
FOR EACH ROW
EXECUTE FUNCTION auto_assign_lead_tags();

-- 5. Create function to get lead tags with details
CREATE OR REPLACE FUNCTION get_lead_tags(p_lead_id uuid)
RETURNS TABLE (
  tag_id uuid,
  tag_name varchar(50),
  tag_category varchar(50),
  tag_type varchar(50),
  tag_color varchar(20),
  is_auto boolean,
  is_system boolean,
  assigned_at timestamptz,
  assigned_by_name varchar(100)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as tag_id,
    t.name as tag_name,
    t.tag_category,
    t.tag_type,
    t.color as tag_color,
    t.is_auto,
    t.is_system,
    ta.assigned_at,
    u.real_name as assigned_by_name
  FROM "lead_tag_assignments" ta
  JOIN "lead_tags" t ON ta.tag_id = t.id
  LEFT JOIN "users" u ON ta.assigned_by_id = u.id
  WHERE ta.lead_id = p_lead_id 
    AND ta.is_active = true
    AND t.is_active = true
  ORDER BY t.sort_order, t.name;
END;
$$;

-- 6. Create function to assign tag to lead
CREATE OR REPLACE FUNCTION assign_tag_to_lead(
  p_lead_id uuid,
  p_tag_id uuid,
  p_assigned_by_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if tag assignment already exists and is active
  IF EXISTS (
    SELECT 1 FROM "lead_tag_assignments" 
    WHERE lead_id = p_lead_id 
      AND tag_id = p_tag_id 
      AND is_active = true
  ) THEN
    RETURN false; -- Tag already assigned
  END IF;

  -- Deactivate any previous assignment (soft delete)
  UPDATE "lead_tag_assignments"
  SET is_active = false, removed_at = now(), removed_by_id = p_assigned_by_id
  WHERE lead_id = p_lead_id AND tag_id = p_tag_id AND is_active = true;

  -- Insert new assignment
  INSERT INTO "lead_tag_assignments" (
    lead_id, 
    tag_id, 
    assigned_by_id, 
    assigned_at,
    is_active
  ) VALUES (
    p_lead_id, 
    p_tag_id, 
    p_assigned_by_id, 
    now(),
    true
  );

  RETURN true;
END;
$$;

-- 7. Create function to remove tag from lead
CREATE OR REPLACE FUNCTION remove_tag_from_lead(
  p_lead_id uuid,
  p_tag_id uuid,
  p_removed_by_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the tag is a system auto tag (cannot be manually removed)
  IF EXISTS (
    SELECT 1 FROM "lead_tags" 
    WHERE id = p_tag_id 
      AND is_auto = true
  ) THEN
    RETURN false; -- Cannot remove auto tags
  END IF;

  -- Update assignment to inactive
  UPDATE "lead_tag_assignments"
  SET 
    is_active = false, 
    removed_at = now(), 
    removed_by_id = p_removed_by_id
  WHERE lead_id = p_lead_id 
    AND tag_id = p_tag_id 
    AND is_active = true;

  RETURN true;
END;
$$;

-- 8. Create scheduled job function to maintain auto tags (to be called by cron/scheduler)
CREATE OR REPLACE FUNCTION maintain_lead_auto_tags()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  lead_record RECORD;
  quoted_tag_id uuid;
  need_maintenance_tag_id uuid;
  expiring_soon_tag_id uuid;
  expired_tag_id uuid;
BEGIN
  -- Get system tag IDs
  SELECT id INTO quoted_tag_id FROM "lead_tags" WHERE "tag_type" = 'quoted' LIMIT 1;
  SELECT id INTO need_maintenance_tag_id FROM "lead_tags" WHERE "tag_type" = 'need_maintenance' LIMIT 1;
  SELECT id INTO expiring_soon_tag_id FROM "lead_tags" WHERE "tag_type" = 'expiring_soon' LIMIT 1;
  SELECT id INTO expired_tag_id FROM "lead_tags" WHERE "tag_type" = 'expired' LIMIT 1;

  -- Process all active leads
  FOR lead_record IN 
    SELECT * FROM "leads" 
    WHERE status NOT IN ('COMPLETED', 'CANCELLED', 'EXPIRED')
  LOOP
    -- Add "需维护" tag if quoted > 10 days and not converted
    IF lead_record.quote_files IS NOT NULL THEN
      IF EXTRACT(DAY FROM (now() - lead_record.updated_at)) > 10 
         AND lead_record.status != 'DRAFT_SIGNED' 
         AND need_maintenance_tag_id IS NOT NULL THEN
        INSERT INTO "lead_tag_assignments" ("lead_id", "tag_id", "is_active")
        VALUES (lead_record.id, need_maintenance_tag_id, true)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    -- Update expiration tags
    DECLARE
      days_old integer := EXTRACT(DAY FROM (now() - lead_record.created_at));
    BEGIN
      IF days_old >= 90 AND expired_tag_id IS NOT NULL THEN
        -- Add expired tag
        INSERT INTO "lead_tag_assignments" ("lead_id", "tag_id", "is_active")
        VALUES (lead_record.id, expired_tag_id, true)
        ON CONFLICT DO NOTHING;
        
        -- Remove expiring_soon tag if exists
        UPDATE "lead_tag_assignments"
        SET is_active = false, removed_at = now()
        WHERE lead_id = lead_record.id 
          AND tag_id = expiring_soon_tag_id 
          AND is_active = true;
          
      ELSIF days_old >= 60 AND expiring_soon_tag_id IS NOT NULL THEN
        -- Add expiring_soon tag
        INSERT INTO "lead_tag_assignments" ("lead_id", "tag_id", "is_active")
        VALUES (lead_record.id, expiring_soon_tag_id, true)
        ON CONFLICT DO NOTHING;
      END IF;
    END;
  END LOOP;
END;
$$;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lead_tags_category ON "lead_tags"("tag_category");
CREATE INDEX IF NOT EXISTS idx_lead_tags_type ON "lead_tags"("tag_type");
CREATE INDEX IF NOT EXISTS idx_lead_tags_is_active ON "lead_tags"("is_active");
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_is_active ON "lead_tag_assignments"("is_active");

-- 10. Add RLS policies for lead tags
ALTER TABLE "lead_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_tag_assignments" ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read tags
CREATE POLICY "Anyone can read lead_tags" ON "lead_tags"
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Only admins can create/update/delete system tags
CREATE POLICY "Only admins can modify system tags" ON "lead_tags"
  FOR ALL
  USING (
    auth.role() = 'authenticated' 
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
      OR is_system = false
    )
  );

-- Policy: Users can read their assigned leads' tag assignments
CREATE POLICY "Users can read lead tag assignments" ON "lead_tag_assignments"
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      -- Admin can read all
      (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
      OR
      -- User can read tags of leads they have access to
      EXISTS (
        SELECT 1 FROM leads l
        WHERE l.id = lead_tag_assignments.lead_id
        -- Add additional lead access control logic here
      )
    )
  );

-- Policy: Users can assign/remove tags to leads they have access to
CREATE POLICY "Users can manage lead tag assignments" ON "lead_tag_assignments"
  FOR ALL
  USING (
    auth.role() = 'authenticated'
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'sales')
    )
  );
