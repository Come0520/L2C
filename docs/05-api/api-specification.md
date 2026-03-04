# L2C API 规范 (API Specification)

> **版本:** v1.0
> **更新日期:** 2026-03-04
> **状态:** Active
> **适用范围:** 所有 `src/app/api/` 下的路由开发

---

## 1. URL 命名规范

### 1.1 基本原则

- **小写 + 短横线 (kebab-case)**：所有路径段使用小写字母和短横线
- **名词复数**：资源集合使用复数形式
- **层级关系**：通过路径嵌套表达从属关系
- **动作后缀**：非 CRUD 操作使用动词作为子路由

```
✅ /api/miniprogram/leads
✅ /api/miniprogram/leads/[id]/followup
✅ /api/miniprogram/tasks/[id]/check-in
✅ /api/miniprogram/orders/[id]/install-accept

❌ /api/miniprogram/getLeads
❌ /api/miniprogram/lead_list
❌ /api/miniprogram/LeadsList
```

### 1.2 路径分层结构

```
/api/{端} /{业务域} /{资源}  /{标识}  /{动作}
      │       │        │        │       │
      │       │        │        │       └─ 可选: claim, convert, check-in...
      │       │        │        └─ 可选: [id] 动态参数
      │       │        └─ 资源名(复数): leads, orders, tasks...
      │       └─ 可选: engineer, sales (角色专属)
      └─ miniprogram | mobile | workbench | v1 | public
```

### 1.3 端级别分组

| 前缀                | 端         | 认证方式                 | 说明                |
| ------------------- | ---------- | ------------------------ | ------------------- |
| `/api/miniprogram/` | 微信小程序 | JWT (自签发)             | 面向外部 C 端用户   |
| `/api/mobile/`      | 移动端 H5  | JWT (自签发)             | 面向内部员工        |
| `/api/workbench/`   | Web 工作台 | Auth.js Session          | 面向后台管理        |
| `/api/v1/`          | 开放平台   | OAuth Client Credentials | 面向第三方集成      |
| `/api/public/`      | 公开接口   | 无需认证                 | 落地页统计等        |
| `/api/webhooks/`    | 回调通知   | 签名验证                 | 支付宝/微信支付回调 |
| `/api/cron/`        | 定时任务   | 内部调用(Cron Secret)    | 超时检测/报价单过期 |

---

## 2. HTTP 方法使用规范

| 方法     | 用途                  | 幂等性    | 安全性    | 示例                             |
| -------- | --------------------- | --------- | --------- | -------------------------------- |
| `GET`    | 查询资源（列表/详情） | ✅ 幂等   | ✅ 安全   | `GET /leads` 获取线索列表        |
| `POST`   | 创建资源 / 执行操作   | ❌ 非幂等 | ❌ 不安全 | `POST /leads` 创建线索           |
| `PATCH`  | 部分更新资源          | ✅ 幂等   | ❌ 不安全 | `PATCH /leads/[id]` 更新线索信息 |
| `PUT`    | 🚫 **不使用**         | —         | —         | 用 PATCH 替代                    |
| `DELETE` | 🚫 **不使用**         | —         | —         | 用 POST + void/release 替代      |

> [!IMPORTANT]
> 本项目**不使用 PUT 和 DELETE 方法**。全量更新用 PATCH，删除/作废操作通过语义化的 POST 子路由实现（如 `/leads/[id]/void`），以保持操作可审计和可追溯。

---

## 3. 统一响应格式

### 3.1 成功响应

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "code": 200
}
```

### 3.2 错误响应

```json
{
  "success": false,
  "error": "错误描述信息",
  "code": 400,
  "details": { ... }  // 可选，Zod 验证错误详情等
}
```

### 3.3 分页响应

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 156,
      "totalPages": 8
    }
  },
  "code": 200
}
```

### 3.4 响应工厂函数

所有路由**必须**使用 `@/shared/lib/api-response` 中的工厂函数构建响应：

| 函数                                         | HTTP 状态码 | 用途              |
| -------------------------------------------- | ----------- | ----------------- |
| `apiSuccess(data, message?)`                 | 200         | 通用成功          |
| `apiPaginated(items, page, pageSize, total)` | 200         | 分页列表          |
| `apiError(message, code?, details?)`         | 400         | 通用错误          |
| `apiUnauthorized(message?)`                  | 401         | 未登录/Token 失效 |
| `apiForbidden(message?)`                     | 403         | 无权限            |
| `apiNotFound(message?)`                      | 404         | 资源不存在        |
| `apiServerError(message?)`                   | 500         | 服务器内部错误    |
| `apiBadRequest(message?)`                    | 400         | 参数校验失败      |

---

## 4. 认证鉴权规范

### 4.1 Miniprogram / Mobile 端

- **机制**：无状态 JWT Token，通过 HTTP Header `Authorization: Bearer <token>` 传递
- **验证入口**：所有路由**必须**使用 `withMiniprogramAuth()` 高阶函数或 `requireMiniprogramRole()` 进行认证
- **JWT Payload 标准字段**：

```typescript
{
  userId: string;    // 用户 ID
  tenantId: string;  // 租户 ID
  role?: string;     // 用户角色
  type: string;      // Token 类型标识
  iat: number;       // 签发时间
  exp: number;       // 过期时间
}
```

### 4.2 Token 类型

| 类型          | 有效期  | 签发场景                              |
| ------------- | ------- | ------------------------------------- |
| `miniprogram` | 7 天    | 正式登录后签发                        |
| `REGISTER`    | 10 分钟 | 微信授权登录后、注册/绑定前的临时凭证 |
| `TEMP_LOGIN`  | 10 分钟 | 多租户用户选择租户前的过渡凭证        |

### 4.3 角色授权

使用 `withMiniprogramAuth(handler, roles?)` 的第二个参数声明允许访问的角色：

```typescript
// 仅销售、店长、管理员可访问
export const GET = withMiniprogramAuth(async (req, user) => { ... }, ['SALES', 'MANAGER', 'ADMIN']);

// 仅需登录，不限角色
export const GET = withMiniprogramAuth(async (req, user) => { ... });
```

### 4.4 Web 工作台端

- **机制**：Auth.js (NextAuth) Session
- **验证**：通过 `auth()` 获取 Session，校验 `session.user`

---

## 5. 错误码体系

### 5.1 HTTP 状态码规范

| 状态码 | 含义       | 使用场景                       |
| ------ | ---------- | ------------------------------ |
| `200`  | 成功       | GET/POST/PATCH 操作成功        |
| `201`  | 已创建     | 暂不使用，统一用 200           |
| `400`  | 参数错误   | Zod 验证失败、业务规则校验失败 |
| `401`  | 未授权     | Token 缺失、过期或无效         |
| `403`  | 禁止访问   | 角色权限不足                   |
| `404`  | 资源不存在 | 按 ID 查询无结果               |
| `409`  | 冲突       | 手机号已存在、重复操作等       |
| `429`  | 请求过多   | 触发限流规则                   |
| `500`  | 服务器错误 | 未捕获的异常                   |

### 5.2 业务错误码

业务错误通过 `error` 字段的中文消息传达，**不使用自定义数字错误码**。错误消息应当：

- 面向最终用户可读
- 明确说明问题原因
- 在适当时提供操作建议

```json
// ✅ 良好的错误消息
{ "error": "手机号已存在（客户：张三）" }
{ "error": "仅限 SALES/MANAGER 角色使用" }
{ "error": "至少提交一个房间的测量数据" }

// ❌ 不良的错误消息
{ "error": "ERR_001" }
{ "error": "validation failed" }
```

---

## 6. 输入验证规范

### 6.1 Zod Schema

- 所有写操作 (POST/PATCH) **必须**使用 Zod Schema 进行输入验证
- Schema 集中定义在 `miniprogram-schemas.ts` 中
- 每个字段**必须**附加 `.describe()` 注释实现自文档化

```typescript
// ✅ 标准做法
const parsed = CreateLeadSchema.safeParse(body);
if (!parsed.success) {
  return apiError(parsed.error.issues[0].message, 400);
}

// ❌ 禁止直接使用未验证的 body
const { name, phone } = await request.json(); // 危险！
```

### 6.2 查询参数

GET 请求的查询参数通过 `URLSearchParams` 手动提取和校验：

```typescript
const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
```

---

## 7. 分页、过滤与排序

### 7.1 分页参数

| 参数                 | 类型   | 默认值 | 最大值 | 说明                   |
| -------------------- | ------ | ------ | ------ | ---------------------- |
| `page`               | number | 1      | —      | 当前页码（从 1 开始）  |
| `pageSize` / `limit` | number | 20     | 50~100 | 每页条数               |
| `cursor`             | string | —      | —      | 游标分页（深分页场景） |

### 7.2 过滤参数

通过查询字符串传递，命名使用 camelCase：

```
GET /leads?salesId=ME&status=PENDING_FOLLOWUP&intentionLevel=HIGH&search=张
```

### 7.3 排序

默认按 `createdAt DESC` 倒序排列。若需自定义排序，使用 `sort` 参数：

```
GET /leads?sort=createdAt:asc
```

---

## 8. 安全规范

### 8.1 多租户隔离（强制）

所有数据库查询**必须**附加 `tenantId` 条件，禁止裸查询：

```typescript
// ✅ 强制租户隔离
const conditions = [eq(leads.tenantId, user.tenantId)];

// ❌ 禁止 — 可能导致跨租户数据泄露
const rows = await db.query.leads.findMany();
```

### 8.2 数据脱敏

- 手机号在列表接口中必须脱敏：`138****1234`
- 详情接口根据角色权限决定是否返回完整信息

### 8.3 限流防护

高频接口（如 Dashboard、登录）需接入 `RateLimiter`（令牌桶算法）。

### 8.4 幂等控制

订单创建、付款等关键写操作需接入 `IdempotencyGuard`，通过 `X-Request-Id` Header 实现。

---

## 9. 日志与审计

### 9.1 结构化日志

所有路由必须包含：

```typescript
// 成功日志
logger.info('[模块名] 操作描述', { route: '路由标识', userId, tenantId, ...关键参数 });

// 错误日志
logger.error('[模块名] 错误描述', { route: '路由标识', error });
```

### 9.2 审计日志

所有写操作建议记录审计日志（容灾设计 — 审计故障不阻断核心业务）：

```typescript
await AuditService.log(db, {
  tableName: '表名',
  recordId: '记录ID',
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  userId: user.id,
  tenantId: user.tenantId,
  details: { ... },
});
```

---

## 10. 路由文件编码模板

```typescript
/**
 * [业务模块] API
 *
 * GET  /api/miniprogram/xxx — 功能说明
 * POST /api/miniprogram/xxx — 功能说明
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { db } from '@/shared/api/db';
import { withMiniprogramAuth } from '../auth-utils';

export const GET = withMiniprogramAuth(
  async (request: NextRequest, user) => {
    try {
      // 1. 参数提取与校验
      // 2. 租户隔离查询
      // 3. 数据转换与脱敏
      // 4. 结构化日志
      return apiSuccess(data);
    } catch (error) {
      logger.error('[模块] 错误描述', { route: 'xxx', error });
      return apiError('用户可读的错误消息', 500);
    }
  },
  ['SALES', 'MANAGER', 'ADMIN']
); // 角色限制
```

---

## 11. 版本管理策略

| 策略         | 说明                                                   |
| ------------ | ------------------------------------------------------ |
| URL 前缀     | 版本化 API 使用 `/api/v1/`、`/api/v2/` 前缀            |
| 兼容期       | 旧版 API 至少保持 **6 个月**兼容                       |
| 多端独立     | `miniprogram`、`mobile` 端独立迭代，不受版本号约束     |
| 非破坏性变更 | 新增字段不算破坏性变更，可直接添加                     |
| 弃用标记     | 即将弃用的端点在响应 Header 中添加 `Deprecation: true` |
