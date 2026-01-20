import { getReceiptBills } from '@/features/finance/actions/receipt';
import { ReceiptBillTable } from '@/features/finance/components/receipt-bill-table';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { ReceiptBillDialog } from '@/features/finance/components/receipt-bill-dialog';
import { Button } from '@/shared/ui/button';
import Plus from 'lucide-react/dist/esm/icons/plus';

export default async function ReceiptsPage() {
    const data = await getReceiptBills();

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="收款管理 (Receipts)"
                subtitle="查看并管理所有收款单据、审批状态及核销进度"
            >
                <ReceiptBillDialog
                    trigger={
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            登记收款
                        </Button>
                    }
                />
            </DashboardPageHeader>

            <div className="bg-card p-6 rounded-lg border shadow-sm">
                <ReceiptBillTable data={data} />
            </div>
        </div>
    );
}
