-- 同步数据库 Schema (NestJS -> Supabase)
-- 基于 20251129000002_complete_database_schema.ts

-- 1. 更新线索状态枚举
DO $$ BEGIN
    CREATE TYPE "lead_status_enum" AS ENUM ('待分配', '待跟踪', '跟踪中', '草签', '已失效');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "lead_source_enum" AS ENUM ('圣都', '自然流量', '转介绍', '其他');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 注意：如果表已有数据且类型不匹配，可能需要 USING 子句转换
-- ALTER TABLE "leads" ALTER COLUMN "status" TYPE "lead_status_enum" USING (status::"lead_status_enum");
-- ALTER TABLE "leads" ALTER COLUMN "source" TYPE "lead_source_enum" USING (source::"lead_source_enum");

-- 2. 销售单扩展字段
ALTER TABLE "sales_orders" 
ADD COLUMN IF NOT EXISTS "quote_status" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "budget_quote_file_url" TEXT,
ADD COLUMN IF NOT EXISTS "budget_quote_uploaded_at" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "push_order_screenshot_url" TEXT,
ADD COLUMN IF NOT EXISTS "push_order_uploaded_at" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "push_order_confirmed_at" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "push_order_confirmed_by_user_id" UUID,
ADD COLUMN IF NOT EXISTS "production_order_nos" JSONB,
ADD COLUMN IF NOT EXISTS "all_production_completed_at" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "designer_id" UUID,
ADD COLUMN IF NOT EXISTS "guide_id" UUID,
ADD COLUMN IF NOT EXISTS "installation_notes" TEXT,
ADD COLUMN IF NOT EXISTS "installation_photo_urls" JSONB,
ADD COLUMN IF NOT EXISTS "plan_confirmed_photo_urls" JSONB;

-- 3. 订单状态定义表
CREATE TABLE IF NOT EXISTS "order_statuses" (
    "id" SERIAL PRIMARY KEY,
    "status_code" VARCHAR(50) NOT NULL UNIQUE,
    "status_name" VARCHAR(100) NOT NULL,
    "phase" VARCHAR(50) NOT NULL,
    "sequence" INT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. 销售单状态历史表
CREATE TABLE IF NOT EXISTS "sales_order_status_history" (
    "id" SERIAL PRIMARY KEY,
    "sales_order_id" UUID NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
    "from_status" VARCHAR(50) NOT NULL,
    "to_status" VARCHAR(50) NOT NULL,
    "changed_by_user_id" UUID NOT NULL, -- 注意：这里可能需要关联到 auth.users 或 public.users
    "change_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. 积分系统
-- 注释掉：这些表在 20251203000001_points_system_complete.sql 中以完整版Schema定义
-- CREATE TABLE IF NOT EXISTS "points_accounts" (
--     "id" SERIAL PRIMARY KEY,
--     "user_id" UUID NOT NULL UNIQUE, -- 关联 auth.users
--     "balance" INT NOT NULL DEFAULT 0,
--     "pending_balance" INT NOT NULL DEFAULT 0,
--     "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
--     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
-- 
-- CREATE TABLE IF NOT EXISTS "points_transactions" (
--     "id" SERIAL PRIMARY KEY,
--     "account_id" INT NOT NULL REFERENCES "points_accounts"("id") ON DELETE CASCADE,
--     "transaction_type" VARCHAR(50) NOT NULL,
--     "amount" INT NOT NULL,
--     "description" TEXT,
--     "reference_id" UUID,
--     "reference_type" VARCHAR(50),
--     "status" VARCHAR(50) NOT NULL DEFAULT 'completed',
--     "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
-- 
-- CREATE TABLE IF NOT EXISTS "points_rules" (
--     "id" SERIAL PRIMARY KEY,
--     "rule_name" VARCHAR(100) NOT NULL,
--     "rule_type" VARCHAR(50) NOT NULL,
--     "trigger_event" VARCHAR(50) NOT NULL,
--     "points_formula" TEXT NOT NULL,
--     "is_active" BOOLEAN NOT NULL DEFAULT true,
--     "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
--     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
-- 
-- CREATE TABLE IF NOT EXISTS "points_product_categories" (
--     "id" SERIAL PRIMARY KEY,
--     "category_name" VARCHAR(100) NOT NULL,
--     "description" TEXT,
--     "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
--     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
-- 
-- CREATE TABLE IF NOT EXISTS "points_products" (
--     "id" SERIAL PRIMARY KEY,
--     "product_name" VARCHAR(100) NOT NULL,
--     "description" TEXT,
--     "points_price" INT NOT NULL,
--     "stock_quantity" INT NOT NULL DEFAULT 0,
--     "category_id" INT NOT NULL REFERENCES "points_product_categories"("id") ON DELETE CASCADE,
--     "product_image_url" TEXT,
--     "is_active" BOOLEAN NOT NULL DEFAULT true,
--     "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
--     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
-- 
-- CREATE TABLE IF NOT EXISTS "points_orders" (
--     "id" SERIAL PRIMARY KEY,
--     "user_id" UUID NOT NULL, -- 关联 auth.users
--     "total_points" INT NOT NULL,
--     "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
--     "shipping_address" TEXT,
--     "contact_phone" VARCHAR(20),
--     "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
--     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
-- 
-- CREATE TABLE IF NOT EXISTS "points_order_items" (
--     "id" SERIAL PRIMARY KEY,
--     "order_id" INT NOT NULL REFERENCES "points_orders"("id") ON DELETE CASCADE,
--     "product_id" INT NOT NULL REFERENCES "points_products"("id") ON DELETE CASCADE,
--     "product_name" VARCHAR(100) NOT NULL,
--     "points_price" INT NOT NULL,
--     "quantity" INT NOT NULL DEFAULT 1,
--     "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
-- );

-- 6. 好伙伴系统
CREATE TABLE IF NOT EXISTS "partner_profiles" (
    "id" SERIAL PRIMARY KEY,
    "partner_id" UUID NOT NULL UNIQUE, -- 关联 auth.users
    "partner_type" VARCHAR(50) NOT NULL,
    "partner_level" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "store_id" UUID,
    "store_name" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "sales_order_partners" (
    "id" SERIAL PRIMARY KEY,
    "sales_order_id" UUID NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
    "partner_id" UUID NOT NULL REFERENCES "partner_profiles"("partner_id") ON DELETE CASCADE,
    "partner_type" VARCHAR(50) NOT NULL,
    "commission_rate" NUMERIC(5,2),
    "commission_amount" NUMERIC(10,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. 初始数据插入
INSERT INTO "order_statuses" ("status_code", "status_name", "phase", "sequence") VALUES
('待分配', '待分配', '线索阶段', 1),
('待跟踪', '待跟踪', '线索阶段', 2),
('跟踪中', '跟踪中', '线索阶段', 3),
('草签', '草签', '线索阶段', 4),
('已失效', '已失效', '线索阶段', 5),
('预算中', '预算中', '订单阶段', 6),
('等待推单', '等待推单', '订单阶段', 7),
('待测量', '待测量', '订单阶段', 8),
('测量中-待分配', '测量中-待分配', '订单阶段', 9),
('测量中-分配中', '测量中-分配中', '订单阶段', 10),
('测量中-待上门', '测量中-待上门', '订单阶段', 11),
('测量中-待确认', '测量中-待确认', '订单阶段', 12),
('方案待确认', '方案待确认', '订单阶段', 13),
('待推单', '待推单', '订单阶段', 14),
('待下单', '待下单', '订单阶段', 15),
('生产中', '生产中', '订单阶段', 16),
('备货完成', '备货完成', '订单阶段', 17),
('安装中-待分配', '安装中-待分配', '订单阶段', 18),
('安装中-分配中', '安装中-分配中', '订单阶段', 19),
('安装中-待上门', '安装中-待上门', '订单阶段', 20),
('安装中-待确认', '安装中-待确认', '订单阶段', 21),
('待对账', '待对账', '订单阶段', 22),
('待回款', '待回款', '财务阶段', 23),
('已完成', '已完成', '财务阶段', 24),
('已取消', '已取消', '异常状态', 25),
('暂停', '暂停', '异常状态', 26),
('异常', '异常', '异常状态', 27)
ON CONFLICT ("status_code") DO NOTHING;

-- 注释掉：在新迁移中处理
-- INSERT INTO "points_rules" ("rule_name", "rule_type", "trigger_event", "points_formula") VALUES
-- ('线索创建奖励', '固定值', '线索创建', '5'),
-- ('线索跟进奖励', '固定值', '线索跟进', '2'),
-- ('线索转化奖励', '固定值', '线索转化', '10'),
-- ('销售单完成奖励', '固定值', '销售单完成', '30'),
-- ('好伙伴订单奖励', '公式', '好伙伴订单', '订单金额 × 品类系数 × 时间段系数 × 门店系数');
-- 
-- INSERT INTO "points_product_categories" ("category_name", "description") VALUES
-- ('家居用品', '各类家居生活用品'),
-- ('数码产品', '数码电子产品'),
-- ('礼品卡', '各类礼品卡'),
-- ('优惠券', '各类优惠券');

-- 8. 启用 RLS (Row Level Security)
ALTER TABLE "sales_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "points_accounts" ENABLE ROW LEVEL SECURITY; -- 在新迁移中处理
-- ALTER TABLE "points_transactions" ENABLE ROW LEVEL SECURITY; -- 在新迁移中处理
-- ALTER TABLE "points_orders" ENABLE ROW LEVEL SECURITY; -- 在新迁移中处理
ALTER TABLE "partner_profiles" ENABLE ROW LEVEL SECURITY;

-- 9. 创建基础 RLS 策略 (示例)

-- 注释掉：在新迁移中处理
-- -- 用户只能查看自己的积分账户
-- CREATE POLICY "Users can view own points account" ON "points_accounts"
-- FOR SELECT USING (auth.uid() = user_id);
-- 
-- -- 用户只能查看自己的积分订单
-- CREATE POLICY "Users can view own points orders" ON "points_orders"
-- FOR SELECT USING (auth.uid() = user_id);

-- 销售只能查看分配给自己的线索 (假设 leads 表有 sales_person_id 字段且关联 auth.users)
-- CREATE POLICY "Sales can view assigned leads" ON "leads"
-- FOR SELECT USING (auth.uid() = sales_person_id);
