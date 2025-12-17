-- Create workflow_definitions table
CREATE TABLE IF NOT EXISTS workflow_definitions (
    code VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'LEAD', 'ORDER', 'FINANCE', 'EXCEPTION'
    order_index INTEGER NOT NULL,
    color VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workflow_transition_rules table
CREATE TABLE IF NOT EXISTS workflow_transition_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_status VARCHAR(100) REFERENCES workflow_definitions(code) ON DELETE CASCADE,
    to_status VARCHAR(100) REFERENCES workflow_definitions(code) ON DELETE CASCADE,
    required_fields TEXT[], -- Array of field names required for this transition
    required_files TEXT[],  -- Array of file types required for this transition
    required_permissions TEXT[], -- Array of roles required for this transition
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_status, to_status)
);

-- Seed workflow_definitions
INSERT INTO workflow_definitions (code, name, category, order_index, color, description) VALUES
-- LEAD Phase
('pending_assignment', '待分配', 'LEAD', 1, '#94A3B8', '线索待分配给销售人员'),
('pending_tracking', '待跟踪', 'LEAD', 2, '#60A5FA', '已分配，等待销售跟踪'),
('tracking', '跟踪中', 'LEAD', 3, '#3B82F6', '销售正在跟踪线索'),
('draft_signed', '草签', 'LEAD', 4, '#8B5CF6', '完成草签，准备进入订单阶段'),
('expired', '已失效', 'LEAD', 5, '#6B7280', '线索已过期失效'),

-- ORDER/MEASUREMENT Phase
('pending_measurement', '待测量', 'ORDER', 6, '#10B981', '等待安排测量'),
('measuring_pending_assignment', '测量中-待分配', 'ORDER', 7, '#14B8A6', '待分配测量师'),
('measuring_assigning', '测量中-分配中', 'ORDER', 8, '#06B6D4', '正在分配测量师'),
('measuring_pending_visit', '测量中-待上门', 'ORDER', 9, '#0EA5E9', '测量师待上门测量'),
('measuring_pending_confirmation', '测量中-待确认', 'ORDER', 10, '#3B82F6', '测量完成，待销售确认'),
('plan_pending_confirmation', '方案待确认', 'ORDER', 11, '#6366F1', '方案待客户确认'),

-- ORDER PROCESSING Phase
('pending_push', '待推单', 'ORDER', 12, '#8B5CF6', '方案确认后，待推单到圣都'),
('pending_order', '待下单', 'ORDER', 13, '#A855F7', '订单客服确认采购需求后，待下单'),
('in_production', '生产中', 'ORDER', 14, '#EC4899', '生产单已下，正在生产'),
('stock_prepared', '备货完成', 'ORDER', 15, '#F472B6', '所有生产单备货完成'),
('pending_shipment', '待发货', 'ORDER', 16, '#00BCD4', '所有生产单已备货，等待发货'),
('shipped', '已发货', 'ORDER', 17, '#2196F3', '货物已发出'),

-- INSTALLATION Phase
('installing_pending_assignment', '安装中-待分配', 'ORDER', 18, '#FB7185', '待分配安装师'),
('installing_assigning', '安装中-分配中', 'ORDER', 19, '#F87171', '正在分配安装师'),
('installing_pending_visit', '安装中-待上门', 'ORDER', 20, '#EF4444', '安装师待上门安装'),
('installing_pending_confirmation', '安装中-待确认', 'ORDER', 21, '#DC2626', '安装完成，待销售确认'),
('delivered', '已交付', 'ORDER', 22, '#4CAF50', '安装确认交付'),

-- FINANCE Phase
('pending_reconciliation', '待对账', 'FINANCE', 23, '#B91C1C', '安装确认完成，待对账'),
('pending_invoice', '待开发票', 'FINANCE', 24, '#7C3AED', '待财务开具发票'),
('pending_payment', '待回款', 'FINANCE', 25, '#6D28D9', '发票已开具，待回款'),
('completed', '已完成', 'FINANCE', 26, '#10B981', '回款完成，订单完结'),

-- EXCEPTION Phase
('cancelled', '已取消', 'EXCEPTION', 27, '#6B7280', '订单已取消'),
('suspended', '暂停', 'EXCEPTION', 28, '#F59E0B', '订单暂停处理'),
('exception', '异常', 'EXCEPTION', 29, '#EF4444', '订单异常')
ON CONFLICT (code) DO NOTHING;

-- Seed workflow_transition_rules
-- Note: 'suspended' and 'cancelled' are global exits, handled specially or added explicitly.
-- Here we add explicit transitions based on STATUS_METADATA 'nextStatuses'.

INSERT INTO workflow_transition_rules (from_status, to_status, required_fields, required_files, required_permissions) VALUES
-- PENDING_ASSIGNMENT
('pending_assignment', 'pending_tracking', NULL, NULL, NULL),
('pending_assignment', 'cancelled', NULL, NULL, NULL),
('pending_assignment', 'expired', NULL, NULL, NULL),

-- PENDING_FOLLOW_UP
('pending_tracking', 'tracking', NULL, NULL, NULL),
('pending_tracking', 'cancelled', NULL, NULL, NULL),
('pending_tracking', 'expired', NULL, NULL, NULL),

-- FOLLOWING_UP
('tracking', 'draft_signed', NULL, NULL, NULL),
('tracking', 'cancelled', NULL, NULL, NULL),
('tracking', 'expired', NULL, NULL, NULL),

-- DRAFT_SIGNED
('draft_signed', 'pending_measurement', NULL, NULL, NULL),
('draft_signed', 'cancelled', NULL, NULL, NULL),
('draft_signed', 'expired', NULL, NULL, NULL),

-- PENDING_MEASUREMENT
('pending_measurement', 'measuring_pending_assignment', NULL, NULL, NULL),
('pending_measurement', 'cancelled', NULL, NULL, NULL),
('pending_measurement', 'suspended', NULL, NULL, NULL),

-- MEASURING_PENDING_ASSIGNMENT
('measuring_pending_assignment', 'measuring_assigning', NULL, NULL, NULL),
('measuring_pending_assignment', 'cancelled', NULL, NULL, NULL),
('measuring_pending_assignment', 'suspended', NULL, NULL, NULL),

-- MEASURING_ASSIGNING
('measuring_assigning', 'measuring_pending_visit', NULL, NULL, NULL),
('measuring_assigning', 'measuring_pending_assignment', NULL, NULL, NULL),
('measuring_assigning', 'cancelled', NULL, NULL, NULL),
('measuring_assigning', 'suspended', NULL, NULL, NULL),

-- MEASURING_PENDING_VISIT
('measuring_pending_visit', 'measuring_pending_confirmation', NULL, NULL, NULL),
('measuring_pending_visit', 'cancelled', NULL, NULL, NULL),
('measuring_pending_visit', 'suspended', NULL, NULL, NULL),

-- MEASURING_PENDING_CONFIRMATION
('measuring_pending_confirmation', 'plan_pending_confirmation', NULL, '{"measurement_report", "measurement_photos"}', NULL),
('measuring_pending_confirmation', 'measuring_pending_assignment', NULL, NULL, NULL),
('measuring_pending_confirmation', 'cancelled', NULL, NULL, NULL),
('measuring_pending_confirmation', 'suspended', NULL, NULL, NULL),

-- PLAN_PENDING_CONFIRMATION
('plan_pending_confirmation', 'pending_push', NULL, NULL, NULL),
('plan_pending_confirmation', 'measuring_pending_confirmation', NULL, NULL, NULL),
('plan_pending_confirmation', 'cancelled', NULL, NULL, NULL),
('plan_pending_confirmation', 'suspended', NULL, NULL, NULL),

-- PENDING_PUSH
('pending_push', 'pending_order', NULL, '{"plan_confirmation_photos"}', NULL),
('pending_push', 'cancelled', NULL, NULL, NULL),
('pending_push', 'suspended', NULL, NULL, NULL),

-- PENDING_ORDER
('pending_order', 'in_production', NULL, '{"push_order_screenshot"}', NULL),
('pending_order', 'cancelled', NULL, NULL, NULL),
('pending_order', 'suspended', NULL, NULL, NULL),

-- IN_PRODUCTION
('in_production', 'stock_prepared', '{"production_order_nos"}', NULL, NULL),
('in_production', 'cancelled', NULL, NULL, NULL),
('in_production', 'suspended', NULL, NULL, NULL),
('in_production', 'exception', NULL, NULL, NULL),

-- STOCK_PREPARED
('stock_prepared', 'pending_shipment', NULL, NULL, NULL),
('stock_prepared', 'cancelled', NULL, NULL, NULL),
('stock_prepared', 'suspended', NULL, NULL, NULL),
('stock_prepared', 'exception', NULL, NULL, NULL),

-- PENDING_SHIPMENT
('pending_shipment', 'shipped', NULL, NULL, NULL),
('pending_shipment', 'cancelled', NULL, NULL, NULL),
('pending_shipment', 'suspended', NULL, NULL, NULL),
('pending_shipment', 'exception', NULL, NULL, NULL),

-- SHIPPED
('shipped', 'installing_pending_assignment', NULL, NULL, NULL),
('shipped', 'cancelled', NULL, NULL, NULL),
('shipped', 'suspended', NULL, NULL, NULL),

-- INSTALLING_PENDING_ASSIGNMENT
('installing_pending_assignment', 'installing_assigning', NULL, NULL, NULL),
('installing_pending_assignment', 'cancelled', NULL, NULL, NULL),
('installing_pending_assignment', 'suspended', NULL, NULL, NULL),

-- INSTALLING_ASSIGNING
('installing_assigning', 'installing_pending_visit', NULL, NULL, NULL),
('installing_assigning', 'installing_pending_assignment', NULL, NULL, NULL),
('installing_assigning', 'cancelled', NULL, NULL, NULL),
('installing_assigning', 'suspended', NULL, NULL, NULL),

-- INSTALLING_PENDING_VISIT
('installing_pending_visit', 'installing_pending_confirmation', '{"installation_notes"}', NULL, NULL),
('installing_pending_visit', 'cancelled', NULL, NULL, NULL),
('installing_pending_visit', 'suspended', NULL, NULL, NULL),

-- INSTALLING_PENDING_CONFIRMATION
('installing_pending_confirmation', 'delivered', NULL, '{"installation_photos"}', NULL),
('installing_pending_confirmation', 'installing_pending_visit', NULL, NULL, NULL),
('installing_pending_confirmation', 'cancelled', NULL, NULL, NULL),
('installing_pending_confirmation', 'suspended', NULL, NULL, NULL),

-- DELIVERED
('delivered', 'pending_reconciliation', NULL, NULL, NULL),
('delivered', 'cancelled', NULL, NULL, NULL),
('delivered', 'suspended', NULL, NULL, NULL),

-- PENDING_RECONCILIATION
('pending_reconciliation', 'pending_invoice', NULL, NULL, NULL),
('pending_reconciliation', 'cancelled', NULL, NULL, NULL),
('pending_reconciliation', 'suspended', NULL, NULL, NULL),

-- PENDING_INVOICE
('pending_invoice', 'pending_payment', NULL, NULL, '{"finance"}'),
('pending_invoice', 'cancelled', NULL, NULL, NULL),
('pending_invoice', 'suspended', NULL, NULL, NULL),

-- PENDING_PAYMENT
('pending_payment', 'completed', '{"invoice_no"}', NULL, '{"finance"}'),
('pending_payment', 'cancelled', NULL, NULL, NULL),
('pending_payment', 'suspended', NULL, NULL, NULL),

-- COMPLETED
('completed', 'suspended', NULL, NULL, NULL),

-- SUSPENDED (Can go back to almost anywhere, adding a subset for sanity or strict as per metadata)
-- For now implementing strict mapped returns from metadata
('suspended', 'pending_assignment', NULL, NULL, NULL),
('suspended', 'pending_tracking', NULL, NULL, NULL),
('suspended', 'tracking', NULL, NULL, NULL),
('suspended', 'draft_signed', NULL, NULL, NULL),
('suspended', 'pending_measurement', NULL, NULL, NULL),
('suspended', 'measuring_pending_assignment', NULL, NULL, NULL),
('suspended', 'measuring_assigning', NULL, NULL, NULL),
('suspended', 'measuring_pending_visit', NULL, NULL, NULL),
('suspended', 'measuring_pending_confirmation', NULL, NULL, NULL),
('suspended', 'plan_pending_confirmation', NULL, NULL, NULL),
('suspended', 'pending_push', NULL, NULL, NULL),
('suspended', 'pending_order', NULL, NULL, NULL),
('suspended', 'in_production', NULL, NULL, NULL),
('suspended', 'stock_prepared', NULL, NULL, NULL),
('suspended', 'pending_shipment', NULL, NULL, NULL),
('suspended', 'shipped', NULL, NULL, NULL),
('suspended', 'installing_pending_assignment', NULL, NULL, NULL),
('suspended', 'installing_assigning', NULL, NULL, NULL),
('suspended', 'installing_pending_visit', NULL, NULL, NULL),
('suspended', 'installing_pending_confirmation', NULL, NULL, NULL),
('suspended', 'delivered', NULL, NULL, NULL),
('suspended', 'pending_reconciliation', NULL, NULL, NULL),
('suspended', 'pending_invoice', NULL, NULL, NULL),
('suspended', 'pending_payment', NULL, NULL, NULL),
('suspended', 'completed', NULL, NULL, NULL),
('suspended', 'cancelled', NULL, NULL, NULL),

-- EXCEPTION
('exception', 'tracking', NULL, NULL, NULL), -- FOLLOWING_UP
('exception', 'cancelled', NULL, NULL, NULL)
ON CONFLICT DO NOTHING;


-- Update update_order_status function to key off configuration
CREATE OR REPLACE FUNCTION update_order_status(p_order_id uuid, p_new_status text, p_changed_by_id uuid)
RETURNS void AS $$
DECLARE
    v_current_status text;
BEGIN
  -- Get current status
  SELECT status INTO v_current_status FROM orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order not found: %', p_order_id;
  END IF;

  -- Validate transition (unless it's the same status, though that's usually a no-op)
  IF v_current_status IS DISTINCT FROM p_new_status THEN
      IF NOT EXISTS (
          SELECT 1 FROM workflow_transition_rules 
          WHERE from_status = v_current_status 
          AND to_status = p_new_status
      ) THEN
          RAISE EXCEPTION 'Invalid status transition from % to %', v_current_status, p_new_status;
      END IF;
  END IF;

  UPDATE orders
  SET
    status = p_new_status,
    last_status_change_by_id = p_changed_by_id,
    last_status_change_at = now(),
    updated_at = now()
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;
