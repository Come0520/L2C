# 任务 7：公共列表 Hook 提取

## 任务概述

从多个列表页面中提取重复的分页加载逻辑为可复用的 `usePaginatedList` Hook，并将至少 2 个页面重构为使用此 Hook。

## 项目上下文

- **项目路径**：`miniprogram-taro/`
- **技术栈**：Taro 4.x + React 18 + TypeScript + Zustand
- **API 层**：`src/services/api.ts` — `api.get<T>(url, options)` 返回 `{ success, data, error }`
- **注释语言**：所有代码注释必须使用中文

### 现有列表页的公共模式

以下页面都有**几乎相同**的分页逻辑（以 `quotes/index.tsx` 为例）：

```typescript
const [list, setList] = useState<Quote[]>([]);
const [loading, setLoading] = useState(false);
const [hasMore, setHasMore] = useState(true);
const [keyword, setKeyword] = useState('');
const pageRef = useRef(1);

const fetchList = async (reset = false) => {
  if (loading) return;
  if (reset) {
    pageRef.current = 1;
    setHasMore(true);
  }
  if (!hasMore && !reset) return;
  setLoading(true);
  const res = await api.get('/miniprogram/quotes', {
    data: { page: pageRef.current, pageSize: 10, keyword },
  });
  if (res.success) {
    const items = res.data?.items || [];
    setList(reset ? items : [...list, ...items]);
    setHasMore(items.length >= 10);
    pageRef.current++;
  }
  setLoading(false);
};

useDidShow(() => fetchList(true));
usePullDownRefresh(() => {
  fetchList(true);
  Taro.stopPullDownRefresh();
});
useReachBottom(() => fetchList());
```

**涉及的列表页面**（均有此模式）：

- `src/pages/quotes/index.tsx`
- `src/pages/crm/index.tsx`
- `src/pages/orders/index.tsx`
- `src/pages/leads/index.tsx`
- `src/pages/service/list/index.tsx`

## 交付物

### 1. 创建 `src/hooks/usePaginatedList.ts`

````typescript
/**
 * 通用分页列表 Hook
 *
 * @description 从列表页面提取的公共分页/搜索/下拉刷新/触底加载逻辑。
 * 消除各列表页面重复的状态管理和数据获取代码。
 *
 * @template T 列表项类型
 *
 * @example
 * ```tsx
 * const { list, loading, hasMore, keyword, setKeyword, refresh, loadMore } =
 *   usePaginatedList<Quote>({
 *     apiPath: '/miniprogram/quotes',
 *     pageSize: 10,
 *     extraParams: { status: 'active' },
 *   })
 * ```
 */

import { useState, useRef, useCallback } from 'react';
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from '@tarojs/taro';
import { api } from '@/services/api';

interface UsePaginatedListOptions {
  /** API 路径（不含 BASE_URL） */
  apiPath: string;
  /** 每页数量，默认 10 */
  pageSize?: number;
  /** 额外请求参数 */
  extraParams?: Record<string, any>;
  /** 是否在 useDidShow 时自动刷新，默认 true */
  autoRefresh?: boolean;
}

interface UsePaginatedListReturn<T> {
  /** 列表数据 */
  list: T[];
  /** 是否正在加载 */
  loading: boolean;
  /** 是否还有更多数据 */
  hasMore: boolean;
  /** 搜索关键字 */
  keyword: string;
  /** 设置搜索关键字 */
  setKeyword: (k: string) => void;
  /** 刷新列表（重置分页） */
  refresh: () => Promise<void>;
  /** 加载更多 */
  loadMore: () => Promise<void>;
}

export function usePaginatedList<T>(options: UsePaginatedListOptions): UsePaginatedListReturn<T> {
  // 实现 ...
}
````

### 2. 重构至少 2 个列表页面

将 `quotes/index.tsx` 和 `crm/index.tsx` 重构为使用 `usePaginatedList`：

**重构前**（quotes）：约 30 行分页逻辑
**重构后**：约 5 行

```typescript
// 重构后的 quotes/index.tsx
const {
  list: quotes,
  loading,
  hasMore,
  keyword,
  setKeyword,
  refresh,
} = usePaginatedList<Quote>({
  apiPath: '/miniprogram/quotes',
  extraParams: currentTab !== 'all' ? { status: currentTab } : undefined,
});
```

### 3. 编写单元测试

创建 `src/hooks/__tests__/usePaginatedList.test.ts`，至少包含：

| 用例 | 描述                                       |
| :--- | :----------------------------------------- |
| 1    | 初始状态应为空列表、非加载、有更多         |
| 2    | `refresh()` 应调用 API 并设置列表数据      |
| 3    | `loadMore()` 应追加数据到现有列表          |
| 4    | 数据不足一页时 `hasMore` 应为 false        |
| 5    | 加载中时不应重复请求                       |
| 6    | `setKeyword` 后 `refresh` 应携带关键字参数 |

> **注意**：由于 Hook 依赖 Taro 生命周期，测试中需用 `renderHook` 或手动调用方式。

## 约束

- **不修改** `api.ts` 源码
- 重构后的页面功能和行为必须与重构前完全一致
- Hook 应足够通用，不包含特定页面的业务逻辑
- 未重构的页面保持原样（后续可逐步迁移）

## 验证标准

```bash
cd miniprogram-taro && npx jest src/hooks/__tests__/usePaginatedList.test.ts
# 输出：1 test suite, 6 tests passed

cd miniprogram-taro && npx taro build --type weapp
# 编译无错误

# 手动验证：报价列表和 CRM 列表的搜索/分页/下拉刷新功能正常
```
