# 监控模块功能需求文档

> **模块路径**：`src/features/monitoring/`
> **模块定位**：系统健康状态监测与预警管理
> **核心价值**：实时监控 + 阈值告警 + 审计追踪 + 通知分发
> **最后更新**：2026-03-02

---

## 1. 模块概述

### 1.1 业务定位

监控模块是 L2C 平台的运维核心支撑子系统，专注于：

> 本模块为纯服务端模块，不含前端 UI 组件。D5 维度评分标记为"不适用 (N/A)"。

- **系统健康探测**：提供数据库连接可用性验证端点，供外部监控平台（如 UptimeRobot、阿里云 CMS）定时拉取
- **告警规则引擎**：基于可配置的条件和阈值，在业务风险达到预设水位时自动触发告警
- **通知分发管道**：支持按角色组批量播送、单用户定向推送，以及用户自定义通知偏好
- **审计追踪**：所有关键写入操作均通过 AuditService 记录完整审计日志

### 1.2 核心价值

| 能力 | 说明 |
|:---|:---|
| 实时健康探测 | 通过标准 HTTP `/api/health` 端点暴露数据库连接状态，兼容 K8s Liveness/Readiness Probe |
| 可配置告警 | 支持 5 种告警触发条件（订单超时、审批挂起、付款到期、库存不足、自定义） |
| 阈值灵活 | 阈值范围 1~90 天，支持业务人员自行调整 |
| 多租户隔离 | 告警规则严格按 `tenantId` 隔离，租户之间互不可见 |
| 防风暴保护 | 内置滑动窗口速率限制器，防止告警风暴导致系统过载（默认 100 次/分钟） |
| 审计合规 | 规则创建、修改、删除、批量通知均记录 AuditService 审计日志 |

### 1.3 技术架构

```
┌──────────────────────────────────────────────────────────┐
│             Monitoring 模块 (Server Actions)             │
├──────────────────┬───────────────────┬───────────────────┤
│ alert-rules.ts   │ notification-     │ preference-       │
│ (告警规则引擎)    │ actions.ts        │ actions.ts        │
│                  │ (通知分发管道)     │ (用户偏好管理)     │
├──────────────────┴───────────────────┴───────────────────┤
│           createSafeAction + Zod Schema 校验              │
├──────────────────────────────────────────────────────────┤
│     checkPermission(NOTIFICATION.MANAGE) 权限管控          │
├──────────────────────────────────────────────────────────┤
│           Drizzle ORM (riskAlerts / auditLogs)           │
├──────────────────────────────────────────────────────────┤
│                  AuditService 审计日志                     │
└──────────────────────────────────────────────────────────┘
```

---

## 2. 功能域清单

### 2.1 告警规则管理 (CRUD)

#### 2.1.1 创建告警规则

- **接口**：`createAlertRule(data)`
- **权限**：`NOTIFICATION.MANAGE`
- **输入参数**：

| 字段 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| `name` | `string` | ✅ | 规则显示名称，不得为空 |
| `condition` | `enum` | ✅ | 告警触发条件：`ORDER_OVERDUE` / `APPROVAL_PENDING` / `PAYMENT_DUE` / `INVENTORY_LOW` / `CUSTOM` |
| `thresholdDays` | `number` | ✅ | 超时阈值（1~90 天） |
| `targetRoles` | `string[]` | ✅ | 目标播送角色组，至少 1 个 |
| `notificationTemplate` | `enum` | ✅ | 通知模板：与 condition 对应的 5 种模板 |
| `isEnabled` | `boolean` | ❌ | 是否启用，默认 `true` |
| `description` | `string` | ❌ | 规则备注信息 |

- **业务规则**：
  - 复用 `riskAlerts` 表存储告警配置
  - `condition` 存入 `riskType` 字段
  - `thresholdDays` 存入 `affectedCount` 字段（字符串类型）
  - 创建成功后写入 `CREATE_ALERT_RULE` 审计日志
  - 受速率限制器保护（100 次/分钟）

#### 2.1.2 查询告警规则列表

- **接口**：`listAlertRules()`
- **权限**：仅需登录（自动按 `tenantId` 过滤）
- **返回**：当前租户下所有告警规则列表
- **业务规则**：
  - 记录查询耗时日志（`durationMs`）
  - 严格按 `tenantId` 过滤，确保多租户隔离

#### 2.1.3 更新告警规则

- **接口**：`updateAlertRule(data)`
- **权限**：`NOTIFICATION.MANAGE`
- **可更新字段**：`name`、`condition`、`thresholdDays`、`targetRoles`、`notificationTemplate`、`isEnabled`、`description`
- **业务规则**：
  - 仅能修改**当前租户**的规则（`tenantId + ruleId` 双条件匹配）
  - 若匹配不到记录，返回"未找到该告警规则或无权操作"
  - 更新成功后写入 `UPDATE_ALERT_RULE` 审计日志

#### 2.1.4 删除告警规则

- **接口**：`deleteAlertRule({ ruleId })`
- **权限**：`NOTIFICATION.MANAGE`
- **业务规则**：
  - 通过 `and(eq(id, ruleId), eq(tenantId, session.tenantId))` 确保删除隔离
  - 删除成功后写入 `DELETE_ALERT_RULE` 审计日志

---

### 2.2 系统健康检查

#### 2.2.1 数据库连接探测

- **端点**：`GET /api/health`
- **无需鉴权**：供外部监控工具直接调用
- **返回格式**：

```json
// 健康
{ "status": "healthy", "dbStatus": "connected", "timestamp": "..." }

// 异常
{ "status": "unhealthy", "dbStatus": "disconnected", "error": "...", "timestamp": "..." }
```

- **HTTP 状态码**：
  - `200`：数据库正常连接
  - `503`：数据库连接失败
- **用途**：K8s Liveness Probe、外部 UptimeRobot 拉取

---

### 2.3 告警通知管理

#### 2.3.1 批量通知发送

- **接口**：`sendBulkNotification(data)`
- **权限**：`NOTIFICATION.MANAGE`
- **输入参数**：

| 字段 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| `targetRoles` | `string[]` | ✅ | 目标角色组 |
| `title` | `string` | ✅ | 消息标题 |
| `content` | `string` | ✅ | 消息正文 |
| `type` | `enum` | ❌ | 级别：`INFO` / `WARNING` / `ERROR`，默认 `INFO` |
| `link` | `string` | ❌ | 跳转链接 |

- **业务规则**：
  - 受速率限制器保护
  - 写入 `SEND_BULK_NOTIFICATION` 审计日志
  - 当前为骨架版本，实际分发待后续实现

#### 2.3.2 单用户通知创建

- **接口**：`createNotification(params)`
- **权限**：`NOTIFICATION.MANAGE`
- **类型映射逻辑**：
  - `INFO` → `SYSTEM`（系统通知）
  - `WARNING` / `ERROR` → `ALERT`（告警通知）
  - 未指定时默认 → `SYSTEM`
- **支持渠道**：`SYSTEM`（站内信）、`FEISHU`（飞书）、`WECHAT`（企微）

#### 2.3.3 通知查询与标记

- **接口**：
  - `getMyNotifications(params)` — 查询当前用户的通知列表（支持分页）
  - `markNotificationAsRead({ notificationId })` — 标记通知为已读（仅限本人通知）
  - `getUnreadCount()` — 获取未读通知数量

---

### 2.4 通知偏好管理

#### 2.4.1 查询用户偏好

- **接口**：`getNotificationPreferences()`
- **权限**：仅需登录（用户管理自身偏好）
- **返回**：当前用户在所有通知分类下的渠道偏好列表

#### 2.4.2 更新用户偏好

- **接口**：`updateNotificationPreference(data)`
- **输入参数**：

| 字段 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| `notificationType` | `enum` | ✅ | 分类：`SYSTEM` / `ORDER_STATUS` / `APPROVAL` / `ALERT` / `MENTION` |
| `channels` | `string[]` | ✅ | 启用的渠道列表，至少 1 个 |

- **业务规则**：
  - 已存在则更新（UPDATE），不存在则插入（INSERT）— Upsert 模式
  - 变更行为写入 `audit_logs` 表（直接 INSERT 而非 AuditService）
  - 用户仅能操作自身偏好

---

### 2.5 通知模板引擎

#### 2.5.1 预设模板

| 模板 ID | 标题 | 内容骨架 |
|:---|:---|:---|
| `ORDER_OVERDUE` | ⚠️ 订单超时提醒 | 您有 `{count}` 个订单已超过 `{days}` 天未处理 |
| `APPROVAL_PENDING` | 📋 审批待处理提醒 | 您有 `{count}` 个审批已等待超过 `{days}` 天 |
| `PAYMENT_DUE` | 💰 付款到期提醒 | 有 `{count}` 笔付款将在 `{days}` 天内到期 |
| `INVENTORY_LOW` | 📦 库存不足预警 | `{count}` 种商品库存低于安全线 |
| `CUSTOM` | 🔔 自定义告警 | 触发了自定义告警条件 |

#### 2.5.2 模板渲染

- **接口**：`renderTemplate(templateName, params)`
- **占位符替换**：支持 `{key}` 格式的动态变量
- **回退策略**：未匹配模板时自动使用 `CUSTOM` 模板

---

### 2.6 防风暴速率限制

#### 2.6.1 限制策略

- **算法**：内存级滑动窗口
- **默认配额**：100 次/分钟
- **保护范围**：告警规则创建 + 批量通知发送
- **超限行为**：抛出异常，返回"操作过于频繁，请稍后再试"
- **测试支持**：暴露 `resetRateLimiterForTest()` 重置接口

---

## 3. 安全与审计

### 3.1 权限管控

| 操作 | 所需权限 | 说明 |
|:---|:---|:---|
| 创建告警规则 | `NOTIFICATION.MANAGE` | 管理员级别 |
| 更新告警规则 | `NOTIFICATION.MANAGE` | 管理员级别 |
| 删除告警规则 | `NOTIFICATION.MANAGE` | 管理员级别 |
| 查询告警规则列表 | 登录即可 | 自动按租户过滤 |
| 批量通知发送 | `NOTIFICATION.MANAGE` | 管理员级别 |
| 单用户通知创建 | `NOTIFICATION.MANAGE` | 管理员级别 |
| 通知偏好管理 | 登录即可 | 用户管理自身偏好 |
| 健康检查 | 无需鉴权 | 运维探测端点 |

### 3.2 多租户隔离策略

- **告警规则**：所有 CRUD 操作均通过 `tenantId` 条件过滤
  - 创建时自动绑定当前用户的 `tenantId`
  - 查询时仅返回当前租户的规则
  - 更新/删除时通过 `and(eq(id), eq(tenantId))` 双条件确保隔离
- **通知偏好**：按 `userId + tenantId` 双维度隔离
- **通知查询**：由 `notifications` 模块内部按用户/租户过滤

### 3.3 AuditService 审计记录

所有关键写入操作均记录审计日志：

| 审计动作 | 触发场景 | 记录表 |
|:---|:---|:---|
| `CREATE_ALERT_RULE` | 创建告警规则 | `risk_alerts` |
| `UPDATE_ALERT_RULE` | 更新告警规则 | `risk_alerts` |
| `DELETE_ALERT_RULE` | 删除告警规则 | `risk_alerts` |
| `SEND_BULK_NOTIFICATION` | 批量通知发送 | `notifications` |
| `UPDATE_NOTIFICATION_PREFERENCE` | 通知偏好变更 | `notification_preferences`（直接 INSERT `audit_logs`） |

### 3.4 日志记录

- 使用 `logger` 模块输出操作日志（`info` / `warn` / `error`）
- 关键日志节点：
  - 规则创建/更新/删除成功
  - 查询耗时指标
  - 限流触发警告
  - 通知发送结果
  - 各类异常捕获

---

## 4. UI 组件

### 4.1 通知铃铛 (NotificationBell)

- **路径**：`components/notification-bell.tsx`
- **类型**：客户端组件 (`'use client'`)
- **当前状态**：骨架/占位组件
- **预期功能**：
  - 在导航栏展示通知触发按钮
  - 显示未读通知角标
  - 点击展开通知列表面板

---

## 5. 数据模型

### 5.1 告警规则存储

复用 `riskAlerts` 表，字段映射关系如下：

| 业务字段 | 数据库字段 | 说明 |
|:---|:---|:---|
| `name` | `title` | 规则名称 |
| `condition` | `riskType` | 触发条件分类 |
| `thresholdDays` | `affectedCount` | 超时阈值（字符串类型） |
| `isEnabled` | `status` | `OPEN` = 启用，`IGNORED` = 禁用 |
| `description` | `description` | 规则备注 |
| `template + threshold` | `suggestedAction` | 组合存储模板和阈值信息 |
| — | `tenantId` | 租户 ID（自动绑定） |
| — | `riskLevel` | 固定为 `MEDIUM` |
| — | `affectedOrders` | 固定为空数组 |

### 5.2 通知偏好存储

使用 `notificationPreferences` 表：

| 字段 | 说明 |
|:---|:---|
| `userId` | 用户 ID |
| `tenantId` | 租户 ID |
| `notificationType` | 通知分类 |
| `channels` | 启用的通知渠道数组 |

---

## 6. 非功能性要求

### 6.1 性能

- 告警规则查询应记录耗时指标（`durationMs`）
- 速率限制应在内存级完成（无额外 DB 查询开销）

### 6.2 可靠性

- 所有数据库操作均使用 try-catch 包裹
- 失败时返回 `{ success: false, error: '...' }` 而非抛出异常
- 速率限制器可通过 `resetRateLimiterForTest()` 重置（测试环境）

### 6.3 可扩展性

- 告警条件类型可通过 Zod enum 扩展新增
- 通知模板可通过 `NOTIFICATION_TEMPLATES` 映射表扩展
- 批量通知的实际分发逻辑预留了异步微服务接口
