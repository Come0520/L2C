'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils';
import Building2 from 'lucide-react/dist/esm/icons/building';
import Users from 'lucide-react/dist/esm/icons/users';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import Package from 'lucide-react/dist/esm/icons/package';
import Megaphone from 'lucide-react/dist/esm/icons/megaphone';
import Shield from 'lucide-react/dist/esm/icons/shield';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import HardHat from 'lucide-react/dist/esm/icons/hard-hat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

/**
 * 设置模块Tab分组配置
 * 每个Tab包含多个子模块
 */
const settingsTabs = [
  {
    id: 'basic',
    label: '基础设置',
    icon: Building2,
    items: [
      { href: '/settings/general', label: '租户信息' },
      { href: '/settings/verification', label: '企业认证' },
      { href: '/settings/preferences', label: '偏好设置' },
    ],
  },
  {
    id: 'team',
    label: '团队管理',
    icon: Users,
    items: [
      { href: '/settings/users', label: '用户管理' },
      { href: '/settings/roles', label: '角色权限' },
    ],
  },
  {
    id: 'business',
    label: '业务规则',
    icon: FileText,
    items: [
      { href: '/settings/quote', label: '报价配置' },
      { href: '/settings/order', label: '订单配置' },
      { href: '/settings/approvals', label: '审批流程' },
      { href: '/settings/workflow', label: '工作流设置' },
      { href: '/settings/sla', label: 'SLA设置' },
      { href: '/settings/sales/targets', label: '销售目标' },
    ],
  },
  {
    id: 'finance',
    label: '财务配置',
    icon: Wallet,
    items: [{ href: '/settings/finance', label: '财务基础' }],
  },
  {
    id: 'worker',
    label: '工人管理',
    icon: HardHat,
    items: [{ href: '/settings/labor-pricing', label: '劳务定价' }],
  },
  {
    id: 'supply',
    label: '供应链配置',
    icon: Package,
    items: [
      { href: '/settings/products', label: '产品管理' },
      { href: '/settings/split-rules', label: '采购拆单规则' },
      { href: '/settings/supply-chain', label: '供应商管理' },
    ],
  },
  {
    id: 'notification',
    label: '通知配置',
    icon: Megaphone,
    items: [
      { href: '/settings/notifications', label: '通知设置' },
      { href: '/settings/reminders', label: '提醒规则' },
    ],
  },
  {
    id: 'system',
    label: '系统管理',
    icon: Shield,
    items: [
      { href: '/settings/feature-flags', label: '功能开关' },
      { href: '/settings/testimonials', label: '首页评论' },
      { href: '/settings/audit-logs', label: '操作日志' },
    ],
  },
];

/**
 * 设置模块顶部Tab导航组件
 * 采用下拉菜单形式展示子模块
 */
export function SettingsTabNav() {
  const pathname = usePathname();

  /**
   * 判断当前Tab是否激活
   */
  const isTabActive = (tab: (typeof settingsTabs)[0]) => {
    return tab.items.some((item) => pathname === item.href || pathname.startsWith(item.href + '/'));
  };

  /**
   * 获取当前激活的子项
   */
  const getActiveItem = (tab: (typeof settingsTabs)[0]) => {
    return tab.items.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'));
  };

  return (
    <nav className="flex items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/10 p-1 backdrop-blur-md dark:bg-black/20">
      {settingsTabs.map((tab) => {
        const active = isTabActive(tab);
        const activeItem = getActiveItem(tab);
        const Icon = tab.icon;

        // 如果只有一个子项，直接跳转
        if (tab.items.length === 1) {
          return (
            <Link
              key={tab.id}
              href={tab.items[0].href}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all',
                active
                  ? 'text-foreground bg-white/80 shadow-sm dark:bg-white/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        }

        // 多个子项使用下拉菜单
        return (
          <DropdownMenu key={tab.id}>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all',
                  active
                    ? 'text-foreground bg-white/80 shadow-sm dark:bg-white/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{activeItem ? activeItem.label : tab.label}</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[160px]">
              {tab.items.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn('w-full', pathname === item.href && 'bg-accent')}
                  >
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </nav>
  );
}

export { settingsTabs };
