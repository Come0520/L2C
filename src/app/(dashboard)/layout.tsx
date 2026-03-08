import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { AppSidebar } from '../../widgets/layout/sidebar';
import { Header } from '../../widgets/layout/header';
import { GlobalSearchCommand } from '@/features/search/components/global-search-command';
import { TenantProvider } from '@/shared/providers/tenant-provider';

/**
 * Dashboard 布局组件
 * 使用 Aceternity Sidebar 实现自适应侧边栏
 * 包含认证守卫 + 服务端租户信息预取（消除客户端瀑布流）
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await auth();
  } catch {
    // auth() 异常（cookie 损坏/secret 不匹配等）→ 清除残留 cookie 防循环
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.delete('authjs.session-token');
    cookieStore.delete('__Secure-authjs.session-token');
    redirect('/login');
  }

  // 未登录或 session 无效 → 清除可能的残留 cookie 后跳转
  if (!session?.user?.id) {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.delete('authjs.session-token');
    cookieStore.delete('__Secure-authjs.session-token');
    redirect('/login');
  }

  // 默认无租户数据（平台账号或未绑定租户）
  let initialTenant: {
    id: string;
    name: string;
    code: string;
    logoUrl: string | null;
    region: string | null;
    settings: unknown;
  } | null = null;

  // ── 并行执行 onboarding 守卫 + 初始化配置 + 预取租户展示信息 ──
  if (session.user?.tenantId) {
    const [{ db }, { tenants }, { eq }, { initTenantSettings }] = await Promise.all([
      import('@/shared/api/db'),
      import('@/shared/api/schema'),
      import('drizzle-orm'),
      import('@/features/settings/actions/system-settings-actions'),
    ]);

    // 三项并行：onboarding 守卫 + 配置初始化 + 租户展示信息预取
    const [tenant, , tenantProfile] = await Promise.all([
      session.user.role === 'ADMIN'
        ? db.query.tenants.findFirst({
            where: eq(tenants.id, session.user.tenantId),
            columns: { onboardingStatus: true, status: true },
          })
        : Promise.resolve(null),
      // 初始化租户配置（静默尝试，确保旧租户配置补齐）
      initTenantSettings(session.user.tenantId).catch((err: unknown) => {
        console.error('Failed to initialize tenant settings:', err);
      }),
      // 预取租户展示数据，服务端注入 TenantProvider，消除客户端 2 次串行请求
      db.query.tenants.findFirst({
        where: eq(tenants.id, session.user.tenantId),
        columns: {
          id: true,
          name: true,
          code: true,
          logoUrl: true,
          region: true,
          settings: true,
        },
      }),
    ]);

    if (tenant?.status === 'active' && tenant?.onboardingStatus === 'pending') {
      redirect('/onboarding');
    }

    initialTenant = tenantProfile ?? null;
  }

  return (
    <TenantProvider initialTenant={initialTenant}>
      <div className="flex h-screen w-full overflow-hidden bg-transparent">
        {/* 侧边栏导航 */}
        <AppSidebar />

        {/* 主内容区域 */}
        <div className="bg-background relative flex flex-1 flex-col overflow-hidden">
          <Header session={session} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 md:p-8">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </div>

        {/* 全局搜索组件 */}
        <GlobalSearchCommand />
      </div>
    </TenantProvider>
  );
}
