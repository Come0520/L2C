# 渠道模块设计方案

> 日期：2026-01-21
> 状态：已确认

## 概述

完整的渠道管理模块，支持多层级渠道结构、灵活返点配置、完整佣金结算流程。

---

## 核心需求确认

| 需求项 | 确认内容 |
|--------|----------|
| 实现范围 | 完整业务闭环（档案+线索+佣金） |
| 渠道类型 | 装企、设计师、异业，支持租户自定义 |
| 层级结构 | 三级：一级渠道 → 二级部门 → 三级成员 |
| 结算对象 | 混合模式（可按公司或个人） |
| 返点方式 | 每个渠道独立配置（固定/阶梯） |
| 结算周期 | 月结 / 单结 |
| 等级评定 | 自动建议 + 手动确认 |

---

## 数据模型

### channel_categories（渠道类型）
```
├── id
├── tenant_id
├── name（如：装修公司、设计师）
├── code
├── is_active
└── sort_order
```

### channels（渠道主表）
```
├── id
├── tenant_id
├── parent_id（父级，null=一级）
├── level（层级：1/2/3）
├── category_id（关联类型表）
├── name / code
├── contact_name / phone
├── grade（等级：S/A/B/C）
├── suggested_grade（系统建议等级）
├── commission_rate（返点比例）
├── commission_type（FIXED/TIERED）
├── tiered_rates（阶梯配置 JSON）
├── settlement_target（COMPANY/INDIVIDUAL）
├── settlement_cycle（MONTHLY/PER_ORDER）
├── bank_info（银行账户 JSON）
├── status（ACTIVE/PAUSED/TERMINATED）
└── total_deal_amount（累计成交额）
```

### channel_commissions（佣金记录）
```
├── id
├── channel_id / referrer_id（带单人）
├── order_id
├── order_amount
├── commission_rate
├── commission_amount
├── status（PENDING/SETTLED/PAID/VOID）
└── settlement_id
```

### channel_settlements（结算单）
```
├── id / settlement_no
├── channel_id
├── period_start / period_end
├── total_amount / adjustment / final_amount
├── status（DRAFT/PENDING/APPROVED/PAID）
└── payment_request_id
```

---

## UI 设计

### 渠道列表页
- 左侧：树形结构展示层级
- 右侧：详情/表单区
- 筛选：类型、等级、状态
- 操作：新增子渠道、生成对账单

### 渠道表单
- 基本信息：名称、类型、联系人
- 返点配置：固定/阶梯
- 结算配置：对象、周期、银行账户
- 等级显示：当前等级 + 系统建议

---

## 佣金结算流程

```
订单完成 → 生成佣金记录 → 结算单 → 付款申请 → 财务审批 → 打款
```

- 月结：按月汇总
- 单结：每单实时结算
- 退款：待结算作废 / 已结算下期扣减

---

## 系统集成

| 模块 | 改动 |
|------|------|
| Leads | 添加 channel_id + referrer_id |
| Orders | 成交触发佣金记录 |
| Finance | 新增佣金支付类型 |
| Settings | 渠道类型管理、等级规则 |
