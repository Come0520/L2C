'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Session } from 'next-auth';
import { Search, User, Menu } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { UserMenu } from './user-menu';
import { HeaderNotificationBell } from './header-notification-bell';
import { useSidebar } from '@/shared/ui/sidebar';

/**
 * 顶部导航栏组件
 * 显示当前页面标题、搜索、通知和用户菜单
 */
interface HeaderProps {
  session?: Session | null;
}

export function Header({ session }: HeaderProps) {
  const pathname = usePathname();

  // 页面标题映射（按路由从具体到通用排列，避免前缀冲突）
  const getPageTitle = () => {
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
  };

  return (
    <header className="glass-liquid flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6 dark:border-white/5">
      {/* 左侧：移动端汉堡菜单 + 页面标题 */}
      <div className="flex items-center gap-4">
        {/* 汉堡菜单按钮：仅移动端显示（md:hidden），通过 SidebarContext 控制侧边栏 */}
        <MobileMenuButton />
        <h1 className="text-foreground text-xl font-semibold">{getPageTitle()}</h1>
      </div>

      {/* 右侧：搜索、通知、用户 */}
      <div className="flex items-center gap-3">
        {/* 搜索按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full hover:bg-white/10"
          onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
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
          >
            <User className="h-4 w-4 text-white" />
          </Button>
        )}
      </div>
    </header>
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
