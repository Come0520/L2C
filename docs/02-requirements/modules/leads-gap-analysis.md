# 线索模块 (Leads) - 需求与实现差距分析报告

**检查时间**: 2026-01-14
**需求文档**: `docs/requirements/modules/线索.md`
**代码范围**: `src/features/leads`, `src/shared/api/schema/leads.ts`

## 1. 数据库概要 (Database Schema)

| 实体 | 字段/功能 | 状态 | 差距说明 |
|:---|:---|:---|:---|
| **Leads 表** | `last_activity_at` | ✅ 已实现 | schema 中存在 `lastActivityAt` |
| | `source_detail` | ✅ 已实现 | schema 中存在 |
| | `tags` | ⚠️ 差异 | 需求定义为 `String[]`，Schema 实现为 `text[]` (Postgres array)，功能一致 |
| **Lead Activities 表** | `quote_id` | ❌ 缺失 | Schema `leadActivities` 表中缺失 `quoteId` 字段 |
| | `purchase_intention` | ❌ 缺失 | Schema `leadActivities` 表中缺失 (记录每次跟进时的意向变化) |
| | `customer_level` | ❌ 缺失 | Schema `leadActivities` 表中缺失 (记录每次跟进时的客户评级) |
| **Lead Status History** | - | ✅ 已实现 | 存在 `leadStatusHistory` 表记录状态变更 |

## 2. 业务逻辑 (Business Logic)

| 功能模块 | 需求点 | 状态 | 差距说明 |
|:---|:---|:---|:---|
| **创建线索** | 查重机制 (Phone) | ✅ 已实现 | `createLead` 中已实现手机号查重 |
| | 查重机制 (地址) | ❌ 缺失 | 需求 6.1 要求"第二识别键：楼盘 + 详细地址"，代码中未实现 |
| | 线索编号生成 | ✅ 已实现 | 实现为 `LD` + 日期 + 随机HEX (比需求更健壮) |
| **分配机制** | 自动分配策略 | ❌ 缺失 | 需求 3.2 (轮转/负载均衡/渠道指定) 未实现，目前仅支持手动分配 |
| | 公海自动回收 | ❌ 缺失 | 需求 3.1 & 6.4 (超时自动回收) 未实现，无定时任务 |
| **状态流转** | 状态定义 | ⚠️ 差异 | 代码使用 `PENDING_ASSIGNMENT`，需求使用 `PENDING_DISPATCH`。逻辑基本一致。 |

## 3. 界面交互 (UI/UX)

| 页面/组件 | 功能点 | 状态 | 差距说明 |
|:---|:---|:---|:---|
| **列表页** | 高级筛选/Tab | ❌ 缺失 | `LeadsFilterBar` 和 `LeadsAdvancedFilter` 为空组件，未实现多Tab和组合筛选 |
| | 列表字段 | ⚠️ 部分缺失 | 列表缺少"意向等级"、"标签"展示 |
| **详情页** | 状态进度条 | ❌ 缺失 | 需求 5.2 要求展示 `[待分配→跟踪→成交]` 进度条，目前仅展示 Badge |
| | 关联单据 | ⭕ 占位 | 测量单和报价单区域显示为"开发中" (Placeholder) |
| **新建弹窗** | 字段完整性 | ✅ 基本完整 | 表单包含了核心字段 |

## 4. 建议改进计划

1.  **Schema 补全**:
    *   在 `lead_activities` 表中添加 `quote_id`, `purchase_intention`, `customer_level`。
2.  **逻辑增强**:
    *   在 `createLead` action 中增加 `community` + `address` 的查重逻辑。
    *   设计并实现"自动分配"和"公海回收"的 Cron Job 或延时任务。
3.  **UI 完善**:
    *   实现 `LeadsFilterBar`，增加 Tab 切换 (全部/公海/我的/已成交)。
    *   实现 `LeadsAdvancedFilter`，支持按时间、渠道、意向筛选。
    *   在详情页顶部增加状态流转进度条组件。
