---
name: frontend-dev-guidelines
description: 基于 React 19 + Next.js 16 官方文档的前端开发规范。在编写任何前端页面、组件或 Server Action 之前，必须阅读并遵循本规范。
---

# L2C 前端开发规范

> **技术栈**: React 19 · Next.js 16 (App Router) · Tailwind CSS v4 · Radix UI (shadcn/ui) · Sonner · Drizzle ORM
>
> 本规范所有条目均源自 [React 官方文档](https://react.dev) 和 [Next.js 官方文档](https://nextjs.org/docs)，非自创约定。

---

## 1. 组件模型：Server Components vs Client Components

### 1.1 默认使用 Server Components

Next.js App Router 中所有组件**默认为 Server Component**。只有在需要以下能力时，才添加 `'use client'` 指令：

- 使用 Hooks（`useState`、`useEffect`、`useRef` 等）
- 使用浏览器 API（`window`、`localStorage`、`IntersectionObserver` 等）
- 使用事件监听器（`onClick`、`onChange` 等）

```tsx
// ✅ Server Component（默认，无需任何指令）
export default async function OrderPage() {
  const orders = await getOrders();
  return <OrderList orders={orders} />;
}

// ✅ Client Component（需要交互时才声明）
('use client');
export function OrderFilter({ onFilter }: Props) {
  const [keyword, setKeyword] = useState('');
  // ...
}
```

### 1.2 Server Component 的优势（官方原文）

- **直接访问后端资源**：数据库、文件系统、内部服务
- **零客户端 JS 开销**：不增加客户端 Bundle 体积
- **安全性**：Token、API Key 等敏感信息不暴露给客户端

### 1.3 组合模式

Server Component 可以渲染 Client Component，但反过来不行。当 Client Component 需要包含服务端内容时，使用 `children` 插槽模式：

```tsx
// ✅ 正确：Server Component 通过 children 嵌入 Client 容器
// layout.tsx (Server Component)
import { Sidebar } from './sidebar'; // Client Component

export default function Layout({ children }) {
  return <Sidebar>{children}</Sidebar>;
}
```

---

## 2. 数据获取

### 2.1 优先级（官方推荐顺序）

| 优先级      | 方式                                 | 使用场景                             |
| ----------- | ------------------------------------ | ------------------------------------ |
| **1️⃣ 首选** | Server Component `async/await`       | 页面加载数据、列表、详情             |
| **2️⃣ 流式** | Server → Client 传 Promise + `use()` | 需要 Suspense 流式渲染的交互组件     |
| **3️⃣ 补充** | React Query / SWR                    | 长轮询、WebSocket 等纯客户端实时场景 |

### 2.2 首选：Server Component 直接获取

```tsx
// ✅ 官方首选：Server Component 中直接 async/await
export default async function LeadDetailPage({ params }) {
  const { id } = await params;
  const lead = await getLeadById(id); // 直接调用 Drizzle ORM

  if (!lead) notFound();
  return <LeadDetail lead={lead} />;
}
```

### 2.3 流式传递：use() API（React 19）

当 Server Component 中 `await` 会阻塞整个页面渲染时，改用**传 Promise + `use()` 解析**模式，实现流式加载：

```tsx
// ✅ React 19 官方推荐：流式数据传递
// page.tsx（Server Component）
import { Suspense } from 'react';
import { OrderList } from './order-list';

export default function OrdersPage() {
  // 不 await，直接传 Promise
  const ordersPromise = getOrders();
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrderList ordersPromise={ordersPromise} />
    </Suspense>
  );
}

// order-list.tsx（Client Component）
('use client');
import { use } from 'react';

export function OrderList({ ordersPromise }: { ordersPromise: Promise<Order[]> }) {
  const orders = use(ordersPromise); // 客户端解析 Promise
  return (
    <ul>
      {orders.map((o) => (
        <li key={o.id}>{o.name}</li>
      ))}
    </ul>
  );
}
```

> **官方说明**：在 Server Component 中用 `await` 会阻塞该组件的渲染直到数据返回。传 Promise 给 Client Component 配合 `use()` 则不会阻塞 Server Component 的渲染。

### 2.4 React Query 降级使用

仅在以下场景使用 `@tanstack/react-query`：

- 客户端轮询 / 实时搜索建议
- 复杂的乐观更新 (Optimistic Update) 场景
- WebSocket 数据同步

**禁止**将 React Query 作为常规页面数据获取的首选方案。

---

## 3. 数据变更：Server Actions

### 3.1 定义 Server Action

使用 `'use server'` 指令标记。文件统一放在 `features/<module>/actions/` 目录下：

```ts
// features/orders/actions/order-actions.ts
'use server'

import { db } from '@/shared/api/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, '订单名称不能为空'),
})

// 返回值模式：{ success, data?, error? }
export async function createOrder(prevState: unknown, formData: FormData) {
  const validated = schema.safeParse({
    name: formData.get('name'),
  })

  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message }
  }

  const [order] = await db.insert(orders).values({ ... }).returning()
  revalidatePath('/orders')
  return { success: true, data: order }
}
```

### 3.2 客户端调用：useActionState（React 19 核心）

**这是 React 19 官方强推的表单状态管理方案**，替代手写 `useState(isLoading)` + `useTransition`：

```tsx
'use client';
import { useActionState } from 'react';
import { createOrder } from '../actions/order-actions';

export function CreateOrderForm() {
  // useActionState 返回三个值：
  // state  - Action 的返回值（即 { success, error? }）
  // action - 绑定到 <form action> 的函数
  // pending - 是否正在提交（替代 useState(isLoading)）
  const [state, action, pending] = useActionState(createOrder, null);

  return (
    <form action={action}>
      <input name="name" placeholder="订单名称" />
      <button disabled={pending}>{pending ? '提交中...' : '创建订单'}</button>
      {state?.error && <p className="text-red-500">{state.error}</p>}
    </form>
  );
}
```

### 3.3 何时保留 react-hook-form

`useActionState` 适合简单到中等复杂度的表单。以下场景继续使用 `react-hook-form`：

- 动态数组字段（`useFieldArray`）
- 复杂嵌套对象验证
- 多步骤向导表单 (Wizard Form)
- 需要实时字段级别验证反馈

使用 `react-hook-form` 时，仍应通过 `useTransition` 包装 Server Action 调用：

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { useTransition } from 'react';
import { updateProduct } from '../actions/product-actions';
import { toast } from 'sonner';

export function ProductForm({ product }) {
  const form = useForm({ defaultValues: product });
  const [isPending, startTransition] = useTransition();

  const onSubmit = form.handleSubmit((data) => {
    startTransition(async () => {
      const result = await updateProduct(product.id, data);
      if (result.success) {
        toast.success('保存成功');
      } else {
        toast.error(result.error);
      }
    });
  });

  return <form onSubmit={onSubmit}>...</form>;
}
```

---

## 4. 缓存策略

### 4.1 同请求去重：React.cache()

**官方说明**：`cache` 仅适用于 Server Components。当同一次渲染中多个组件需要相同的数据时，用 `cache()` 避免重复查询：

```ts
// shared/data/queries.ts
import { cache } from 'react';
import { db } from '@/shared/api/db';

// ✅ 同一请求内，多个组件调用 getUser('xxx') 只会执行一次查询
export const getUser = cache(async (userId: string) => {
  return db.select().from(users).where(eq(users.id, userId));
});
```

> **注意**：`React.cache()` 的缓存范围是**单次服务器请求**，请求结束后自动失效。不同请求之间不共享缓存。

### 4.2 跨请求缓存：unstable_cache

用于需要跨请求持久化的数据（如配置字典、产品列表等）：

```ts
import { unstable_cache } from 'next/cache';

export const getCachedProducts = (tenantId: string) =>
  unstable_cache(
    async () => {
      return db.select().from(products).where(eq(products.tenantId, tenantId));
    },
    [`products-${tenantId}`],
    { tags: ['products', `products-${tenantId}`] }
  );
```

### 4.3 缓存失效

```ts
import { revalidatePath, revalidateTag } from 'next/cache';

// 按路径失效
revalidatePath('/products');

// 按标签失效（更精细）
revalidateTag(`products-${tenantId}`);
```

### 4.4 缓存层级总览

| 层级       | 机制                             | 生命周期         | 用途             |
| ---------- | -------------------------------- | ---------------- | ---------------- |
| 同请求去重 | `React.cache()`                  | 单次请求         | ORM 查询去重     |
| 持久化缓存 | `unstable_cache`                 | 跨请求，手动失效 | 字典、配置、列表 |
| 路由缓存   | `loading.tsx` + Full Route Cache | 路由级           | 页面级骨架屏     |

---

## 5. 错误处理

### 5.1 两层策略（官方推荐）

| 类型           | 处理方式                 | 示例                               |
| -------------- | ------------------------ | ---------------------------------- |
| **预期错误**   | Server Action **返回值** | 表单验证失败、权限不足、记录不存在 |
| **非预期异常** | `error.tsx` 错误边界     | 数据库连接失败、运行时崩溃         |

### 5.2 预期错误：返回值模式

**官方明确指出**：预期的错误不要使用 `throw`，应该作为返回值传递：

```ts
// Server Action 中
export async function createLead(prevState: unknown, formData: FormData) {
  // 预期错误 → 返回，不 throw
  if (!validated.success) {
    return { success: false, error: '表单验证失败' }
  }

  // 非预期异常 → 让它自然 throw，交给 error.tsx
  const [lead] = await db.insert(leads).values({ ... }).returning()
  return { success: true, data: lead }
}
```

### 5.3 非预期异常：error.tsx

在关键路由段放置 `error.tsx` 作为错误边界：

```tsx
// app/(main)/orders/error.tsx
'use client';

export default function OrderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className="text-xl font-bold">订单模块出错了</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="mt-4">
        重试
      </button>
    </div>
  );
}
```

### 5.4 Toast 反馈

使用 **Sonner** 进行轻量级操作反馈：

```tsx
import { toast } from 'sonner';

// 成功
toast.success('订单创建成功');

// 错误
toast.error('创建失败：' + result.error);

// 加载中
toast.loading('正在处理...');
```

---

## 6. 加载状态与 Suspense

### 6.1 路由级加载：loading.tsx

```tsx
// app/(main)/orders/loading.tsx
export default function OrdersLoading() {
  return <OrdersSkeleton />;
}
```

### 6.2 组件级加载：Suspense

```tsx
import { Suspense } from 'react';

export default async function DashboardPage() {
  return (
    <div>
      <h1>仪表盘</h1>
      <Suspense fallback={<ChartSkeleton />}>
        <SalesChart />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />
      </Suspense>
    </div>
  );
}
```

---

## 7. UI 与样式规范

### 7.1 技术栈

| 用途       | 工具                       |
| ---------- | -------------------------- |
| CSS 框架   | Tailwind CSS v4            |
| 组件库     | Radix UI（通过 shadcn/ui） |
| 图标       | Lucide React               |
| Toast 通知 | Sonner                     |
| 动画       | Framer Motion / GSAP       |

### 7.2 组件使用原则

- 优先使用 `src/shared/ui/` 下的 shadcn 组件
- 新增 UI 组件使用 `npx shadcn@latest add <component>` 安装
- 禁止安装 MUI、Ant Design 等重型 UI 库

### 7.3 响应式设计

使用 Tailwind 的移动端优先断点：

```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{/* 内容 */}</div>
```

---

## 8. 项目结构

```
src/
├── app/                      # Next.js App Router 路由
│   ├── (main)/               # 主布局分组
│   │   ├── orders/
│   │   │   ├── page.tsx      # 页面入口（Server Component）
│   │   │   ├── loading.tsx   # 路由级加载
│   │   │   └── error.tsx     # 错误边界
│   │   └── layout.tsx
│   └── (auth)/               # 认证布局分组
├── features/                 # 业务功能模块
│   └── orders/
│       ├── actions/          # Server Actions（'use server'）
│       │   ├── order-actions.ts
│       │   └── queries.ts    # 缓存查询函数
│       └── components/       # 模块专属组件
│           ├── order-list.tsx
│           └── order-form.tsx
└── shared/                   # 全局共享
    ├── api/                  # 数据库连接、Schema
    ├── lib/                  # 工具函数
    └── ui/                   # shadcn/ui 组件
```

### 8.1 导入别名

使用 `@/` 前缀指向 `src/` 目录：

```tsx
import { db } from '@/shared/api/db';
import { Button } from '@/shared/ui/button';
import { createOrder } from '@/features/orders/actions/order-actions';
```

---

## 9. 速查清单

在编写新组件/页面时，对照以下清单：

- [ ] 是否需要交互？不需要 → 使用 Server Component（不加 `'use client'`）
- [ ] 数据获取方式？优先 Server Component `async/await`，其次 `use()` 流式传递
- [ ] 表单提交？简单表单用 `useActionState`，复杂表单用 `react-hook-form` + `useTransition`
- [ ] 是否有 `loading.tsx`？确保每个路由段都有加载状态
- [ ] 是否有 `error.tsx`？关键路由段需要错误边界兜底
- [ ] Server Action 返回格式？`{ success: boolean, data?, error? }`
- [ ] 是否用了 `React.cache()` 包装高频 ORM 查询？
