# 安装模块架构设计 (Install Task Module Architecture Design)

**日期**: 2026-01-14
**状态**: 已确认 (Validated)
**相关需求**: [安装单模块需求](./安装单.md)

## 1. 设计概述

本文档记录了安装单 (Install Task) 模块的核心技术架构决策。作为订单履约的最后一公里，安装模块必须确保派单的准确性、工费计算的统一性以及现场作业的智能化。

## 2. 核心架构决策

### 2.1 货齐校验机制

- **策略**: **强制阻止 + 审批例外 (Block with Approval Exception)**
  - **默认机制**: 系统实时校验所有关联采购单的物流状态，若任一未到货，则禁止派单员执行“指派”操作。
  - **审批流程**: 若遇特殊情况（如客户自备部分货物），派单员可发起审批流程，经店长批准后允许派单。
  - **目的**: 杜绝师傅空跑，同时保留处理特殊情况的灵活性。
  - **价值**: 降低无效派单成本，提升师傅满意度。

### 2.2 工费计算自动化

- **策略**: **自动计算 (Auto Calculation)**
  - **机制**: 系统根据订单明细（轨道长度、窗户数量、客户地址距离等）自动计算工费（基础费 + 高空作业费 + 超远路费 + 特种墙体打孔费）。
  - **人工调整**: 派单员可微调工费，但系统强制记录“调整原因”。
  - **目的**: 确保工费计算的统一性和准确性。
  - **价值**: 提升派单效率，避免人工计算错误。

### 2.3 离线数据同步

- **策略**: **混合策略 (Hybrid Sync)**
  - **默认机制**: 小程序自动监听网络状态，网络恢复后自动静默上传离线数据。
  - **兜底保障**: 若连续 3 次上传失败，系统弹窗强提醒师傅手动处理。
  - **目的**: 兼顾极致体验与数据安全。
  - **价值**: 师傅无需关注网络状态，专注现场作业，同时确保数据不丢失。

### 2.4 客户自助预约

- **策略**: **智能推荐 + 双向确认 (Smart Recommendation + Mutual Confirmation)**
  - **智能推荐**: 系统根据师傅日程、路程、预计工时等算法，推荐 3 个最佳时段。
  - **双向确认**: 客户选择时段后，系统通知师傅；师傅需点击“确认”才算预约成功。若师傅拒绝，系统自动提示客户重选。
  - **目的**: 避免时间冲突，提升预约成功率。
  - **价值**: 减轻派单员沟通压力，提升客户体验。

## 3. 数据结构示例 (Schema Example)

### 3.1 Install Tasks 表 (安装单主表)

```sql
CREATE TABLE install_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_no VARCHAR(50) NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES orders(id),
    customer_id UUID NOT NULL REFERENCES customers(id),

    -- 状态与进度
    status VARCHAR(20) NOT NULL,

    -- 派单信息
    dispatcher_id UUID,
    installer_id UUID,
    scheduled_date DATE,
    scheduled_time_slot VARCHAR(20),

    -- 货齐校验
    logistics_ready_status BOOLEAN NOT NULL DEFAULT FALSE,

    -- 工费信息
    labor_fee DECIMAL(10, 2),
    actual_labor_fee DECIMAL(10, 2),
    fee_breakdown JSONB,

    -- 验收信息
    rating INTEGER,
    rating_comment TEXT,

    -- 驳回追踪
    reject_count INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

## 4. 总结

本架构设计构建了一个**智能、高效且安全**的安装管理系统。通过货齐校验和智能预约，我们避免了无效派单和时间冲突；通过自动工费计算和离线同步，我们提升了现场作业效率和数据可靠性。
