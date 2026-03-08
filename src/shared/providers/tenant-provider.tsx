'use client';

/**
 * Tenant Context & Provider
 * 提供当前租户信息，确保数据隔离
 */

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getTenantInfo, getVerificationStatus } from '@/features/settings/actions/tenant-info';
import type { VerificationStatus } from '@/features/settings/types/tenant';
import { logger } from '@/shared/lib/logger';

// 租户信息接口
export interface Tenant {
  id: string;
  name: string;
  code: string;
  logoUrl?: string | null;
  region?: string | null;
  verificationStatus?: VerificationStatus;
  settings?: Record<string, unknown>;
}

interface TenantContextValue {
  tenant: Tenant | null;
  isLoading: boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
  /**
   * 可选：服务端预取的租户数据
   *
   * @description 由 Server Component（Dashboard Layout）提前获取并传入，
   * 避免客户端挂载后再发 Server Action 请求（消除瀑布流，减少 2 次串行请求）。
   * 未传时退回到客户端请求模式（兼容无法服务端预取的场景）。
   */
  initialTenant?: Tenant | null;
}

export function TenantProvider({ children, initialTenant }: TenantProviderProps) {
  const { data: session, status } = useSession();
  // 有服务端预取数据时直接使用，无需等待客户端请求
  const [tenant, setTenant] = useState<Tenant | null>(initialTenant ?? null);
  // 有服务端数据则直接设为非 loading 状态
  const [isLoading, setIsLoading] = useState(!initialTenant);

  const fetchTenant = useCallback(async (): Promise<void> => {
    if (!session?.user?.tenantId) return;

    try {
      const [tenantResult, verificationResult] = await Promise.all([
        getTenantInfo(),
        getVerificationStatus(),
      ]);
      if (tenantResult.success) {
        setTenant({
          id: tenantResult.data.id,
          name: tenantResult.data.name,
          code: tenantResult.data.code,
          logoUrl: tenantResult.data.logoUrl,
          region: tenantResult.data.region,
          verificationStatus: verificationResult.success
            ? verificationResult.data.status
            : 'unverified',
          settings: tenantResult.data.settings,
        });
      }
    } catch (error) {
      logger.error('Failed to fetch tenant:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.tenantId]);

  useEffect(() => {
    // 服务端已预取数据，无需客户端再发请求
    if (initialTenant !== undefined) return;

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
  }, [session, status, fetchTenant, initialTenant]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        isLoading,
        refreshTenant: fetchTenant,
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
