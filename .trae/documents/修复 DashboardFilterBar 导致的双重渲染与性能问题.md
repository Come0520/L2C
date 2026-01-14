**修复 DashboardFilterBar 组件的性能问题**

1. **重构** **`src/shared/ui/dashboard-filter-bar.tsx`**:

   * 移除导致循环更新的复杂 `useEffect`。

   * 添加 `useEffect` 监听 `searchParams.get('search')`，仅在 URL 搜索参数实际改变时更新本地 `searchValue`。

   * 添加 `useEffect` 监听本地 `searchValue`，使用 400ms 防抖逻辑调用 `onSearchChange` 或更新 URL。

   * 确保两个 Effect 互不干扰，打破“URL更新 -> 触发搜索 -> URL更新”的死循环。

2. **验证**:

   * 确认修改后，切换 Tab 不再触发额外的搜索请求。

   * 确认搜索输入流畅，且能正确同步到 URL。

