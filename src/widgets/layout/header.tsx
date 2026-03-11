'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Session } from 'next-auth';
import { ShieldAlert, Search, User, Menu } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { UserMenu } from './user-menu';
import { HeaderNotificationBell } from './header-notification-bell';
import { useSidebar } from '@/shared/ui/sidebar';
import { useGlobalSearch } from '@/features/search/hooks/use-global-search';
import { exitTenantView } from '@/features/platform/actions/impersonate-actions';
import { toast } from 'sonner';

/**
 * 顶部导航栏组件
 * 显示当前页面标题、搜索、通知和用户菜单
 */
interface HeaderProps {
  session?: Session | null;
}

export function Header({ session }: HeaderProps) {
  const pathname = usePathname();
  const { openSearch } = useGlobalSearch();

  // 页面标题映射（按路由从具体到通用排列，避免前缀冲突），使用 useMemo 防止每次渲染重新创建
  const pageTitle = useMemo(() => {
    if (pathname === '/') return '工作台';
    // 线索管理
    if (pathname.startsWith('/leads')) return '线索管理';
    // 客户管理
    if (pathname.startsWith('/customers')) return '客户管理';
    // 报价管理（含套餐子路由）
    if (pathname.startsWith('/quotes')) return '报价管理';
    // 订单管理
    if (pathname.startsWith('/orders')) return '订单管理';

    // 上门服务（子路由优先）
    if (pathname.startsWith('/service/measurement')) return '测量服务';
    if (pathname.startsWith('/service/installation')) return '安装服务';
    if (pathname.startsWith('/service')) return '上门服务';
    // 供应链
    if (pathname.startsWith('/supply-chain')) return '供应链管理';
    // 财务中心
    if (pathname.startsWith('/finance')) return '财务中心';
    // 售后服务
    if (pathname.startsWith('/after-sales')) return '售后服务';
    // 数据分析
    if (pathname.startsWith('/analytics')) return '数据分析';
    // 渠道管理
    if (pathname.startsWith('/channels')) return '渠道管理';
    // 展厅陈列
    if (pathname.startsWith('/showroom')) return '云展厅';
    // 审批工作流（子路由优先）
    if (pathname.startsWith('/workflow/approvals')) return '审批中心';
    if (pathname.startsWith('/workflow')) return '工作流';

    // 通知中心
    if (pathname.startsWith('/notifications')) return '通知中心';
    // 个人设置
    if (pathname.startsWith('/profile')) return '个人偏好';
    // 系统设置
    if (pathname.startsWith('/settings')) return '系统设置';
    // 平台管理
    if (pathname.startsWith('/admin')) return '平台管理';
    return '工作台';
  }, [pathname]);

  const isImpersonating =
    session?.user?.isPlatformAdmin && session?.user?.tenantId !== '__PLATFORM__';

  return (
    <div className="flex w-full flex-col">
      {/* 租户视角橙色横幅 */}
      {isImpersonating && (
        <div className="flex h-10 w-full items-center justify-center gap-4 bg-orange-500/90 px-4 text-sm font-medium text-white shadow-sm dark:bg-orange-600/90">
          <ShieldAlert className="h-4 w-4" />
          <span>⚠️ 当前处于租户视角 (ID: {session.user.tenantId})</span>
          <Button
            variant="secondary"
            size="sm"
            className="ml-4 h-7 bg-white/20 text-white hover:bg-white/30"
            onClick={async () => {
              try {
                const res = await exitTenantView();
                if (res.success) {
                  toast.success('已退出租户视角');
                  setTimeout(() => {
                    window.location.href = '/api/auth/signout?callbackUrl=/login';
                  }, 500);
                }
              } catch (e: unknown) {
                toast.error(e instanceof Error ? e.message : '操作失败');
              }
            }}
          >
            退出视角
          </Button>
        </div>
      )}

      <header className="glass-liquid flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6 dark:border-white/5">
        {/* 左侧：移动端汉堡菜单 + 页面标题 */}
        <div className="flex items-center gap-4">
          {/* 汉堡菜单按钮：仅移动端显示（md:hidden），通过 SidebarContext 控制侧边栏 */}
          <MobileMenuButton />
          <h1 className="text-foreground text-xl font-semibold">{pageTitle}</h1>
        </div>

        {/* 右侧：搜索、通知、用户 */}
        <div className="flex items-center gap-3">
          {/* 搜索按钮 */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="全局搜索"
            className="h-9 w-9 rounded-full hover:bg-white/10"
            onClick={openSearch}
          >
            <Search className="text-muted-foreground h-4 w-4" />
          </Button>

          {/* 通知按钮 */}
          <HeaderNotificationBell />

          {/* 用户菜单 */}
          {session ? (
            <UserMenu session={session} />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="from-primary-500 to-primary-600 h-9 w-9 rounded-full bg-linear-to-br hover:opacity-90"
              aria-label="登录/游客"
            >
              <User className="h-4 w-4 text-white" />
            </Button>
          )}
        </div>
      </header>
    </div>
  );
}

/**
 * 移动端侧边栏触发按钮
 * 仅在移动端（md:hidden）显示，点击后通过 SidebarContext 控制侧边栏开关
 */
function MobileMenuButton() {
  const { open, setOpen } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-full hover:bg-white/10 md:hidden"
      onClick={() => setOpen(!open)}
      aria-label="打开菜单"
    >
      <Menu className="text-foreground h-5 w-5" />
    </Button>
  );
}
