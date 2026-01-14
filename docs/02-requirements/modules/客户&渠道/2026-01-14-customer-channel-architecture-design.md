# 客户与渠道模块架构设计 (Customer & Channel Module Architecture Design)

**日期**: 2026-01-14
**状态**: 已确认 (Validated)
**相关需求**: [客户档案需求](./客户.md), [渠道合作伙伴需求](./渠道.md)

## 1. 设计概述

本文档记录了客户 (Customer) 和渠道 (Channel) 两个基础数据模块的核心技术架构决策。客户模块负责管理已成交客户的全生命周期画像，渠道模块负责管理引流源头和返佣结算。

## 2. 客户模块架构决策

### 2.1 客户画像更新策略
*   **策略**: **增量更新 (Event-Driven Update)**
    *   **机制**: 在客户表中存储画像指标（`total_amount`, `total_orders`, `level` 等），而非实时计算。
    *   **触发时机**: 每次订单完成时，系统自动更新对应客户的指标并重新计算等级。
    *   **目的**: 保证查询性能，支持快速统计和报表分析。
    *   **价值**: 在数据量大的情况下，依然能提供秒级的客户详情加载和报表查询。

### 2.2 客户合并策略
*   **策略**: **硬合并 (Data Migration)**
    *   **机制**:
        *   选择一个“主档案”（如主要使用的电话号码）。
        *   将另一个档案的所有关联数据（订单、线索、售后记录）迁移至主档案。
        *   标记被合并档案为 `is_merged=true`，不再在列表中显示。
    *   **目的**: 确保客户数据的唯一性和统计的准确性。
    *   **价值**: 避免重复统计，提供统一的客户视图。

### 2.3 客户价值分层
*   **策略**: **自动计算 (Automatic Tiering)**
    *   **机制**: 基于累计交易额和订单数，自动计算客户等级（A/B/C/D）。
    *   **规则**: 等级只升不降（除非手动调整），激励销售维护客户关系。
    *   **价值**: 支持精细化客户运营和差异化服务策略。

## 3. 渠道模块架构决策

### 3.1 渠道等级更新策略
*   **策略**: **定时任务 (Scheduled Job)**
    *   **机制**: 每日凌晨自动运行任务，计算所有渠道的年度成交额并更新 `level` 字段。
    *   **备选**: 订单完成时触发增量更新（更新 `total_deal_amount` 并重算等级）。
    *   **目的**: 平衡性能与时效性。
    *   **价值**: 保证渠道列表和报表的查询性能，同时“天级”的更新频率已满足业务需求。

### 3.2 返佣结算触发时机
*   **策略**: **可配置触发 (Configurable Trigger)**
    *   **默认模式 (A)**: 订单创建时立即生成“待结算佣金”记录。
        *   **优势**: 渠道可即时看到佣金，体验好。
    *   **可选模式 (B)**: 订单完成时生成。
        *   **优势**: 更安全，符合“先收钱再分钱”的财务逻辑。
    *   **可选模式 (C)**: 收款完成时生成。
        *   **优势**: 最保守，确保资金到账。
    *   **配置**: 租户可在系统设置中选择适合自己的模式。
    *   **价值**: 灵活适应不同租户的财务习惯和风险偏好。

### 3.3 底价供货模式
*   **策略**: **固定结算价 (Fixed Settlement Price)**
    *   **机制**:
        *   商品库维护“对客价”（面向终端客户）和“渠道底价”（面向渠道）。
        *   **渠道结算价 = 渠道底价**（固定值，不随等级变化）。
        *   **等级作用**: 影响年终返利（如达标后给予 95 折的额外返利）。
    *   **配置**: 年终返利比例可在系统设置中调整。
    *   **价值**: 价格透明，便于渠道计算利润空间；通过年终返利激励渠道提升业绩。

### 3.4 返佣模式
*   **策略**: **对客价折扣 (Customer Price Discount)**
    *   **机制**:
        *   商品库只维护“对客价”。
        *   **渠道结算价 = 对客价 × 折扣率**。
        *   **等级折扣**: 不同等级渠道享受不同折扣率（S 级 75%，A 级 80%）。
    *   **价值**: 灵活调整，对客价变动时渠道结算价自动同步。

## 4. 数据结构示例 (Schema Example)

### 4.1 Customers 表 (客户主表)
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    phone_secondary VARCHAR(20),
    
    -- 客户画像指标（增量更新）
    level VARCHAR(10) NOT NULL DEFAULT 'D',
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    avg_order_amount DECIMAL(10, 2),
    first_order_at TIMESTAMPTZ,
    last_order_at TIMESTAMPTZ,
    
    -- 其他字段
    source_lead_id UUID,
    referrer_customer_id UUID,
    assigned_sales_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 合并标记
    is_merged BOOLEAN DEFAULT FALSE
);
```

### 4.2 Channels 表 (渠道主表)
```sql
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    channel_type VARCHAR(20) NOT NULL,
    
    -- 合作模式
    cooperation_mode VARCHAR(20) NOT NULL, -- BASE_PRICE / COMMISSION
    commission_rate DECIMAL(5, 4),
    price_discount_rate DECIMAL(5, 4), -- 仅返佣模式使用
    
    -- 渠道画像指标（定时更新）
    level VARCHAR(10) NOT NULL DEFAULT 'C',
    total_leads INTEGER NOT NULL DEFAULT 0,
    total_deal_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    
    -- 结算配置
    settlement_type VARCHAR(20) NOT NULL, -- PREPAY / MONTHLY
    commission_trigger_mode VARCHAR(20) DEFAULT 'ORDER_CREATED', -- ORDER_CREATED / ORDER_COMPLETED / PAYMENT_COMPLETED
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 5. 总结
本架构设计构建了一个**高效、准确且灵活**的客户与渠道管理体系。通过增量更新和定时任务，我们确保了系统在大数据量下的性能表现；通过可配置的返佣触发时机和灵活的合作模式，我们适应了不同租户的业务特点和财务偏好。
