# 数据库架构变更建议书 (Schema Design RFC)

基于最新的业务工作流设计 (`business_flows.md` 和 `订单_采购全流程详解.md`)，现有的数据库 Schema 需要进行以下调整以支持 **智能拆单**、**双轨采购**、**多场景测量** 等核心特性。

## 1. 核心变更概览

| 模块 | 变更类型 | 说明 |
|:---|:---|:---|
| **线索 (Leads)** | 字段新增 | 增加 `decoration_progress` 用于智能跟进推荐 |
| **订单 (Orders)** | 字段新增 | 增加 `settlement_type` (月结/现结/预收) |
| **采购 (PO)** | 类型枚举改造 | `type` 字段改造为 ENUM (FINISHED, FABRIC, STOCK) |
| **加工 (Processing)** | **新增表** | 新增 `work_orders` 和 `work_order_items` 表 (面料加工路线) |
| **测量 (Measure)** | 字段新增 | 增加 `measurement_type` (方案验证/盲测/自测) |

## 2. 详细 Schema 变更

### 2.1 枚举类型定义 (Enums)

```sql
-- [NEW] 装修进度
CREATE TYPE decoration_progress AS ENUM (
  'WATER_ELECTRIC',    -- 水电
  'MUD_WOOD',          -- 泥木
  'INSTALLATION',      -- 安装
  'PAINTING',          -- 油漆
  'COMPLETED'          -- 完工
);

-- [NEW] 订单结算方式
CREATE TYPE order_settlement_type AS ENUM (
  'PREPAID',           -- 预收
  'CREDIT',            -- 月结
  'CASH'               -- 现结
);

-- [MODIFY] 采购单类型
-- 原: VARCHAR, 新: ENUM
CREATE TYPE po_type AS ENUM (
  'FINISHED',          -- 成品采购
  'FABRIC',            -- 面料采购
  'STOCK'              -- 内部备货
);

-- [NEW] 加工单状态
CREATE TYPE work_order_status AS ENUM (
  'PENDING',           -- 待加工 (面料未入库)
  'PROCESSING',        -- 加工中
  'COMPLETED',         -- 已完成
  'CANCELLED'          -- 已取消
);

-- [NEW] 测量类型
CREATE TYPE measure_type AS ENUM (
  'QUOTE_BASED',       -- 方案验证
  'BLIND',             -- 盲测
  'SALES_SELF'         -- 销售自测
);
```

### 2.2 表结构变更 (Table Alterations)

#### leads (线索)
```sql
ALTER TABLE leads 
  ADD COLUMN decoration_progress decoration_progress,
  ADD COLUMN next_follow_up_recommendation TIMESTAMPTZ; -- 系统推荐跟进时间
```

#### orders (订单)
```sql
ALTER TABLE orders 
  ADD COLUMN settlement_type order_settlement_type DEFAULT 'CASH'; 
-- confirmation_img 已存在
```

#### purchase_orders (采购单)
```sql
-- 修改 type 列类型
ALTER TABLE purchase_orders 
  DROP COLUMN type,
  ADD COLUMN type po_type DEFAULT 'FINISHED'; 
```

#### measure_tasks (测量任务)
```sql
ALTER TABLE measure_tasks
  ADD COLUMN type measure_type DEFAULT 'BLIND';
```

### 2.3 新增表结构 (New Tables)

#### work_orders (加工单)
用于 "面料+加工" 路线，在面料入库后生成。

```sql
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  wo_no VARCHAR(50) UNIQUE NOT NULL,         -- WO20260101001
  order_id UUID REFERENCES orders(id) NOT NULL,
  po_id UUID REFERENCES purchase_orders(id) NOT NULL, -- 关联的面料采购单
  supplier_id UUID REFERENCES suppliers(id) NOT NULL, -- 加工厂
  status work_order_status DEFAULT 'PENDING',
  start_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  remark TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_work_orders_order ON work_orders(order_id);
CREATE INDEX idx_work_orders_po ON work_orders(po_id);
```

#### work_order_items (加工明细)

```sql
CREATE TABLE work_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID REFERENCES work_orders(id) NOT NULL,
  order_item_id UUID REFERENCES order_items(id) NOT NULL, -- 关联原始订单项(成品窗帘)
  -- 这里的 product 是成品窗帘，但加工消耗的是面料
  -- 实际业务中，加工单可能需要列出“消耗面料”和“产出成品”。
  -- 简化模型：加工单Item对应订单Item(窗帘)，状态流转。
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. 关联影响分析

1.  **智能拆单引擎**:
    *   代码需适配新的 `po_type`。
    *   拆单逻辑需新增：当创建 `FABRIC` 类型的 PO 时，后续需自动预生成 `work_orders` 记录（或在入库时生成）。建议在面料入库 (`STOCKED`) 事件触发时生成加工单。

2.  **状态聚合 (木桶效应)**:
    *   订单状态机需监听 `work_orders` 的状态变化。
    *   `Order.status = PENDING_DELIVERY` 的条件变为: `All(PO.status == READY) AND All(WO.status == COMPLETED)`.

3.  **测量服务**:
    *   前端需根据 `measure_tasks.type` 渲染不同表单 (Checklist vs Blank Sheet)。
