-- 启用实时订阅所需的 REPLICA IDENTITY FULL
-- 这确保了更新和删除事件包含完整的旧数据，以便前端可以正确处理

-- 启用 sales_orders 表的 REPLICA IDENTITY FULL
ALTER TABLE sales_orders REPLICA IDENTITY FULL;

-- 启用 quotes 表的 REPLICA IDENTITY FULL
ALTER TABLE quotes REPLICA IDENTITY FULL;

-- 启用相关联的子表的 REPLICA IDENTITY FULL，确保完整的数据变更跟踪
ALTER TABLE quote_items REPLICA IDENTITY FULL;
ALTER TABLE quote_versions REPLICA IDENTITY FULL;
