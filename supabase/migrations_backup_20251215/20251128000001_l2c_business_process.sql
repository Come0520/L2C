-- L2C业务流程表迁移
-- 创建时间：2025-11-28

-- 1. 客户表
CREATE TABLE IF NOT EXISTS "customers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(100) NOT NULL,
  "phone" varchar(20) NOT NULL,
  "address" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 2. 销售单表
CREATE TABLE IF NOT EXISTS "sales_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sales_no" varchar(50) NOT NULL UNIQUE,
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
  "designer" varchar(100) NULL,
  "sales_person" varchar(100) NULL,
  "create_time" date NOT NULL,
  "expected_delivery_time" date NULL,
  "status" varchar(20) NOT NULL DEFAULT 'draft',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 3. 销售单金额表
CREATE TABLE IF NOT EXISTS "sales_order_amounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sales_order_id" uuid NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
  "curtain_subtotal" numeric NOT NULL DEFAULT 0,
  "wallcovering_subtotal" numeric NOT NULL DEFAULT 0,
  "background_wall_subtotal" numeric NOT NULL DEFAULT 0,
  "window_cushion_subtotal" numeric NOT NULL DEFAULT 0,
  "standard_product_subtotal" numeric NOT NULL DEFAULT 0,
  "package_amount" numeric NOT NULL DEFAULT 0,
  "package_excess_amount" numeric NOT NULL DEFAULT 0,
  "upgrade_amount" numeric NOT NULL DEFAULT 0,
  "total_amount" numeric NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("sales_order_id")
);

-- 4. 销售单空间套餐表
CREATE TABLE IF NOT EXISTS "sales_order_packages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sales_order_id" uuid NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
  "space" varchar(50) NOT NULL,
  "package_id" varchar(50) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("sales_order_id", "space")
);

-- 5. 销售单项表
CREATE TABLE IF NOT EXISTS "sales_order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sales_order_id" uuid NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
  "category" varchar(50) NOT NULL,
  "space" varchar(50) NOT NULL,
  "product" varchar(255) NOT NULL,
  "image_url" varchar(255) NULL,
  "package_tag" varchar(50) NULL,
  "is_package_item" boolean NOT NULL DEFAULT false,
  "package_type" varchar(20) NULL,
  "unit" varchar(20) NOT NULL DEFAULT '米',
  "width" numeric NOT NULL DEFAULT 0,
  "height" numeric NOT NULL DEFAULT 0,
  "quantity" integer NOT NULL DEFAULT 1,
  "unit_price" numeric NOT NULL DEFAULT 0,
  "usage_amount" numeric NOT NULL DEFAULT 0,
  "amount" numeric NOT NULL DEFAULT 0,
  "price_difference" numeric NOT NULL DEFAULT 0,
  "difference_amount" numeric NOT NULL DEFAULT 0,
  "remark" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 6. 套餐定义表
CREATE TABLE IF NOT EXISTS "packages" (
  "id" varchar(50) PRIMARY KEY,
  "name" varchar(100) NOT NULL,
  "price" numeric NOT NULL DEFAULT 0,
  "description" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 7. 套餐项表
CREATE TABLE IF NOT EXISTS "package_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "package_id" varchar(50) NOT NULL REFERENCES "packages"("id") ON DELETE CASCADE,
  "type" varchar(20) NOT NULL,
  "quota" numeric NOT NULL DEFAULT 0,
  "base_price" numeric NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 8. 测量单表
CREATE TABLE IF NOT EXISTS "measurement_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "measurement_no" varchar(50) NOT NULL UNIQUE,
  "sales_order_id" uuid NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
  "measurer_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "scheduled_date" date NULL,
  "actual_date" date NULL,
  "measurement_data" jsonb NULL,
  "remark" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 9. 安装单表
CREATE TABLE IF NOT EXISTS "installation_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "installation_no" varchar(50) NOT NULL UNIQUE,
  "sales_order_id" uuid NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
  "installer_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "scheduled_date" date NULL,
  "actual_date" date NULL,
  "installation_data" jsonb NULL,
  "remark" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 10. 对账单表
CREATE TABLE IF NOT EXISTS "reconciliation_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "reconciliation_no" varchar(50) NOT NULL UNIQUE,
  "sales_order_id" uuid NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "total_amount" numeric NOT NULL DEFAULT 0,
  "paid_amount" numeric NOT NULL DEFAULT 0,
  "balance_amount" numeric NOT NULL DEFAULT 0,
  "invoice_no" varchar(50) NULL,
  "remark" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- 11. 初始数据：K3套餐
INSERT INTO "packages" ("id", "name", "price", "description") VALUES
('k3', 'K3套餐', 3900, '包含24米布料、24米纱料、24米轨道')
ON CONFLICT ("id") DO NOTHING;

-- 12. 初始数据：K3套餐项
INSERT INTO "package_items" ("package_id", "type", "quota", "base_price") VALUES
('k3', 'cloth', 24, 180),
('k3', 'gauze', 24, 100),
('k3', 'track', 24, 50)
ON CONFLICT DO NOTHING;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sales_orders_lead_id ON "sales_orders"("lead_id");
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON "sales_orders"("customer_id");
CREATE INDEX IF NOT EXISTS idx_sales_order_items_sales_order_id ON "sales_order_items"("sales_order_id");
CREATE INDEX IF NOT EXISTS idx_sales_order_items_category ON "sales_order_items"("category");
CREATE INDEX IF NOT EXISTS idx_sales_order_packages_sales_order_id ON "sales_order_packages"("sales_order_id");
CREATE INDEX IF NOT EXISTS idx_measurement_orders_sales_order_id ON "measurement_orders"("sales_order_id");
CREATE INDEX IF NOT EXISTS idx_installation_orders_sales_order_id ON "installation_orders"("sales_order_id");
CREATE INDEX IF NOT EXISTS idx_reconciliation_orders_sales_order_id ON "reconciliation_orders"("sales_order_id");
