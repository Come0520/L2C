-- Fix update_order function signature to accept TEXT for UUIDs
CREATE OR REPLACE FUNCTION update_order(
    p_order_id TEXT,
    order_data JSONB
) RETURNS VOID AS $$
DECLARE
    v_order_uuid UUID;
BEGIN
    v_order_uuid := p_order_id::UUID;
    
    UPDATE sales_orders
    SET
        project_address = COALESCE(order_data->>'projectAddress', project_address),
        designer_name = COALESCE(order_data->>'designer', designer_name),
        sales_person_name = COALESCE(order_data->>'salesPerson', sales_person_name),
        expected_delivery_time = COALESCE((order_data->>'expectedDeliveryTime')::TIMESTAMP WITH TIME ZONE, expected_delivery_time),
        updated_at = NOW()
    WHERE id = v_order_uuid;
    
    -- Update amounts if present
    IF order_data->'subtotals' IS NOT NULL THEN
        UPDATE sales_order_amounts
        SET
            total_amount = (order_data->>'totalAmount')::DECIMAL
        WHERE sales_order_id = v_order_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql;
