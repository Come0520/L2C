# 罗莱L2C销售管理系统 - API接口设计文档
**版本**：v4.0
**更新日期**：2025-11-28
**架构理念**：Next.js + Supabase BaaS架构，Server Actions为主，Route Handlers为辅

## 🚀 架构升级说明

### v4.0架构升级要点

#### 1. 双层API架构设计
- **第一层（客户端直连）**：Supabase Client
  - **场景**：高频读取、实时订阅、简单CRUD
  - **安全**：依赖Row Level Security (RLS)
  - **优势**：零延迟，减少服务器负载
- **第二层（服务端逻辑）**：Next.js Server Actions & Route Handlers
  - **场景**：复杂业务逻辑、跨表事务、第三方集成、敏感操作
  - **安全**：服务端验证 + Supabase Service Role Key
  - **优势**：类型安全（tRPC/Zod），逻辑封装

#### 2. 性能优化策略
- **缓存机制**：Next.js Data Cache (Fetch API) + Request Memoization
- **静态生成**：关键公共数据使用ISR (Incremental Static Regeneration)
- **数据库优化**：Supavisor连接池 + Postgres索引优化

#### 3. 安全增强
- **Row Level Security (RLS)**：数据库层面的强制访问控制
- **Middleware**：Next.js中间件处理路由保护和重定向
- **Zod验证**：输入数据运行时严格校验

## 🌐 API接口规范标准

### 接口交互模式

#### 1. Server Actions (推荐)
用于处理表单提交和数据变更（Mutations）。
```typescript
// actions/leads.ts
'use server'

export async function createLead(data: CreateLeadSchema) {
  // 1. 验证权限
  // 2. 验证数据 (Zod)
  // 3. 执行数据库操作 (Supabase Client)
  // 4. 重新验证路径 (revalidatePath)
}
```

#### 2. Route Handlers (REST API)
用于Webhook回调、外部系统集成或非React客户端调用。
```
URL模式：https://l2c.luolai.com/api/v1/[resource]
```

### URL设计规范 (Route Handlers)

```
基础URL：https://l2c.luolai.com/api/v1

资源命名：使用复数名词，小写字母，kebab-case
✅ 正确示例：
/api/v1/leads
/api/v1/leads/[id]
/api/v1/webhooks/payment
```

### 响应格式规范 (Route Handlers)

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

错误响应：
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "手机号格式不正确",
    "details": [...]
  }
}
```

## 🔐 认证授权体系

### Supabase Auth集成

#### 认证流程
1. **客户端**：使用 Supabase Auth UI 或 SDK 进行登录。
2. **服务端**：Next.js Middleware 拦截请求，刷新 Session。
3. **数据库**：RLS 策略根据 `auth.uid()` 限制数据访问。

#### 权限控制 (RBAC)
- **存储方式**：`public.profiles` 表或 `auth.users` metadata。
- **验证方式**：
  - 前端：`useUser()` hook 检查角色。
  - 后端：Server Actions 中检查 `supabase.auth.getUser()`。
  - 数据库：RLS 策略 `(auth.jwt() ->> 'role') = 'admin'`。

## 📋 核心业务接口定义 (Server Actions / Route Handlers)

### 1. 用户认证 (Auth)
*主要通过 Supabase Client SDK 直接调用，特殊流程使用 Server Actions*

| 动作 | 描述 | 调用方式 |
|---|---|---|
| `signInWithPassword` | 邮箱密码登录 | Client SDK |
| `signInWithOtp` | 手机验证码登录 | Client SDK |
| `signOut` | 登出 | Client SDK |
| `updateProfile` | 更新个人资料 | Server Action |

### 2. 线索管理 (Leads)

#### 获取线索列表
- **方式**：Server Component (直接查询数据库) 或 Supabase Client
- **权限**：RLS (只能看自己的，或管理员看全部)

#### 创建线索
- **方式**：Server Action `createLead`
- **逻辑**：
  1. 验证输入 (Zod)。
  2. 插入 `leads` 表。
  3. 触发分配逻辑 (Postgres Trigger 或 Edge Function)。
  4. 返回结果并刷新UI。

#### 线索状态流转
- **方式**：Server Action `updateLeadStatus`
- **逻辑**：
  1. 验证状态机合法性。
  2. 更新状态。
  3. 记录操作日志 (`audit_logs` 表)。

### 3. 订单管理 (Orders)

#### 创建订单
- **方式**：Server Action `createOrder`
- **逻辑**：
  1. 开启 Supabase 事务 (RPC 或 Edge Function)。
  2. 扣减库存/锁定资源。
  3. 创建订单主表和明细表。
  4. 生成支付链接 (可选)。

#### 订单查询
- **方式**：Supabase Client (列表) / Server Component (详情)
- **优化**：关联查询 `orders` join `order_items` join `products`。

### 4. 数据报表 (Analytics)
- **方式**：Route Handler `/api/v1/analytics/dashboard`
- **逻辑**：
  1. 执行复杂聚合查询 (Postgres Materialized Views)。
  2. 缓存结果 (Next.js Cache)。
  3. 返回 JSON 数据供前端图表渲染。

### 5. 报价管理 (Quotes)

#### 5.1 报价单主表管理

##### 创建报价
- **方式**：Server Action `createQuote`
- **逻辑**：
  1. 验证权限和输入数据 (Zod)。
  2. 开启事务，创建报价主表记录。
  3. 创建初始版本记录，关联报价主表。
  4. 计算价格，生成报价单号。
  5. 提交事务，返回结果。

##### 获取报价列表
- **方式**：Server Component (直接查询) 或 Route Handler `/api/v1/quotes`
- **逻辑**：
  1. 应用筛选条件 (销售、日期范围等)。
  2. 分页查询报价主表和最新版本信息。
  3. 返回包含客户、项目、最新版本摘要的列表。

##### 获取报价详情
- **方式**：Server Component (直接查询) 或 Route Handler `/api/v1/quotes/[id]`
- **逻辑**：
  1. 查询报价主表基本信息。
  2. 关联查询客户、销售员信息。
  3. 返回报价主表详情，包含版本统计信息。

#### 5.2 报价单版本管理

##### 创建报价单版本
- **方式**：Server Action `createQuoteVersion`
- **逻辑**：
  1. 验证权限和输入数据。
  2. 基于指定版本创建新版本，复制基础信息。
  3. 应用变更，重新计算价格。
  4. 更新报价主表的当前版本号。
  5. 返回新创建的版本信息。

##### 获取报价单版本列表
- **方式**：Server Component (直接查询) 或 Route Handler `/api/v1/quotes/[id]/versions`
- **逻辑**：
  1. 查询指定报价的所有版本记录。
  2. 按版本号降序排序。
  3. 标记最新版本。
  4. 返回版本列表，包含基本信息和状态。

##### 获取特定版本详情
- **方式**：Server Component (直接查询) 或 Route Handler `/api/v1/quotes/[id]/versions/[versionId]`
- **逻辑**：
  1. 查询指定版本的详细信息。
  2. 关联查询客户、项目、销售员信息。
  3. 查询版本关联的报价明细。
  4. 返回完整的版本详情，包含价格计算、折扣、明细等。

#### 5.3 报价单版本状态流转

##### 发布为初稿
- **方式**：Server Action `publishQuoteVersion`
- **逻辑**：
  1. 验证权限和当前状态合法性。
  2. 更新版本状态为 "preliminary"。
  3. 记录提交时间和提交人。
  4. 触发通知 (可选)。

##### 客户确认报价
- **方式**：Server Action `customerConfirmQuoteVersion`
- **逻辑**：
  1. 验证权限和当前状态合法性。
  2. 更新版本状态为 "confirmed"。
  3. 记录客户确认时间和反馈。
  4. 触发后续流程 (可选)。

##### 转换为销售单
- **方式**：Server Action `convertQuoteVersionToOrder`
- **逻辑**：
  1. 验证权限和当前状态合法性。
  2. 开启事务，创建销售单记录。
  3. 将报价明细转换为销售单明细。
  4. 更新报价版本状态为 "converted"，关联销售单ID。
  5. 提交事务，返回销售单信息。

#### 5.4 价格计算

##### 计算报价价格
- **方式**：Server Action `calculateQuotePrice`
- **逻辑**：
  1. 验证输入数据 (产品、规格、数量等)。
  2. 应用定价规则，计算基础价格。
  3. 计算规格加价和定制加价。
  4. 应用折扣规则。
  5. 计算最终价格，返回详细的价格构成。

## 🔧 Webhooks集成

### 外部系统回调
- **路径**：`/api/v1/webhooks/stripe` (示例)
- **验证**：验证签名头部。
- **处理**：异步写入数据库，触发后续流程。

## 📁 数据库交互规范

### Supabase Client使用
```typescript
// 服务端 (Server Actions / Components)
import { createClient } from '@/utils/supabase/server';

// 客户端 (Client Components)
import { createClient } from '@/utils/supabase/client';
```

### 类型生成
使用 Supabase CLI 自动生成 TypeScript 类型：
```bash
supabase gen types typescript --project-id "$PROJECT_ID" > types/supabase.ts
```

## 🎯 设计重点建议
1. **优先使用 RLS**：将安全规则下沉到数据库层。
2. **减少 API 路由**：能用 Server Actions 解决的交互，尽量不写 API 路由。
3. **利用 Postgres 能力**：复杂查询、全文搜索、地理位置查询直接在数据库层解决。
