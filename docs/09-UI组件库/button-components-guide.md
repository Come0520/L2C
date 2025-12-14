# PaperButton 和 StatefulButton 使用指南

> 适配三种主题的现代化按钮组件

---

## 📦 组件概况

L2C 项目提供了两个强大的按钮组件：

1. **PaperButton** - 基础按钮组件，完全主题化
2. **StatefulButton** - 状态按钮，自动处理 loading/success/error 状态

---

## 🎨 PaperButton 组件

### 特性

✅ **完全主题化** - 适配 warmRicePaper / liquidGlass / linear  
✅ **丝滑动画** - Spring 动画 hover/tap 效果  
✅ **多种变体** - 9 种按钮样式  
✅ **灵活尺寸** - 4 种大小 + icon 专用  
✅ **圆角控制** - 5 种圆角选项  
✅ **图标支持** - 左/右图标 + 加载状态  

### 变体（Variants）

| 变体 | 用途 | 主题适配 |
|------|------|---------|
| `primary` | 主要操作 | 品牌紫色 |
| `secondary` | 次要操作 | 主题背景色 ✅ |
| `outline` | 轮廓按钮 | 主题边框色 ✅ |
| `ghost` | 幽灵按钮 | 主题背景色 ✅ |
| `success` | 成功状态 | 绿色 |
| `warning` | 警告状态 | 黄色 |
| `error` | 错误状态 | 红色 |
| `info` | 信息状态 | 蓝色 |
| `destructive` | 危险操作 | 红色 |
| `link` | 链接样式 | 品牌色下划线 |

### 尺寸（Sizes）

```tsx
size="sm"     // 小按钮 (h-8)
size="md"     // 中按钮 (h-10) - 默认
size="lg"     // 大按钮 (h-12)
size="icon"   // 图标按钮 (10x10)
```

### 圆角（Rounded）

```tsx
rounded="none"  // 无圆角 (适合 linear 主题)
rounded="sm"    // 小圆角
rounded="md"    // 中圆角 - 默认
rounded="lg"    // 大圆角
rounded="full"  // 完全圆形
```

---

## 📝 使用示例

### 1. 基础按钮

```tsx
import { PaperButton } from '@/components/ui/paper-button';

<PaperButton variant="primary">
  点击我
</PaperButton>
```

### 2. 带图标的按钮

```tsx
import { Save, Download } from 'lucide-react';

// 左侧图标
<PaperButton 
  variant="primary"
  leftIcon={<Save className="h-4 w-4" />}
>
  保存
</PaperButton>

// 右侧图标
<PaperButton 
  variant="secondary"
  rightIcon={<Download className="h-4 w-4" />}
>
  下载
</PaperButton>

// 仅图标
<PaperButton 
  variant="ghost"
  size="icon"
  aria-label="删除"
>
  <Trash className="h-4 w-4" />
</PaperButton>
```

### 3. 加载状态

```tsx
const [isLoading, setIsLoading] = useState(false);

<PaperButton 
  variant="primary"
  loading={isLoading}
  onClick={async () => {
    setIsLoading(true);
    await fetchData();
    setIsLoading(false);
  }}
>
  加载数据
</PaperButton>
```

### 4. 不同主题适配

```tsx
// Secondary 按钮在三种主题下自动适配
// warmRicePaper: 米黄色背景
// liquidGlass: 玻璃效果
// linear: 深灰色背景
<PaperButton variant="secondary">
  自动适配主题
</PaperButton>
```

### 5. 完整示例

```tsx
<div className="flex gap-4">
  <PaperButton variant="primary" size="lg">
    主要操作
  </PaperButton>
  
  <PaperButton variant="outline" size="md">
    次要操作
  </PaperButton>
  
  <PaperButton variant="ghost" size="sm">
    辅助操作
  </PaperButton>
  
  <PaperButton 
    variant="destructive"
    leftIcon={<Trash className="h-4 w-4" />}
  >
    删除
  </PaperButton>
</div>
```

---

## ⚡ StatefulButton 组件

自动管理按钮的 loading/success/error 状态，无需手动控制。

### 特性

✅ **自动状态管理** - 根据 status prop 自动切换  
✅ **平滑过渡动画** - 状态切换时淡入淡出  
✅ **自动恢复** - success/error 状态自动返回 idle  
✅ **可定制文字** - 自定义每种状态的文字  
✅ **继承所有 PaperButton 特性** - 完全主题化  

### 使用示例

#### 1. 基础用法

```tsx
import { StatefulButton } from '@/components/ui/stateful-button';
import { useState } from 'react';

function MyForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const handleSubmit = async () => {
    setStatus('loading');
    try {
      await submitForm();
      setStatus('success');
    } catch (error) {
      setStatus('error');
    }
  };
  
  return (
    <StatefulButton
      status={status}
      loadingText="提交中..."
      successText="提交成功！"
      errorText="提交失败"
      onClick={handleSubmit}
    >
      提交表单
    </StatefulButton>
  );
}
```

#### 2. 自定义持续时间

```tsx
<StatefulButton
  status={status}
  duration={3000}  // success/error 状态持续 3 秒
  successText="已保存"
>
  保存
</StatefulButton>
```

#### 3. 完整示例

```tsx
function SaveButton() {
  const [status, setStatus] = useState<ButtonStatus>('idle');
  
  const handleSave = async () => {
    setStatus('loading');
    
    try {
      const result = await api.save(data);
      setStatus('success');
      // 2秒后自动恢复为 idle
    } catch (err) {
      setStatus('error');
      // 2秒后自动恢复为 idle
    }
  };
  
  return (
    <StatefulButton
      status={status}
      variant="primary"
      size="md"
      loadingText="保存中..."
      successText="✓ 已保存"
      errorText="✗ 保存失败"
      duration={2000}
      onClick={handleSave}
      leftIcon={<Save className="h-4 w-4" />}
    >
      保存更改
    </StatefulButton>
  );
}
```

---

## 🎯 最佳实践

### 1. 按钮层次

```tsx
// 一个页面应有明确的按钮层次
<div className="flex gap-2">
  <PaperButton variant="primary">     {/* 最重要的操作 */}
    保存
  </PaperButton>
  <PaperButton variant="outline">     {/* 次要操作 */}
    取消
  </PaperButton>
  <PaperButton variant="ghost">       {/* 辅助操作 */}
    重置
  </PaperButton>
</div>
```

### 2. 危险操作确认

```tsx
// 危险操作使用 destructive 变体
<PaperButton 
  variant="destructive"
  onClick={handleDelete}
  leftIcon={<AlertTriangle className="h-4 w-4" />}
>
  删除账户
</PaperButton>
```

### 3. 加载状态提示

```tsx
// 使用 StatefulButton 自动处理
<StatefulButton
  status={deleteStatus}
  loadingText="删除中..."
  successText="已删除"
  errorText="删除失败"
  variant="destructive"
>
  删除
</StatefulButton>
```

### 4. 响应式按钮

```tsx
// 移动端全宽，桌面端自适应
<PaperButton 
  variant="primary" 
  className="w-full md:w-auto"
>
  提交
</PaperButton>
```

### 5. 无障碍性

```tsx
// 图标按钮必须提供 aria-label
<PaperButton 
  variant="ghost"
  size="icon"
  aria-label="关闭对话框"
>
  <X className="h-4 w-4" />
</PaperButton>
```

---

## 🎨 主题适配效果

### warmRicePaper 主题

```tsx
// Secondary 按钮
bg: 米黄色 (#F5F2E9)
text: 墨色
border: 暖棕色
hover: 深一级米黄色
```

### liquidGlass 主题

```tsx
// Secondary 按钮
bg: 半透明玻璃效果
text: 深色
border: 半透明边框
hover: 增强玻璃效果
```

### linear 主题

```tsx
// Secondary 按钮
bg: 深灰 (#0a0a0a)
text: 白色
border: 中灰 (#404040)
hover: 更深的灰色
```

---

## 🆚 何时使用哪个组件

### 使用 PaperButton

- ✅ 简单的点击操作
- ✅ 导航按钮
- ✅ 不需要状态反馈
- ✅ 需要完全控制样式

### 使用 StatefulButton

- ✅ 异步操作（API 调用）
- ✅ 表单提交
- ✅ 文件上传
- ✅ 需要状态反馈
- ✅ 自动恢复状态

---

## 📚 API 参考

### PaperButton Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'success' \| 'warning' \| 'error' \| 'info' \| 'destructive' \| 'link'` | `'primary'` | 按钮变体 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'icon'` | `'md'` | 按钮尺寸 |
| `rounded` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` | `'md'` | 圆角大小 |
| `loading` | `boolean` | `false` | 加载状态 |
| `leftIcon` | `ReactNode` | - | 左侧图标 |
| `rightIcon` | `ReactNode` | - | 右侧图标 |
| `icon` | `ReactNode` | - | 左侧图标（同 leftIcon） |
| `as` | `ElementType` | `'button'` | 渲染为其他元素 |
| ...其他 Button 原生属性 | - | - | disabled, onClick 等 |

### StatefulButton Props

继承所有 PaperButton props，额外包含：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `status` | `'idle' \| 'loading' \| 'success' \| 'error'` | `'idle'` | 当前状态 |
| `loadingText` | `string` | `'Loading...'` | 加载中文字 |
| `successText` | `string` | `'Success'` | 成功文字 |
| `errorText` | `string` | `'Error'` | 失败文字 |
| `duration` | `number` | `2000` | 状态持续毫秒数 |

---

## 🚀 动画说明

### Hover 动画

```typescript
whileHover={{ 
  scale: 1.02,
  transition: { type: "spring", stiffness: 400, damping: 10 }
}}
```

- 缩放至 102%
- 使用 spring 动画
- 高刚度（stiffness: 400）实现快速响应
- 适当阻尼（damping: 10）避免过度弹跳

### Tap 动画

```typescript
whileTap={{ 
  scale: 0.98,
  transition: { type: "spring", stiffness: 400, damping: 10 }
}}
```

- 缩放至 98%
- 提供点击反馈

### 图标淡入动画

```typescript
initial={{ opacity: 0, x: -5 }}  // 左图标从左淡入
animate={{ opacity: 1, x: 0 }}
transition={{ duration: 0.2 }}
```

---

## 总结

PaperButton 和 StatefulButton 提供了：

🎨 **完美的主题适配** - 无需手动处理主题  
⚡ **丝滑的动画** - Spring 动画带来专业体验  
♿ **无障碍支持** - 完整的 ARIA 属性  
📦 **TypeScript 类型安全** - 完整的类型检查  
🎯 **灵活易用** - 多种变体满足各种需求  

建议在项目中统一使用这两个组件替换原生 button 元素！
