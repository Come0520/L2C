import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface TenantOption {
  id: string;
  name: string;
  role: string;
}

interface UseTenantsResult {
  tenants: TenantOption[];
  loading: boolean;
  switchTenant: (targetTenantId: string, currentTenantId?: string) => Promise<void>;
  refreshTenants: () => Promise<void>;
}

export function useTenants(): UseTenantsResult {
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取该用户所有关联的租户
  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/switch-tenant');
      const json = await res.json();
      if (json.success && json.tenants) {
        setTenants(json.tenants);
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // 切换租户抽象方法
  const switchTenant = async (targetTenantId: string, currentTenantId?: string) => {
    if (targetTenantId === currentTenantId) return;

    try {
      setLoading(true);
      const res = await fetch('/api/auth/switch-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTenantId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || '切换企业失败');
      }

      toast.success('企业切换成功！');

      // 切换租户后，需要重新走登录认证流程以刷新 Token
      setTimeout(() => {
        window.location.href = '/api/auth/signout?callbackUrl=/login';
      }, 500);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : '切换企业失败';
      console.error('切换企业失败:', error);
      toast.error(errMsg);
      setLoading(false);
      throw error; // 向上抛出供调用方（如 Dialog）处理
    }
  };

  return {
    tenants,
    loading,
    switchTenant,
    refreshTenants: fetchTenants,
  };
}
