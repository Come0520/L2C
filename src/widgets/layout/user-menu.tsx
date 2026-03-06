'use client';

import React, { useEffect, useState } from 'react';
import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { LogOut, Settings, Building2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/shared/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

interface TenantOption {
  id: string;
  name: string;
  role: string;
}

/**
 * 用户菜单组件
 * 显示用户头像和下拉菜单，包含个人信息、设置、租户切换和退出登录
 */
interface UserMenuProps {
  session: Session;
}

export function UserMenu({ session }: UserMenuProps) {
  const user = session.user;
  // 用户头像文字：优先使用自定义文字，否则使用名字前两位，再否则使用邮箱前两位
  const avatarText =
    user?.preferences?.avatarText ||
    user?.name?.slice(0, 2) ||
    user?.email?.slice(0, 2) ||
    'U';

  const avatarBgColor = user?.preferences?.avatarBgColor || 'bg-primary-500';

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const currentTenantId = session.user?.tenantId;

  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取该用户所有关联的租户
  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted]);

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

      toast.success('企业切换成功！');

      // 切换租户后，需要重新走登录认证流程以刷新 Token
      setTimeout(() => {
        window.location.href = '/api/auth/signout?callbackUrl=/login';
      }, 500);
    } catch (error: any) {
      console.error('切换企业失败:', error);
      toast.error(error.message || '切换企业失败');
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full hover:opacity-90"
      >
        <Avatar className="h-9 w-9">
          <AvatarFallback
            className={`${avatarBgColor} text-sm text-white flex items-center justify-center rounded-full`}
            style={avatarBgColor.startsWith('#') ? { backgroundColor: avatarBgColor } : {}}
          >
            {avatarText}
          </AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  const currentTenant = tenants.find((t) => t.id === currentTenantId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full hover:opacity-90 transition-opacity"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} className="object-cover" />
            <AvatarFallback
              className={`${avatarBgColor} text-sm text-white flex items-center justify-center rounded-full`}
              style={avatarBgColor.startsWith('#') ? { backgroundColor: avatarBgColor } : {}}
            >
              {avatarText}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user?.name || '未设置姓名'}</p>
            <p className="text-muted-foreground text-xs">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* 租户切换子菜单 */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Building2 className="mr-2 h-4 w-4" />
            <span className="truncate max-w-[140px]">{currentTenant?.name || '当前企业'}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-56 max-h-[300px] overflow-y-auto">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                切换您当前的管理企业
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {session.user?.isPlatformAdmin && currentTenantId === '__PLATFORM__' && (
                <DropdownMenuItem disabled>
                  <Building2 className="mr-2 h-4 w-4" />
                  <span className="truncate">平台超级中心</span>
                </DropdownMenuItem>
              )}
              {tenants.map((tenant) => (
                <DropdownMenuItem
                  key={tenant.id}
                  onClick={() => handleSwitchTenant(tenant.id)}
                  className="flex items-center gap-2 cursor-pointer"
                  disabled={loading}
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      currentTenantId === tenant.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <span className="truncate text-sm font-medium">{tenant.name}</span>
                    <span className="text-muted-foreground text-xs">
                      身份: {tenant.role === 'ADMIN' ? '拥有者' : '员工'}
                    </span>
                  </div>
                  {loading && currentTenantId !== tenant.id && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuItem asChild>
          <Link href="/profile/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>个人设置</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/login', redirect: true })}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
