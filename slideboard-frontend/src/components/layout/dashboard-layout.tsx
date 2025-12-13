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
  CheckCircle,
  BookOpen,
  LogOut,
  Ruler,
  Hammer,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

// import l2cLogo from '@/assets/images/l2c-logo.png'; // Removed in favor of static asset

import { GooeyThemeToggle } from '@/components/ui/gooey-theme-toggle';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { Tabs } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
// import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Check if current page should be full screen (no sidebar/header)
  const isFullScreenPage = React.useMemo(() => {
    if (!pathname) return false;
    
    // Auth pages and error pages
    const fullScreenPrefixes = ['/login', '/register', '/auth', '/403', '/404'];
    return fullScreenPrefixes.some(prefix => pathname.startsWith(prefix));
  }, [pathname]);

  const navGroups = React.useMemo(
    () => [
      {
        title: '工作台',
        icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0" />,
        href: '/dashboard', // Default href for parent, though we might not use it directly for navigation if it has children
        items: [
          { title: '总览仪表盘', icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0" />, href: '/dashboard' },
          { title: '待办清单', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/dashboard/todos' },
          { title: '预警中心', icon: <Bell className="h-5 w-5 flex-shrink-0" />, href: '/dashboard/alerts' },
          { title: '罗莱大学', icon: <BookOpen className="h-5 w-5 flex-shrink-0" />, href: '/academy' },
        ],
      },
      {
        title: '客户经营',
        icon: <Users className="h-5 w-5 flex-shrink-0" />,
        href: '/customers',
        items: [
          { title: '已合作装企', icon: <Users className="h-5 w-5 flex-shrink-0" />, href: '/customers/cooperative' },
          { title: '潜在合作装企', icon: <Users className="h-5 w-5 flex-shrink-0" />, href: '/customers/prospects' },
          { title: '考核视图', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/customers/assessment' },
        ],
      },
      {
        title: '线索管理',
        icon: <Users className="h-5 w-5 flex-shrink-0" />,
        href: '/leads',
        items: [
          { title: '线索管理', icon: <Users className="h-5 w-5 flex-shrink-0" />, href: '/leads' },
        ],
      },
      {
        title: '测量阶段',
        icon: <Ruler className="h-5 w-5 flex-shrink-0" />,
        href: '/orders/status/pending-survey',
        items: [
          { title: '待测量', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/pending-survey' },
          { title: '测量中-待分配', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/surveying-pending-assignment' },
          { title: '测量中-分配中', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/surveying-assigning' },
          { title: '测量中-待上门', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/surveying-pending-visit' },
          { title: '测量中-待确认', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/surveying-pending-confirmation' },
          { title: '方案待确认', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/plan-pending-confirmation' },
        ],
      },
      {
        title: '订单处理阶段',
        icon: <FileText className="h-5 w-5 flex-shrink-0" />,
        href: '/orders/status/draft-sign',
        items: [
          { title: '开单', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/draft-sign' },
          { title: '待推单', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/pending-push' },
          { title: '待下单', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/pending-place-order' },
          { title: '生产/备货中', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/in-production' },
          { title: '备货完成', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/stock-ready' },
          { title: '待发货', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/pending-shipment' },
        ],
      },
      {
        title: '安装阶段',
        icon: <Hammer className="h-5 w-5 flex-shrink-0" />,
        href: '/orders/status/installing-pending-assignment',
        items: [
          { title: '安装中-待分配', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/installing-pending-assignment' },
          { title: '安装中-分配中', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/installing-assigning' },
          { title: '安装中-待上门', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/installing-pending-visit' },
          { title: '安装中-待确认', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/installing-pending-confirmation' },
        ],
      },
      {
        title: '财务阶段',
        icon: <CreditCard className="h-5 w-5 flex-shrink-0" />,
        href: '/orders/status/pending-reconciliation',
        items: [
          { title: '待对账', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/pending-reconciliation' },
          { title: '待开票', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/pending-invoice' },
        ],
      },
      {
        title: '异常状态',
        icon: <AlertTriangle className="h-5 w-5 flex-shrink-0" />,
        href: '/orders/status/exception',
        items: [
          { title: '异常订单', icon: <AlertTriangle className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/exception' },
          { title: '已取消', icon: <AlertTriangle className="h-5 w-5 flex-shrink-0" />, href: '/orders/status/cancelled' },
        ],
      },
      {
        title: '商品与库存',
        icon: <Package className="h-5 w-5 flex-shrink-0" />,
        href: '/products',
        items: [
          { title: '商品管理', icon: <Package className="h-5 w-5 flex-shrink-0" />, href: '/products' },
          { title: '库存管理', icon: <Package className="h-5 w-5 flex-shrink-0" />, href: '/products/inventory' },
          { title: '供应商管理', icon: <Truck className="h-5 w-5 flex-shrink-0" />, href: '/suppliers' },
        ],
      },
      {
        title: '服务与供应链',
        icon: <UserCircle className="h-5 w-5 flex-shrink-0" />,
        href: '/service-supply',
        items: [
          { title: '测量师管理', icon: <UserCircle className="h-5 w-5 flex-shrink-0" />, href: '/service-supply/surveyors' },
          { title: '安装师傅管理', icon: <UserCircle className="h-5 w-5 flex-shrink-0" />, href: '/service-supply/installers' },
        ],
      },
      {
        title: '积分与商城',
        icon: <Gift className="h-5 w-5 flex-shrink-0" />,
        href: '/mall',
        items: [
          { title: '积分商城', icon: <Gift className="h-5 w-5 flex-shrink-0" />, href: '/mall' },
          { title: '积分商品', icon: <Package className="h-5 w-5 flex-shrink-0" />, href: '/customers/loyalty/gifts' },
          { title: '积分规则', icon: <CheckCircle className="h-5 w-5 flex-shrink-0" />, href: '/points-coefficient/all-rules' },
        ],
      },
      {
        title: '通知与审批',
        icon: <Bell className="h-5 w-5 flex-shrink-0" />,
        href: '/notifications',
        items: [
          { title: '消息通知', icon: <Bell className="h-5 w-5 flex-shrink-0" />, href: '/notifications' },
          { title: '我的审批', icon: <CheckCircle className="h-5 w-5 flex-shrink-0" />, href: '/approvals' },
        ],
      },
      {
        title: '财务',
        icon: <FileText className="h-5 w-5 flex-shrink-0" />,
        href: '/finance',
        items: [
          { title: '财务概览', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/finance' },
          { title: '对账单', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/finance/reconciliations' },
        ],
      },
      {
        title: '文件管理',
        icon: <Folder className="h-5 w-5 flex-shrink-0" />,
        href: '/files',
        items: [
          { title: '文件中心', icon: <Folder className="h-5 w-5 flex-shrink-0" />, href: '/files' },
        ],
      },
      {
        title: '系统',
        icon: <Settings className="h-5 w-5 flex-shrink-0" />,
        href: '/system',
        items: [
          { title: '团队管理', icon: <Users className="h-5 w-5 flex-shrink-0" />, href: '/system/team' },
          { title: '系统设置', icon: <Settings className="h-5 w-5 flex-shrink-0" />, href: '/system/settings' },
          { title: '操作日志', icon: <FileText className="h-5 w-5 flex-shrink-0" />, href: '/system/audit' },
        ],
      },
    ],
    []
  );

  // Find current active group
  const activeGroup = React.useMemo(() => {
    const group = navGroups.find(group => 
      group.items.some(item => pathname === item.href || pathname?.startsWith(item.href))
    );
    return group || navGroups[0];
  }, [pathname, navGroups]);

  // Transform group items to Tabs format
  const tabs = React.useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.items.map(item => ({
      title: item.title,
      value: item.href,
      href: item.href,
      content: null,
    }));
  }, [activeGroup]);

  // 退出登录处理
  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // If it's a full screen page, render only children
  if (isFullScreenPage) {
    return <>{children}</>;
  }

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
    <div className={cn("flex flex-col md:flex-row bg-theme-bg-primary w-full flex-1 mx-auto overflow-hidden", "h-screen")}>
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 bg-theme-bg-secondary border-r border-theme-border">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo Area */}
            <div className="flex items-center gap-2 px-1 py-2 mb-4">
              <Image
                src="/l2c-logo.svg"
                alt="L2C Logo"
                width={32}
                height={32}
                className="rounded-lg object-contain flex-shrink-0"
                priority
                unoptimized
              />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="font-bold text-lg text-theme-text-primary whitespace-pre overflow-hidden"
              >
                销售管理系统
              </motion.span>
            </div>

            {/* Navigation Groups - Only Top Level */}
            <div className="flex flex-col gap-2">
              {navGroups.map((group) => (
                <SidebarLink
                  key={group.title}
                  link={{
                    label: group.title,
                    href: group.href,
                    icon: group.icon
                  }}
                  className={cn(
                    activeGroup && activeGroup.title === group.title
                      ? "bg-theme-bg-tertiary text-primary-500 font-medium rounded-md"
                      : "text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/50 rounded-md"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Footer / User Profile */}
          <div className="flex flex-col gap-2">
            <SidebarLink
              link={{
                label: user?.name || 'User',
                href: '#',
                icon: (
                  <div className="h-7 w-7 rounded-full bg-theme-bg-tertiary flex items-center justify-center border border-theme-border flex-shrink-0 overflow-hidden">
                    {user?.avatarUrl ? (
                      <Image src={user.avatarUrl} width={28} height={28} alt="Avatar" className="rounded-full" />
                    ) : (
                      <UserCircle className="h-5 w-5 text-theme-text-secondary" />
                    )}
                  </div>
                )
              }}
            />
            {/* Logout button mimicking a link */}
            <div onClick={handleSignOut} className="cursor-pointer">
              <SidebarLink
                link={{
                  label: '退出登录',
                  href: '#',
                  icon: <LogOut className="h-5 w-5 text-theme-text-secondary flex-shrink-0" />
                }}
              />
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-theme-bg-secondary/50 backdrop-blur-md border-b border-theme-border px-6 h-[73px] flex items-center transition-colors duration-300">
          <div className="flex items-center justify-between w-full">
            {/* Left Side: Breadcrumbs / Group Title */}
            <div className="flex items-center gap-4">
               <h1 className="text-xl font-bold text-theme-text-primary">{activeGroup?.title}</h1>
            </div>

            {/* Right Side: Theme Toggle & Notifications */}
            <div className="flex items-center space-x-6">
              <div className="hidden md:block">
                <GooeyThemeToggle />
              </div>
              <button className="p-2 relative text-theme-text-secondary hover:text-theme-text-primary transition-colors rounded-md hover:bg-theme-bg-tertiary" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Tabs and Main Content */}
        <main className="flex-1 overflow-hidden bg-theme-bg-primary p-6 pt-0">
           <div className="h-full flex flex-col">
              {/* Secondary Navigation Tabs */}
               <div className="py-4">
                  <Tabs 
                    tabs={tabs} 
                    activeTab={pathname || ''}
                    layoutId="nav-tabs"
                    containerClassName="gap-2"
                    activeTabClassName="bg-paper-500 shadow-sm"
                    tabClassName="text-ink-600 hover:text-ink-900 hover:bg-paper-300 transition-colors"
                    contentClassName="hidden"
                  />
               </div>
              
              {/* Page Content */}
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex-1 overflow-y-auto rounded-2xl border border-theme-border bg-theme-bg-secondary/30 p-6 shadow-sm"
              >
                 {children}
              </motion.div>
           </div>
        </main>
      </div>
    </div>
  );
}
