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
import { useTenants } from '@/shared/hooks/use-tenants';
import { getRoleLabel } from '@/shared/config/roles';
import { ActionConfirmDialog } from '@/shared/ui/action-confirm-dialog';

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
    user?.preferences?.avatarText || user?.name?.slice(0, 2) || user?.email?.slice(0, 2) || 'U';

  const avatarBgColor = user?.preferences?.avatarBgColor || 'bg-primary-500';

  const [mounted, setMounted] = useState(false);
  const currentTenantId = session.user?.tenantId;
  const { tenants, loading, switchTenant } = useTenants();

  useEffect(() => {
    // 避免在 render 期间同步 setState，使用 setTimeout 延迟到下一个 tick
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full hover:opacity-90"
        aria-label="用户菜单加载中"
      >
        <Avatar className="h-9 w-9">
          <AvatarFallback
            className={`${avatarBgColor} flex items-center justify-center rounded-full text-sm text-white`}
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
          className="h-9 w-9 rounded-full transition-opacity hover:opacity-90"
          aria-label="打开用户菜单"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user?.image || undefined}
              alt={user?.name || 'User'}
              className="object-cover"
            />
            <AvatarFallback
              className={`${avatarBgColor} flex items-center justify-center rounded-full text-sm text-white`}
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
            <span className="max-w-[140px] truncate">{currentTenant?.name || '当前企业'}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="max-h-[300px] w-56 overflow-y-auto">
              <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
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
                <ActionConfirmDialog
                  key={tenant.id}
                  title="确认切换企业？"
                  description={`您即将切换到【${tenant.name}】，这将会刷新您的登录状态。`}
                  action={async () => {
                    await switchTenant(tenant.id, currentTenantId);
                  }}
                  trigger={
                    <DropdownMenuItem
                      className="flex w-full cursor-pointer items-center gap-2"
                      disabled={loading || currentTenantId === tenant.id}
                      onSelect={(e) => {
                        // 阻止默认关闭，让弹窗可以显示
                        e.preventDefault();
                      }}
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
                          身份: {getRoleLabel(tenant.role)}
                        </span>
                      </div>
                      {loading && currentTenantId !== tenant.id && (
                        <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
                      )}
                    </DropdownMenuItem>
                  }
                />
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
          onClick={() => {
            // 立即跳转给用户即时反馈，服务端 signOut 在后台异步完成（清除 cookie）
            // 使用 redirect: false 避免等待服务端响应导致页面卡住
            signOut({ callbackUrl: '/login', redirect: false });
            window.location.href = '/login';
          }}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
