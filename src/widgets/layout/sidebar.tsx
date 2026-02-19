'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { Sidebar, SidebarBody, useSidebar } from '@/components/ui/sidebar';
import {
  Home,
  Users,
  FileText,
  ShoppingCart,
  BarChart2,
  Settings,
  Ruler,
  Wrench,
  DollarSign,
  Headphones,
  Truck,
  ClipboardCheck,
  User,
  Store,
  Building2, // 租户管理图标
  Network, // 渠道管理图标
  UserCheck, // 客户管理图标
  Bell, // 通知中心图标
} from 'lucide-react';

import { motion } from 'motion/react';
import { AnimatedList } from '@/shared/ui/animated-list';
import { LogoWithThemeSwitcher } from '@/shared/ui/theme-pill-nav';
import { useTenant } from '@/shared/providers/tenant-provider';
import { VerifiedIcon } from '@/shared/ui/verification-badge';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { ROLES } from '@/shared/config/roles';

/**
 * 导航链接配置
 * 各模块入口，使用 lucide-react 图标
 * requiredPermission: 访问该菜单所需的模块权限前缀（用于角色过滤）
 */
const navLinks = [
  {
    label: '工作台',
    href: '/',
    icon: Home,
    requiredPermission: null, // 所有角色可见
  },
  {
    label: '线索管理',
    href: '/leads',
    icon: Users,
    requiredPermission: 'lead',
  },
  {
    label: '渠道管理',
    href: '/channels',
    icon: Network,
    requiredPermission: 'channel',
  },
  {
    label: '客户管理',
    href: '/customers',
    icon: UserCheck,
    requiredPermission: 'customer',
  },
  {
    label: '报价管理',
    href: '/quotes',
    icon: FileText,
    requiredPermission: 'quote',
  },
  {
    label: '订单管理',
    href: '/orders',
    icon: ShoppingCart,
    requiredPermission: 'order',
  },
  {
    label: '云展厅',
    href: '/showroom',
    icon: Store,
    requiredPermission: 'products', // 需要产品查看权限
  },
  {
    label: '测量服务',
    href: '/service/measurement',
    icon: Ruler,
    requiredPermission: 'measure',
  },
  {
    label: '安装服务',
    href: '/service/installation',
    icon: Wrench,
    requiredPermission: 'install',
  },
  {
    label: '供应链',
    href: '/supply-chain',
    icon: Truck,
    requiredPermission: 'supply_chain',
  },
  {
    label: '财务中心',
    href: '/finance',
    icon: DollarSign,
    requiredPermission: 'finance',
  },
  {
    label: '审批中心',
    href: '/workflow/approvals',
    icon: ClipboardCheck,
    requiredPermission: null, // 所有角色可见（内容按权限过滤）
  },
  {
    label: '售后服务',
    href: '/after-sales',
    icon: Headphones,
    requiredPermission: 'after_sales',
  },
  {
    label: '通知中心',
    href: '/notifications',
    icon: Bell,
    requiredPermission: null, // 所有角色可见
  },
  {
    label: '数据分析',
    href: '/analytics',
    icon: BarChart2,
    requiredPermission: 'analytics',
  },
  {
    label: '系统设置',
    href: '/settings',
    icon: Settings,
    requiredPermission: 'settings',
  },
];

/**
 * 检查角色是否拥有某模块的任意权限
 * @param roles 用户角色列表
 * @param modulePrefix 模块权限前缀（如 'lead', 'order', 'finance'）
 * @returns 是否有权限访问该模块
 */
function hasModuleAccess(roles: string[], modulePrefix: string): boolean {
  // ADMIN / TENANT_ADMIN 拥有全部模块访问权限
  if (roles.includes('ADMIN') || roles.includes('TENANT_ADMIN')) return true;

  // 从 ROLES 配置中检查用户的任一角色是否拥有该模块的某个权限
  for (const roleCode of roles) {
    const roleDef = ROLES[roleCode];
    if (!roleDef) continue;
    // 检查该角色是否拥有以 modulePrefix 开头的任意权限
    const hasPermission = (roleDef.permissions as string[]).some(
      (perm: string) => perm === '**' || perm === '*' || perm.startsWith(`${modulePrefix}.`)
    );
    if (hasPermission) return true;
  }
  return false;
}

/**
 * 应用侧边栏导航组件
 * 使用 Aceternity UI Sidebar 实现悬停展开效果
 */
export function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { data: session } = useSession();

  // 动态生成导航菜单：按角色过滤 + 平台管理员添加租户管理
  const displayNavLinks = React.useMemo(() => {
    const userRoles = session?.user?.roles || [session?.user?.role || 'SALES'];

    // 按权限过滤可见菜单
    let filtered = navLinks.filter((link) => {
      if (!link.requiredPermission) return true; // 无权限要求，所有人可见
      return hasModuleAccess(userRoles, link.requiredPermission);
    });

    // 平台管理员额外显示租户管理
    if (session?.user?.isPlatformAdmin) {
      filtered = [
        ...filtered,
        {
          label: '租户管理',
          href: '/admin/tenants',
          icon: Building2,
          requiredPermission: null,
        },
      ];
    }
    return filtered;
  }, [session?.user?.isPlatformAdmin, session?.user?.roles, session?.user?.role]);

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="glass-liquid justify-between gap-6 border-r border-white/10 dark:border-white/5">
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Logo 带主题切换 */}
          <div className="border-b border-white/10 px-2 pb-4 dark:border-white/5">
            <LogoWrapper />
          </div>

          {/* 导航链接 - 使用 AnimatedList */}
          <div className="mt-4 flex-1 overflow-x-hidden overflow-y-auto px-1">
            <AnimatedList
              items={displayNavLinks.map((link) => {
                const isActive =
                  pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <NavLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    icon={link.icon}
                    isActive={isActive}
                  />
                );
              })}
              showGradients={false}
              enableArrowNavigation={false}
              displayScrollbar={true}
              itemClassName="mb-1"
            />
          </div>
        </div>

        {/* 底部用户信息 - 指向独立的用户设置页面 */}
        <div className="mt-auto border-t border-white/10 pt-4 dark:border-white/5">
          <NavLink
            href="/profile/settings"
            label="个人设置"
            icon={User}
            isActive={pathname === '/profile/settings' || pathname.startsWith('/profile/')}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

/**
 * Logo 包装组件（根据展开状态显示/隐藏标题）
 */
function LogoWrapper() {
  const { open, animate } = useSidebar();
  const { tenant } = useTenant();

  return (
    <div
      className={cn(
        'flex items-center transition-all duration-300',
        animate && !open ? 'justify-center' : 'justify-start gap-3'
      )}
    >
      {tenant?.logoUrl ? (
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
          <Image src={tenant.logoUrl} alt={tenant.name || 'Logo'} fill className="object-cover" />
        </div>
      ) : (
        <LogoWithThemeSwitcher />
      )}
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-flex' : 'none') : 'inline-flex',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="flex items-center gap-1.5"
      >
        <span className="from-primary-600 to-primary-400 bg-linear-to-r bg-clip-text font-serif text-xl leading-tight font-semibold whitespace-normal text-transparent">
          {tenant?.name || 'L2C System'}
        </span>
        {tenant?.verificationStatus === 'verified' && (
          <VerifiedIcon size="md" className="shrink-0" />
        )}
      </motion.span>
    </div>
  );
}

/**
 * 导航链接项组件
 * 放大了字体尺寸 (text-base)
 */
function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}) {
  const { open, animate } = useSidebar();

  return (
    <Link
      href={href}
      className={cn(
        'group/sidebar flex items-center rounded-xl px-3 py-2.5 transition-all duration-300',
        animate && !open ? 'justify-center' : 'justify-start gap-3',
        isActive
          ? 'bg-primary-500/20 text-primary-600 dark:text-primary-400'
          : 'text-neutral-700 hover:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/5'
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0 transition-colors',
          isActive
            ? 'text-primary-600 dark:text-primary-400'
            : 'text-neutral-500 dark:text-neutral-400'
        )}
      />
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          'text-base font-medium whitespace-pre transition duration-150 group-hover/sidebar:translate-x-1',
          isActive ? 'text-primary-600 dark:text-primary-400' : ''
        )}
      >
        {label}
      </motion.span>
    </Link>
  );
}

// 默认导出以保持向后兼容
export { AppSidebar as Sidebar };
