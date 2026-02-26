import { getChartOfAccounts } from '@/features/finance/actions/chart-of-accounts-actions';
import { ChartOfAccountsTree } from '@/features/finance/components/chart-of-accounts-tree';

export default async function ChartOfAccountsPage() {
  const result = await getChartOfAccounts();

  if (!result.success) {
    // 简单处理错误，如果未登录或者未选择租户就跳转到主页或登录页等
    // 此处可更根据现有系统处理机制
    console.error('获取科目列表失败');
    return <div>获取科目列表失败。请检查是否已选择正确的租户。</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">科目管理</h2>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <ChartOfAccountsTree initialData={result.data || []} />
      </div>
    </div>
  );
}
