# 测量模块整改设计方案

**日期**: 2026-01-20  
**状态**: 已确认  
**范围**: Web 端管理功能增强

---

## 一、背景

基于 2026-01-20 审计报告，测量模块整体完成度 70-75%，本次整改聚焦 Web 端管理功能增强，小程序端延后开发。

---

## 二、本期实施范围

### P0：列表页高级筛选

**目标**: 提升后台人员管理效率

| 筛选器 | 组件类型 | 说明 |
|:---|:---|:---|
| 日期范围 | `DateRangePicker` | 筛选预约日期 |
| 测量师 | `Select` | 派单员可见全部 |
| 销售 | `Select` | 店长可见 |

**搜索框扩展**：支持对地址、渠道、客户的模糊搜索

**涉及文件**:
- `src/features/service/measurement/components/measurement-filter-bar.tsx`
- `src/features/service/measurement/components/measurement-advanced-filter.tsx` [NEW]
- `src/features/service/measurement/actions/queries.ts`

---

### P1：详情页增强

**目标**: 完善详情页信息展示和操作

#### 1.1 状态 Tabs 展示
用 Tabs 组件替代原有 Badge 展示当前状态，高亮当前所在阶段。

```
[待分配] [待上门] [待确认] [已完成]
```

#### 1.2 版本切换组件
显示测量方案版本列表，支持切换查看：
```
[V1.A] [V1.B] [V2.A]
```

#### 1.3 操作日志 / 驳回记录
使用 Timeline 组件展示操作历史，包括：
- 创建、指派、接单、签到、提交、确认、驳回等事件
- 驳回时显示驳回原因

#### 1.4 转报价按钮
- 条件：`status === 'COMPLETED'`
- 行为：跳转至报价单创建页面，URL 带 `measureTaskId` 参数

**涉及文件**:
- `src/app/(dashboard)/service/measurement/[id]/page.tsx`
- `src/features/service/measurement/components/status-tabs.tsx` [NEW]
- `src/features/service/measurement/components/version-switcher.tsx` [NEW]
- `src/features/service/measurement/components/operation-log.tsx` [NEW]

---

### P2：业务管控逻辑

#### 2.1 GPS 距离校验

**Haversine 距离计算**:
```typescript
// @/shared/lib/gps-utils.ts
function calculateDistance(lat1, lng1, lat2, lng2): number
```

**校验规则**:
| 距离 | 状态 | 处理 |
|:---|:---|:---|
| ≤500m | 正常 | 允许签到 |
| 500m-1000m | 黄色警告 | 提示后允许签到 |
| >1000m | 红色警告 | 强烈建议重新定位 |

**前置条件**: 客户地址需要存储坐标字段 (`addressLocation`)

**涉及文件**:
- `src/shared/lib/gps-utils.ts`
- `src/features/service/measurement/actions/mutations.ts` (checkInMeasureTask)
- `src/shared/api/schema/service.ts` (添加 addressLocation 字段)

#### 2.2 驳回预警机制

**驳回计数**:
- `measure_tasks` 表添加 `rejectCount` 字段
- 每次驳回时 +1

**预警触发**:
- `rejectCount >= 3` 时通知店长
- 使用现有通知系统 (`createNotification`)

**UI 展示**:
- 列表页：驳回次数 ≥2 时显示徽章（黄色/橙色/红色）
- 详情页：驳回历史 Timeline

**涉及文件**:
- `src/shared/api/schema/service.ts` (rejectCount, rejectReason, rejectHistory)
- `src/features/service/measurement/actions/reject.ts`
- `src/features/service/measurement/components/measure-task-table.tsx`

---

## 三、延后范围

| 功能 | 原因 |
|:---|:---|
| 小程序端完整版 | 工作量大，先完善管理端 |
| `submitMeasureData` 逻辑 | 随小程序一起开发 |
| 离线缓存 / 照片压缩 / 语音输入 | 小程序端功能 |

---

## 四、验证计划

### 自动化测试
- 高级筛选 API 单元测试
- GPS 距离计算单元测试
- 驳回预警逻辑单元测试

### 手动验证
- 浏览器审计列表页筛选功能
- 详情页 UI 元素完整性检查
