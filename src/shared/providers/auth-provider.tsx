/**
 * Auth Provider
 * 为客户端组件提供 Session 上下文
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <SessionProvider
            refetchInterval={5 * 60}
            refetchOnWindowFocus={false}
        >
            {children}
        </SessionProvider>
    );
}