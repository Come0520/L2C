-- 清理遗留数据表
-- 创建时间: 2025-12-12
-- 描述: 删除不再使用的 point_products 和 point_exchanges 表，这些功能已被 mall_products 和 mall_orders 替代

-- 1. 删除 point_exchanges 表 (存在外键依赖，先删除)
DROP TABLE IF EXISTS "public"."point_exchanges";

-- 2. 删除 point_products 表
DROP TABLE IF EXISTS "public"."point_products";

-- 3. 确认清理完成
-- 如果有相关的 RLS 策略或索引，它们通常会随表一起删除，但为了保险起见，可以显式清理（此处不需要，因为 DROP TABLE CASCADE 会自动处理，但为了安全使用普通 DROP）

COMMENT ON TABLE "public"."mall_products" IS '积分商城商品表 (已替代 point_products)';
COMMENT ON TABLE "public"."mall_orders" IS '积分商城兑换订单表 (已替代 point_exchanges)';
