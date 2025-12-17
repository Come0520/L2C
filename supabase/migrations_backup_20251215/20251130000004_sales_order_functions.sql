-- 销售单相关函数与触发器
-- 2025-11-30

-- 1. 生成销售单号函数
CREATE OR REPLACE FUNCTION generate_sales_no()
RETURNS TEXT AS $$
DECLARE
  v_date TEXT;
  v_random TEXT;
BEGIN
  v_date := to_char(now(), 'YYYYMMDD');
  v_random := floor(random() * 9000 + 1000)::text;
  RETURN 'SO' || v_date || v_random;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建销售单 RPC (核心事务逻辑)
CREATE OR REPLACE FUNCTION create_sales_order(
  p_lead_id UUID,
  p_customer_info JSONB, -- { name, phone, address }
  p_order_info JSONB,    -- { designer, sales_person, create_time, expected_delivery_time }
  p_amounts JSONB,       -- { curtain, wallcovering, ... total_amount }
  p_packages JSONB,      -- { "space": "packageId", ... }
  p_items JSONB[]        -- Array of item objects
) RETURNS UUID AS $$
DECLARE
  v_customer_id UUID;
  v_sales_order_id UUID;
  v_sales_no TEXT;
  v_item JSONB;
  v_key TEXT;
  v_val TEXT;
BEGIN
  -- 1. 处理客户 (Upsert)
  -- 尝试根据手机号查找客户
  SELECT id INTO v_customer_id FROM customers WHERE phone = p_customer_info->>'phone';
  
  IF v_customer_id IS NULL THEN
    -- 创建新客户
    INSERT INTO customers (name, phone, address)
    VALUES (p_customer_info->>'name', p_customer_info->>'phone', p_customer_info->>'address')
    RETURNING id INTO v_customer_id;
  ELSE
    -- 更新现有客户信息
    UPDATE customers 
    SET name = p_customer_info->>'name', address = p_customer_info->>'address', updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  -- 2. 生成单号
  v_sales_no := generate_sales_no();

  -- 3. 插入销售单主表
  INSERT INTO sales_orders (
    sales_no, lead_id, customer_id, designer, sales_person, 
    create_time, expected_delivery_time, status
  )
  VALUES (
    v_sales_no, 
    p_lead_id, 
    v_customer_id, 
    p_order_info->>'designer', 
    p_order_info->>'sales_person',
    (p_order_info->>'create_time')::date,
    (p_order_info->>'expected_delivery_time')::date,
    'draft'
  )
  RETURNING id INTO v_sales_order_id;

  -- 4. 插入金额表
  INSERT INTO sales_order_amounts (
    sales_order_id,
    curtain_subtotal, wallcovering_subtotal, background_wall_subtotal,
    window_cushion_subtotal, standard_product_subtotal,
    package_amount, package_excess_amount, upgrade_amount, total_amount
  )
  VALUES (
    v_sales_order_id,
    COALESCE((p_amounts->>'curtain')::numeric, 0),
    COALESCE((p_amounts->>'wallcovering')::numeric, 0),
    COALESCE((p_amounts->>'background-wall')::numeric, 0),
    COALESCE((p_amounts->>'window-cushion')::numeric, 0),
    COALESCE((p_amounts->>'standard-product')::numeric, 0),
    COALESCE((p_amounts->>'packageAmount')::numeric, 0),
    COALESCE((p_amounts->>'packageExcessAmount')::numeric, 0),
    COALESCE((p_amounts->>'upgradeAmount')::numeric, 0),
    COALESCE((p_amounts->>'totalAmount')::numeric, 0)
  );

  -- 5. 插入套餐表
  IF p_packages IS NOT NULL THEN
    FOR v_key, v_val IN SELECT * FROM jsonb_each_text(p_packages)
    LOOP
      INSERT INTO sales_order_packages (sales_order_id, space, package_id)
      VALUES (v_sales_order_id, v_key, v_val);
    END LOOP;
  END IF;

  -- 6. 插入订单项
  IF p_items IS NOT NULL THEN
    FOREACH v_item IN ARRAY p_items
    LOOP
      INSERT INTO sales_order_items (
        sales_order_id, category, space, product, image_url,
        package_tag, is_package_item, package_type,
        unit, width, height, quantity, unit_price,
        usage_amount, amount, price_difference, difference_amount, remark
      )
      VALUES (
        v_sales_order_id,
        v_item->>'category',
        v_item->>'space',
        v_item->>'product',
        v_item->>'imageUrl',
        v_item->>'packageTag',
        COALESCE((v_item->>'isPackageItem')::boolean, false),
        v_item->>'packageType',
        COALESCE(v_item->>'unit', '米'),
        COALESCE((v_item->>'width')::numeric, 0),
        COALESCE((v_item->>'height')::numeric, 0),
        COALESCE((v_item->>'quantity')::int, 1),
        COALESCE((v_item->>'unitPrice')::numeric, 0),
        COALESCE((v_item->>'usageAmount')::numeric, 0),
        COALESCE((v_item->>'amount')::numeric, 0),
        COALESCE((v_item->>'priceDifference')::numeric, 0),
        COALESCE((v_item->>'differenceAmount')::numeric, 0),
        v_item->>'remark'
      );
    END LOOP;
  END IF;

  RETURN v_sales_order_id;
END;
$$ LANGUAGE plpgsql;

-- 3. 状态变更历史触发器
CREATE OR REPLACE FUNCTION record_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO sales_order_status_history (
      sales_order_id, from_status, to_status, changed_by_user_id, created_at
    )
    VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid(), now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_status_change ON sales_orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON sales_orders
  FOR EACH ROW EXECUTE FUNCTION record_order_status_change();
