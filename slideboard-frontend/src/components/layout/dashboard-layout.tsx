'use client';

import {
  LayoutDashboard,
  Users,
  Package,
  Truck,
  Gift,
  FileText,
  Bell,
  Folder,
  Settings,
  UserCircle,
  Menu,
  X,
  CheckCircle,
  BookOpen
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperSidebar, PaperNavItem, PaperNavGroup } from '@/components/ui/paper-nav';
import { siteConfig } from '@/config/site';
import { useAuth } from '@/contexts/auth-context';
// import { useTheme } from '@/contexts/theme-context';
import { GooeySwitch } from '@/components/ui/gooey-theme-toggle';
// import { cn } from '@/lib/utils'; // unused

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const pathname = usePathname();
  // const { theme, setTheme } = useTheme(); // unused, moved to GooeySwitch
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);
  const { user } = useAuth();

  const navGroups = React.useMemo(
    () => [
      {
        title: '工作台',
        items: [
          { title: '总览仪表盘', icon: <LayoutDashboard className="h-5 w-5" />, href: '/dashboard' },
          { title: '待办清单', icon: <FileText className="h-5 w-5" />, href: '/dashboard/todos' },
          { title: '预警中心', icon: <Bell className="h-5 w-5" />, href: '/dashboard/alerts' },
          { title: '罗莱大学', icon: <BookOpen className="h-5 w-5" />, href: '/academy' },
        ],
      },
      {
        title: '客户经营',
        items: [
          { title: '已合作装企', icon: <Users className="h-5 w-5" />, href: '/customers/cooperative' },
          { title: '潜在合作装企', icon: <Users className="h-5 w-5" />, href: '/customers/prospects' },
          { title: '考核视图', icon: <FileText className="h-5 w-5" />, href: '/customers/assessment' },
        ],
      },
      {
        title: '业务管理（订单流）',
        items: [
          { title: '线索管理', icon: <Users className="h-5 w-5" />, href: '/leads' },
          { title: '开单', icon: <FileText className="h-5 w-5" />, href: '/orders/status/draft-sign' },
          { title: '待测量', icon: <FileText className="h-5 w-5" />, href: '/orders/status/pending-survey' },
          { title: '测量中-待分配', icon: <FileText className="h-5 w-5" />, href: '/orders/status/surveying-pending-assignment' },
          { title: '测量中-分配中', icon: <FileText className="h-5 w-5" />, href: '/orders/status/surveying-assigning' },
          { title: '测量中-待上门', icon: <FileText className="h-5 w-5" />, href: '/orders/status/surveying-pending-visit' },
          { title: '测量中-待确认', icon: <FileText className="h-5 w-5" />, href: '/orders/status/surveying-pending-confirmation' },
          { title: '方案待确认', icon: <FileText className="h-5 w-5" />, href: '/orders/status/plan-pending-confirmation' },
          { title: '待推单', icon: <FileText className="h-5 w-5" />, href: '/orders/status/pending-push' },
          { title: '待下单', icon: <FileText className="h-5 w-5" />, href: '/orders/status/pending-place-order' },
          { title: '生产/备货中', icon: <FileText className="h-5 w-5" />, href: '/orders/status/in-production' },
          { title: '备货完成', icon: <FileText className="h-5 w-5" />, href: '/orders/status/stock-ready' },
          { title: '待发货', icon: <FileText className="h-5 w-5" />, href: '/orders/status/pending-shipment' },
          { title: '安装中-待分配', icon: <FileText className="h-5 w-5" />, href: '/orders/status/installing-pending-assignment' },
          { title: '安装中-分配中', icon: <FileText className="h-5 w-5" />, href: '/orders/status/installing-assigning' },
          { title: '安装中-待上门', icon: <FileText className="h-5 w-5" />, href: '/orders/status/installing-pending-visit' },
          { title: '安装中-待确认', icon: <FileText className="h-5 w-5" />, href: '/orders/status/installing-pending-confirmation' },
          { title: '待对账', icon: <FileText className="h-5 w-5" />, href: '/orders/status/pending-reconciliation' },
          { title: '待开票', icon: <FileText className="h-5 w-5" />, href: '/orders/status/pending-invoice' },
          { title: '待回款', icon: <FileText className="h-5 w-5" />, href: '/orders/status/pending-payment' },
          { title: '已完成', icon: <CheckCircle className="h-5 w-5" />, href: '/orders/status/completed' },
        ],
      },
      {
        title: '商品与库存',
        items: [
          { title: '商品管理', icon: <Package className="h-5 w-5" />, href: '/products' },
          { title: '销售道具管理', icon: <Package className="h-5 w-5" />, href: '/sales-tools' },
          { title: '礼品管理', icon: <Gift className="h-5 w-5" />, href: '/gifts' },
        ],
      },
      {
        title: '服务与供应链',
        items: [
          { title: '服务与供应链', icon: <Truck className="h-5 w-5" />, href: '/service-supply' },
          { title: '供应商管理', icon: <Truck className="h-5 w-5" />, href: '/suppliers' },
        ],
      },
      {
        title: '积分与商城',
        items: [
          { title: '积分系统', icon: <Gift className="h-5 w-5" />, href: '/points' },
          { title: '积分商城', icon: <Gift className="h-5 w-5" />, href: '/mall' },
        ],
      },
      {
        title: '通知与审批',
        items: [
          { title: '通知系统', icon: <Bell className="h-5 w-5" />, href: '/notifications' },
          { title: '审批流程', icon: <FileText className="h-5 w-5" />, href: '/approvals' },
        ],
      },
      {
        title: '财务',
        items: [
          { title: '财务管理', icon: <FileText className="h-5 w-5" />, href: '/finance' },
          { title: '报表分析', icon: <FileText className="h-5 w-5" />, href: '/finance/reports' },
          { title: '数据分析', icon: <FileText className="h-5 w-5" />, href: '/finance/analytics' },
        ],
      },
      {
        title: '文件',
        items: [
          { title: '文件管理', icon: <Folder className="h-5 w-5" />, href: '/files' },
          { title: '分享功能', icon: <Folder className="h-5 w-5" />, href: '/sharing' },
        ],
      },
      {
        title: '系统',
        items: [
          { title: '系统管理', icon: <Settings className="h-5 w-5" />, href: '/system' },
          { title: '用户认证', icon: <UserCircle className="h-5 w-5" />, href: '/system/auth' },
          { title: '权限管理', icon: <Settings className="h-5 w-5" />, href: '/system/permissions' },
          { title: '系统配置', icon: <Settings className="h-5 w-5" />, href: '/system/settings' },
          { title: '状态流转规则', icon: <FileText className="h-5 w-5" />, href: '/system/status-rules' },
          { title: '账户设置', icon: <UserCircle className="h-5 w-5" />, href: '/account' },
        ],
      },
    ],
    []
  );

  React.useEffect(() => {
    const match = navGroups.find((g) =>
      g.items.some((it: { href: string }) => pathname.startsWith(it.href))
    );
    setOpenGroup(match ? match.title : null);
  }, [pathname, navGroups]);

  if (user?.role === 'OTHER_CUSTOMER') {
    return (
      <div className="flex h-screen items-center justify-center bg-paper-200">
        <div className="max-w-lg p-6 bg-white rounded-lg shadow-paper-lg text-center">
          <h2 className="text-xl font-bold text-ink-800">当前角色为客户</h2>
          <p className="mt-2 text-sm text-ink-600">客户不开放Web端访问，请使用微信小程序进行报价确认、安装沟通与验收评价。</p>
        </div>
      </div>
    )
  }


  return (
    <div className="flex h-screen bg-theme-bg-primary text-theme-text-primary transition-colors duration-300">
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg"
      >
        跳转到主要内容
      </a>

      {/* 侧边栏 */}
      <PaperSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="bg-theme-bg-secondary border-r border-theme-border transition-colors duration-300"
      >
        {/* Logo区域 - 强制高度与右侧 Header 一致 */}
        {/* 使用 border-b-transparent 确保高度一致但看起来是一体的，或者保持 border-theme-border */}
        <div className="h-[73px] px-6 flex items-center border-b border-theme-border mb-6 flex-shrink-0 box-border">
          <div className="flex items-center space-x-3 transition-all duration-300 ease-in-out">
            {/* Logo Slot */}
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src="/l2c-logo.png"
                alt="L2C Logo"
                width={40}
                height={40}
                className="rounded-lg object-contain"
              />
            </div>

            {!sidebarCollapsed && (
              <div className="flex flex-col animate-in fade-in duration-300">
                <h1 className="text-lg font-bold text-theme-text-primary tracking-tight leading-tight">
                  {siteConfig.name}
                </h1>
                <p className="text-[10px] text-theme-text-secondary font-medium uppercase tracking-wider">
                  {siteConfig.shortName} System v2.0
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 主导航 */}
        <div>
          {navGroups.map((group) => (
            <PaperNavGroup
              key={group.title}
              title={group.title}
              open={openGroup === group.title}
              onOpenChange={(o) => setOpenGroup(o ? group.title : null)}
            >
              {group.items.map((item) => (
                <PaperNavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  active={pathname === item.href}
                  className="mb-1"
                >
                  {!sidebarCollapsed && item.title}
                </PaperNavItem>
              ))}
            </PaperNavGroup>
          ))}
        </div>

        {/* 底部操作区 */}
        {!sidebarCollapsed && (
          <div className="mt-auto p-4 border-t border-theme-border">
            <div className="space-y-3">
              <PaperButton variant="ghost" size="sm" className="w-full justify-start text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </PaperButton>
              <PaperButton variant="ghost" size="sm" className="w-full justify-start text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary">
                <UserCircle className="h-4 w-4 mr-2" />
                Profile
              </PaperButton>
            </div>
          </div>
        )}
      </PaperSidebar>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden bg-theme-bg-primary transition-colors duration-300">

        {/* 顶部导航栏 */}
        <header className="bg-theme-bg-secondary/50 backdrop-blur-md border-b border-theme-border px-6 py-4 transition-colors duration-300">
          <div className="flex items-center justify-between">
            {/* Left Side: Toggle & Breadcrumbs */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors rounded-md hover:bg-theme-bg-tertiary"
                aria-label="Toggle Sidebar"
              >
                {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
              </button>
              <nav className="flex items-center space-x-2 text-sm text-theme-text-secondary">
                <Link href="/" className="hover:text-theme-text-primary transition-colors">Home</Link>
                <span>/</span>
                <span className="text-theme-text-primary font-medium">
                  {navGroups.flatMap(g => g.items).find(item => pathname === item.href)?.title || 'Page'}
                </span>
              </nav>
            </div>

            {/* Right Side: Theme Toggle, Notifications, User */}
            <div className="flex items-center space-x-6">
              {/* Theme Switcher */}
              <div className="hidden md:block">
                <GooeySwitch />
              </div>

              {/* Notifications */}
              <button className="p-2 relative text-theme-text-secondary hover:text-theme-text-primary transition-colors rounded-md hover:bg-theme-bg-tertiary" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
              </button>

              {/* 用户信息与下拉 */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-theme-bg-tertiary rounded-full flex items-center justify-center border border-theme-border">
                  <UserCircle className="h-5 w-5 text-theme-text-secondary" />
                </div>
                <div className="relative">
                  <details className="group">
                    <summary className="list-none cursor-pointer">
                      <div className="hidden md:block">
                        <p className="text-sm font-medium text-theme-text-primary transition-colors">Administrator</p>
                        <p className="text-xs text-theme-text-secondary">Super Admin</p>
                      </div>
                    </summary>
                    <div className="absolute right-0 mt-2 w-56 bg-theme-bg-secondary border border-theme-border rounded-lg shadow-xl p-2 z-50">
                      <div className="px-2 py-1 text-xs text-theme-text-secondary uppercase tracking-wider font-semibold">Account</div>
                      <button className="w-full text-left px-3 py-2 rounded-md hover:bg-theme-bg-tertiary text-sm transition-colors text-theme-text-secondary">
                        Profile Settings
                      </button>
                      <button className="w-full text-left px-3 py-2 rounded-md hover:bg-theme-bg-tertiary text-sm transition-colors text-red-500 hover:text-red-400">
                        Sign Out
                      </button>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
