import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { AppSidebar } from '../../widgets/layout/sidebar';
import { Header } from '../../widgets/layout/header';
import { GlobalSearchCommand } from '@/features/search/components/global-search-command';

/**
 * Dashboard 布局组件
 * 使用 Aceternity Sidebar 实现自适应侧边栏
 * 包含认证守卫，未登录用户自动跳转到登录页
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // 未登录，跳转到登录页
  if (!session) {
    redirect('/login');
  }

  // 初始化租户配置（静默尝试，确保旧租户配置补齐）
  if (session.user?.tenantId) {
    const { initTenantSettings } =
      await import('@/features/settings/actions/system-settings-actions');
    // 这是一个异步操作，但不阻塞布局渲染
    initTenantSettings(session.user.tenantId).catch((err) => {
      console.error('Failed to initialize tenant settings:', err);
    });
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-transparent">
      {/* 侧边栏导航 */}
      <AppSidebar />

      {/* 主内容区域 */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <Header session={session} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">{children}</main>
      </div>

      {/* 全局搜索组件 */}
      <GlobalSearchCommand />
    </div>
  );
}
