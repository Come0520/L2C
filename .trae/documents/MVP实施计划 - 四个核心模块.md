# 基于前端表单的数据库表设计

## 一、前端表单分析

### 1. 核心表单数据结构
- **OrderFormData**：包含客户信息、订单信息、套餐信息、商品列表和金额汇总
- **商品项**：窗帘、墙布、背景墙、飘窗垫、标品，均继承自CurtainItem
- **套餐信息**：按空间配置，包含基础金额、超出金额和升级金额

### 2. 关键字段映射
| 前端字段 | 数据库表 | 说明 |
|----------|----------|------|
| leadId, leadNumber | leads | 线索关联 |
| customerName, customerPhone, projectAddress | customers | 客户信息 |
| designer, salesPerson, createTime, expectedDeliveryTime | sales_orders | 订单信息 |
| spacePackages | sales_order_packages | 空间套餐配置 |
| curtains, wallcoverings, etc. | sales_order_items | 商品列表，通过category字段区分 |
| subtotals, packageAmount, etc. | sales_order_amounts | 金额汇总 |

## 二、数据库表设计

### 1. 客户表（customers）
```sql
CREATE TABLE IF NOT EXISTS "customers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(100) NOT NULL,
  "phone" varchar(20) NOT NULL,
  "address" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
```

### 2. 销售单表（sales_orders）
```sql
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
```

### 3. 销售单金额表（sales_order_amounts）
```sql
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
```

### 4. 销售单空间套餐表（sales_order_packages）
```sql
CREATE TABLE IF NOT EXISTS "sales_order_packages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sales_order_id" uuid NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
  "space" varchar(50) NOT NULL,
  "package_id" varchar(50) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("sales_order_id", "space")
);
```

### 5. 销售单项表（sales_order_items）
```sql
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
```

### 6. 套餐定义表（packages）
```sql
CREATE TABLE IF NOT EXISTS "packages" (
  "id" varchar(50) PRIMARY KEY,
  "name" varchar(100) NOT NULL,
  "price" numeric NOT NULL DEFAULT 0,
  "description" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
```

### 7. 套餐项表（package_items）
```sql
CREATE TABLE IF NOT EXISTS "package_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "package_id" varchar(50) NOT NULL REFERENCES "packages"("id") ON DELETE CASCADE,
  "type" varchar(20) NOT NULL,
  "quota" numeric NOT NULL DEFAULT 0,
  "base_price" numeric NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
```

### 8. 测量单表（measurement_orders）
```sql
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
```

### 9. 安装单表（installation_orders）
```sql
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
```

### 10. 对账单表（reconciliation_orders）
```sql
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
```

## 三、表关系图

```
┌─────────────┐     ┌─────────────┐
│   leads     │────▶│ customers   │
└─────────────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│ sales_orders│────▶│sales_order_ │
└─────────────┘     │  amounts    │
       │            └─────────────┘
       ├─────────────────┐
       ▼                 ▼
┌─────────────┐     ┌─────────────┐
│sales_order_ │     │sales_order_ │
│  packages   │     │   items     │
└─────────────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  packages   │────▶│ package_    │
└─────────────┘     │   items     │
                    └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ sales_orders│────▶│measurement_ │     │installation_│
└─────────────┘     │  orders     │     │  orders     │
       │            └─────────────┘     └─────────────┘
       ▼
┌─────────────┐
│reconciliation_│
│  orders     │
└─────────────┘
```

## 四、前端字段与数据库字段映射表

### 1. OrderFormData 映射
| 前端字段 | 数据库表 | 数据库字段 |
|----------|----------|------------|
| leadId | sales_orders | lead_id |
| leadNumber | leads | id (通过关联获取) |
| customerName | customers | name |
| customerPhone | customers | phone |
| projectAddress | customers | address |
| designer | sales_orders | designer |
| salesPerson | sales_orders | sales_person |
| createTime | sales_orders | create_time |
| expectedDeliveryTime | sales_orders | expected_delivery_time |
| spacePackages | sales_order_packages | space + package_id |
| curtains | sales_order_items | category='curtain' |
| wallcoverings | sales_order_items | category='wallcovering' |
| backgroundWalls | sales_order_items | category='background-wall' |
| windowCushions | sales_order_items | category='window-cushion' |
| standardProducts | sales_order_items | category='standard-product' |
| subtotals.curtain | sales_order_amounts | curtain_subtotal |
| subtotals.wallcovering | sales_order_amounts | wallcovering_subtotal |
| subtotals.background-wall | sales_order_amounts | background_wall_subtotal |
| subtotals.window-cushion | sales_order_amounts | window_cushion_subtotal |
| subtotals.standard-product | sales_order_amounts | standard_product_subtotal |
| packageAmount | sales_order_amounts | package_amount |
| packageExcessAmount | sales_order_amounts | package_excess_amount |
| upgradeAmount | sales_order_amounts | upgrade_amount |
| totalAmount | sales_order_amounts | total_amount |

### 2. CurtainItem 映射
| 前端字段 | 数据库表 | 数据库字段 |
|----------|----------|------------|
| id | sales_order_items | id |
| space | sales_order_items | space |
| product | sales_order_items | product |
| imageUrl | sales_order_items | image_url |
| packageTag | sales_order_items | package_tag |
| isPackageItem | sales_order_items | is_package_item |
| packageType | sales_order_items | package_type |
| unit | sales_order_items | unit |
| width | sales_order_items | width |
| height | sales_order_items | height |
| quantity | sales_order_items | quantity |
| unitPrice | sales_order_items | unit_price |
| usageAmount | sales_order_items | usage_amount |
| amount | sales_order_items | amount |
| priceDifference | sales_order_items | price_difference |
| differenceAmount | sales_order_items | difference_amount |
| remark | sales_order_items | remark |

## 五、索引设计

### 1. 核心索引
| 表名 | 索引字段 | 用途 |
|------|----------|------|
| sales_orders | lead_id, customer_id | 加速订单查询 |
| sales_order_items | sales_order_id, category | 加速商品列表查询 |
| sales_order_packages | sales_order_id, space | 加速空间套餐查询 |
| sales_order_amounts | sales_order_id | 加速金额汇总查询 |
| measurement_orders | sales_order_id, status | 加速测量单查询 |
| installation_orders | sales_order_id, status | 加速安装单查询 |
| reconciliation_orders | sales_order_id, status | 加速对账单查询 |

## 六、数据迁移策略

### 1. 初始数据导入
- 导入套餐数据（如K3套餐）
- 导入空间选项数据
- 导入商品类别数据

### 2. 现有数据迁移
- 将现有订单数据迁移到sales_orders表
- 将现有订单项数据迁移到sales_order_items表
- 重新计算金额汇总数据

## 七、API设计建议

### 1. 销售单相关API
- `POST /api/sales-orders`：创建销售单
- `GET /api/sales-orders/:id`：获取销售单详情
- `PUT /api/sales-orders/:id`：更新销售单
- `POST /api/sales-orders/:id/items`：添加销售单项
- `PUT /api/sales-orders/:id/items/:itemId`：更新销售单项
- `DELETE /api/sales-orders/:id/items/:itemId`：删除销售单项

### 2. 套餐相关API
- `GET /api/packages`：获取所有套餐
- `GET /api/packages/:id`：获取套餐详情

### 3. 测量和安装相关API
- `POST /api/measurement-orders`：创建测量单
- `POST /api/installation-orders`：创建安装单

## 八、性能优化建议

### 1. 读写分离
- 销售单创建和更新操作使用主库
- 销售单查询和统计使用从库

### 2. 缓存策略
- 缓存套餐定义数据
- 缓存销售单金额汇总
- 缓存常用的商品列表

### 3. 批量操作
- 销售单项的批量添加和更新
- 金额汇总的批量计算

## 九、扩展性考虑

### 1. 商品类别扩展
- 通过category字段支持新的商品类别
- 无需修改表结构，只需在前端添加新的类别选项

### 2. 套餐类型扩展
- 支持不同类型的套餐（如按房间、按面积）
- 通过package_items表的type字段区分

### 3. 业务流程扩展
- 支持自定义的订单状态流转
- 支持不同产品类型的特殊处理逻辑

通过以上设计，数据库表结构与前端表单高度匹配，能够准确存储和查询业务数据，同时保持了良好的扩展性和性能。