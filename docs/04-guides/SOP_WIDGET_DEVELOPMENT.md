# Widget 开发与注册标准操作指南 (SOP)

本指南旨在规范工作台 (Workbench) 模块中 Widget 的新增与维护流程，确保系统的高内聚、低耦合以及良好的横向扩展性。

## 1. 核心流程概览

新增一个 Widget 通常需要遵循以下四个步骤：

1. **类型定义**：在 `types.ts` 中注册新的 Widget ID。
2. **组件实现**：编写业务逻辑组件。
3. **元数据注册**：在 `registry.tsx` 中配置名称、权限及尺寸。
4. **懒加载映射**：在 `widget-renderer.tsx` 中建立动态导入。

---

## 2. 详细步骤说明

### 2.1 类型定义 (Type Definition)

在 `src/features/dashboard/types.ts` 的 `WidgetType` 联合类型中添加你的 ID。

```typescript
export type WidgetType = 'existing-widget' | 'your-new-widget'; // 新增此处
```

### 2.2 组件实现 (Component Implementation)

- **存放位置**：根据所属业务领域存放在 `src/features/dashboard/widgets/` 下对应的模块中（如 `sales-widgets.tsx`）。
- **设计标准**：
  - 使用 `shared/ui` 下的高级组件（如 `Card`）。
  - 数据获取优先使用 Server Actions。
  - 必须包含响应式处理，确保在不同 `w` (宽度) 下的显示效果。

### 2.3 元数据注册 (Metadata Registry)

编辑 `src/features/dashboard/widgets/registry.tsx` 中的 `WIDGET_REGISTRY` 对象：

```typescript
'your-new-widget': {
    type: 'your-new-widget',
    title: '组件标题',
    description: '组件详细描述',
    icon: YourIcon, // 基于 lucide-react
    iconColor: 'text-blue-500',
    permissions: ['ROLE_A', 'ROLE_B'], // 权限白名单
    defaultSize: { w: 2, h: 2 }, // 在网格中的默认占位 (1-4)
},
```

### 2.4 懒加载映射 (Lazy Loading)

编辑 `src/features/dashboard/widgets/widget-renderer.tsx` 中的 `WIDGET_COMPONENTS` 对象：

```typescript
'your-new-widget': React.lazy(() => import('./your-module').then(m => ({ default: m.YourNewWidget }))),
```

---

## 3. L4 规范要求

为符合 L4 级别健壮性要求，所有新增 Widget 必须：

1. **自带骨架屏 (Skeleton)**：在 `React.Suspense` 触发时提供良好的视觉过渡。
2. **异常隔离**：Widget 内部的错误不应导致整个仪表盘 white-screen（利用已有错误处理逻辑或 `ErrorBoundary`）。
3. **权限校验**：通过 `permissions` 数组严格限定可见角色，防止越权。
4. **性能优化**：必须使用懒加载，减少首屏入口文件的体积。

## 4. 维护说明总结

- **图标更新**：统一从 `lucide-react` 导出并配置颜色原子类。
- **样式指南**：遵循 `glass-liquid` 或 `glass-morph` 视觉风格。
