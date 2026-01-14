# L2C 系统技术架构文档 (Technical Architecture)

**版本**：v1.0 (Stable)

**更新日期**：2026-01-04

**状态**：已批准 (Approved)

---

## 1. 项目概述与背景 (Project Context)

本架构旨在支撑 **L2C (Lead-to-Cash)** 线索管理系统，服务于窗帘供应链业务。考虑到 2026 年的技术标准及中国大陆部署的合规与性能要求，系统从海外原生的 Supabase 方案全面转向基于**阿里云**的自研企业级架构，核心目标是实现极致的类型安全、业务闭环和低延迟响应。

---

## 2. 技术栈矩阵 (Technology Stack)

基于 2025-2026 年企业级标准，我们选择了以下高性能组合：

| 维度 | 技术选型 | 版本/说明 |
| --- | --- | --- |
| **运行时** | **Node.js 22 (LTS)** | 提供原生 ESM 支持与高性能异步上下文。 |
| **核心框架** | **Next.js 16.1.x** | 采用 Turbopack 构建，支持 Standalone 模式部署。 |
| **UI 引擎** | **React 19 (Stable)** | 核心利用 Server Actions 与 React Compiler 优化。 |
| **样式引擎** | **Tailwind CSS v4.0** | 采用原生 Oxide 引擎，零运行时开销，编译速度快。 |
| **数据层** | **Drizzle ORM** | 实现从数据库 Schema 到 UI 的全链路类型推导。 |
| **基础设施** | **阿里云全家桶** | 包含 RDS PostgreSQL、OSS 存储、SMS 短信及 ECS 服务器。 |

---

## 3. 物理架构与部署 (Infrastructure)

系统深耕阿里云生态，确保数据的安全合规与极致访问速度。

* **计算层**：Next.js 以 Standalone 模式运行在 ECS 容器中，镜像体积控制在 ~100MB。
* **网络层**：强制开启 **HTTP/3 (QUIC)** 协议，优化工地弱网环境下的数据上传成功率。
* **数据层**：阿里云 RDS PostgreSQL 负责业务数据，配置 7 天 PITR (任意时间点恢复) 备份策略。
* **存储层**：OSS 采用 **STS 临时凭证 + 客户端直传** 方案，避免服务端中转造成的带宽浪费。

---

## 4. 软件架构：Feature-Sliced Design (FSD)

本项目严格遵循 FSD 规范，通过层级隔离规避业务耦合。

### 4.1 分层定义

1. **App Layer**：全局 Provider、样式及路由初始化。
2. **Pages Layer**：路由组合层，负责“组装”各个 Widget。
3. **Widgets Layer**：独立的大型 UI 部件，如订单管理面板。
4. **Features Layer**：**业务交互核心**，存放 Server Actions (如 `createQuote`)。
5. **Entities Layer**：业务模型层，定义 `Order`、`Product` 等数据实体及 RLS 策略。
6. **Shared Layer**：底层 UI 组件库、公用工具函数 (如 `createSafeAction`)。

### 4.2 模块化原则

* **Public API**：模块间只能通过其目录下的 `index.ts` 进行通信，禁止跨切片深度引用。
* **单向依赖**：严禁低层组件依赖高层组件。

---

## 5. 核心计价引擎最佳实践

窗帘业务涉及复杂的物理量计算，所有逻辑必须在 **Shared Layer** 或 **Entities Layer** 定义，严禁散落在 UI 中。

### 5.1 计算公式示例

系统统一使用毫米 (mm) 作为数据库存储单位，计算时遵循：


### 5.2 精确度控制

* 所有货币金额以“分”为单位存储为 `integer`。
* 计算过程中的参数（如褶皱倍率、加工单价）必须在后台可视化调整，严禁硬编码在代码中。

---

## 6. 开发规范与数据安全 (Standardization)

### 6.1 Server Actions 范式

所有 Mutation 必须由 `createSafeAction` 包装，流程如下：

1. **Zod 校验**：严格的输入数据格式检查。
2. **权限校验**：显式调用 `checkPermission`。
3. **事务处理**：跨表写入必须包裹在 `db.transaction` 中。
4. **缓存失效**：成功后立即调用 `revalidatePath` 刷新前端数据缓存。

### 6.2 数据保护策略

* **软删除 (Soft Delete)**：核心业务表统一使用 `deleted_at` 字段。
* **行级权限 (RLS)**：在数据库层级强制执行租户隔离，防止数据越权。
* **审计日志**：关键变更必须记录 `system_logs`。

---

## 7. 开发检查清单 (Self-Checklist)

* [ ] 所有的参数是否都可以在系统中可视化调整？
* [ ] 文档需求是否记录在 `docs/需求.md`，计划是否在 `todolist.md`？
* [ ] 是否完全消除了 `any` 类型的使用？
* [ ] 列表查询参数是否已绑定到 URL Query Parameters？

---

*L2C 项目架构组 | 2026-01-04*
