'use client';

/**
 * Auth Provider
 * 为客户端组件提供 Session 上下文
 */

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

import type { Session } from 'next-auth';

export function AuthProvider({ children, session }: { children: ReactNode; session: Session | null }) {
    return (
        <SessionProvider
            session={session}
            refetchInterval={5 * 60}
            refetchOnWindowFocus={false}
        >
            {children}
        </SessionProvider>
    );
}