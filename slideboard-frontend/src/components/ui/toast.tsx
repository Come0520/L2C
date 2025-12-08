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
                style: {
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
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
