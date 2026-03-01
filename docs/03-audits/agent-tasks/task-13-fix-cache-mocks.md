# Task 13 返工：修复 unstable_cache 导致的测试 Mock 失效

> **背景**：Task 13 引入 `unstable_cache` 缓存后，4 个测试文件因未添加 `next/cache` mock 而失败（"Quote not found"）。
> 性能优化本身已通过验收，**本次只需修复测试兼容性**。

## ❌ 失败详情

| 失败文件 | 错误信息 | 根因 |
|:---|:---|:---|
| `quote-lifecycle-actions.test.ts` | "Quote not found" | 查询走了 `unstable_cache` 壳，mock 被绕过 |
| `audit-integration.test.ts` | "Quote not found" | 同上 |
| 另外 2 个文件 | 待确认（可能同源） | 同上 |

## 根因分析

在 `queries.ts` 中，你将 `getQuotes` 和 `getQuote` 改为了通过 `unstable_cache` 包裹：

```typescript
const getCachedQuotes = unstable_cache(
  async (...) => { /* 实际查询 */ },
  ['quotes'],
  { revalidate: 60 }
);
```

但部分测试文件没有 mock `next/cache` 模块，导致 `unstable_cache` 在测试环境中尝试使用不存在的 `incrementalCache`，查询返回 undefined，最终报 "Quote not found"。

## 修复方法

### 已成功的参考（你在这两个文件中已经做对了）

`queries.test.ts` 和 `security.test.ts` 中已经正确添加了以下 mock：
```typescript
vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn) => fn),
}));
```

### 需要修复的文件

在以下失败文件的**顶部 import 区域之后**，添加完全相同的 mock：

1. **`src/features/quotes/actions/__tests__/quote-lifecycle-actions.test.ts`**
2. **`src/features/quotes/actions/__tests__/audit-integration.test.ts`**

同时检查其他可能受影响的测试文件（如果有调用 `getQuote` / `getQuotes` 的）：
3. 检查 `src/features/quotes/actions/__tests__/` 下所有文件
4. 如果某个文件导入了 `queries.ts` 中的函数但没有 mock `next/cache`，一律添加

### 添加位置与格式

```typescript
// 文件顶部 import 之后，describe 之前
vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn) => fn),
}));
```

> 这行代码的作用是让 `unstable_cache` 直接透传原始函数，等同于不走缓存，使 mock 链路恢复正常。

## 验收标准

1. 运行 `npx vitest run src/features/quotes` **全部通过**（0 个失败）
2. `npx tsc --noEmit` 零错误
3. **不得删除或修改任何生产代码**，只修改测试文件中的 mock

## 交付说明
完成后宣告"Task 13 返工完成"，汇报修复了哪些文件。
