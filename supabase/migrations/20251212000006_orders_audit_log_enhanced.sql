-- Enhanced audit log for order status changes
-- Date: 2025-12-12
-- Purpose: Comprehensive audit trail with metadata and rich query capabilities

-- 1. Enhance order_status_transitions table with more fields
ALTER TABLE order_status_transitions 
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS transition_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS reason_category varchar(50); -- 'manual', 'auto', 'system', 'timeout', 'exception'

COMMENT ON COLUMN order_status_transitions.ip_address IS '操作者IP地址';
COMMENT ON COLUMN order_status_transitions.user_agent IS '操作者浏览器UA';
COMMENT ON COLUMN order_status_transitions.transition_duration_seconds IS '从上一状态到当前状态的耗时（秒）';
COMMENT ON COLUMN order_status_transitions.reason_category IS '变更原因分类';

-- 2. Enhanced trigger to record more audit information
CREATE OR REPLACE FUNCTION record_order_status_change_enhanced()
RETURNS TRIGGER AS $$
DECLARE
  v_duration integer;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.last_status_change_at := now();
    
    -- Calculate duration in seconds
    IF OLD.last_status_change_at IS NOT NULL THEN
      v_duration := EXTRACT(EPOCH FROM (now() - OLD.last_status_change_at))::integer;
    END IF;
    
    INSERT INTO order_status_transitions (
      order_id,
      from_status,
      to_status,
      changed_by_id,
      changed_at,
      comment,
      metadata,
      transition_duration_seconds,
      reason_category
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(NEW.last_status_change_by_id, NULL),
      now(),
      NEW.status_change_comment,
      jsonb_build_object(
        'order_id', NEW.id,
        'customer_name', NEW.customer_name,
        'total_amount', NEW.total_amount,
        'version', NEW.version
      ),
      v_duration,
      CASE 
        WHEN NEW.is_cancelled THEN 'manual'
        WHEN NEW.is_paused THEN 'manual'
        WHEN NEW.is_abnormal THEN 'exception'
        ELSE 'manual'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace old trigger with enhanced version
DROP TRIGGER IF EXISTS trg_record_order_status_change ON orders;
CREATE TRIGGER trg_record_order_status_change
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION record_order_status_change_enhanced();

-- 3. Enhanced query function with filtering and pagination
CREATE OR REPLACE FUNCTION get_order_status_history_enhanced(
  p_order_id integer,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  transition_id uuid,
  from_status varchar(100),
  from_status_name text,
  to_status varchar(100),
  to_status_name text,
  changed_by_id uuid,
  changed_by_name varchar(100),
  changed_at timestamptz,
  comment text,
  duration_seconds integer,
  duration_display text,
  reason_category varchar(50),
  metadata jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.id as transition_id,
    st.from_status,
    COALESCE(wd_from.name, st.from_status) as from_status_name,
    st.to_status,
    wd_to.name as to_status_name,
    st.changed_by_id,
    u.name as changed_by_name,
    st.changed_at,
    st.comment,
    st.transition_duration_seconds as duration_seconds,
    CASE 
      WHEN st.transition_duration_seconds IS NULL THEN '-'
      WHEN st.transition_duration_seconds < 60 THEN st.transition_duration_seconds || '秒'
      WHEN st.transition_duration_seconds < 3600 THEN (st.transition_duration_seconds / 60) || '分钟'
      WHEN st.transition_duration_seconds < 86400 THEN (st.transition_duration_seconds / 3600) || '小时'
      ELSE (st.transition_duration_seconds / 86400) || '天'
    END as duration_display,
    st.reason_category,
    st.metadata
  FROM order_status_transitions st
  LEFT JOIN users u ON st.changed_by_id = u.id
  LEFT JOIN workflow_definitions wd_from ON st.from_status = wd_from.code
  LEFT JOIN workflow_definitions wd_to ON st.to_status = wd_to.code
  WHERE st.order_id = p_order_id
  ORDER BY st.changed_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 4. Get status change statistics for an order
CREATE OR REPLACE FUNCTION get_order_status_statistics(p_order_id integer)
RETURNS TABLE (
  total_transitions integer,
  total_duration_seconds integer,
  avg_transition_duration_seconds integer,
  manual_changes integer,
  system_changes integer,
  exception_count integer,
  current_status varchar(100),
  current_status_duration_seconds integer
) AS $$
DECLARE
  v_current_status varchar(100);
  v_last_change_at timestamptz;
BEGIN
  -- Get current status
  SELECT status, last_status_change_at 
  INTO v_current_status, v_last_change_at
  FROM orders WHERE id = p_order_id;

  RETURN QUERY
  SELECT 
    COUNT(*)::integer as total_transitions,
    SUM(transition_duration_seconds)::integer as total_duration_seconds,
    AVG(transition_duration_seconds)::integer as avg_transition_duration_seconds,
    COUNT(*) FILTER (WHERE reason_category = 'manual')::integer as manual_changes,
    COUNT(*) FILTER (WHERE reason_category IN ('auto', 'system', 'timeout'))::integer as system_changes,
    COUNT(*) FILTER (WHERE reason_category = 'exception')::integer as exception_count,
    v_current_status as current_status,
    CASE 
      WHEN v_last_change_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (now() - v_last_change_at))::integer
      ELSE NULL
    END as current_status_duration_seconds
  FROM order_status_transitions
  WHERE order_id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Get all status transitions for multiple orders (for batch analysis)
CREATE OR REPLACE FUNCTION get_batch_order_status_history(
  p_order_ids uuid[],
  p_status_filter varchar(100) DEFAULT NULL
)
RETURNS TABLE (
  order_id uuid,
  order_no varchar(100),
  transition_id uuid,
  from_status varchar(100),
  to_status varchar(100),
  to_status_name text,
  changed_by_name varchar(100),
  changed_at timestamptz,
  duration_seconds integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.order_id,
    o.id::text as order_no,
    st.id as transition_id,
    st.from_status,
    st.to_status,
    wd.name as to_status_name,
    u.name as changed_by_name,
    st.changed_at,
    st.transition_duration_seconds as duration_seconds
  FROM order_status_transitions st
  INNER JOIN orders o ON st.order_id = o.id
  LEFT JOIN users u ON st.changed_by_id = u.id
  LEFT JOIN workflow_definitions wd ON st.to_status = wd.code
  WHERE st.order_id = ANY(p_order_ids)
    AND (p_status_filter IS NULL OR st.to_status = p_status_filter)
  ORDER BY st.changed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Get status timeline summary (for visualization)
CREATE OR REPLACE FUNCTION get_order_status_timeline(p_order_id integer)
RETURNS TABLE (
  status varchar(100),
  status_name text,
  status_color varchar(50),
  entered_at timestamptz,
  exited_at timestamptz,
  duration_seconds integer,
  changed_by_name varchar(100)
) AS $$
BEGIN
  RETURN QUERY
  WITH transitions_with_exit AS (
    SELECT 
      st.to_status,
      wd.name as status_name,
      wd.color as status_color,
      st.changed_at as entered_at,
      LEAD(st.changed_at) OVER (ORDER BY st.changed_at) as exited_at,
      u.name as changed_by_name
    FROM order_status_transitions st
    LEFT JOIN workflow_definitions wd ON st.to_status = wd.code
    LEFT JOIN users u ON st.changed_by_id = u.id
    WHERE st.order_id = p_order_id
  )
  SELECT 
    to_status as status,
    status_name,
    status_color,
    entered_at,
    exited_at,
    CASE 
      WHEN exited_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (exited_at - entered_at))::integer
      ELSE EXTRACT(EPOCH FROM (now() - entered_at))::integer
    END as duration_seconds,
    changed_by_name
  FROM transitions_with_exit
  ORDER BY entered_at;
END;
$$ LANGUAGE plpgsql;

-- 7. Create view for easy audit log access
CREATE OR REPLACE VIEW v_order_audit_log AS
SELECT 
  st.id as audit_id,
  st.order_id,
  o.id::text as order_no,
  o.customer_name,
  st.from_status,
  wd_from.name as from_status_name,
  st.to_status,
  wd_to.name as to_status_name,
  st.changed_by_id,
  u.name as changed_by_name,
  u.email as changed_by_email,
  st.changed_at,
  st.comment,
  st.transition_duration_seconds,
  st.reason_category,
  st.metadata,
  st.ip_address,
  st.user_agent
FROM order_status_transitions st
INNER JOIN orders o ON st.order_id = o.id
LEFT JOIN users u ON st.changed_by_id = u.id
LEFT JOIN workflow_definitions wd_from ON st.from_status = wd_from.code
LEFT JOIN workflow_definitions wd_to ON st.to_status = wd_to.code;

-- 8. Performance indexes
CREATE INDEX IF NOT EXISTS idx_order_status_transitions_changed_at 
  ON order_status_transitions(changed_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_order_status_transitions_to_status 
  ON order_status_transitions(to_status);
  
CREATE INDEX IF NOT EXISTS idx_order_status_transitions_changed_by 
  ON order_status_transitions(changed_by_id);

COMMENT ON FUNCTION get_order_status_history_enhanced IS '获取订单状态变更历史（增强版，支持分页和详细信息）';
COMMENT ON FUNCTION get_order_status_statistics IS '获取订单状态变更统计信息';
COMMENT ON FUNCTION get_batch_order_status_history IS '批量获取多个订单的状态历史';
COMMENT ON FUNCTION get_order_status_timeline IS '获取订单状态时间线（用于可视化）';
COMMENT ON VIEW v_order_audit_log IS '订单审计日志视图';
