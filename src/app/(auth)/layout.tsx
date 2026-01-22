/**
 * 认证页面布局
 * 深色背景，居中显示
 */

import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="w-full max-w-md px-4">
                {children}
            </div>
        </div>
    );
}
