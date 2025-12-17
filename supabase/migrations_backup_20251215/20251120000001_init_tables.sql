-- 初始化数据库表结构
-- 按照依赖顺序创建表

-- 1. 用户表
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone" varchar(20) NOT NULL UNIQUE,
  "name" varchar(100) NOT NULL,
  "avatar_url" varchar(255) NULL,
  "role" varchar(20) NOT NULL DEFAULT 'user',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "auth_user_id" uuid NULL UNIQUE
);

-- 2. 团队表
CREATE TABLE IF NOT EXISTS "teams" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(100) NOT NULL,
  "description" text NULL,
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- 3. 团队成员表
CREATE TABLE IF NOT EXISTS "team_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" varchar(20) NOT NULL DEFAULT 'member',
  "joined_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("team_id", "user_id")
);

-- 4. 幻灯片表
CREATE TABLE IF NOT EXISTS "slides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" varchar(255) NOT NULL,
  "description" text NULL,
  "content" jsonb NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'draft',
  "is_public" boolean NOT NULL DEFAULT false,
  "thumbnail_url" varchar(255) NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 5. 幻灯片元素表
CREATE TABLE IF NOT EXISTS "slide_elements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slide_id" uuid NOT NULL REFERENCES "slides"("id") ON DELETE CASCADE,
  "element_type" varchar(20) NOT NULL,
  "properties" jsonb NOT NULL,
  "position_x" numeric NOT NULL,
  "position_y" numeric NOT NULL,
  "width" numeric NOT NULL,
  "height" numeric NOT NULL,
  "z_index" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- 6. 协作表
CREATE TABLE IF NOT EXISTS "collaborations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slide_id" uuid NOT NULL REFERENCES "slides"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "permission" varchar(20) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("slide_id", "user_id")
);

-- 7. 线索表
CREATE TABLE IF NOT EXISTS "leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(100) NOT NULL,
  "phone" varchar(20) NOT NULL,
  "email" varchar(100) NULL,
  "source" varchar(50) NOT NULL,
  "status" varchar(50) NOT NULL,
  "assigned_to_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
  "created_by_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 8. 线索跟进表
CREATE TABLE IF NOT EXISTS "lead_follow_ups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "follow_up_date" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 9. 线索分配表
CREATE TABLE IF NOT EXISTS "lead_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "assigned_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "assigned_at" timestamptz NOT NULL DEFAULT now()
);

-- 10. 产品表
CREATE TABLE IF NOT EXISTS "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(255) NOT NULL,
  "description" text NULL,
  "price" numeric NOT NULL,
  "category" varchar(50) NOT NULL,
  "status" varchar(20) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 11. 订单表
CREATE TABLE IF NOT EXISTS "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sales_no" varchar(50) NOT NULL UNIQUE,
  "customer_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "sales_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "total_amount" numeric NOT NULL,
  "status" varchar(50) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 12. 订单项表
CREATE TABLE IF NOT EXISTS "order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL,
  "quantity" integer NOT NULL,
  "unit_price" numeric NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 13. 订单状态日志表
CREATE TABLE IF NOT EXISTS "order_status_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "status" varchar(50) NOT NULL,
  "changed_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "changed_at" timestamptz NOT NULL DEFAULT now(),
  "comment" text NULL
);

-- 14. 积分账户表
CREATE TABLE IF NOT EXISTS "point_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "balance" numeric NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("user_id")
);

-- 15. 积分交易表
CREATE TABLE IF NOT EXISTS "point_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "amount" numeric NOT NULL,
  "type" varchar(50) NOT NULL,
  "description" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- 16. 积分产品表
CREATE TABLE IF NOT EXISTS "point_products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(255) NOT NULL,
  "description" text NULL,
  "price" numeric NOT NULL,
  "stock" integer NOT NULL,
  "status" varchar(20) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 17. 积分兑换表
CREATE TABLE IF NOT EXISTS "point_exchanges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "point_products"("id") ON DELETE CASCADE,
  "quantity" integer NOT NULL,
  "total_points" numeric NOT NULL,
  "status" varchar(50) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 18. 分析缓存表
CREATE TABLE IF NOT EXISTS "analytics_cache" (
  "id" serial PRIMARY KEY,
  "cache_key" varchar(255) NOT NULL UNIQUE,
  "cache_type" varchar(50) NOT NULL,
  "cache_data" text NOT NULL,
  "date_range" varchar(50) NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_id ON "leads"("assigned_to_id");
CREATE INDEX IF NOT EXISTS idx_leads_created_by_id ON "leads"("created_by_id");
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON "orders"("customer_id");
CREATE INDEX IF NOT EXISTS idx_orders_sales_id ON "orders"("sales_id");
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON "order_items"("order_id");
CREATE INDEX IF NOT EXISTS idx_point_accounts_user_id ON "point_accounts"("user_id");
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON "point_transactions"("user_id");
CREATE INDEX IF NOT EXISTS idx_point_exchanges_user_id ON "point_exchanges"("user_id");
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires_at ON "analytics_cache"("expires_at");
