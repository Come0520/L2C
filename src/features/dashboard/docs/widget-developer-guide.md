# Widget 开发者快速接入指南

> 版本：v1.0 | 最后更新：2026-02-23

---

## 什么是 Widget（微件）？

Dashboard 采用插件化架构，每个数据卡片是一个独立的 **Widget**。
Widget 是一个 React Server Component（RSC），通过 Suspense + 骨架屏实现按需加载。

---

## 新建一个 Widget

### 第 1 步：在 `widgets/` 目录创建组件

```tsx
// src/features/dashboard/widgets/my-widget.tsx
import { Suspense } from 'react';
import { WidgetSkeleton } from '../components/widget-skeleton';
import { getMyData } from '../actions/my-data';

// 数据层（Server Component）
async function MyWidgetContent() {
  const data = await getMyData();
  return (
    <div className="widget-card">
      <h3>{data.title}</h3>
      {/* 渲染内容 */}
    </div>
  );
}

// 导出带 Suspense 包裹的 Widget
export function MyWidget() {
  return (
    <Suspense fallback={<WidgetSkeleton />}>
      <MyWidgetContent />
    </Suspense>
  );
}
```

### 第 2 步：在 Widget 注册表中登记

```typescript
// src/features/dashboard/widget-registry.ts
export const WIDGET_REGISTRY = {
  ...existingWidgets,
  'my-widget': {
    id: 'my-widget',
    name: '我的数据卡片',
    component: MyWidget,
    // 允许查看的角色
    roles: ['admin', 'manager', 'sales'],
    // 默认展示在哪些角色的 Dashboard
    defaultFor: ['admin'],
    // 卡片尺寸：sm/md/lg
    size: 'md',
  },
};
```

### 第 3 步：添加 Error Boundary

每个 Widget 自动由 `widget-error-boundary.tsx` 包裹，无需手动处理顶层崩溃。
但若 Widget 内部有子组件可能出错，需要自行加 try-catch：

```tsx
try {
  const data = await getMyData();
} catch (error) {
  logger.error('[MyWidget] 数据加载失败', error);
  return <EmptyState message="数据加载失败" />;
}
```

---

## 权限控制

Widget 在渲染前自动经过角色检查：

```typescript
// 在 widget-registry 中声明 roles，系统会在 Dashboard 页面根据 session.user.role 过滤
// 如果需要细粒度控制，在 Widget 内部使用 checkPermission()
import { checkPermission } from '@/shared/lib/rbac';
const hasAccess = checkPermission(session, 'analytics:view');
```

---

## 最佳实践

| 规则 | 说明 |
|:---|:---|
| 数据获取在 Server Component | 不要在 Client Component 中调用 Server Action 获取初始数据 |
| 必须有骨架屏 | 所有 Widget 必须提供 `fallback={<WidgetSkeleton />}` |
| 错误降级 | 数据缺失时展示 `<EmptyState>`，不要展示报错信息给用户 |
| 缓存 Tag | 数据 Action 应使用 `revalidateTag` 而非 `revalidatePath` |
