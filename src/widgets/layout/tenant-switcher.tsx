'use client';

import React, { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { Session } from 'next-auth';

import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

interface TenantOption {
  id: string;
  name: string;
  role: string;
}

interface TenantSwitcherProps {
  session: Session;
}

export function TenantSwitcher({ session }: TenantSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const currentTenantId = session.user?.tenantId;

  // 获取该用户所有关联的租户
  useEffect(() => {
    async function fetchTenants() {
      try {
        const res = await fetch('/api/auth/switch-tenant');
        const json = await res.json();
        if (json.success && json.tenants) {
          setTenants(json.tenants);
        }
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
      }
    }
    fetchTenants();
  }, []);

  const currentTenant = tenants.find((t) => t.id === currentTenantId);

  // 切换租户
  const handleSwitchTenant = async (targetTenantId: string) => {
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

      // 切换成功提示

      // 切换租户后，需要重新走登录认证流程以刷新 Token
      setTimeout(() => {
        // 先调用 NextAuth 的 API 强制登出，并自动跳转回 /login 刷新（也可直接刷新本页但 JWT 更新可能延迟）
        // 最好直接强制 reload 页面，并且使用 signOut
        window.location.href = '/api/auth/signout?callbackUrl=/login';
      }, 500);
    } catch (error: unknown) {
      console.error('切换企业失败:', error);
      setLoading(false);
    }
  };

  // 超级管理员由于没有绑定实际租户，直接显示平台管理标识
  if (session.user?.isPlatformAdmin && currentTenantId === '__PLATFORM__') {
    return (
      <div className="text-muted-foreground flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium">
        <Building2 className="h-4 w-4" />
        平台超级中心
      </div>
    );
  }

  // 只有一个租户或者还在加载时，只展示个简单的 Badge 或不可切换状态
  if (tenants.length <= 1) {
    return (
      <div className="text-foreground flex cursor-default items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium">
        <Building2 className="text-primary h-4 w-4" />
        <span className="max-w-[200px] truncate">{currentTenant?.name || '我的企业'}</span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={loading}
          className="w-[240px] justify-between border-white/10 bg-white/5 transition-colors hover:bg-white/10 hover:text-white"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="text-primary h-4 w-4 shrink-0" />
            <span className="truncate">{currentTenant?.name || '选择企业...'}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="bg-background/80 w-[240px] border-white/10 p-0 shadow-xl backdrop-blur-xl">
        <Command>
          <CommandInput placeholder="搜索企业..." />
          <CommandList>
            <CommandEmpty>未找到企业</CommandEmpty>
            <CommandGroup heading="您所在的企业">
              {tenants.map((tenant) => (
                <CommandItem
                  key={tenant.id}
                  value={tenant.name}
                  onSelect={() => {
                    handleSwitchTenant(tenant.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      currentTenantId === tenant.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <span className="truncate text-sm font-medium">{tenant.name}</span>
                    <span className="text-muted-foreground text-xs">
                      身份: {tenant.role === 'ADMIN' ? '拥有者' : '员工'}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
