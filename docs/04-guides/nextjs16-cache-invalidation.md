# Next.js 16 缓存失效最佳实践

> **起因**：报价单模块因错误使用 `revalidateTag` 导致缓存不刷新（添加/删除商品后界面不更新、金额显示 ¥0.00）。  
> **根因**：Next.js 16 中 `revalidateTag` 行为变更为 SWR 模式，不再立即清除缓存。

---

## 核心 API 对比

| API                           | 行为                                  | 适用场景                 | 示例                            |
| ----------------------------- | ------------------------------------- | ------------------------ | ------------------------------- |
| `updateTag(tag)`              | **立即删除缓存条目**                  | Server Action 中的写后读 | `updateTag('quotes')`           |
| `revalidateTag(tag, profile)` | **SWR**：标记 stale，首次仍返回旧数据 | 博客/CMS 等可容忍延迟    | `revalidateTag('posts', 'max')` |
| `revalidatePath(path)`        | 清除整条路由的 Full Route Cache       | 导航到新页面             | `revalidatePath('/quotes')`     |

> [!CAUTION]
> **`revalidateTag` 不再等同于"立即刷新"！** 使用它会导致用户在 Server Action 后仍看到旧数据。
> 对于 Server Action，**必须使用 `updateTag`**。

---

## ✅ 正确用法

### Server Action 中（写后读场景）

```typescript
'use server';
import { revalidatePath, updateTag } from 'next/cache';

export async function createItem(data: FormData) {
  await db.insert(items).values({ ... });

  // ✅ 正确：立即清除缓存
  updateTag('items');
  revalidatePath('/items');
}
```

### 非紧急场景（CMS/博客）

```typescript
// ✅ SWR 模式：用户短暂看到旧数据，后台静默更新
revalidateTag('blog-posts', 'max');
```

---

## ❌ 常见错误

```typescript
// ❌ 错误 1：SWR 模式，首次请求仍返回旧数据
revalidateTag('quotes', 'default');

// ❌ 错误 2：空 tag 不会匹配任何缓存条目
revalidateTag('', 'default');

// ❌ 错误 3：单参数调用已废弃
revalidateTag('quotes');
```

---

## 项目待修复清单

以下模块仍在使用 `revalidateTag(tag, 'default')`，需在后续版本中逐步迁移至 `updateTag`：

| 模块                   | 文件数 | 影响                   |
| ---------------------- | ------ | ---------------------- |
| `service/installation` | ~10 处 | 安装工单状态不即时刷新 |
| `service/measurement`  | ~7 处  | 测量任务状态延迟       |
| `supply-chain`         | ~5 处  | 库存/采购数据延迟      |
| `showroom`             | ~5 处  | 展厅商品编辑延迟       |
| `products`             | ~6 处  | 产品/套餐管理延迟      |
| `settings`             | ~4 处  | 系统设置更新延迟       |
| `sales`                | ~3 处  | 销售目标数据延迟       |

> [!IMPORTANT]
> 特别注意：大量使用 `revalidateTag('', 'default')` 的调用**完全无效**（空 tag 不匹配任何缓存）。

---

## 测试 Mock 更新

测试中 mock `next/cache` 时，需同时 mock `updateTag`：

```typescript
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(), // ← 新增
  unstable_cache: vi.fn((fn) => fn),
}));
```

---

## 参考

- [Next.js Docs: updateTag](https://nextjs.org/docs/app/api-reference/functions/updateTag)
- [Next.js Docs: revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- 本项目类型定义：`node_modules/next/dist/server/web/spec-extension/revalidate.d.ts`
