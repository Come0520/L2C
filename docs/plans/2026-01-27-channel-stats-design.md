# 渠道统计功能设计方案

> 日期：2026-01-27
> 状态：待实施

## 概述

为渠道管理模块新增业绩统计功能，支持多层级渠道的数据聚合分析。

---

## 需求汇总

### 统计指标（7项）

| 指标 | 计算方式 | 数据来源 |
|------|----------|----------|
| 带单总额 | SUM(订单金额) | orders → leads → channelId |
| 成交单数 | COUNT(订单) | orders → leads → channelId |
| 平均单价 | 带单总额 / 成交单数 | 计算字段 |
| 线索数量 | COUNT(线索) | leads.channelId |
| 转化率 | 成交单数 / 线索数量 | 计算字段 |
| 佣金总额 | SUM(佣金) | channel_commissions.channelId |
| 活跃度 | 最近30天是否有新订单 | 计算字段 |

### 层级聚合规则

```
一级渠道统计 = 自身数据 + 所有二级子渠道汇总 + 所有三级子渠道汇总
二级渠道统计 = 自身数据 + 所有三级子渠道汇总
三级渠道统计 = 仅自身数据
```

### 权限控制

- 仅 **ADMIN** 和 **MANAGER** 角色可见渠道统计功能

---

## UI 设计

### A. Dashboard 渠道卡片

**位置**：Dashboard 页面新增卡片

```
┌────────────────────────────────────────┐
│  📊 渠道业绩          [查看详情 →]     │
├────────────────────────────────────────┤
│   12          ¥128.5万       85%       │
│  活跃渠道      本月带单     转化率     │
│  ────────────────────────────────────  │
│  待结算佣金：¥3.2万                    │
└────────────────────────────────────────┘
```

### C. 渠道分析页 (`/channels/analytics`)

**页面结构**：
- 顶部：时间/类型/等级筛选器
- 中部：4个核心指标卡片 + 趋势图
- 底部：渠道排行榜（支持展开子渠道）

---

## 技术实现

### 新增文件

1. `src/features/channels/actions/channel-stats.ts` - 统计查询 Server Actions
2. `src/features/channels/components/channel-stats-card.tsx` - Dashboard 卡片组件
3. `src/app/(dashboard)/channels/analytics/page.tsx` - 分析页面
4. `src/features/channels/components/channel-ranking.tsx` - 排行榜组件

### 数据查询

使用 Drizzle ORM 聚合查询，按 channelId 分组统计。

---

## 系统集成

| 模块 | 改动 |
|------|------|
| Dashboard | 新增渠道业绩卡片 |
| Channels | 新增 analytics 子页面 |
| Sidebar | 可选：添加分析入口 |
