import { getReconciliations } from '@/features/finance/actions/reconciliation';
import { ReconciliationTable } from '@/features/finance/components/ReconciliationTable';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';

export default async function ReconciliationPage() {
    const data = await getReconciliations();

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="对账管理"
                subtitle="管理客户、供应商、渠道及内部对账单，核对资金往来"
            />

            <div className="bg-card p-6 rounded-lg border shadow-sm">
                <ReconciliationTable data={data} />
            </div>
        </div>
    );
}
