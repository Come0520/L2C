# 项目架构对齐修复计划

## 问题分析

通过对比项目实际目录结构与架构设计文档，发现了以下主要不符合项：

### 1. 路由结构

* 架构设计要求使用路由组（如 `(auth)/`、`(dashboard)/`），但实际项目未使用

* 存在大量架构设计中未提及的路由目录（如 `academy/`、`custom-config-test/`、`demo/` 等）

### 2. 组件结构

* 架构设计要求组件分为 `ui/` 和 `business/`，但实际项目分为 `client-components/` 和其他组件

* `client-components/` 下的分类与架构设计不符

### 3. 服务端逻辑

* 架构设计要求有 `server/` 目录，包含 `actions/` 和 `db/`，但实际项目中没有

* 实际使用 `services/` 目录存放业务逻辑，而非 `server/actions/`

### 4. 技术选型实现

* 架构设计要求使用 **Shadcn UI + TailwindCSS**，但实际使用自定义 Paper UI

* 架构设计要求使用 **Prisma / Drizzle** 作为 ORM，但实际直接使用 Supabase 客户端

* 架构设计要求摒弃传统 REST API，采用 **Server Actions**，但实际仍有大量 API 路由

### 5. 其他目录

* 存在架构设计中未提及的目录（如 `constants/`、`contexts/`、`hooks/`、`schemas/`、`services/`、`utils/` 等）

## 计划内容

### 1. 目录结构调整

#### 1.1 路由结构优化

* 将 `auth/` 路由改为路由组 `(auth)/`

* 将 `dashboard/` 路由改为路由组 `(dashboard)/`

* 移除或归档架构设计中未提及的测试路由（如 `custom-config-test/`、`demo/`、`tailwind-test/` 等）

#### 1.2 组件结构调整

* 将 `components/client-components/ui/` 合并到 `components/ui/`

* 将业务组件组织到 `components/business/` 目录

* 移除不必要的嵌套结构

#### 1.3 服务端逻辑重组

* 创建 `server/` 目录，包含 `actions/` 和 `db/` 子目录

* 将 `services/` 目录中的业务逻辑迁移到 `server/actions/`

* 移除或重构传统 API 路由，改为使用 Server Actions

#### 1.4 其他目录调整

* 将 `schemas/` 目录内容迁移到 `server/db/`

* 将 `constants/` 目录内容迁移到 `lib/` 或 `types/`

* 整合 `utils/` 和 `lib/` 目录，确保职责清晰

### 2. 技术选型对齐

#### 2.1 UI 组件库

* 评估是否需要迁移到 Shadcn UI，或继续使用自定义 Paper UI

* 确保 UI 组件符合架构设计要求

#### 2.2 数据访问层

* 评估是否需要引入 Prisma 或 Drizzle ORM

* 确保数据访问符合架构设计要求

#### 2.3 状态管理

* 确保 React Query 的使用符合架构设计要求

* 评估是否需要引入 Zustand 进行客户端状态管理

### 3. 代码实现优化

#### 3.1 数据访问与变异

* 重构数据访问逻辑，优先使用 Server Actions

* 减少传统 REST API 路由的使用

* 确保数据验证使用 Zod，并位于正确位置

#### 3.2 安全架构

* 确保 Supabase RLS 策略正确配置

* 确保中间件处理路由级别的访问控制

#### 3.3 缓存策略

* 确保充分利用 Next.js 内置的多级缓存机制

### 4. 验证与测试

* 运行 `npm run build` 确保项目能正常构建

* 运行 `npm run dev` 确保开发服务器正常启动

* 检查控制台是否有任何警告或错误

* 验证所有功能是否正常工作

## 预期结果

* 项目目录结构符合架构设计文档要求

* 技术选型和实现符合架构设计文档要求

* 代码组织清晰，职责明确

* 项目能正常构建和运行

## 优先级

1. **高优先级**：目录结构调整、服务端逻辑重组
2. **中优先级**：技术选型对齐、代码实现优化
3. **低优先级**：移除测试路由、整合工具目录

## 注意事项

* 修复过程中应确保不破坏现有功能

* 对于大型重构，建议分阶段进行

* 修复后应进行充分的测试，确保所有功能正常工作

* 修复过程中应遵循项目的命名规范和编码规范

