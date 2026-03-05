'use client';

/**
 * Auth Provider
 * 为客户端组件提供 Session 上下文
 * 使用 next-auth v5 无 session prop 模式，自动通过 fetch 获取 session
 * 避免服务端 layout 向客户端 Provider 传递 session 导致的 Turbopack SSR 模块边界冲突
 */

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}
