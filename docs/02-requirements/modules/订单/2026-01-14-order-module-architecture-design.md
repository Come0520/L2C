# 订单模块架构设计 (Order Module Architecture Design)

**日期**: 2026-01-14
**状态**: 已确认 (Validated)
**相关需求**: [订单模块需求](./订单.md)

## 1. 设计概述

本文档记录了订单 (Order) 模块的核心技术架构决策。作为 L2C 流程的交易闭环和履约起点，订单模块必须确保数据的准确性、状态的可追溯性以及撤单流程的财务严谨性。

## 2. 核心架构决策

### 2.1 订单数据快照

- **策略**: **完整快照 (Full Snapshot)**
  - **机制**: 订单创建时，将报价单的所有数据（商品信息、价格、数量、规格）完整复制并存储到订单表，而非仅存储引用 ID。
  - **目的**: 确保订单作为“法律凭证”的绝对准确性，不受后续报价单修改的影响。
  - **价值**: 为财务对账、纠纷处理提供不可篡改的成交依据。

### 2.2 状态流转驱动

- **策略**: **数据驱动 (Data-Driven State Machine)**
  - **机制**: 订单状态由关联的子单据（采购单、安装单、收款单）状态自动聚合驱动，禁止手动切换。
  - **木桶效应**: 只有当所有子单据都达到目标状态时，订单状态才能流转。任一环节阻塞，整个订单阻塞。
  - **价值**: 确保订单状态永远反映真实的业务进度，杜绝“货未发但状态已发货”的虚假状态。

### 2.3 拆单自动化

- **策略**: **预拆 + 手动调整 (Pre-split + Manual Adjustment)**
  - **第一步**: 系统根据商品的 `default_supplier_id` 自动将订单明细预拆分至不同供应商。
  - **第二步**: 客服在拆单界面可手动调整商品归属（如更换供应商）。
  - **第三步**: 确认后生成正式采购单。
  - **价值**: 90% 的场景下实现“一键拆单”，极大提升客服效率。

### 2.4 撤单分级控制

- **策略**: **分级撤单 (Phased Cancellation)**
  - **阶段 1 (待下单)**: 允许直接撤单，无需审批。
  - **阶段 2 (生产中)**: 需店长审批。系统提示已有采购单进入生产，可能产生供应商违约金。
  - **阶段 3 (已发货/待安装)**: 禁止撤单，必须走“售后退货”流程。
  - **价值**: 在客户体验和公司利益之间取得平衡。

### 2.5 面料已采买撤单处理

- **策略**: **协商撤单 (Negotiated Cancellation)**
  - **触发条件**: 系统检测到关联采购单状态为“面料已采买”。
  - **流程**:
    1. 系统弹窗提示已有采购单面料已采买。
    2. 销售必须上传“供应商确认书”（供应商同意退单或承担违约金）。
    3. 店长审批后执行撤单。
  - **价值**: 明确责任分摊，避免公司承担全部损失。

### 2.6 撤单财务核算

- **策略**: **自定义方案 (Customized Cancellation Plan)**
  - **核算视图**: 系统提供清晰的财务核算界面，区分：
    - **收入端**: 客户已付金额（定金、全款）。
    - **成本端**: 公司已发生成本（面料、人工、运输）。
    - **费用端**: 违约金、退货物流费等。
    - **最终结果**: 客户应退金额 / 公司净亏损。
  - **灵活配置**: 销售可勾选不同选项（如定金没收比例、面料处理方式），系统实时计算最终退款金额。
  - **价值**: 支持复杂的协商场景，确保财务核算准确无误。

## 3. 数据结构示例 (Schema Example)

### 3.1 Orders 表 (订单主表)

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(50) NOT NULL UNIQUE,
    quote_id UUID NOT NULL,
    quote_version_id UUID NOT NULL,
    lead_id UUID,
    customer_id UUID NOT NULL,

    -- 完整快照数据
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    delivery_address TEXT NOT NULL,

    -- 财务数据
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) NOT NULL,
    settlement_type VARCHAR(20) NOT NULL,

    -- 状态
    status VARCHAR(20) NOT NULL,

    -- 凭证
    confirmation_img TEXT,
    payment_proof_img TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);
```

### 3.2 Order Items 表 (订单明细)

```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),

    -- 完整快照数据
    product_id UUID NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    sku VARCHAR(50),
    category VARCHAR(20) NOT NULL,

    -- 规格快照
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,

    -- 拆单关联
    po_id UUID,
    supplier_id UUID,

    status VARCHAR(20) NOT NULL
);
```

## 4. 总结

本架构设计构建了一个**准确、可控且财务严谨**的订单管理系统。通过完整快照和数据驱动状态，我们确保了订单数据的绝对真实性和可追溯性；通过分级撤单和自定义核算方案，我们实现了对复杂业务场景的灵活应对，同时守住了公司的财务底线。
