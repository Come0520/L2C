'use client'

import { Toaster as SonnerToaster } from 'sonner'

/**
 * Toast Provider 组件
 * 放在 layout 中使用
 */
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

/**
 * Toast 工具函数
 * 导出 sonner 的 toast 用于其他组件调用
 */
export { toast } from 'sonner'
