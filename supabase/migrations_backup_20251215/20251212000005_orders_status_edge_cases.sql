-- Enhancement for order status transition edge cases
-- Date: 2025-12-12
-- Purpose: Handle 5% edge cases for order status flow

-- 1. Add version column for optimistic locking (concurrent modification conflict)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0;

-- Create function to increment version on update
CREATE OR REPLACE FUNCTION increment_order_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_order_version ON orders;
CREATE TRIGGER trg_increment_order_version
BEFORE UPDATE ON orders
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION increment_order_version();

-- 2. Enhanced update_order_status with field validation and optimistic locking
CREATE OR REPLACE FUNCTION update_order_status_v2(
  p_order_id uuid, 
  p_new_status text, 
  p_changed_by_id uuid,
  p_expected_version integer DEFAULT NULL,
  p_comment text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    v_current_status text;
    v_current_version integer;
    v_required_fields text[];
    v_required_files text[];
    v_order_data jsonb;
    v_missing_fields text[];
    v_missing_files text[];
    v_field text;
    v_file text;
BEGIN
  -- Get current status and version with row lock
  SELECT status, version, row_to_json(orders.*)::jsonb 
  INTO v_current_status, v_current_version, v_order_data 
  FROM orders 
  WHERE id = p_order_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Optimistic locking check
  IF p_expected_version IS NOT NULL AND v_current_version != p_expected_version THEN
    RAISE EXCEPTION 'Concurrent modification detected. Expected version %, but current is %', 
      p_expected_version, v_current_version
    USING ERRCODE = '40001'; -- serialization_failure
  END IF;

  -- Validate transition (unless it's the same status)
  IF v_current_status IS DISTINCT FROM p_new_status THEN
      -- Check if transition is allowed
      SELECT required_fields, required_files
      INTO v_required_fields, v_required_files
      FROM workflow_transition_rules 
      WHERE from_status = v_current_status AND to_status = p_new_status;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid status transition from % to %', v_current_status, p_new_status;
      END IF;

      -- Validate required fields
      IF v_required_fields IS NOT NULL THEN
        v_missing_fields := ARRAY[]::text[];
        FOREACH v_field IN ARRAY v_required_fields LOOP
          IF v_order_data->>v_field IS NULL OR v_order_data->>v_field = '' THEN
            v_missing_fields := array_append(v_missing_fields, v_field);
          END IF;
        END LOOP;
        
        IF array_length(v_missing_fields, 1) > 0 THEN
          RAISE EXCEPTION 'Missing required fields for transition: %', array_to_string(v_missing_fields, ', ');
        END IF;
      END IF;

      -- Validate required files
      IF v_required_files IS NOT NULL THEN
        v_missing_files := ARRAY[]::text[];
        FOREACH v_file IN ARRAY v_required_files LOOP
          -- Check if file URL exists (assuming field name pattern: {file_type}_url or {file_type}_urls)
          IF (v_order_data->>(v_file || '_url') IS NULL OR v_order_data->>(v_file || '_url') = '') 
             AND (v_order_data->>(v_file || '_urls') IS NULL OR jsonb_array_length(v_order_data->(v_file || '_urls')) = 0) THEN
            v_missing_files := array_append(v_missing_files, v_file);
          END IF;
        END LOOP;
        
        IF array_length(v_missing_files, 1) > 0 THEN
          RAISE EXCEPTION 'Missing required files for transition: %', array_to_string(v_missing_files, ', ');
        END IF;
      END IF;
  END IF;

  -- Update status
  UPDATE orders
  SET
    status = p_new_status,
    last_status_change_by_id = p_changed_by_id,
    last_status_change_at = now(),
    status_change_comment = p_comment,
    updated_at = now()
    -- version will be incremented by trigger
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_version', v_current_version + 1,
    'from_status', v_current_status,
    'to_status', p_new_status
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Cancel order with rollback logic
CREATE OR REPLACE FUNCTION cancel_order(
  p_order_id uuid,
  p_cancelled_by_id uuid,
  p_cancellation_reason text
)
RETURNS jsonb AS $$
DECLARE
  v_current_status text;
  v_measurement_ids uuid[];
  v_installation_ids uuid[];
BEGIN
  -- Get current status
  SELECT status INTO v_current_status FROM orders WHERE id = p_order_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Check if cancellation is allowed from current status
  IF NOT EXISTS (
    SELECT 1 FROM workflow_transition_rules 
    WHERE from_status = v_current_status AND to_status = 'cancelled'
  ) THEN
    RAISE EXCEPTION 'Cannot cancel order from status: %', v_current_status;
  END IF;

  -- Get related measurement and installation orders
  SELECT array_agg(id) INTO v_measurement_ids 
  FROM measurements WHERE order_id = p_order_id AND status NOT IN ('cancelled', 'completed');
  
  SELECT array_agg(id) INTO v_installation_ids 
  FROM installations WHERE order_id = p_order_id AND status NOT IN ('cancelled', 'completed');

  -- Cancel related measurement orders
  IF v_measurement_ids IS NOT NULL THEN
    UPDATE measurements
    SET status = 'cancelled',
        cancelled_at = now(),
        cancelled_by_id = p_cancelled_by_id,
        cancellation_reason = 'Order cancelled: ' || p_cancellation_reason,
        updated_at = now()
    WHERE id = ANY(v_measurement_ids);
  END IF;

  -- Cancel related installation orders
  IF v_installation_ids IS NOT NULL THEN
    UPDATE installations
    SET status = 'cancelled',
        cancelled_at = now(),
        cancelled_by_id = p_cancelled_by_id,
        cancellation_reason = 'Order cancelled: ' || p_cancellation_reason,
        updated_at = now()
    WHERE id = ANY(v_installation_ids);
  END IF;

  -- Update order status to cancelled
  UPDATE orders
  SET
    status = 'cancelled',
    is_cancelled = true,
    cancelled_at = now(),
    cancelled_by_id = p_cancelled_by_id,
    cancellation_reason = p_cancellation_reason,
    last_status_change_by_id = p_cancelled_by_id,
    last_status_change_at = now(),
    updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'cancelled_measurements', coalesce(array_length(v_measurement_ids, 1), 0),
    'cancelled_installations', coalesce(array_length(v_installation_ids, 1), 0)
  );
END;
$$ LANGUAGE plpgsql;

-- 4. Batch update with transaction protection and validation
CREATE OR REPLACE FUNCTION batch_update_order_status_v2(
  p_order_ids uuid[], 
  p_new_status text,
  p_changed_by_id uuid DEFAULT NULL,
  p_skip_validation boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
  v_order_id uuid;
  v_current_status text;
  v_success_count integer := 0;
  v_failed_count integer := 0;
  v_failed_orders jsonb := '[]'::jsonb;
  v_error_message text;
BEGIN
  -- Process each order
  FOREACH v_order_id IN ARRAY p_order_ids LOOP
    BEGIN
      -- Get current status
      SELECT status INTO v_current_status FROM orders WHERE id = v_order_id;
      
      IF NOT FOUND THEN
        v_failed_count := v_failed_count + 1;
        v_failed_orders := v_failed_orders || jsonb_build_object(
          'order_id', v_order_id,
          'reason', 'Order not found'
        );
        CONTINUE;
      END IF;

      -- Skip if already in target status
      IF v_current_status = p_new_status THEN
        v_success_count := v_success_count + 1;
        CONTINUE;
      END IF;

      -- Validate transition unless skipped
      IF NOT p_skip_validation THEN
        IF NOT EXISTS (
          SELECT 1 FROM workflow_transition_rules 
          WHERE from_status = v_current_status AND to_status = p_new_status
        ) THEN
          v_failed_count := v_failed_count + 1;
          v_failed_orders := v_failed_orders || jsonb_build_object(
            'order_id', v_order_id,
            'reason', format('Invalid transition from %s to %s', v_current_status, p_new_status)
          );
          CONTINUE;
        END IF;
      END IF;

      -- Update status
      UPDATE orders
      SET
        status = p_new_status,
        last_status_change_by_id = p_changed_by_id,
        last_status_change_at = now(),
        updated_at = now()
      WHERE id = v_order_id;

      v_success_count := v_success_count + 1;

    EXCEPTION WHEN OTHERS THEN
      v_failed_count := v_failed_count + 1;
      GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
      v_failed_orders := v_failed_orders || jsonb_build_object(
        'order_id', v_order_id,
        'reason', v_error_message
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success_count', v_success_count,
    'failed_count', v_failed_count,
    'failed_orders', v_failed_orders
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Enhanced exception recovery with more paths
-- Add more recovery paths from exception status
INSERT INTO workflow_transition_rules (from_status, to_status) VALUES
('exception', 'draft_signed'),
('exception', 'pending_measurement'),
('exception', 'measuring_pending_assignment'),
('exception', 'measuring_pending_visit'),
('exception', 'measuring_pending_confirmation'),
('exception', 'plan_pending_confirmation'),
('exception', 'pending_push'),
('exception', 'pending_order'),
('exception', 'in_production'),
('exception', 'stock_prepared'),
('exception', 'pending_shipment'),
('exception', 'shipped'),
('exception', 'installing_pending_assignment'),
('exception', 'installing_pending_visit'),
('exception', 'installing_pending_confirmation'),
('exception', 'delivered'),
('exception', 'suspended')
ON CONFLICT DO NOTHING;

-- 6. Add index for performance
CREATE INDEX IF NOT EXISTS idx_orders_status_version ON orders(status, version);
-- Note: Commented out because order_status_transitions table may not exist yet
-- This index will be created in the audit log migration file
-- CREATE INDEX IF NOT EXISTS idx_order_status_transitions_order_changed ON order_status_transitions(order_id, changed_at DESC);

-- 7. Create helper function to check if transition is valid
CREATE OR REPLACE FUNCTION is_valid_status_transition(
  p_from_status text,
  p_to_status text
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workflow_transition_rules 
    WHERE from_status = p_from_status AND to_status = p_to_status
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 8. Create function to get allowed next statuses
CREATE OR REPLACE FUNCTION get_allowed_next_statuses(p_current_status text)
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT to_status 
    FROM workflow_transition_rules 
    WHERE from_status = p_current_status
    ORDER BY to_status
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION update_order_status_v2 IS 'Enhanced status update with optimistic locking and field validation';
COMMENT ON FUNCTION cancel_order IS 'Cancel order with automatic rollback of related measurement and installation orders';
COMMENT ON FUNCTION batch_update_order_status_v2 IS 'Batch update with transaction protection and detailed error reporting';
COMMENT ON FUNCTION is_valid_status_transition IS 'Check if a status transition is allowed';
COMMENT ON FUNCTION get_allowed_next_statuses IS 'Get list of allowed next statuses from current status';
