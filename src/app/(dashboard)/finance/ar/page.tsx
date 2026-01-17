import { getARStatements } from '@/features/finance/actions/ar';
import { ARStatementTable } from '@/features/finance/components/ARStatementTable';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';

export default async function ARPage() {
    const data = await getARStatements();

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="收款管理 (AR)"
                subtitle="管理客户应收对账单、登记收款、查看回款进度"
            />

            <div className="bg-card p-6 rounded-lg border shadow-sm">
                <ARStatementTable data={data} />
            </div>
        </div>
    );
}
