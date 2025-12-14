# 修复Toast组件主题适配问题

## 问题分析
当前Toast组件使用了硬编码的白色背景和灰色边框，这与主题系统冲突。当切换到深色主题时，Toast组件仍然显示白色背景，破坏了主题一致性和用户体验。

## 修复方案
1. **移除硬编码样式**：删除`toastOptions`中的`style`属性，避免硬编码的颜色与主题冲突
2. **使用主题CSS变量**：利用Sonner的`classNames`属性，结合主题系统的CSS变量，让Toast组件自动适配当前主题
3. **应用主题类名**：为Toast组件添加适当的类名，确保它能继承当前主题的样式

## 具体修改
```tsx
// src/components/ui/toast.tsx
import { Toaster as SonnerToaster } from 'sonner'

export function ToastProvider() {
    return (
        <SonnerToaster
            position="top-right"
            expand={false}
            richColors
            closeButton
            toastOptions={{
                classNames: {
                    toast: 'bg-theme-bg-secondary text-theme-text-primary border-theme-border shadow-lg',
                    description: 'text-theme-text-secondary',
                    actionButton: 'bg-primary-500 text-white',
                    cancelButton: 'bg-theme-bg-tertiary text-theme-text-primary',
                },
            }}
        />
    )
}

export { toast } from 'sonner'
```

## 预期效果
- Toast组件将自动适配当前主题，在浅色主题下显示浅色背景，在深色主题下显示深色背景
- 保持Sonner的核心特性（堆叠显示、丰富颜色、关闭按钮）
- 与应用的整体风格保持一致，提升用户体验

## 验证方法
1. 运行应用，切换不同主题
2. 触发Toast通知（如保存成功、删除失败等）
3. 验证Toast组件在不同主题下的显示效果是否正常
4. 验证Toast组件的交互功能是否正常（关闭、悬停等）