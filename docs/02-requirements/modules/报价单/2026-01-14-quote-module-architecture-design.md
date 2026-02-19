# 报价模块架构设计 (Quote Module Architecture Design)

**日期**: 2026-01-14
**状态**: 已确认 (Validated)
**相关需求**: [报价单需求](./报价单.md), [数量计算逻辑](./数量计算逻辑.md)

## 1. 设计概述

本文档记录了报价 (Quote) 模块的核心技术架构决策。作为 L2C 系统的核心交易引擎，报价模块必须兼顾计算的准确性、配置的灵活性以及用户体验的流畅性。

## 2. 核心架构决策

### 2.1 计算引擎架构

- **策略**: **双重计算 (Dual Calculation)**
  - **前端 (Client-side)**: 实现实时计算逻辑（JS/TS），确保用户修改参数时能获得毫秒级的价格反馈，提供极致的交互体验。
  - **后端 (Server-side)**: 在保存/提交时，使用完全相同的逻辑再次计算并校验。
  - **目的**: 前端负责体验，后端负责安全（防止恶意篡改价格）。
  - **一致性保障**: 核心公式逻辑封装为共享库 (Shared Library) 或通过测试用例保证前后端逻辑严格一致。

### 2.2 公式与参数管理

- **策略**: **脚本引擎 (Script Engine)**
  - **实现**: 核心计算公式（如 `width * fold_ratio * unit_price`）不硬编码在业务代码中，而是作为配置字符串存储。
  - **解析**: 后端使用表达式解析引擎（如 `mathjs` 或自定义解析器）动态执行计算。
  - **配置化**: 支持租户级参数配置（如 `SIDE_LOSS`, `BOTTOM_LOSS`），满足不同商家的个性化损耗计算需求。

### 2.3 对花损耗逻辑

- **策略**: **自动计算 (Auto Calculation)**
  - **机制**: 引入 `pattern_repeat` (花距) 参数。
  - **公式**: `单幅用量 = ceil(裁切高度 / 花距) * 花距`。
  - **场景**: 当 `pattern_repeat > 0` 时自动触发该逻辑；否则按净尺寸计算。
  - **价值**: 确保有花纹面料的采购量准确，避免因缺料导致的生产事故。

### 2.4 多方案对比

- **策略**: **苹果风对比 (Side-by-Side Comparison)**
  - **UI 交互**: 在同一页面并排展示多个报价方案（如“高配版” vs “性价比版”）。
  - **差异高亮**: 自动识别并高亮显示不同方案之间的差异项（如面料单价、总金额）。
  - **数据结构**: 报价单主表关联多个 `quote_variants`，支持一键切换和独立打印。

### 2.5 折扣风控体系

- **策略**: **自动风控 (Automated Risk Control)**
  - **底线控制**: 系统预设“最低折扣率”（如 90%）。在此之上的折扣，销售可自主决定。
  - **越权审批**: 当折扣低于底线（如 85%）时，系统自动冻结报价单，触发审批工作流。
  - **流程**: 需店长/经理审批通过后，报价单方可生效（转订单/打印）。

## 3. 数据结构示例 (Schema Example)

### 3.1 Quotes 表 (报价单主表)

```sql
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_no VARCHAR(50) NOT NULL UNIQUE,
    lead_id UUID NOT NULL,
    customer_id UUID,
    status VARCHAR(20) NOT NULL, -- DRAFT, PENDING_APPROVAL, APPROVED, REJECTED

    -- 财务汇总
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_rate DECIMAL(5, 4) DEFAULT 1.0, -- 0.95 = 95折
    final_amount DECIMAL(10, 2) NOT NULL,

    -- 审批相关
    approval_required BOOLEAN DEFAULT FALSE,
    approver_id UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Quote Items 表 (报价明细)

```sql
CREATE TABLE quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id),

    -- 商品信息
    product_id UUID NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    sku VARCHAR(50),

    -- 规格参数 (快照)
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    fold_ratio DECIMAL(3, 2), -- 褶皱倍数
    pattern_repeat DECIMAL(10, 2), -- 花距

    -- 计算结果
    quantity DECIMAL(10, 2) NOT NULL, -- 用量
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,

    -- 扩展参数 (JSONB 存储非标属性)
    attributes JSONB DEFAULT '{}'
);
```

## 4. 总结

本架构设计构建了一个**安全、灵活且智能**的报价引擎。通过双重计算和自动风控，我们保障了交易的安全性和利润底线；通过脚本引擎和自动对花逻辑，我们实现了对复杂业务场景的精准覆盖；而苹果风的多方案对比，则直接服务于提升销售转化率这一核心商业目标。
