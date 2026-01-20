/**
 * Tenant Context & Provider
 * 提供当前租户信息，确保数据隔�?
 */

'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';

// 租户信息接口
export interface Tenant {
    id: string;
    name: string;
    code: string;
    logoUrl?: string;
    settings?: Record<string, unknown>;
}

interface TenantContextValue {
    tenant: Tenant | null;
    isLoading: boolean;
    refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTenant = async (): Promise<void> => {
        if (!session?.user?.tenantId) return;

        try {
            // 暂时模拟获取租户信息
            // 实际应调�?API: GET /api/tenants/current
            // 或者从 Session 中直接解析更多租户信�?

            // 模拟延迟
            // await new Promise(resolve => setTimeout(resolve, 100));

            setTenant({
                id: session.user.tenantId,
                name: '示例租户', // TODO: Fetch from API
                code: 'demo',
                settings: {},
            });
        } catch (error) {
            console.error('Failed to fetch tenant:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'loading') return;

        if (status === 'unauthenticated') {
            setIsLoading(false);
            return;
        }

        if (session?.user?.tenantId) {
            fetchTenant();
        } else {
            setIsLoading(false);
            // 如果已登录但没有租户 ID，可能需要跳转到租户选择或创建页
            // router.push('/onboarding');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, status]);

    return (
        <TenantContext.Provider
            value={{
                tenant,
                isLoading,
                refreshTenant: fetchTenant
            }}
        >
            {children}
        </TenantContext.Provider>
    );
}

// Hook to use tenant context
export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}


