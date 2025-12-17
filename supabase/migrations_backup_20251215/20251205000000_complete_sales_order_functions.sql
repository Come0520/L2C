-- 完善销售订单相关函数
-- 2025-12-05

-- 创建系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. 更新销售订单状态函数
CREATE OR REPLACE FUNCTION update_sales_order_status(
    p_order_id UUID,
    p_new_status TEXT,
    p_changed_by TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE sales_orders
    SET
        status = p_new_status,
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- 检查是否更新成功
    IF NOT FOUND THEN
        RAISE EXCEPTION '销售订单不存在: %', p_order_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. 完整更新销售订单函数（包括订单项）
CREATE OR REPLACE FUNCTION full_update_sales_order(
    p_order_id UUID,
    p_customer_info JSONB,
    p_order_info JSONB,
    p_amounts JSONB,
    p_items JSONB[]
) RETURNS VOID AS $$
DECLARE
    v_customer_id UUID;
    v_item JSONB;
BEGIN
    -- 检查销售订单是否存在
    IF NOT EXISTS (SELECT 1 FROM sales_orders WHERE id = p_order_id) THEN
        RAISE EXCEPTION '销售订单不存在: %', p_order_id;
    END IF;
    
    -- 1. 更新客户信息
    SELECT id INTO v_customer_id FROM customers WHERE phone = p_customer_info->>'phone';
    
    IF v_customer_id IS NOT NULL THEN
        UPDATE customers 
        SET name = p_customer_info->>'name', address = p_customer_info->>'address', updated_at = now()
        WHERE id = v_customer_id;
    END IF;
    
    -- 2. 更新销售订单主表
    UPDATE sales_orders
    SET
        designer = p_order_info->>'designer',
        sales_person = p_order_info->>'sales_person',
        expected_delivery_time = (p_order_info->>'expected_delivery_time')::date,
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- 3. 更新金额表
    UPDATE sales_order_amounts
    SET
        curtain_subtotal = COALESCE((p_amounts->>'curtain')::numeric, 0),
        wallcovering_subtotal = COALESCE((p_amounts->>'wallcovering')::numeric, 0),
        background_wall_subtotal = COALESCE((p_amounts->>'background-wall')::numeric, 0),
        window_cushion_subtotal = COALESCE((p_amounts->>'window-cushion')::numeric, 0),
        standard_product_subtotal = COALESCE((p_amounts->>'standard-product')::numeric, 0),
        package_amount = COALESCE((p_amounts->>'packageAmount')::numeric, 0),
        package_excess_amount = COALESCE((p_amounts->>'packageExcessAmount')::numeric, 0),
        upgrade_amount = COALESCE((p_amounts->>'upgradeAmount')::numeric, 0),
        total_amount = COALESCE((p_amounts->>'totalAmount')::numeric, 0),
        updated_at = NOW()
    WHERE sales_order_id = p_order_id;
    
    -- 4. 删除现有订单项
    DELETE FROM sales_order_items WHERE sales_order_id = p_order_id;
    
    -- 5. 插入新订单项
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
                p_order_id,
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
END;
$$ LANGUAGE plpgsql;

-- 3. 删除销售订单函数（级联删除相关数据）
CREATE OR REPLACE FUNCTION delete_sales_order(
    p_order_id UUID
) RETURNS VOID AS $$
BEGIN
    -- 检查销售订单是否存在
    IF NOT EXISTS (SELECT 1 FROM sales_orders WHERE id = p_order_id) THEN
        RAISE EXCEPTION '销售订单不存在: %', p_order_id;
    END IF;
    
    -- 删除相关数据（级联）
    DELETE FROM sales_order_packages WHERE sales_order_id = p_order_id;
    DELETE FROM sales_order_items WHERE sales_order_id = p_order_id;
    DELETE FROM sales_order_amounts WHERE sales_order_id = p_order_id;
    
    -- 删除销售订单主表
    DELETE FROM sales_orders WHERE id = p_order_id;
    
    -- 记录日志
    INSERT INTO system_logs (event_type, description, created_at)
    VALUES ('sales_order_deleted', '销售订单已删除: ' || p_order_id::text, NOW());
END;
$$ LANGUAGE plpgsql;

-- 4. 批量更新销售订单状态函数
CREATE OR REPLACE FUNCTION batch_update_sales_order_status(
    p_order_ids UUID[],
    p_new_status TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
    v_order_id UUID;
    v_missing_orders TEXT := '';
BEGIN
    -- 检查所有订单是否存在
    FOREACH v_order_id IN ARRAY p_order_ids
    LOOP
        IF NOT EXISTS (SELECT 1 FROM sales_orders WHERE id = v_order_id) THEN
            v_missing_orders := v_missing_orders || v_order_id::text || ', ';
        END IF;
    END LOOP;
    
    IF v_missing_orders != '' THEN
        RAISE EXCEPTION '以下销售订单不存在: %', LEFT(v_missing_orders, LENGTH(v_missing_orders) - 2);
    END IF;
    
    UPDATE sales_orders
    SET
        status = p_new_status,
        updated_at = NOW()
    WHERE id = ANY(p_order_ids);
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- 5. 获取销售订单状态历史函数
DROP FUNCTION IF EXISTS get_sales_order_status_history(UUID);
CREATE OR REPLACE FUNCTION get_sales_order_status_history(
    p_order_id UUID
) RETURNS TABLE (
    from_status TEXT,
    to_status TEXT,
    changed_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        soh.from_status,
        soh.to_status,
        soh.changed_by_user_id,
        soh.created_at
    FROM sales_order_status_history soh
    WHERE soh.sales_order_id = p_order_id
    ORDER BY soh.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. 更新销售订单金额函数
CREATE OR REPLACE FUNCTION update_sales_order_amounts(
    p_order_id UUID,
    p_amounts JSONB
) RETURNS VOID AS $$
BEGIN
    UPDATE sales_order_amounts
    SET
        curtain_subtotal = COALESCE((p_amounts->>'curtain')::numeric, curtain_subtotal),
        wallcovering_subtotal = COALESCE((p_amounts->>'wallcovering')::numeric, wallcovering_subtotal),
        background_wall_subtotal = COALESCE((p_amounts->>'background-wall')::numeric, background_wall_subtotal),
        window_cushion_subtotal = COALESCE((p_amounts->>'window-cushion')::numeric, window_cushion_subtotal),
        standard_product_subtotal = COALESCE((p_amounts->>'standard-product')::numeric, standard_product_subtotal),
        package_amount = COALESCE((p_amounts->>'packageAmount')::numeric, package_amount),
        package_excess_amount = COALESCE((p_amounts->>'packageExcessAmount')::numeric, package_excess_amount),
        upgrade_amount = COALESCE((p_amounts->>'upgradeAmount')::numeric, upgrade_amount),
        total_amount = COALESCE((p_amounts->>'totalAmount')::numeric, total_amount),
        updated_at = NOW()
    WHERE sales_order_id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- 7. 添加销售订单日志函数
CREATE OR REPLACE FUNCTION add_sales_order_log(
    p_order_id UUID,
    p_action TEXT,
    p_details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO sales_order_logs (
        sales_order_id,
        action,
        details,
        created_at
    ) VALUES (
        p_order_id,
        p_action,
        p_details,
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- 8. 获取销售订单详情函数
CREATE OR REPLACE FUNCTION get_sales_order_details(
    p_order_id UUID
) RETURNS TABLE (
    id UUID,
    sales_no TEXT,
    lead_id UUID,
    customer_id UUID,
    designer TEXT,
    sales_person TEXT,
    status TEXT,
    create_time DATE,
    expected_delivery_time DATE,
    project_address TEXT,
    amounts JSONB,
    items JSONB[],
    packages JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        so.id,
        so.sales_no,
        so.lead_id,
        so.customer_id,
        so.designer,
        so.sales_person,
        so.status,
        so.create_time,
        so.expected_delivery_time,
        so.project_address,
        jsonb_build_object(
            'curtain_subtotal', soa.curtain_subtotal,
            'wallcovering_subtotal', soa.wallcovering_subtotal,
            'background_wall_subtotal', soa.background_wall_subtotal,
            'window_cushion_subtotal', soa.window_cushion_subtotal,
            'standard_product_subtotal', soa.standard_product_subtotal,
            'package_amount', soa.package_amount,
            'package_excess_amount', soa.package_excess_amount,
            'upgrade_amount', soa.upgrade_amount,
            'total_amount', soa.total_amount
        ) AS amounts,
        (SELECT array_agg(
            jsonb_build_object(
                'id', soi.id,
                'category', soi.category,
                'space', soi.space,
                'product', soi.product,
                'image_url', soi.image_url,
                'package_tag', soi.package_tag,
                'is_package_item', soi.is_package_item,
                'package_type', soi.package_type,
                'unit', soi.unit,
                'width', soi.width,
                'height', soi.height,
                'quantity', soi.quantity,
                'unit_price', soi.unit_price,
                'usage_amount', soi.usage_amount,
                'amount', soi.amount,
                'price_difference', soi.price_difference,
                'difference_amount', soi.difference_amount,
                'remark', soi.remark
            )
        ) FROM sales_order_items soi WHERE soi.sales_order_id = so.id) AS items,
        (SELECT jsonb_object_agg(sop.space, sop.package_id) 
         FROM sales_order_packages sop 
         WHERE sop.sales_order_id = so.id) AS packages
    FROM sales_orders so
    LEFT JOIN sales_order_amounts soa ON so.id = soa.sales_order_id
    WHERE so.id = p_order_id;
END;
$$ LANGUAGE plpgsql;