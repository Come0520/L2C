# 销售目标与佣金联动机制说明

> 版本：v1.0 | 最后更新：2026-02-23

---

## 系统架构概览

```
销售目标 (sales_targets)
        │
        ├── 考核基准：实际成交额 vs 目标额
        │
订单完成 ──→ 渠道佣金生成 (channel_commissions)
        │        │
        │        ├── 状态：PENDING → SETTLED → PAID
        │        └── 退款处理：VOID / 负向 commissionAdjustments
        │
        └── 分析看板：月度达成率、团队排名
```

---

## 一、销售目标 (Sales Target)

### 1.1 目标生命周期

```
[设定] → [调整] → [确认] → [归档]
```

| 操作 | 权限 | 函数 | 触发缓存失效 |
|:---|:---|:---|:---|
| 设定/更新目标 | admin / manager / BOSS | `updateSalesTarget()` | `sales-targets` `sales-dashboard` `sales-analytics` |
| 调整目标额 | admin / manager / BOSS | `adjustSalesTarget()` | 同上 |
| 确认目标 | admin / manager / BOSS | `confirmSalesTarget()` | 同上 |
| 查询团队目标 | admin / manager / BOSS | `getSalesTargets()` | — (只读) |
| 查看个人目标 | 全角色 | `getMySalesTarget()` | — (只读) |

### 1.2 数据结构

```typescript
// sales_targets 表核心字段
{
  tenantId: string;       // 租户隔离
  userId: string;         // 归属销售人员
  year: number;           // 年份 (2020–2100)
  month: number;          // 月份 (1–12)
  targetAmount: string;   // 目标金额（Decimal 存储）
  updatedBy: string;      // 最后修改人
}
```

### 1.3 达成率计算

```
达成率 = 本月已签订单总额 / 目标金额 × 100%
```

> 数据来源：`analytics.ts` 中按 `sales_person_id` 聚合的订单总额

---

## 二、渠道佣金 (Channel Commission)

### 2.1 触发条件

佣金**仅在以下条件同时满足时**自动创建：

1. 订单状态变更为 `PAID` 或 `COMPLETED`
2. 订单关联的线索 (`lead`) 有所属渠道 (`channelId`)
3. 渠道设置了 `commissionRate`（佣金比例）

```typescript
// CommissionService.createCommission() 调用时机
// → 在订单支付、完成状态流转时，由 order actions 调用
```

### 2.2 佣金计算公式

```
佣金金额 = 订单总额 × (渠道佣金比例 / 100)
```

**示例：**
- 订单总额：¥28,800
- 渠道佣金比例：3%
- 佣金金额：¥28,800 × 0.03 = **¥864**

### 2.3 佣金状态流转

```
PENDING（待结算）
    │
    ├── 正常情况 → SETTLED（已结算）→ PAID（已支付）
    │
    └── 退款情况
          ├── 全额退款 + PENDING → VOID（作废）
          └── 全额退款 + SETTLED/PAID → commissionAdjustments (-全额)
              部分退款 → commissionAdjustments (-按比例)
```

### 2.4 退款对佣金的影响

| 退款类型 | 佣金状态 | 处理方式 |
|:---|:---|:---|
| 全额退款 | PENDING | 标记为 `VOID` |
| 全额退款 | SETTLED / PAID | 写入负向调整记录 `-commissionAmount` |
| 部分退款 | 任意 | 按退款比例写入负向调整 `-refundAmount × commissionRate` |

---

## 三、销售目标与佣金的关联关系

> [!NOTE]
> 销售目标与渠道佣金是**独立体系**，前者面向内部绩效考核，后者面向外部渠道合作方。

| 维度 | 销售目标 | 渠道佣金 |
|:---|:---|:---|
| 主体 | 内部销售人员 | 外部合作渠道 |
| 计算基准 | 销售人员签单总额 | 渠道来源订单总额 |
| 资金流向 | 影响个人绩效奖金 | 支付给渠道合作方 |
| 数据隔离 | 按 `userId` 隔离 | 按 `channelId` 隔离 |

### 间接关联路径

```
销售线索 (lead)
    │
    ├── createdBy → 销售人员 → 销售目标统计
    │
    └── channelId → 渠道 → 佣金计算
```

同一笔线索同时影响：
- 销售人员的**目标达成率**（通过订单完成额计入）
- 来源渠道的**佣金结算**（通过渠道比例计算）

---

## 四、重要注意事项

> [!WARNING]
> 渠道佣金不等于销售人员的个人绩效奖金。佣金是支付给**渠道**的，不计入销售人员的薪资体系。

> [!IMPORTANT]
> 修改渠道佣金比例**不会**溯及修改之前已生成的佣金记录，仅影响新产生的订单。

---

## 五、审计追踪

所有销售目标变更均通过 `AuditService.log()` 记录到 `audit_logs` 表，可在管理后台 → 审计日志中查询以下操作：

- `UPDATE` / `CREATE` — 目标设定与修改
- `ADJUST_TARGET_VALUE` — 中途调整
- `CONFIRM_TARGET` — 目标确认
