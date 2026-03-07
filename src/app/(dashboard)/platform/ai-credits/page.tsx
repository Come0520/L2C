/**
 * 平台管理 — 积分额度管理页
 * 展示各套餐的积分配置和各租户使用统计
 */
import {
  getAllTenantsCreditsStats,
  getPlanCreditsConfig,
} from '@/features/ai-rendering/actions/credit-actions';

export const metadata = {
  title: 'AI 积分额度管理 — 平台管理',
};

export default async function AiCreditsPage() {
  const [stats, planConfig] = await Promise.all([
    getAllTenantsCreditsStats(),
    Promise.resolve(getPlanCreditsConfig()),
  ]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">AI 积分额度管理</h1>
        <p className="mt-1 text-sm text-gray-500">查看各套餐积分配置和租户使用情况。</p>
      </div>

      {/* 套餐额度配置展示 */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-medium text-gray-700">套餐积分配置</h2>
        <div className="grid grid-cols-3 gap-4">
          {(
            [
              { name: 'Base 基础版', key: 'base', color: 'bg-gray-50 border-gray-200' },
              { name: 'Pro 专业版', key: 'pro', color: 'bg-blue-50 border-blue-200' },
              {
                name: 'Enterprise 旗舰版',
                key: 'enterprise',
                color: 'bg-purple-50 border-purple-200',
              },
            ] as const
          ).map((plan) => (
            <div key={plan.key} className={`rounded-lg border p-4 ${plan.color}`}>
              <p className="text-sm font-medium text-gray-600">{plan.name}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {planConfig[plan.key] === Infinity ? '∞' : planConfig[plan.key]}
              </p>
              <p className="mt-1 text-xs text-gray-500">积分/月</p>
            </div>
          ))}
        </div>
      </div>

      {/* 租户使用统计 */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-gray-700">租户使用统计</h2>
        {stats.length === 0 ? (
          <p className="text-sm text-gray-500">暂无数据</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    租户 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    本月消耗积分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    渲染次数
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {stats.map((row) => (
                  <tr key={row.tenantId}>
                    <td className="px-6 py-4 font-mono text-sm whitespace-nowrap text-gray-600">
                      {row.tenantId}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold whitespace-nowrap text-gray-900">
                      {row.totalCreditsUsed ?? 0}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
                      {row.renderingCount}
                    </td>
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
