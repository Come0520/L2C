# 采购模块架构设计 (Purchase Order Module Architecture Design)

**日期**: 2026-01-14
**状态**: 已确认 (Validated)
**相关需求**: [采购单模块需求](./采购单.md)

## 1. 设计概述

本文档记录了采购单 (Purchase Order) 模块的核心技术架构决策。作为连接订单和供应链的关键模块，采购模块必须确保供应商履约的可视化、成本数据的保密性以及库存的自动化联动。

## 2. 核心架构决策

### 2.1 物流跟踪自动化
*   **策略**: **API 对接 (Automatic Logistics Tracking)**
    *   **机制**: 系统对接主流物流公司 API（顺丰、德邦、中通等），每日自动查询所有“已发货”采购单的物流状态。
    *   **自动流转**: 当物流 API 返回“已签收”状态时，系统自动将采购单状态更新为“已到货”，并触发订单状态流转。
    *   **目的**: 实现物流信息的实时同步，无需人工干预。
    *   **价值**: 提升销售和客户的体验，在系统内即可查看物流进度，无需跳转第三方平台。

### 2.2 成本价可见性控制
*   **策略**: **分级可见 (Role-Based Visibility)**
    *   **机制**:
        *   **采购员**: 可见成本价（工作需要）。
        *   **店长**: 可见性可配置（租户级设置），默认可见。
        *   **销售**: 不可见成本价（仅查看采购进度）。
    *   **配置**: 店长是否可见成本价，可在租户系统设置中开关。
    *   **目的**: 守住商业机密，防止成本泄露和飞单。
    *   **价值**: 平衡管理透明度与数据安全。

### 2.3 面料库存联动
*   **策略**: **自动入库 (Automatic Stock In)**
    *   **机制**: 采购员点击“确认入库”后，系统自动将采购单中的面料数量增加到库存表，并生成库存变动记录（来源：采购入库）。
    *   **目的**: 实现采购到货与库存更新的自动化闭环。
    *   **价值**: 提升采购员工作效率，避免因遗忘手动入库导致的库存不准问题。

### 2.4 生产超时预警
*   **策略**: **定时任务 (Scheduled Warning)**
    *   **机制**: 每日凌晨自动运行任务，扫描所有“生产中”状态的采购单。
    *   **超时判定**: 对比当前时间与下单时间，若超过配置的“超时标准天数”，则触发预警。
    *   **通知**: 自动向采购员和店长发送系统通知和飞书消息。
    *   **目的**: 及时发现供应链异常，主动跟进，避免客户投诉。
    *   **价值**: 降低对人工监控的依赖，提升供应链响应速度。

### 2.5 超时标准配置
*   **策略**: **混合模式 (Hybrid Configuration)**
    *   **机制**:
        *   **系统默认值**: 在租户系统设置中配置一个“默认超时标准”（如 7 天）。
        *   **供应商覆盖**: 在供应商管理中，可为每个供应商单独配置超时标准（如供应商 A 为 10 天）。
        *   **优先级**: 预警时，优先使用供应商自身的超时标准；若未配置，则回退使用系统默认值。
    *   **目的**: 兼顾配置便利性与业务灵活性。
    *   **价值**: 既能通过默认值快速上线，又能针对不同供应商的效率差异进行精细化管控。

## 3. 数据结构示例 (Schema Example)

### 3.1 Purchase Orders 表 (采购单主表)
```sql
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_no VARCHAR(50) NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES orders(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    
    -- 采购类型
    type VARCHAR(20) NOT NULL, -- FABRIC / FINISHED / STOCK
    
    -- 状态与进度
    status VARCHAR(20) NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    
    -- 物流信息
    logistics_company VARCHAR(50),
    logistics_no VARCHAR(50),
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- 时间节点
    sent_at TIMESTAMPTZ,
    produced_at TIMESTAMPTZ,
    
    -- 付款状态
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 PO Items 表 (采购单明细)
```sql
CREATE TABLE po_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id),
    order_item_id UUID NOT NULL REFERENCES order_items(id),
    
    -- 商品快照
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(100) NOT NULL,
    sku VARCHAR(50),
    
    -- 成本与数量
    unit_cost DECIMAL(10, 2) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4. 总结
本架构设计构建了一个**自动化、安全且灵活**的采购管理系统。通过 API 对接和定时任务，我们实现了物流跟踪和超时预警的自动化；通过分级可见和混合配置，我们兼顾了数据安全与业务灵活性；通过自动入库，我们打通了采购与库存的数据闭环。
