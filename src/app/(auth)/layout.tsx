/**
 * 认证页面布局
 * 深色背景，居中显示
 */

import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative overflow-hidden">
            {/* 全局背景动画 */}
            <div className="liquid-mesh-bg" />
            <div className="aurora-animate" />

            <div className="w-full max-w-md px-4 relative z-10">
                {children}
            </div>
        </div>
    );
}
