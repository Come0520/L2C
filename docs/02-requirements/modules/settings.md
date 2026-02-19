# 系统设置 (Settings) 模块需求文档

## 1. 模块概述

系统设置模块（Settings）是 SaaS 平台的多租户配置中枢，负责管理租户级别的全局配置、用户与角色权限、业务规则以及系统级参数。该模块通过集中化的配置管理，支撑其他业务模块（如线索、订单、交付等）的灵活运行，确保租户数据的隔离性与安全性。

## 2. 功能清单

| 功能域       | 子功能       | 描述                                   | 权限要求               |
| ------------ | ------------ | -------------------------------------- | ---------------------- |
| **租户信息** | 基础信息管理 | 查看和修改租户名称、Logo、联系方式等   | `SETTINGS.MANAGE`      |
|              | 企业认证     | 提交企业营业执照等认证信息             | `SETTINGS.MANAGE`      |
| **用户管理** | 用户列表     | 查看当前租户下的所有用户               | `SETTINGS.USER_MANAGE` |
|              | 用户编辑     | 修改用户基本信息、分配角色             | `SETTINGS.USER_MANAGE` |
|              | 状态管理     | 启用/禁用用户账号（软删除）            | `SETTINGS.USER_MANAGE` |
| **角色权限** | 角色列表     | 查看系统预置角色和自定义角色           | `SETTINGS.MANAGE`      |
|              | 角色 CRUD    | 创建、编辑、删除自定义角色；分配权限点 | `SETTINGS.MANAGE`      |
|              | 权限矩阵     | 可视化查看各角色的权限分配情况         | `SETTINGS.MANAGE`      |
| **业务规则** | 提醒设置     | 配置线索回收、跟进提醒等自动化规则     | `SETTINGS.MANAGE`      |
|              | 渠道管理     | 管理线索来源渠道（如官网、转介绍等）   | `SETTINGS.MANAGE`      |
|              | 分单规则     | 配置线索自动分配规则                   | `SETTINGS.MANAGE`      |
| **系统参数** | 全局开关     | 启用/禁用特定系统功能（如公海池回收）  | `SETTINGS.MANAGE`      |
|              | 审批流配置   | 设计和配置业务单据的审批流程           | `SETTINGS.MANAGE`      |

## 3. 数据模型

### 核心实体关系

- **Tenant (租户)**：顶层实体，所有数据通过 `tenant_id` 隔离。
- **User (用户)**：归属于通过 `users` 表存储，关联 `tenant`。
- **Role (角色)**：定义权限集合。分为系统预置角色（System Roles）和自定义角色（Custom Roles）。
- **UserRole (用户角色关联)**：多对多关系，`users_to_roles` 表。支持主角色（Primary Role）概念。
- **SystemSetting (系统设置)**：键值对存储，用于存储全局配置参数。
  - `key`: 配置键名（如 `ENABLE_LEAD_RECYCLE`）
  - `value`: JSON 格式的配置值
  - `category`: 配置分类（如 `crm`, `finance`）

### 数据库表结构摘要

- **users**: `id`, `tenant_id`, `email`, `name`, `is_active`, `deleted_at`
- **roles**: `id`, `tenant_id`, `code`, `name`, `permissions` (JSON), `is_system`, `description`
- **users_to_roles**: `user_id`, `role_id`, `is_primary`
- **system_settings**: `tenant_id`, `category`, `key`, `value` (JSON), `updated_at`

## 4. 权限模型

采用 **RBAC (Role-Based Access Control)** 模型。

- **权限点 (Permission Code)**：细粒度的操作权限，如 `leads:view`, `settings:manage`。
- **角色 (Role)**：权限点的集合。
  - **Owner**: 拥有所有权限，不可被删除。
  - **Admin**: 系统管理员，拥有大部分管理权限。
  - **Member**: 普通成员，权限受限。
- **授权机制**：
  - 用户登录时，后端计算其所有角色的权限并集。
  - 前端通过 `usePermissions` Hook 判断显示控制。
  - 后端 Actions 通过 `checkPermission` 中间件进行拦截。

## 5. 业务规则与约束

1.  **租户隔离**：所有查询必须过滤 `tenant_id`，严禁跨租户数据访问。
2.  **最后管理员保护**：租户必须至少保留一个处于“启用”状态的管理员账号。尝试禁用或删除最后一个管理员时应报错。
3.  **系统角色保护**：系统预置角色（`code` 以 `sys_` 开头或 `is_system=true`）不可修改权限集合，不可删除。
4.  **软删除**：用户和关键业务数据的删除操作仅标记 `deleted_at` 或 `is_active=false`，不进行物理删除。
5.  **并发控制**：关键配置修改（如提醒规则）应使用数据库事务和行锁（`for update`）防止竞态条件。
6.  **审计日志**：所有敏感操作（用户增删改、权限变更、系统参数修改）必须写入审计日志（Audit Log）。

## 6. API 清单 (Server Actions)

所有 Action 位于 `src/features/settings/actions/` 目录下。

### 用户管理 (`user-actions.ts`)

- `updateUser`: 更新用户信息的名称、角色等。
- `toggleUserActive`: 切换用户启用/禁用状态。
- `deleteUser`: 软删除用户。

### 角色管理 (`roles-management.ts`)

- `getRolesAction`: 获取角色列表（含系统角色）。
- `createRole`: 创建自定义角色。
- `updateRole`: 更新自定义角色权限。
- `deleteRole`: 删除自定义角色。

### 系统设置 (`system-settings-actions.ts`)

- `getSettingsByCategory`: 按分类获取配置。
- `updateSetting`: 更新单个配置项。
- `batchUpdateSettings`: 批量更新配置项。
- `initializeTenantSettings`: 初始化租户默认配置。

### 提醒规则 (`reminder-actions.ts`)

- `getReminderRules`: 获取提醒规则列表。
- `createReminderRule`: 创建新规则。
- `updateReminderRule`: 更新规则详情。
- `deleteReminderRule`: 删除规则。
