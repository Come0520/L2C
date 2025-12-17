CREATE TABLE IF NOT EXISTS order_status_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status varchar(100),
  to_status varchar(100) NOT NULL,
  changed_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  comment text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_status_change_at timestamptz DEFAULT now();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_status_change_by_id uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION record_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.last_status_change_at := now();
    INSERT INTO order_status_transitions (
      order_id,
      from_status,
      to_status,
      changed_by_id,
      changed_at,
      comment
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(NEW.last_status_change_by_id, NULL),
      now(),
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_record_order_status_change ON orders;
CREATE TRIGGER trg_record_order_status_change
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION record_order_status_change();

CREATE OR REPLACE FUNCTION create_order(order_data jsonb)
RETURNS uuid AS $$
DECLARE
  v_id uuid;
  v_sales_no text;
BEGIN
  v_sales_no := 'SO' || to_char(now(), 'YYYYMMDD') || substring(md5(random()::text) from 1 for 6);
  INSERT INTO orders (
    sales_no,
    status,
    customer_name,
    customer_phone,
    project_address,
    designer,
    sales_person,
    create_time,
    expected_delivery_time,
    total_amount,
    subtotal_amount,
    discount_amount,
    tax_amount,
    created_at,
    updated_at
  ) VALUES (
    v_sales_no,
    COALESCE(order_data->>'status', 'pending_push'),
    COALESCE(order_data->>'customerName', ''),
    order_data->>'customerPhone',
    order_data->>'projectAddress',
    order_data->>'designer',
    order_data->>'salesPerson',
    (order_data->>'createTime')::timestamptz,
    (order_data->>'expectedDeliveryTime')::timestamptz,
    COALESCE((order_data->>'totalAmount')::numeric, 0),
    COALESCE((order_data->'subtotals'->>'total')::numeric, NULL),
    COALESCE((order_data->'subtotals'->>'discount')::numeric, NULL),
    COALESCE((order_data->'subtotals'->>'tax')::numeric, NULL),
    now(),
    now()
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_order_status(p_order_id uuid, p_new_status text, p_changed_by_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE orders
  SET
    status = p_new_status,
    last_status_change_by_id = p_changed_by_id,
    last_status_change_at = now(),
    updated_at = now()
  WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order not found: %', p_order_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_order(p_order_id uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM order_items WHERE order_id = p_order_id;
  DELETE FROM order_status_transitions WHERE order_id = p_order_id;
  DELETE FROM orders WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION batch_update_order_status(p_order_ids uuid[], p_new_status text)
RETURNS integer AS $$
DECLARE
  v_updated_count integer;
BEGIN
  UPDATE orders
  SET
    status = p_new_status,
    updated_at = now()
  WHERE id = ANY(p_order_ids);
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_order_status_history(p_order_id uuid)
RETURNS TABLE (
  transition_id uuid,
  from_status varchar(100),
  to_status varchar(100),
  changed_by_name varchar(100),
  changed_at timestamptz,
  comment text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.id as transition_id,
    st.from_status,
    st.to_status,
    u.real_name as changed_by_name,
    st.changed_at,
    st.comment
  FROM order_status_transitions st
  LEFT JOIN users u ON st.changed_by_id = u.id
  WHERE st.order_id = p_order_id
  ORDER BY st.changed_at DESC;
END;
$$ LANGUAGE plpgsql;
