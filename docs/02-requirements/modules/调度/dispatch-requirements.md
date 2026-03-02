# 调度模块功能需求文档

> **模块路径**：`src/features/dispatch/`
> **最后更新**：2026-03-02
> **状态**：已实现

---

## 1. 模块概述

### 1.1 业务定位

调度模块（Dispatch）是 L2C 系统中连接**工单/订单**与**安装/测量人员**的核心调度中心。它负责将生成的测量任务和安装任务分配给最合适的工人，是整个履约链路中的关键环节。

### 1.2 核心价值

- **智能匹配**：基于技能、负载、评价、距离、可用时间等多维度自动推荐最优工人
- **效率提升**：减少手动调度的工作量，提高派单效率
- **安全可靠**：全链路多租户隔离 + 操作审计日志，防止越权操作

### 1.3 技术架构概览

```
┌──────────────┐       ┌─────────────────────┐       ┌──────────────────┐
│   UI 前端    │──────▶│   Server Actions     │──────▶│   数据库 (Drizzle)│
│  (调度页面)  │       │ dispatch-actions.ts  │       │  measureTasks    │
└──────────────┘       │                     │       │  installTasks    │
                       │  ┌────────────────┐ │       │  users           │
                       │  │ 智能匹配引擎   │ │       └──────────────────┘
                       │  │ matching.ts    │ │
                       │  │ scoring.ts     │ │
                       │  └────────────────┘ │
                       └─────────────────────┘
```

---

## 2. 功能域清单

### 2.1 任务指派

#### 2.1.1 测量工人指派（`assignMeasureWorker`）

- **功能描述**：将指定的测量工人分配到一个测量任务
- **前置条件**：
  - 操作者已登录且有有效的 tenantId
  - 目标工人属于当前租户
  - 目标任务属于当前租户
- **操作流程**：
  1. 验证操作者会话身份
  2. 验证工人租户归属（防止跨租户越权）
  3. 更新任务的 `assignedWorkerId`，状态变为 `DISPATCHING`
  4. 记录审计日志
  5. 刷新调度页面缓存（`revalidatePath('/dispatch')`）
- **返回结果**：`{ success: true, taskId: string }`

#### 2.1.2 安装工人指派（`assignInstallWorker`）

- **功能描述**：将指定的安装工人分配到一个安装任务
- **前置条件**：同测量工人指派
- **操作流程**：
  1. 验证操作者会话身份
  2. 验证安装工人租户归属
  3. 更新任务的 `installerId`、`dispatcherId`、`assignedAt`，状态变为 `DISPATCHING`
  4. 可选设置 `scheduledDate`（预约上门日期）
  5. 记录审计日志
  6. 刷新调度页面缓存
- **返回结果**：`{ success: true, taskId: string }`

### 2.2 人员匹配（智能派单引擎）

#### 2.2.1 基础评分算法（`calculateWorkerScore`）

- **算法说明**：基于三维度加权计算工人匹配得分（0-100）
- **评分维度**：
  | 维度 | 权重 | 规则 |
  |:---|:---:|:---|
  | 技能匹配 | 50 分 | 精确匹配 +50，全能工 +40，不匹配 = 0 分 |
  | 工作负载 | 30 分 | 空闲(0单) +30，正常(1-2单) +20，忙碌(3-4单) +10，过载(≥5单) -10 |
  | 服务评分 | 20 分 | 按 5 分制线性映射，无评分给 10 分 |

#### 2.2.2 技能映射规则（`getRequiredSkill`）

- 包含 `CURTAIN` → 映射到 `CURTAIN` 技能
- 包含 `WALL` → 映射到 `WALLCLOTH` 技能
- 其他 → 映射到 `General` 通用技能

#### 2.2.3 距离因子（`calculateDistance` + `getDistanceScore`）

- 使用 Haversine 公式计算两点之间的直线距离（km）
- 距离评分规则：
  | 距离 | 评分 |
  |:---|:---:|
  | 0-5 km | 10 分 |
  | 5-20 km | 5 分 |
  | > 20 km | 0 分 |
  | 无位置信息 | 5 分（中性） |

#### 2.2.4 可用时间因子（`hasScheduleConflict` + `getAvailabilityScore`）

- 检测工人已排班时间段与任务计划时间是否重叠
- 时间可用性评分：
  | 场景 | 评分 |
  |:---|:---:|
  | 未指定计划时间 | 5 分（中性） |
  | 时间可用 | 10 分 |
  | 时间冲突 | 0 分 |

#### 2.2.5 批量匹配主函数（`matchWorkersForTask`）

- **功能描述**：为任务从候选工人列表中筛选并排序最优工人
- **综合评分**：`MIN(100, 基础分 + 距离加分 + 可用时间加分)`
- **配置项**：
  - `excludeConflicts`（默认 `true`）：是否完全排除有时间冲突的工人
- **返回结果**：按综合评分降序的 `MatchResult[]` 列表

### 2.3 任务状态流转

#### 2.3.1 测量任务状态流（`updateMeasureTaskStatus`）

```
PENDING_APPROVAL → PENDING → DISPATCHING → PENDING_VISIT → PENDING_CONFIRM → COMPLETED
                                                                              ↗
                                    任意状态 ─────────────────────────→ CANCELLED
```

- 完成（COMPLETED）时自动记录 `completedAt` 时间
- 取消（CANCELLED）时记录额外日志
- 任务不存在或无权操作时，记录 `ILLEGAL_ACCESS_ATTEMPT` 审计

#### 2.3.2 安装任务状态流（`updateInstallTaskStatus`）

```
PENDING_DISPATCH → DISPATCHING → PENDING_VISIT → PENDING_CONFIRM → COMPLETED
```

- 完成（COMPLETED）时自动记录 `completedAt` 时间
- 任务不存在或无权操作时，记录 `ILLEGAL_ACCESS_ATTEMPT` 审计

### 2.4 安全与权限

#### 2.4.1 多租户隔离

- 所有数据库查询和更新操作都强制携带 `tenantId` 的 WHERE 条件
- 指派前先验证工人是否属于当前租户
- 任务更新前验证任务是否属于当前租户

#### 2.4.2 操作审计日志

所有关键写操作都通过 `AuditService.record()` 记录审计日志，包括：

| 操作 | 审计表 | 审计动作 |
|:---|:---|:---|
| 指派测量工人 | measure_tasks | UPDATE |
| 更新测量状态 | measure_tasks | UPDATE |
| 越权尝试（测量） | measure_tasks | ILLEGAL_ACCESS_ATTEMPT |
| 指派安装工人 | install_tasks | UPDATE |
| 更新安装状态 | install_tasks | UPDATE |
| 越权尝试（安装） | install_tasks | ILLEGAL_ACCESS_ATTEMPT |

#### 2.4.3 身份验证

- 所有 Server Action 在执行前先通过 `auth()` 获取会话
- 未登录或无 tenantId 的请求直接抛出 `未授权访问` 错误

---

## 3. 数据模型

### 3.1 measureTasks（测量任务表）

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| id | string | 任务唯一 ID |
| tenantId | string | 租户 ID（隔离键） |
| assignedWorkerId | string | 指派的测量工人 ID |
| status | enum | 任务状态（见 2.3.1） |
| completedAt | Date | 完成时间 |
| updatedAt | Date | 最后更新时间 |

### 3.2 installTasks（安装任务表）

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| id | string | 任务唯一 ID |
| tenantId | string | 租户 ID（隔离键） |
| installerId | string | 指派的安装工人 ID |
| dispatcherId | string | 调度操作者 ID |
| status | enum | 任务状态（见 2.3.2） |
| scheduledDate | Date | 预约上门日期 |
| assignedAt | Date | 分配时间 |
| completedAt | Date | 完成时间 |
| updatedAt | Date | 最后更新时间 |

---

## 4. API 接口清单

### 4.1 Server Actions

| 接口 | 参数 | 返回值 | 说明 |
|:---|:---|:---|:---|
| `assignMeasureWorker` | `taskId: string, workerId: string` | `{ success: true, taskId: string }` | 指派测量工人 |
| `updateMeasureTaskStatus` | `taskId: string, status: MeasureTaskStatus` | `{ success: true, taskId: string }` | 更新测量任务状态 |
| `assignInstallWorker` | `taskId: string, installerId: string, scheduledDate?: Date` | `{ success: true, taskId: string }` | 指派安装工人 |
| `updateInstallTaskStatus` | `taskId: string, status: InstallTaskStatus` | `{ success: true, taskId: string }` | 更新安装任务状态 |

### 4.2 匹配算法 API

| 接口 | 参数 | 返回值 | 说明 |
|:---|:---|:---|:---|
| `calculateWorkerScore` | `worker: WorkerProfile, task: TaskRequirement` | `number (0-100)` | 计算单个工人匹配分 |
| `matchWorkersForTask` | `task: TaskRequirement, workers: WorkerProfile[], options?` | `MatchResult[]` | 批量匹配排序 |
| `calculateDistance` | `a: GeoLocation, b: GeoLocation` | `number (km)` | Haversine 公式计算距离 |
| `getDistanceScore` | `workerLocation?, taskLocation?` | `number (0-10)` | 距离评分 |
| `hasScheduleConflict` | `scheduledSlots?, scheduledAt, durationMinutes?` | `boolean` | 时间冲突检测 |
| `getAvailabilityScore` | `worker: WorkerProfile, task: TaskRequirement` | `number (0-10)` | 可用时间评分 |
| `getRequiredSkill` | `category: string` | `string` | 品类→技能标签映射 |

---

## 5. 测试覆盖

当前测试文件（5 个）覆盖以下场景：

| 测试文件 | 覆盖场景 |
|:---|:---|
| `actions.test.ts` | 基础评分算法正确性（技能、负载、评价） |
| `scoring.test.ts` | 详细评分算法 + 批量匹配排序 |
| `security.integration.test.ts` | 多租户安全隔离集成测试 |
| `task-assignment.test.ts` | 任务指派逻辑（正常/异常/边界） |
| `task-status.test.ts` | 任务状态流转 + 越权审计 |
