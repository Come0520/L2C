-- Batch assign sales person functionality
-- Date: 2025-12-12
-- Purpose: Enable batch assignment of orders to sales personnel with history tracking

-- 1. Create order assignment history table
CREATE TABLE IF NOT EXISTS order_assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_assignee_id uuid REFERENCES users(id) ON DELETE SET NULL,
  new_assignee_id uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  assigned_by_id uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  reason text,
  assignment_type varchar(50) DEFAULT 'manual', -- 'manual', 'auto', 'system'
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_order_assignment_history_order ON order_assignment_history(order_id);
CREATE INDEX idx_order_assignment_history_assigned_at ON order_assignment_history(assigned_at DESC);
CREATE INDEX idx_order_assignment_history_new_assignee ON order_assignment_history(new_assignee_id);

COMMENT ON TABLE order_assignment_history IS '订单分配历史记录表';
COMMENT ON COLUMN order_assignment_history.assignment_type IS '分配类型：manual-手动, auto-自动, system-系统';

-- 2. Create batch assign sales person function
CREATE OR REPLACE FUNCTION batch_assign_sales_person(
  p_order_ids uuid[],
  p_sales_person_id uuid,
  p_assigned_by_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_order_id uuid;
  v_success_count integer := 0;
  v_failed_count integer := 0;
  v_failed_orders jsonb := '[]'::jsonb;
  v_old_sales_person_id uuid;
  v_order_no varchar(100);
  v_error_message text;
BEGIN
  -- Verify assigner has permission (only sales_manager and above can batch assign)
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_assigned_by_id 
    AND role IN ('sales_manager', 'admin', 'super_admin')
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to batch assign. Only managers and admins can perform this action.';
  END IF;

  -- Verify target sales person exists and has sales role
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_sales_person_id 
    AND role IN ('sales', 'sales_manager')
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Invalid sales person. User must be active and have sales role.';
  END IF;

  -- Process each order
  FOREACH v_order_id IN ARRAY p_order_ids LOOP
    BEGIN
      -- Get current sales person and order info with row lock
      SELECT sales_id, sales_no 
      INTO v_old_sales_person_id, v_order_no
      FROM orders 
      WHERE id = v_order_id
      FOR UPDATE;

      IF NOT FOUND THEN
        v_failed_count := v_failed_count + 1;
        v_failed_orders := v_failed_orders || jsonb_build_object(
          'orderId', v_order_id,
          'orderNo', 'Unknown',
          'reason', 'Order not found'
        );
        CONTINUE;
      END IF;

      -- Skip if already assigned to the same person
      IF v_old_sales_person_id = p_sales_person_id THEN
        v_success_count := v_success_count + 1;
        CONTINUE;
      END IF;

      -- Check if order is in a state that allows reassignment
      IF EXISTS (
        SELECT 1 FROM orders 
        WHERE id = v_order_id 
        AND status IN ('completed', 'cancelled')
      ) THEN
        v_failed_count := v_failed_count + 1;
        v_failed_orders := v_failed_orders || jsonb_build_object(
          'orderId', v_order_id,
          'orderNo', v_order_no,
          'reason', 'Cannot reassign completed or cancelled orders'
        );
        CONTINUE;
      END IF;

      -- Update sales person
      UPDATE orders
      SET 
        sales_id = p_sales_person_id,
        updated_at = now()
      WHERE id = v_order_id;

      -- Record assignment history
      INSERT INTO order_assignment_history (
        order_id,
        old_assignee_id,
        new_assignee_id,
        assigned_by_id,
        assigned_at,
        reason,
        assignment_type,
        metadata
      ) VALUES (
        v_order_id,
        v_old_sales_person_id,
        p_sales_person_id,
        p_assigned_by_id,
        now(),
        p_reason,
        'manual',
        jsonb_build_object(
          'order_no', v_order_no,
          'batch_operation', true
        )
      );

      v_success_count := v_success_count + 1;

    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
      v_failed_count := v_failed_count + 1;
      v_failed_orders := v_failed_orders || jsonb_build_object(
        'orderId', v_order_id,
        'orderNo', COALESCE(v_order_no, 'Unknown'),
        'reason', v_error_message
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success_count', v_success_count,
    'failed_count', v_failed_count,
    'failed_orders', v_failed_orders,
    'total', array_length(p_order_ids, 1)
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Create function to get assignment history for an order
CREATE OR REPLACE FUNCTION get_order_assignment_history(p_order_id uuid)
RETURNS TABLE (
  assignment_id uuid,
  old_assignee_name varchar(100),
  new_assignee_name varchar(100),
  assigned_by_name varchar(100),
  assigned_at timestamptz,
  reason text,
  assignment_type varchar(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oah.id as assignment_id,
    u_old.name as old_assignee_name,
    u_new.name as new_assignee_name,
    u_by.name as assigned_by_name,
    oah.assigned_at,
    oah.reason,
    oah.assignment_type
  FROM order_assignment_history oah
  LEFT JOIN users u_old ON oah.old_assignee_id = u_old.id
  INNER JOIN users u_new ON oah.new_assignee_id = u_new.id
  INNER JOIN users u_by ON oah.assigned_by_id = u_by.id
  WHERE oah.order_id = p_order_id
  ORDER BY oah.assigned_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to get assignment statistics for a sales person
CREATE OR REPLACE FUNCTION get_sales_person_assignment_stats(
  p_sales_person_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  total_assignments integer,
  assignments_as_new integer,
  assignments_as_old integer,
  avg_hold_duration_hours numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH assignment_durations AS (
    SELECT 
      order_id,
      assigned_at,
      LEAD(assigned_at) OVER (PARTITION BY order_id ORDER BY assigned_at) as next_assigned_at
    FROM order_assignment_history
    WHERE new_assignee_id = p_sales_person_id
      AND (p_start_date IS NULL OR assigned_at >= p_start_date)
      AND (p_end_date IS NULL OR assigned_at <= p_end_date)
  )
  SELECT 
    COUNT(DISTINCT oah.order_id)::integer as total_assignments,
    COUNT(*) FILTER (WHERE oah.new_assignee_id = p_sales_person_id)::integer as assignments_as_new,
    COUNT(*) FILTER (WHERE oah.old_assignee_id = p_sales_person_id)::integer as assignments_as_old,
    COALESCE(AVG(
      EXTRACT(EPOCH FROM (ad.next_assigned_at - ad.assigned_at)) / 3600
    ), 0)::numeric(10,2) as avg_hold_duration_hours
  FROM order_assignment_history oah
  LEFT JOIN assignment_durations ad ON oah.order_id = ad.order_id AND oah.assigned_at = ad.assigned_at
  WHERE oah.new_assignee_id = p_sales_person_id OR oah.old_assignee_id = p_sales_person_id
    AND (p_start_date IS NULL OR oah.assigned_at >= p_start_date)
    AND (p_end_date IS NULL OR oah.assigned_at <= p_end_date);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION batch_assign_sales_person IS '批量分配销售人员到订单，带权限验证和历史记录';
COMMENT ON FUNCTION get_order_assignment_history IS '获取订单的分配历史记录';
COMMENT ON FUNCTION get_sales_person_assignment_stats IS '获取销售人员的分配统计信息';
