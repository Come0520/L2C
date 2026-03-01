/**
 * 认证页面布局
 * 深色背景，居中显示
 */

import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)]">
      {/* 全局背景动画 */}
      <div className="liquid-mesh-bg" />
      <div className="aurora-animate" />

      <div className="relative z-10 w-full max-w-md px-4">{children}</div>
    </div>
  );
}
