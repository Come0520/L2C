-- 添加优化索引

-- 1. 线索表索引优化
-- 用于状态筛选和时间排序的复合索引
CREATE INDEX IF NOT EXISTS idx_leads_status_created_at 
ON "leads"("status", "created_at" DESC);

-- 用于名称和手机号搜索的复合索引
CREATE INDEX IF NOT EXISTS idx_leads_name_phone 
ON "leads"("name", "phone");

-- 2. 订单表索引优化
-- 用于状态筛选和时间排序的复合索引
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at 
ON "orders"("status", "created_at" DESC);

-- 3. 订单项表索引优化
-- 用于快速查找订单的所有订单项
CREATE INDEX IF NOT EXISTS idx_order_items_order_id_product_id 
ON "order_items"("order_id", "product_id");

-- 4. 线索跟进记录表索引优化
-- 用于快速查找线索的所有跟进记录
CREATE INDEX IF NOT EXISTS idx_lead_follow_ups_lead_id_created_at 
ON "lead_follow_ups"("lead_id", "created_at" DESC);

-- 5. 产品表索引优化
-- 用于分类筛选和状态查询
CREATE INDEX IF NOT EXISTS idx_products_category_status 
ON "products"("category", "status");
