/**
 * 认证页面布局
 * 居中卡片样式
 */

import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-50 via-white to-primary-100">
            <div className="w-full max-w-md px-4">
                {children}
            </div>
        </div>
    );
}
