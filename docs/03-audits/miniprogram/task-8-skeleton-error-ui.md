# 任务 8：UI 体验打磨（骨架屏 + 统一错误组件）

## 任务概述

添加骨架屏组件和统一错误展示组件，替代现有的"加载中..."文字和简单 Toast 错误提示，提升用户感知性能和错误体验。

## 项目上下文

- **项目路径**：`miniprogram-taro/`
- **技术栈**：Taro 4.x + React 18 + TypeScript + SCSS Modules
- **设计系统**：`src/styles/_variables.scss` — Apple HIG 设计变量
  - 颜色：`$color-primary: #007AFF`、`$color-bg: #F2F2F7`、`$color-text-secondary: #8E8E93` 等
  - 圆角：`$radius-md: 12px`、`$radius-lg: 16px`
  - 间距：`$spacing-md: 16px`
- **组件库**：`@tarojs/components` 中的 `View`, `Text`, `Image`
- **注释语言**：所有代码注释必须使用中文

## 交付物

### 1. 创建 `src/components/Skeleton/index.tsx` + `index.scss`

**骨架屏组件**，在数据加载中时显示占位动画：

```typescript
/**
 * 骨架屏组件
 *
 * @description 数据加载时的占位动画，提升用户感知性能。
 * 支持列表、卡片、详情三种布局模式。
 */

interface SkeletonProps {
  /** 是否显示骨架屏（true=显示骨架，false=显示 children） */
  loading: boolean;
  /** 骨架行数（列表模式下使用） */
  rows?: number;
  /** 是否显示头像占位 */
  avatar?: boolean;
  /** 布局类型 */
  type?: 'list' | 'card' | 'detail';
  /** 子内容 */
  children?: React.ReactNode;
}
```

**样式要求**：

- 使用 CSS 动画实现呼吸灯（shimmer）效果：从左到右的渐变光波
- 骨架块使用 `$color-bg` 底色，光波使用白色半透明渐变
- 动画周期 1.5s，ease-in-out
- 圆角和间距与设计系统保持一致
- 行高 16px，行间距 12px

**三种布局**：

```
list 模式（默认）：
┌──────────────────────────────┐
│ ████                         │  ← 行 1
│ ████████████████             │  ← 行 2
│ ████████████                 │  ← 行 3
└──────────────────────────────┘

card 模式：
┌──────────────────────────────┐
│ ┌────┐                       │
│ │ 🟫 │  ████████████████     │  ← 头像 + 标题
│ └────┘  ████████████         │  ← 头像 + 副标题
│ ████████████████████████     │  ← 内容行
│ ████████████████             │  ← 内容行
└──────────────────────────────┘

detail 模式：
┌──────────────────────────────┐
│ ████████████████████████████ │  ← 标题（大）
│                              │
│ ████████████████████████     │  ← 段落行
│ ████████████████████████████ │
│ ████████████████             │
│                              │
│ ████████████████████████     │  ← 段落行
│ ████████████████████████████ │
└──────────────────────────────┘
```

### 2. 创建 `src/components/ErrorState/index.tsx` + `index.scss`

**错误状态组件**，统一页面级错误展示：

```typescript
/**
 * 错误状态组件
 *
 * @description 统一的页面级错误展示，替代简单的 Toast 提示。
 * 显示错误图标、标题、描述和重试按钮。
 */

interface ErrorStateProps {
  /** 错误标题，默认"出错了" */
  title?: string;
  /** 错误描述信息 */
  message?: string;
  /** 重试按钮文字，默认"重新加载" */
  retryText?: string;
  /** 重试回调 */
  onRetry?: () => void;
}
```

**样式要求**：

- 垂直居中布局
- 错误图标使用 emoji 或 SVG（😕 或自定义图形）
- 标题字号 18px，`$color-text-primary`
- 描述字号 14px，`$color-text-secondary`
- 重试按钮使用 `$color-primary`，圆角 `$radius-md`

### 3. 在 3 个核心页面引入骨架屏

替换以下页面中的"加载中..."文字为骨架屏组件：

#### `src/pages/workbench/index.tsx`

```typescript
// 替换前
{loading && <Text>加载中...</Text>}

// 替换后
<Skeleton loading={loading} type="card" rows={4}>
  {/* 现有的工作台内容 */}
</Skeleton>
```

#### `src/pages/leads/index.tsx`

```typescript
<Skeleton loading={loading} type="list" rows={5} avatar>
  {/* 现有的线索列表内容 */}
</Skeleton>
```

#### `src/pages/quotes/index.tsx`

```typescript
<Skeleton loading={loading} type="list" rows={4}>
  {/* 现有的报价列表内容 */}
</Skeleton>
```

### 4. 在 1 个页面引入错误组件

选择 `workbench/index.tsx`，在 API 请求失败时显示 `ErrorState`：

```typescript
{error ? (
  <ErrorState
    title="加载失败"
    message={error}
    onRetry={() => fetchDashboard()}
  />
) : (
  <Skeleton loading={loading} type="card" rows={4}>
    {/* 工作台内容 */}
  </Skeleton>
)}
```

## 约束

- 样式必须使用 `_variables.scss` 中的设计变量
- 骨架屏组件必须是通用的，不包含业务逻辑
- CSS 类名使用 BEM 命名（`.skeleton__row`、`.error-state__title`）
- 不使用外部 UI 库（不引入 NutUI 等）
- 不修改页面的数据获取逻辑，仅修改渲染层

## 验证标准

```bash
cd miniprogram-taro && npx taro build --type weapp
# 编译无错误

# 手动验证：
# 1. 工作台页面：加载中显示卡片骨架屏动画
# 2. 线索列表：加载中显示带头像的列表骨架屏
# 3. 报价列表：加载中显示列表骨架屏
# 4. 工作台断网时：显示 ErrorState 组件 + 重试按钮
# 5. 骨架屏呼吸灯动画流畅无卡顿
```
