'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { Sidebar, SidebarBody, useSidebar } from '@/shared/ui/sidebar';
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
import { LogoWithThemeSwitcher } from '@/shared/ui/theme-pill-nav';
import { useTenant } from '@/shared/providers/tenant-provider';
import { VerifiedIcon } from '@/shared/ui/verification-badge';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { ROLES } from '@/shared/config/roles';

/**
 * 导航链接项类型定义
 */
interface NavLinkItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission: string | null;
}

/**
 * 导航分组类型定义
 */
interface NavGroup {
  title: string; // 分组标题（侧边栏展开时显示）
  items: NavLinkItem[];
}

/**
 * 导航分组配置
 * 按业务逻辑将菜单分为 4 组，提升高权限用户的导航体验
 * requiredPermission: 访问该菜单所需的模块权限前缀（用于角色过滤）
 */
const navGroups: NavGroup[] = [
  {
    title: '业务中心',
    items: [
      { label: '工作台', href: '/dashboard', icon: Home, requiredPermission: null },
      { label: '线索管理', href: '/leads', icon: Users, requiredPermission: 'lead' },
      { label: '渠道管理', href: '/channels', icon: Network, requiredPermission: 'channel' },
      { label: '客户管理', href: '/customers', icon: UserCheck, requiredPermission: 'customer' },
      { label: '报价管理', href: '/quotes', icon: FileText, requiredPermission: 'quote' },
      { label: '订单管理', href: '/orders', icon: ShoppingCart, requiredPermission: 'order' },
      { label: '云展厅', href: '/showroom', icon: Store, requiredPermission: 'showroom' },
    ],
  },
  {
    title: '交付中心',
    items: [
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
      { label: '供应链', href: '/supply-chain', icon: Truck, requiredPermission: 'supply_chain' },
      {
        label: '售后服务',
        href: '/after-sales',
        icon: Headphones,
        requiredPermission: 'after_sales',
      },
    ],
  },
  {
    title: '管理中心',
    items: [
      { label: '财务中心', href: '/finance', icon: DollarSign, requiredPermission: 'finance' },
      {
        label: '审批中心',
        href: '/workflow/approvals',
        icon: ClipboardCheck,
        requiredPermission: 'approval',
      },
      { label: '数据分析', href: '/analytics', icon: BarChart2, requiredPermission: 'analytics' },
      { label: '通知中心', href: '/notifications', icon: Bell, requiredPermission: null },
    ],
  },
  {
    title: '系统',
    items: [
      { label: '系统设置', href: '/settings', icon: Settings, requiredPermission: 'settings' },
    ],
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
  if (roles.includes('ADMIN')) return true;

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
 * 按分组渲染导航链接，提升高权限用户的导航体验
 */
export function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { data: session } = useSession();

  // 动态生成分组导航菜单：按角色过滤 + 平台管理员添加租户管理
  const displayGroups = React.useMemo(() => {
    const userRoles = session?.user?.roles || [session?.user?.role || 'SALES'];

    // 按权限过滤每组中的可见菜单
    const filtered = navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((link) => {
          if (!link.requiredPermission) return true;
          return hasModuleAccess(userRoles, link.requiredPermission);
        }),
      }))
      .filter((group) => group.items.length > 0); // 移除空分组

    // 平台管理员额外显示独立的"租户管理"和"套餐配置"子菜单入口
    if (session?.user?.isPlatformAdmin) {
      const systemGroup = filtered.find((g) => g.title === '系统');
      const platformItems = [
        {
          label: '租户管理',
          href: '/platform/tenants',
          icon: Building2,
          requiredPermission: null,
        },
        {
          label: '套餐配置',
          href: '/platform/plans',
          icon: DollarSign,
          requiredPermission: null,
        },
      ];
      if (systemGroup) {
        systemGroup.items.push(...platformItems);
      } else {
        filtered.push({
          title: '平台管理',
          items: platformItems,
        });
      }
    }
    return filtered;
  }, [session?.user?.isPlatformAdmin, session?.user?.roles, session?.user?.role]);

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="glass-liquid border-border/50 justify-between gap-6 border-r shadow-sm dark:border-white/10">
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Logo 带主题切换 */}
          <div className="border-border/50 border-b px-2 pb-4 dark:border-white/5">
            <LogoWrapper />
          </div>

          {/* 分组导航链接 */}
          <div className="mt-2 flex-1 overflow-x-hidden overflow-y-auto px-2 py-2">
            {displayGroups.map((group, groupIndex) => (
              <div key={group.title} className={cn("flex flex-col gap-1", groupIndex > 0 ? 'mt-6' : '')}>
                {/* 分组标题 - 仅侧边栏展开时显示 */}
                <motion.div
                  animate={{
                    display: open ? 'block' : 'none',
                    opacity: open ? 1 : 0,
                  }}
                  className="mb-1.5 px-3"
                >
                  <span className="text-muted-foreground/60 text-[10px] font-semibold tracking-widest uppercase">
                    {group.title}
                  </span>
                </motion.div>
                {/* 收起时的分组分隔线 */}
                {!open && groupIndex > 0 && (
                  <div className="border-border/30 mx-2 mb-2 border-t dark:border-white/5" />
                )}
                {/* 导航项 */}
                {group.items.map((link) => {
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
              </div>
            ))}
          </div>
        </div>

        {/* 底部用户信息 - 指向独立的用户设置页面 */}
        <div className="border-border/50 mt-auto border-t pt-4 pb-2 px-2 dark:border-white/5">
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
        'group/sidebar flex items-center rounded-xl px-3 py-2.5 transition-all duration-300 active:scale-95',
        animate && !open ? 'justify-center' : 'justify-start gap-3',
        isActive
          ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20 font-semibold ring-1 ring-primary-500/50 dark:bg-primary-500 dark:ring-primary-500/40'
          : 'text-neutral-500 hover:bg-neutral-100/80 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-neutral-100'
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0 transition-colors',
          isActive
            ? 'text-white'
            : 'text-neutral-500 group-hover/sidebar:text-neutral-900 dark:text-neutral-400 dark:group-hover/sidebar:text-neutral-100'
        )}
      />
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          'text-base font-medium whitespace-pre transition duration-150 group-hover/sidebar:translate-x-1',
          isActive ? 'text-white' : ''
        )}
      >
        {label}
      </motion.span>
    </Link>
  );
}

// 默认导出以保持向后兼容
export { AppSidebar as Sidebar };
