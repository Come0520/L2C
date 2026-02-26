import { getAccountingPeriods, getOrCreateCurrentPeriod } from '@/features/finance/actions/period-actions';
import { PeriodListClient } from '@/features/finance/components/period-list-client';

export default async function FinancialPeriodsPage() {
    // 1. 初次访问时自动确认/初始化当月账期
    await getOrCreateCurrentPeriod();

    // 2. 获取列表数据
    const result = await getAccountingPeriods();

    if (!result.success) {
        return <div>获取账期数据失败，请重试或检查租户权限。</div>;
    }

    // 服务端取出的数据带有封闭人名称
    const periods = result.data || [];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">账期管理</h2>
            </div>

            <div className="text-sm text-muted-foreground mb-4">
                查看财务所有账期状态、执行关账操作。当前周期账期会自动生成。
            </div>

            <PeriodListClient initialData={periods as any} />
        </div>
    );
}
