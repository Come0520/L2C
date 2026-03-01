# Task 13: Quotes 模块性能优化冲刺 (D8: 7 → 9)

> **目标**：将 Quotes 报价单模块的性能维度从 7 分提升至 9 分，目标是 L5 级。

## 背景与痛点
当前 D8 性能只有 7 分，主要问题：
- **无显式缓存策略**：高频读取（报价配置、商品配置）每次都重新查询
- **潜在 N+1 查询**：尚未经过系统审计
- **大型组件未优化**：`quote-detail.tsx`（~30KB）无 memo 包裹可能频繁重渲染

## 工作目录范围
- `src/features/quotes/actions/` 目录
- `src/features/quotes/components/` 目录（限于 React 性能优化，不改业务逻辑）

## 任务清单

### 任务 1：引入缓存策略（最大单项提升）
使用 Next.js `unstable_cache` 为以下**高频、低变动**的只读数据添加缓存：

```typescript
// 示例：报价配置查询缓存
export const getCachedQuoteConfig = unstable_cache(
  async (tenantId: string) => {
    return await db.query.quoteConfigs.findFirst({ where: eq(quoteConfigs.tenantId, tenantId) });
  },
  ['quote-config'],
  { revalidate: 60, tags: [`quote-config-${tenantId}`] }
);
```

需要缓存的查询：
- `getQuoteConfig` / `getQuoteSettings` 等配置类查询
- `getProductCategories`（如在 quotes 中调用）
- 静态的税率、单位等枚举数据查询

### 任务 2：消除 N+1 查询
系统审计以下文件，排查循环内调用数据库的情况：
- `src/features/quotes/quote.service.ts`
- `src/features/quotes/actions/` 下的所有文件

**常见 N+1 模式**：
```typescript
// ❌ 危险：逐条查询
for (const item of items) {
  const product = await db.query.products.findFirst({ where: eq(products.id, item.productId) });
}

// ✅ 安全：批量查询
const productIds = items.map(i => i.productId);
const products = await db.select().from(productsTable).where(inArray(products.id, productIds));
```

### 任务 3：React 组件性能优化
以下大型/频繁渲染组件添加 `React.memo` 或使用 `useMemo`/`useCallback`：
- `QuoteItemsTable` 或类似的大型列表组件（渲染大量行时容易触发不必要的重渲染）
- 报价汇总计算函数（使用 `useMemo` 缓存计算结果，避免在每次渲染时重新计算）

**注意**：只处理确实存在性能问题的组件，不要过度 memo 化。

### 任务 4：评估代码分割可行性
查看 Quotes 功能的主要入口组件（`quote-detail.tsx` 等），评估是否可用 `React.lazy` 对次级面板（如 PDF 预览、版本历史）做动态加载。如可行则实施，如不确定请备注说明并跳过。

## 验收标准
1. 至少 2 处高频查询添加了 `unstable_cache` 缓存
2. N+1 查询排查报告（记录哪些地方存在/已修复）
3. `npx tsc --noEmit` 零错误
4. `npx vitest run src/features/quotes` 全部通过

## 交付说明
完成后宣告"Task 13 完成"，汇报缓存新增位置和 N+1 修复情况。
