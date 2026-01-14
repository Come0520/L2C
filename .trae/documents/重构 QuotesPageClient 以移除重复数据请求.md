**目标**: 重构 `QuotesPageClient` 组件，移除冗余的客户端数据获取逻辑，解决双重请求导致的 `net::ERR_ABORTED` 错误。

**步骤**:

1. **修改** **`src/app/(dashboard)/quotes/quotes-page-client.tsx`**:

   * 移除 `useState` 定义的数据状态 (`data`, `total`, `totalPages`, `isLoading`)。

   * 移除 `useState` 定义的筛选状态 (`status`, `page`, `pageSize` 等)，改为直接从 `searchParams` 获取或使用 `initialData` 中的值。

   * 删除 `fetchQuotes` 函数。

   * 删除调用 `fetchQuotes` 的 `useEffect`。

   * 删除 `getQuotes` 和 `getQuoteBundles` 的导入。

   * 更新 `handleTabChange`, `handlePageSizeChange`, `handleSearchChange`, `handleFilterChange` 函数，确保它们只通过 `router.replace` 更新 URL 参数。

   * 修改 JSX 渲染部分，直接使用 `initialData` 中的数据。

**预期结果**:

* 切换 Tab 或筛选时，只触发一次网络请求（Next.js 页面更新）。

* 消除因并发请求导致的 `net::ERR_ABORTED` 错误（除了正常的浏览器取消）。

* 代码量减少，逻辑更清晰，符合 Next.js App Router 最佳实践。

