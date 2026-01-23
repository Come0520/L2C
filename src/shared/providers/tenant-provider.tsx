/**
 * Tenant Context & Provider
 * 提供当前租户信息，确保数据隔�?
 */

'use client';

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getTenantInfo } from '@/features/settings/actions/tenant-info';

// 租户信息接口
export interface Tenant {
    id: string;
    name: string;
    code: string;
    logoUrl?: string | null;
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

    const fetchTenant = useCallback(async (): Promise<void> => {
        if (!session?.user?.tenantId) return;

        try {
            const result = await getTenantInfo();
            if (result.success) {
                setTenant({
                    id: result.data.id,
                    name: result.data.name,
                    code: result.data.code,
                    logoUrl: result.data.logoUrl,
                    settings: {}, // 暂时使用空对象，后续需要可根据 TenantInfo 扩展
                });
            }
        } catch (error) {
            console.error('Failed to fetch tenant:', error);
        } finally {
            setIsLoading(false);
        }
    }, [session?.user?.tenantId]);

    useEffect(() => {
        if (status === 'loading') return;

        if (status === 'unauthenticated') {
            setIsLoading(false);
            setTenant(null);
            return;
        }

        if (session?.user?.tenantId) {
            fetchTenant();
        } else {
            setIsLoading(false);
            setTenant(null);
        }
    }, [session, status, fetchTenant]);

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


