-- Create order_status_transitions table if not exists
-- This is a prerequisite for the audit log enhancement migration

CREATE TABLE IF NOT EXISTS order_status_transitions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status varchar(100),
  to_status varchar(100) NOT NULL,
  changed_by_id uuid REFERENCES users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  comment text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_order_status_transitions_order_id 
  ON order_status_transitions(order_id);

CREATE INDEX IF NOT EXISTS idx_order_status_transitions_changed_at 
  ON order_status_transitions(changed_at DESC);

COMMENT ON TABLE order_status_transitions IS '订单状态变更历史记录表';
