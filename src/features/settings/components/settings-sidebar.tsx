'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils';
import Building2 from 'lucide-react/dist/esm/icons/building';
import Settings2 from 'lucide-react/dist/esm/icons/settings2';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import User from 'lucide-react/dist/esm/icons/user';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Palette from 'lucide-react/dist/esm/icons/palette';
import BadgeCheck from 'lucide-react/dist/esm/icons/badge-check';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import GitBranch from 'lucide-react/dist/esm/icons/git-branch';
import ScrollText from 'lucide-react/dist/esm/icons/scroll-text';
import Bell from 'lucide-react/dist/esm/icons/bell';
import Truck from 'lucide-react/dist/esm/icons/truck';

/**
 * 设置页导航分组配置
 * 按 4 组排列：企业信息、团队管理、业务规则、系统管理
 */
const settingsNav = [
  {
    title: '企业信息',
    items: [
      { href: '/settings/general', title: '基本信息', icon: Building2 },
      { href: '/settings/theme', title: '品牌与主题', icon: Palette },
      { href: '/settings/verification', title: '企业认证', icon: BadgeCheck },
    ],
  },
  {
    title: '团队管理',
    items: [
      { href: '/settings/users', title: '团队成员', icon: User },
      { href: '/settings/roles', title: '角色权限', icon: Shield },
      { href: '/settings/workflow', title: '审批流程', icon: GitBranch },
    ],
  },
  {
    title: '业务规则',
    items: [
      { href: '/settings/quote', title: '报价设置', icon: FileText },
      { href: '/settings/order', title: '订单设置', icon: ShoppingCart },
      { href: '/settings/finance', title: '财务设置', icon: Wallet },
      { href: '/settings/supply-chain', title: '供应链设置', icon: Truck },
      { href: '/settings/notifications', title: '通知规则', icon: Bell },
    ],
  },
  {
    title: '系统管理',
    items: [
      { href: '/settings/audit-logs', title: '审计日志', icon: ScrollText },
      { href: '/settings/system', title: '系统配置', icon: Settings2 },
    ],
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();
  return (
    <nav className="border-border bg-card/50 w-64 shrink-0 space-y-6 border-r p-6">
      {settingsNav.map((group, index) => (
        <div key={index}>
          <h4 className="text-muted-foreground mb-2 px-3 text-[10px] font-semibold tracking-widest uppercase">
            {group.title}
          </h4>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export { settingsNav };
