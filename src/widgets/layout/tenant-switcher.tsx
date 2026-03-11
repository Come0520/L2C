'use client';

import React, { useState } from 'react';
import { Check, ChevronsUpDown, Building2, Loader2 } from 'lucide-react';
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
import { useTenants } from '@/shared/hooks/use-tenants';
import { getRoleLabel } from '@/shared/config/roles';
import { ActionConfirmDialog } from '@/shared/ui/action-confirm-dialog';

interface TenantSwitcherProps {
  session: Session;
}

export function TenantSwitcher({ session }: TenantSwitcherProps) {
  const [open, setOpen] = useState(false);
  const currentTenantId = session.user?.tenantId;
  const { tenants, loading, switchTenant } = useTenants();

  const currentTenant = tenants.find((t) => t.id === currentTenantId);

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
          aria-label="切换企业"
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
                <ActionConfirmDialog
                  key={tenant.id}
                  title="确认切换企业？"
                  description={`您即将切换到【${tenant.name}】，这将会刷新您的登录状态。`}
                  action={async () => {
                    await switchTenant(tenant.id, currentTenantId);
                    setOpen(false);
                  }}
                  trigger={
                    <CommandItem
                      value={tenant.name}
                      onSelect={() => {
                        // 阻止默认的选择行为触发Popover关闭，让弹窗获得控制权
                        // Popover 由外层的 open 状态控制
                      }}
                      className="flex w-full cursor-pointer items-center gap-2"
                      disabled={loading || currentTenantId === tenant.id}
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
                          身份: {getRoleLabel(tenant.role)}
                        </span>
                      </div>
                      {loading && currentTenantId !== tenant.id && (
                        <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
                      )}
                    </CommandItem>
                  }
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
