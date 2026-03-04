# L2C API 设计思路与架构决策 (API Design Philosophy)

> **版本:** v1.0
> **更新日期:** 2026-03-04
> **状态:** Active

---

## 1. 设计理念：API-First

L2C 系统采用 **API-First** 的设计理念 — 即 API 不是 UI 的附属品，而是系统的核心骨架。

**核心要义：**

- API 作为**唯一的数据通道**，无论是 Web 后台、微信小程序还是第三方集成，全部通过 API 层完成数据交互
- 前端是 API 的**消费者**，而非 API 的**驱动者** — API 的设计应面向业务领域，而非某个特定页面
- Server Actions（服务端动作）仅用于 Web 端的内部交互，不对外暴露

```
                    ┌─────────────┐
                    │  Web 后台    │──── Auth.js Session ────┐
                    │  (Next.js)  │                         │
                    └─────────────┘                         │
                    ┌─────────────┐                    ┌────▼─────┐
                    │ 微信小程序   │──── JWT Token ────▶│          │
                    │  (Taro)     │                    │  API 层  │──▶ Drizzle ORM ──▶ PostgreSQL
                    └─────────────┘                    │ (统一网关)│
                    ┌─────────────┐                    │          │
                    │ 第三方系统   │──── OAuth 2.0 ────▶│          │
                    │ (ERP/CRM)   │                    └────┬─────┘
                    └─────────────┘                         │
                                                           ▼
                                                    ┌──────────────┐
                                                    │  领域服务层   │
                                                    │ cache/security│
                                                    │ customer/order│
                                                    └──────────────┘
```

---

## 2. 架构决策记录 (ADR)

### ADR-001：为什么选择 Next.js Route Handlers 而非独立后端

**背景：** L2C 是一个 SaaS 平台，需要同时支撑 Web 后台和多个移动端。

**决策：** 使用 Next.js 内置的 Route Handlers (`src/app/api/`) 作为 API 层，不单独部署 Express/NestJS 后端。

**理由：**

- **单体部署简化运维**：前后端共享同一部署单元，不需要额外的 API 网关
- **全栈类型安全**：前后端共用 TypeScript 类型和 Zod Schema
- **Server Actions 混合**：Web 端可同时使用 Server Actions（零网络开销）和 REST API（跨端复用）
- **渐进式拆分**：未来可将 `/api/v1/` 独立为微服务，无需重写

**代价：** Route Handlers 不支持中间件链式组合，通过 `withMiniprogramAuth()` HOF 模式补偿。

---

### ADR-002：为什么按"端"分组而非按"领域"分组

**背景：** API 路由可以按业务领域（leads/orders/tasks）或按消费端（miniprogram/mobile）组织。

**决策：** 采用**端优先 + 领域次之**的两级分组策略。

```
✅ 当前策略（端优先）:
/api/miniprogram/leads/    ← 小程序端的线索 API
/api/mobile/leads/         ← 移动端的线索 API

❌ 备选方案（领域优先）:
/api/leads/miniprogram/    ← 不直观
/api/leads/?client=mini    ← 需要额外路由判断
```

**理由：**

- 不同端的认证机制不同（JWT vs Session），按端分组可在目录级别统一处理
- 不同端对同一领域的数据需求差异大（小程序看精简列表，后台看完整报表）
- 按端隔离降低了修改某一端 API 时对其他端的影响范围
- 开发者可以明确负责某一端的全部 API

**代价：** 部分业务逻辑在多端间重复。通过 `shared/services/` 服务层抽象公共逻辑来缓解。

---

### ADR-003：为什么不用 PUT 和 DELETE

**背景：** RESTful API 通常使用全部 HTTP 方法（GET/POST/PUT/PATCH/DELETE）。

**决策：** 本项目仅使用 GET/POST/PATCH，禁用 PUT 和 DELETE。

**理由：**

- **PUT 的问题**：PUT 语义要求客户端传递实体的完整表示，容易导致字段意外覆盖。PATCH 更安全，只更新传递的字段
- **DELETE 的问题**：硬删除在业务系统中几乎不可接受（无法审计追溯）。使用语义化的 POST 子路由（如 `/leads/[id]/void`）替代，明确表达业务动作（"作废"而非"删除"）
- **审计友好**：每个变更操作都有明确的业务语义名称（void/release/claim/convert），方便审计日志记录

---

### ADR-004：为什么使用自签 JWT 而非 Auth.js 统一认证

**背景：** 项目 Web 端已使用 Auth.js 进行认证，小程序和移动端也需要认证。

**决策：** 小程序/移动端使用独立的 JWT 自签发机制，不复用 Auth.js。

**理由：**

- Auth.js 的 Session 机制依赖 Cookie，微信小程序不支持浏览器 Cookie
- 小程序端需要微信 OpenID 关联，这是 Auth.js 不原生支持的认证流
- 独立的 JWT 可以精确控制 Token 生命周期（正式 7 天、临时 10 分钟）
- Token Payload 可以嵌入 `tenantId` 和 `role`，减少每次请求的数据库查询

**Token 生命周期设计：**

```
微信登录 → [REGISTER Token, 10min] → 注册/绑定 → [TEMP_LOGIN Token, 10min]
                                                            │
                                        多租户 → 选择租户 ─────┘
                                                            │
                                                  [正式 Token, 7d] → 业务 API
```

---

### ADR-005：为什么 Schema 集中定义而非分散在路由文件中

**背景：** Zod 验证 Schema 可以直接写在路由文件中，也可以集中管理。

**决策：** 所有小程序端 Schema 统一定义在 `miniprogram-schemas.ts` 中。

**理由：**

- **自文档化**：集中的 Schema 文件就是 API 契约文档本身
- **复用**：多个路由可能共享同一 Schema（如 PaginationSchema）
- **一致性**：确保字段命名、验证规则在全业务域保持一致
- **前端同步**：前端团队只需阅读一个文件即可了解全部 API 入参格式

---

### ADR-006：认证双轨制 — HOF vs Result 两种模式

**背景：** 项目中存在两种认证模式。

**现状：**

- `withMiniprogramAuth(handler, roles?)` — 高阶函数 (HOF) 包装器，自动处理认证失败响应
- `requireMiniprogramRole(request, roles)` — 返回 `{success, user/response}` 结果对象

**设计意图：**

- **HOF 模式**：适用于整个路由需要统一认证的场景（推荐默认使用）
- **Result 模式**：适用于认证后需要额外条件判断的复杂场景

**建议：** 新路由优先使用 `withMiniprogramAuth()` HOF 模式，`requireMiniprogramRole()` 作为备选方案。

> [!WARNING]
> 两个文件中 `MiniprogramRole` 类型定义不一致（`auth-utils.ts` 用大写，`middleware.ts` 用小写），需要在后续迭代中统一。

---

## 3. 多端复用策略

### 3.1 三层抽象架构

```
┌──────────────────────────────────────────────────┐
│                     路由层 (Route)                │
│  miniprogram/leads/route.ts                      │
│  mobile/leads/route.ts                           │
│  ↓ 各端独立，处理认证 + 请求解析 + 响应格式化    │
├──────────────────────────────────────────────────┤
│                    服务层 (Service)               │
│  shared/services/miniprogram/customer.service.ts │
│  ↓ 可跨端复用的业务逻辑（脱敏/审计/缓存）       │
├──────────────────────────────────────────────────┤
│                   数据层 (Data Access)            │
│  features/leads/actions/lead-actions.ts          │
│  shared/api/db + Drizzle ORM                     │
│  ↓ 数据库操作（全部强制 tenantId 隔离）          │
└──────────────────────────────────────────────────┘
```

### 3.2 复用规则

| 层级           | 复用方式       | 示例                                                     |
| -------------- | -------------- | -------------------------------------------------------- |
| Zod Schema     | 直接引用       | `import { LoginSchema } from '../miniprogram-schemas'`   |
| Server Actions | 作为服务层调用 | `import { getLeads } from '@/features/leads/actions'`    |
| 服务层         | 跨端共享       | `CustomerService.maskPhone()` 在多端使用                 |
| 响应工具       | 统一导入       | `import { apiSuccess } from '@/shared/lib/api-response'` |

---

## 4. 安全纵深防御架构

L2C 的 API 安全不依赖单一防线，而是构建多层防御体系：

```
請求流入
   │
   │  ① Rate Limiter (令牌桶限流)
   │     └─ 防 CC 攻击、刷单、暴力破解
   │
   │  ② JWT 验证 (withMiniprogramAuth)
   │     └─ Token 签名校验、有效期检查
   │
   │  ③ 角色授权 (RBAC)
   │     └─ 检查用户角色是否在允许列表
   │
   │  ④ Zod Schema 验证
   │     └─ 输入格式、类型、范围校验
   │
   │  ⑤ 租户隔离 (tenantId 强制过滤)
   │     └─ 数据库查询绝不越过租户边界
   │
   │  ⑥ 幂等控制 (IdempotencyGuard)
   │     └─ 关键写操作防重复提交
   │
   │  ⑦ 数据脱敏 (Masking)
   │     └─ 手机号等敏感信息按角色脱敏
   │
   │  ⑧ 审计日志 (AuditService)
   │     └─ 变更操作全程记录（容灾设计）
   │
   ▼
  响应返回
```

### 各层失败时的行为

| 防线     | 失败响应                | 影响范围 |
| -------- | ----------------------- | -------- |
| 限流     | `429 Too Many Requests` | 请求级   |
| JWT      | `401 Unauthorized`      | 请求级   |
| RBAC     | `403 Forbidden`         | 请求级   |
| Schema   | `400 Bad Request`       | 字段级   |
| 租户隔离 | 返回空数据集            | 数据级   |
| 幂等控制 | 返回上次结果            | 操作级   |
| 审计故障 | **不阻断核心业务**      | 监控级   |

---

## 5. 未来演进方向

### 5.1 短期优化（1-3 个月）

- **统一 `MiniprogramRole` 类型定义**：消除大小写不一致
- **补充 OpenAPI/Swagger 文档**：基于 Zod Schema 自动生成
- **Mobile 端测试补齐**：从 1 个测试文件扩展到全覆盖

### 5.2 中期演进（3-6 个月）

- **GraphQL 网关层**：为复杂聚合查询提供 GraphQL 接口
- **API 网关独立**：将 `/api/v1/` 开放平台 API 拆分为独立服务
- **事件驱动集成**：扩展 Webhook 支持更多业务事件

### 5.3 长期愿景（6-12 个月）

- **gRPC 内部通信**：微服务间高性能通信
- **API Marketplace**：向合作伙伴开放 API 订阅和自助对接
