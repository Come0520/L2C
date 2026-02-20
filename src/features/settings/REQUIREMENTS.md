# 系统设置模块 (System Settings) — 需求文档

> 版本: 1.0 | 最后更新: 2026-02-19

## 1. 模块概述

系统设置模块为 L2C 平台的全局配置中心，提供租户级别的基础信息管理、团队权限控制、
业务规则定制、财务参数配置、通知管理及系统审计等功能。
所有配置均为租户隔离，支持多角色权限控制。

---

## 2. 功能分组与需求清单

### 2.1 基础设置 (Basic)

| 编号 | 功能 | 路由 | 说明 |
|------|------|------|------|
| Settings-01 | 租户信息管理 | `/settings/general` | 公司名称、联系方式、Logo 上传、地址信息的增删改查 |
| Settings-02 | 企业认证 | `/settings/verification` | 营业执照上传、认证状态查询（待审核/已认证/已拒绝） |
| Settings-03 | 偏好设置 | `/settings/preferences` | 用户个人偏好（主题、语言、通知偏好） |

#### 关联 Actions
- `tenant-info.ts` — 租户信息 CRUD、Logo 上传、认证申请
- `preference-actions.ts` — 用户偏好读写
- `profile-actions.ts` — 个人信息修改 (头像、姓名、手机号、密码)

#### 关联组件
- `tenant-info-form.tsx` — 租户信息表单
- `verification-form.tsx` — 企业认证申请表单
- `user-preference-settings.tsx` — 偏好设置面板
- `user-profile-form.tsx` — 个人信息修改表单
- `theme-settings.tsx` / `theme-preview.tsx` — 主题配置与预览

---

### 2.1.1 个人中心 (User Profile) [NEW]

| 编号 | 功能 | 说明 | 权限要求 |
|------|------|------|----------|
| Profile-01 | 基本信息修改 | 修改姓名、头像、手机号 | 仅限本人 |
| Profile-02 | 安全设置 | 修改登录密码 | 仅限本人 (需验证旧密码) |

**验证规则:**
- 姓名: 必填, 2-20字符
- 手机号: 选填, 需符合手机号格式, 全局唯一 (除自身外)
- 密码: 至少8位, 包含字母和数字


---

### 2.2 团队管理 (Team)

| 编号 | 功能 | 路由 | 说明 |
|------|------|------|------|
| Settings-04 | 用户管理 | `/settings/users` | 用户列表、创建/编辑/禁用/删除用户、员工邀请 |
| Settings-05 | 角色权限 | `/settings/roles` | 角色 CRUD、权限矩阵配置、系统角色同步、权限覆盖 |

#### 关联 Actions
- `user-actions.ts` — 用户 CRUD、状态切换
- `roles-management.ts` — 角色 CRUD、系统角色同步
- `roles.ts` — 可用角色查询、默认角色初始化
- `role-override-actions.ts` — 角色权限覆盖（细粒度权限控制）
- `invite.ts` — 员工/客户邀请链接生成

#### 关联组件
- `user-list.tsx` / `user-form.tsx` / `invite-user-dialog.tsx`
- `role-list.tsx` / `role-form.tsx` / `roles/role-dialog.tsx`
- `permission-matrix.tsx` / `permission-tree.tsx` / `role-selector.tsx`
- `roles-settings-actions.tsx` — 角色管理操作栏

---

### 2.3 业务规则 (Business)

| 编号 | 功能 | 路由 | 说明 |
|------|------|------|------|
| Settings-06 | 报价配置 | `/settings/quote` | 报价模式、快速报价字段、窗帘/墙纸计算器配置 |
| Settings-07 | 订单配置 | `/settings/order` | 订单流程参数、发货提醒天数 |
| Settings-08 | 审批流程 | `/settings/approvals` | 审批节点设计器、审批规则 |
| Settings-09 | 工作流设置 | `/settings/workflow` | 工作流管理（占位，@todo [P3]） |
| Settings-10 | SLA 设置 | `/settings/sla` | 服务等级协议参数 |
| Settings-11 | 系统参数 | — | 全局业务参数（有效期、缓冲天数等） |

#### 关联 Actions
- `quote-config-actions.ts` — 报价模式配置读写
- `system-settings-actions.ts` — 通用键值配置 CRUD、分类查询、批量更新
- `tenant-config.ts` — AR/AP/工作流 Zod 校验 + 配置读写
- `workflow/actions.ts` — 工作流占位 Actions

#### 关联组件
- `quick-quote-field-config.tsx` — 快速报价字段管理
- `curtain-calc-config.tsx` / `curtain-calc-settings.tsx` — 窗帘计算器
- `curtain-quick-quote-config.tsx` / `wallpaper-quick-quote-config.tsx` — 快速报价品类
- `order-settings-config.tsx` / `measure-settings-config.tsx`
- `approval-flow-designer.tsx` / `approval-settings-config.tsx`
- `business-rules-config.tsx` — 通用业务规则
- `system-params-config.tsx` — 系统参数面板
- `workflow/workflow-config-form.tsx` — 工作流配置表单（占位）

---

### 2.4 财务配置 (Finance)

| 编号 | 功能 | 路由 | 说明 |
|------|------|------|------|
| Settings-12 | 财务基础 | `/settings/finance` | 付款条款、税率、结算周期等财务基础参数 |
| Settings-13 | 付款设置 | — | 支付方式、付款节点配置 |

#### 关联组件
- `finance-base-config.tsx` — 财务基础配置
- `payment-settings-config.tsx` — 付款参数配置

---

### 2.5 工人管理 (Worker)

| 编号 | 功能 | 路由 | 说明 |
|------|------|------|------|
| Settings-14 | 劳务定价 | `/settings/labor-pricing` | 工种定价、阶梯报价 |

#### 关联组件
- `labor-pricing-config.tsx` — 劳务定价配置

---

### 2.6 供应链配置 (Supply)

| 编号 | 功能 | 路由 | 说明 |
|------|------|------|------|
| Settings-15 | 产品管理 | `/settings/products` | 产品与空间类型 |
| Settings-16 | 采购拆单规则 | `/settings/split-rules` | 订单拆分规则配置 |
| Settings-17 | 供应商管理 | `/settings/supply-chain` | 供应商信息 |

#### 关联 Actions
- `room-groups-actions.ts` — 空间类型 CRUD

#### 关联组件
- `room-types-config.tsx` — 空间类型管理
- `split-rules-config.tsx` — 拆单规则配置
- `showroom-settings-config.tsx` — 展厅配置

---

### 2.7 通知配置 (Notification)

| 编号 | 功能 | 路由 | 说明 |
|------|------|------|------|
| Settings-18 | 通知设置 | `/settings/notifications` | 通知渠道、偏好、渠道列表管理 |
| Settings-19 | 提醒规则 | `/settings/reminders` | 自动提醒规则 CRUD |

#### 关联 Actions
- `actions.ts`（根级）— 渠道管理 CRUD
- `reminder-actions.ts` — 提醒规则 CRUD

#### 关联组件
- `notification-settings-config.tsx` / `notification-preferences-form.tsx`
- `channel-settings-config.tsx` / `channel-list.tsx`
- `reminder-rule-list.tsx` / `reminder-rule-form.tsx`
- `lead-settings-config.tsx` — 线索通知设置

---

### 2.8 系统管理 (System)

| 编号 | 功能 | 路由 | 说明 |
|------|------|------|------|
| Settings-20 | 功能开关 | `/settings/feature-flags` | 租户级功能启停控制 |
| Settings-21 | 操作日志 | `/settings/audit-logs` | 审计日志查询、分页、筛选 |

#### 关联 Actions
- `audit-logs.ts` — 审计日志查询（分页 + 筛选）

#### 关联组件
- `tenant-feature-control.tsx` — 功能开关面板
- `audit-log-panel.tsx` — 审计日志列表
- `report-settings-config.tsx` — 报表配置

---

## 3. 非功能需求

### 3.1 安全
- 所有写操作必须经过 `auth()` 鉴权 + `checkPermission()` 权限校验
- 敏感操作（角色变更、用户删除）记录审计日志
- 输入参数：Server Actions 使用 Zod Schema 校验

### 3.2 性能
- 配置子页面支持 `next/dynamic` 懒加载（Task 9 待实现）
- 系统设置键值对支持按分类批量查询，减少数据库往返

### 3.3 多租户
- 所有数据操作自动注入 `tenantId`，严格租户隔离
- 默认设置在租户初始化时通过 `initTenantSettings` 创建

### 3.4 可维护性
- 统一使用 `createSafeAction` 封装 Server Actions
- 通用设置存储：`systemSettings` 表，键值对形式，支持动态类型解析

---

## 4. 数据模型

| 表 | 用途 |
|----|------|
| `systemSettings` | 通用键值配置存储 |
| `roles` / `rolePermissions` | 角色与权限 |
| `users` | 用户信息 |
| `channels` / `channelCategories` | 渠道与分类 |
| `reminderRules` | 提醒规则 |
| `auditLogs` | 审计日志 |
| `tenants` | 租户信息 |

---

## 5. 导航结构

```
设置模块 (SettingsTabNav)
├── 基础设置: 租户信息 | 企业认证 | 偏好设置
├── 团队管理: 用户管理 | 角色权限
├── 业务规则: 报价配置 | 订单配置 | 审批流程 | 工作流设置 | SLA设置
├── 财务配置: 财务基础
├── 工人管理: 劳务定价
├── 供应链配置: 产品管理 | 采购拆单规则 | 供应商管理
├── 通知配置: 通知设置 | 提醒规则
└── 系统管理: 功能开关 | 操作日志
```

---

## 6. 文件清单

### Actions（12 个文件）
`actions.ts` · `audit-logs.ts` · `invite.ts` · `preference-actions.ts` ·
`quote-config-actions.ts` · `role-override-actions.ts` · `roles-management.ts` ·
`roles.ts` · `room-groups-actions.ts` · `system-settings-actions.ts` ·
`tenant-config.ts` · `tenant-info.ts` · `user-actions.ts` · `workflow/actions.ts`

### 组件（47 个文件）
覆盖全部 8 个功能分组，详见 `src/features/settings/components/` 目录。
