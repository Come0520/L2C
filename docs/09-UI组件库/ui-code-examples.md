# UI 开发代码示例

> 快速参考指南 - 主题化开发最佳实践

---

## 🎨 场景 1: 创建主题化卡片

### ✅ 推荐写法

```tsx
import { PaperCard } from '@/components/ui/paper-card';

export function MyFeatureCard() {
  return (
    <PaperCard padding="md" hover>
      <PaperCard.Title>功能标题</PaperCard.Title>
      <PaperCard.Description>
        这是一个描述性文字
      </PaperCard.Description>
      <PaperCard.Content>
        <p className="text-theme-text-secondary mt-2">
          详细内容文字
        </p>
      </PaperCard.Content>
    </PaperCard>
  );
}
```

**优点**：
- 自动适配三种主题
- 使用语义化组件
- 代码简洁易读

### ❌ 避免写法

```tsx
export function MyFeatureCard() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg">
      <h3 className="text-xl font-semibold text-gray-900">功能标题</h3>
      <p className="text-sm text-gray-500">这是一个描述性文字</p>
      <p className="text-gray-600 mt-2">详细内容文字</p>
    </div>
  );
}
```

**问题**：
- 硬编码白色背景（无法适配暗色主题）
- 使用 gray-* 固定颜色
- 代码冗长且难维护

---

## 📱 场景 2: 响应式布局

### ✅ 推荐写法（移动优先）

```tsx
export function ResponsiveGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <PaperCard padding="sm">
        <h3 className="text-lg md:text-xl">内容</h3>
      </PaperCard>
      {/* 更多卡片 */}
    </div>
  );
}
```

**说明**：
- 默认单列（移动端）
- md（768px）以上2列
- lg（1024px）以上3列
- 间距也响应式

### ❌ 避免写法（桌面优先）

```tsx
export function ResponsiveGrid() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-6 md:gap-4">
      {/* ❌ 反向的断点逻辑 */}
    </div>
  );
}
```

---

## 🔘 场景 3: 主题化按钮

### ✅ 推荐写法

```tsx
import { PaperButton } from '@/components/ui/paper-button';

export function ActionButtons() {
  return (
    <div className="flex gap-2">
      <PaperButton variant="primary">
        主要操作
      </PaperButton>
      <PaperButton variant="outline">
        次要操作
      </PaperButton>
      <PaperButton variant="ghost">
        辅助操作
      </PaperButton>
    </div>
  );
}
```

### 或使用工具类

```tsx
export function QuickButton() {
  return (
    <button className="btn--primary">
      快速操作
    </button>
  );
}
```

---

## 🎨 场景 4: 动态颜色变化

### ✅ 推荐写法（使用 CSS 变量）

```tsx
export function StatusBadge({ status }: { status: 'success' | 'warning' | 'error' }) {
  const colorMap = {
    success: 'bg-success-100 text-success-800 border-success-500',
    warning: 'bg-warning-100 text-warning-800 border-warning-500',
    error: 'bg-error-100 text-error-800 border-error-500',
  };

  return (
    <span className={cn('px-2 py-1 rounded-full text-xs border', colorMap[status])}>
      {status}
    </span>
  );
}
```

### 或使用内联 CSS 变量

```tsx
export function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="progress-bar-bg h-2 rounded-full overflow-hidden">
      <div 
        className="progress-bar-fill h-full transition-all"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
```

**说明**：`.progress-bar-fill` 在 `globals.css` 中已定义，使用主题色渐变

---

## 📝 场景 5: 表单输入

### ✅ 推荐写法

```tsx
import { PaperInput } from '@/components/ui/paper-input';

export function LoginForm() {
  return (
    <form className="space-y-4">
      <PaperInput
        label="用户名"
        placeholder="请输入用户名"
        required
      />
      <PaperInput
        label="密码"
        type="password"
        placeholder="请输入密码"
        required
      />
    </form>
  );
}
```

---

## 🖼️ 场景 6: 模态框

### ✅ 推荐写法

```tsx
import { PaperModal } from '@/components/ui/paper-modal';

export function ConfirmDialog({ isOpen, onClose }: Props) {
  return (
    <PaperModal isOpen={isOpen} onClose={onClose} title="确认操作">
      <p className="text-theme-text-secondary">
        您确定要执行此操作吗？
      </p>
      <div className="flex gap-2 mt-4 justify-end">
        <PaperButton variant="outline" onClick={onClose}>
          取消
        </PaperButton>
        <PaperButton variant="primary" onClick={handleConfirm}>
          确认
        </PaperButton>
      </div>
    </PaperModal>
  );
}
```

---

## 🎯 场景 7: 条件样式

### ✅ 推荐写法（使用 cn 工具）

```tsx
import { cn } from '@/utils/lib-utils';

export function TabButton({ isActive, children }: Props) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-t-lg transition-colors',
        'border-b-2',
        isActive 
          ? 'bg-theme-bg-secondary border-primary-500 text-primary-600'
          : 'border-transparent text-theme-text-secondary hover:text-theme-text-primary'
      )}
    >
      {children}
    </button>
  );
}
```

### ❌ 避免写法

```tsx
// ❌ 字符串拼接
<button className={`px-4 py-2 ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}>

// ❌ 内联样式
<button style={{ backgroundColor: isActive ? '#eff6ff' : 'transparent' }}>
```

---

## 📊 场景 8: 数据展示（表格）

### ✅ 推荐写法

```tsx
import { PaperTable } from '@/components/ui/paper-table';

export function DataTable({ data }: Props) {
  return (
    <PaperTable>
      <PaperTable.Header>
        <PaperTable.Row>
          <PaperTable.HeaderCell>姓名</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>邮箱</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>状态</PaperTable.HeaderCell>
        </PaperTable.Row>
      </PaperTable.Header>
      <PaperTable.Body>
        {data.map(item => (
          <PaperTable.Row key={item.id}>
            <PaperTable.Cell>{item.name}</PaperTable.Cell>
            <PaperTable.Cell>{item.email}</PaperTable.Cell>
            <PaperTable.Cell>
              <StatusBadge status={item.status} />
            </PaperTable.Cell>
          </PaperTable.Row>
        ))}
      </PaperTable.Body>
    </PaperTable>
  );
}
```

---

## 🔍 快速参考

### 常用主题颜色类

```tsx
// 文字颜色
text-theme-text-primary      // 主要文字
text-theme-text-secondary    // 次要文字

// 背景颜色
bg-theme-bg-primary          // 主要背景
bg-theme-bg-secondary        // 次要背景（如卡片）
bg-theme-bg-tertiary         // 三级背景（如侧边栏）

// 边框
border-theme-border          // 主边框
border-theme-border-light    // 浅色边框

// 品牌色
bg-primary-500               // 主品牌色
text-primary-600             // 品牌色文字
hover:bg-primary-600         // hover 状态

// 状态色
bg-success-500 text-success-800
bg-warning-500 text-warning-800
bg-error-500 text-error-800
```

### CSS 变量使用

```tsx
// 在需要动态样式时使用 CSS 变量
style={{ borderRadius: 'var(--radius-xl)' }}
style={{ boxShadow: 'var(--shadow-card)' }}
style={{ color: 'var(--theme-text-primary)' }}
```

---

## 无障碍性提示

### 为图标按钮添加 ARIA 标签

```tsx
<button aria-label="关闭对话框" className="p-2">
  <X className="h-4 w-4" />
</button>
```

### 使用语义化 HTML

```tsx
// ✅ 推荐
<nav aria-label="主导航">
  <ul>
    <li><a href="/dashboard">仪表盘</a></li>
  </ul>
</nav>

// ❌ 避免
<div className="nav">
  <div onClick={() => router.push('/dashboard')}>仪表盘</div>
</div>
```

### 确保充足的对比度

```tsx
// ✅ 主题变量自动保证对比度
<p className="text-theme-text-primary">正文内容</p>

// ❌ 自定义颜色需要验证对比度
<p className="text-gray-400">可能对比度不足</p>
```

---

## 总结

**核心原则**：
1. 优先使用 Paper 组件系列
2. 使用主题变量而非固定颜色
3. 移动优先的响应式设计
4. 遵循无障碍性规范
5. 使用 `cn()` 工具管理条件样式
