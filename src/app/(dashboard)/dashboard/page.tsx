import React, { Suspense } from 'react';
import { AceternityTabs } from '@/shared/ui/aceternity-tabs';
import { Skeleton } from '@/shared/ui/skeleton';
import { DashboardTab } from '@/features/dashboard/components/dashboard-tab';
import { TodoTab } from '@/features/dashboard/components/todo-tab';
import { AlertsTab } from '@/features/dashboard/components/alerts-tab';
import { auth } from '@/shared/lib/auth';
import { getAllTenants } from '@/features/platform/actions/admin-actions';
import { getPlatformOverview } from '@/features/platform/actions/platform-analytics';
import { getAllTemplates } from '@/features/ai-rendering/actions/template-actions';
import { getAllTenantsCreditsStats, getPlanCreditsConfig } from '@/features/ai-rendering/actions/credit-actions';
import type { TenantCreditsStats } from '@/features/ai-rendering/actions/credit-actions';

import { PlanManagementClient } from '@/features/platform/components/plan-management-client';
import type { TenantWithPlan } from '@/features/platform/components/plan-management-client';
import { TenantManagementClient } from '@/features/platform/components/tenant-management-client';
import type { TenantOverview } from '@/features/platform/components/tenant-management-client';
import { TemplateManager } from '@/features/ai-rendering/components/template-manager';

/**
 * 工作台首页
 * 使用 Aceternity Tabs 组件展示核心模块及平台管理大盘
 */
export default async function DashboardPage() {
  const session = await auth();
  const isPlatformAdmin = session?.user?.isPlatformAdmin === true;
  const tabs = [
    {
      title: '仪表盘',
      value: 'dashboard',
      content: (
        <div className="glass-liquid relative h-full w-full overflow-hidden rounded-2xl border border-white/10 p-6">
          <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl" />}>
            <DashboardTab />
          </Suspense>
        </div>
      ),
    },
    {
      title: '待办事项',
      value: 'todos',
      content: (
        <div className="glass-liquid relative h-full w-full overflow-hidden rounded-2xl border border-white/10 p-6">
          <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl" />}>
            <TodoTab />
          </Suspense>
        </div>
      ),
    },
    {
      title: '报警中心',
      value: 'alerts',
      content: (
        <div className="glass-liquid relative h-full w-full overflow-hidden rounded-2xl border border-white/10 p-6">
          <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl" />}>
            <AlertsTab />
          </Suspense>
        </div>
      ),
    },
  ];

  if (isPlatformAdmin) {
    try {
      const [
        tenantsResult,
        overviewResult,
        templates,
        stats,
        planConfig
      ] = await Promise.all([
        getAllTenants({ page: 1, pageSize: 100 }),
        getPlatformOverview(),
        getAllTemplates(),
        getAllTenantsCreditsStats(),
        Promise.resolve(getPlanCreditsConfig())
      ]);

      const rawTenants = tenantsResult.success ? (tenantsResult.data?.tenants ?? []) : [];
      const tenants: TenantWithPlan[] = rawTenants.map((t) => ({
        id: t.id,
        name: t.name,
        code: t.code,
        status: t.status,
        planType: ((t as unknown as Record<string, unknown>).planType as 'base' | 'pro' | 'enterprise') ?? 'base',
        planExpiresAt: null,
        createdAt: t.createdAt,
      }));

      const overview: TenantOverview = overviewResult.success && overviewResult.data
        ? {
          totalTenants: overviewResult.data.totalCount ?? 0,
          activeTenants: overviewResult.data.activeCount ?? 0,
          pendingTenants: overviewResult.data.pendingCount ?? 0,
          suspendedTenants: overviewResult.data.suspendedCount ?? 0,
        }
        : {
          totalTenants: 0,
          activeTenants: 0,
          pendingTenants: 0,
          suspendedTenants: 0,
        };

      const adminTabs = [
        {
          title: '平台总览(租户管理)',
          value: 'tenants',
          content: (
            <div className="glass-liquid relative h-full w-full overflow-auto rounded-2xl border border-white/10 p-2 md:p-6">
              <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl" />}>
                <TenantManagementClient initialTenants={rawTenants} initialTotal={tenantsResult.success ? (tenantsResult.data?.total ?? 0) : 0} overview={overview} />
              </Suspense>
            </div>
          )
        },
        {
          title: '套餐与配置',
          value: 'plans',
          content: (
            <div className="glass-liquid relative h-full w-full overflow-auto rounded-2xl border border-white/10 p-2 md:p-6">
              <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl" />}>
                <PlanManagementClient tenants={tenants} />
              </Suspense>
            </div>
          )
        },
        {
          title: 'AI 款式模板',
          value: 'ai-templates',
          content: (
            <div className="glass-liquid relative h-full w-full overflow-auto rounded-2xl border border-white/10 p-2 md:p-6">
              <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl" />}>
                <TemplateManager initialTemplates={templates} />
              </Suspense>
            </div>
          )
        },
        {
          title: '积分透视台',
          value: 'ai-credits',
          content: (
            <div className="glass-liquid relative h-full w-full overflow-auto rounded-2xl border border-white/10 p-2 md:p-6">
              <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl" />}>
                <AiCreditsTab stats={stats} planConfig={planConfig} />
              </Suspense>
            </div>
          )
        }
      ];

      tabs.push(...adminTabs);
    } catch (adminError) {
      // 平台管理功能加载失败不应影响普通仪表盘渲染
      console.error('[Dashboard] 平台管理面板加载失败:', adminError);
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] w-full flex-col items-start justify-start [perspective:1000px]">
      <AceternityTabs
        tabs={tabs}
        containerClassName="mb-4"
        tabClassName="text-sm font-medium"
        contentClassName="mt-6"
      />
    </div>
  );
}

/**
 * 积分额度展示面板
 */
function AiCreditsTab({ stats, planConfig }: { stats: TenantCreditsStats[], planConfig: Record<string, number> }) {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-medium text-gray-100">套餐积分配置</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              { name: 'Base 基础版', key: 'base', color: 'bg-gray-800/50 border-gray-700/50' },
              { name: 'Pro 专业版', key: 'pro', color: 'bg-blue-900/20 border-blue-800/40' },
              { name: 'Enterprise 旗舰版', key: 'enterprise', color: 'bg-purple-900/20 border-purple-800/40' },
            ] as const
          ).map((plan) => (
            <div key={plan.key} className={`rounded-xl border p-4 ${plan.color}`}>
              <p className="text-sm font-medium text-gray-300">{plan.name}</p>
              <p className="mt-2 text-3xl font-bold text-gray-100">
                {planConfig[plan.key] === Infinity ? '∞' : planConfig[plan.key]}
              </p>
              <p className="mt-1 text-xs text-gray-400">积分/月</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-medium text-gray-100">各租户实际消耗统计</h2>
        {stats.length === 0 ? (
          <p className="text-sm text-gray-500">暂无任何流水数据</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">租户 ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">本月消耗积分</th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-400 uppercase">渲染发起频次</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.map((row) => (
                  <tr key={row.tenantId} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm whitespace-nowrap text-gray-200">{row.tenantId}</td>
                    <td className="px-6 py-4 text-sm font-bold whitespace-nowrap text-indigo-400">{row.totalCreditsUsed ?? 0} <span className="text-gray-500 text-xs font-normal">点</span></td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-300">{row.renderingCount} <span className="text-gray-500 text-xs font-normal">次</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
