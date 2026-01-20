import { getInternalTransfers } from '@/features/finance/actions/transfers';
import { TransfersList } from '@/features/finance/components/transfers-list';
import { CreateTransferDialog } from '@/features/finance/components/create-transfer-dialog';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * 资金调拨管理页面
 */
export default async function TransfersPage() {
    const result = await getInternalTransfers();
    const transfers = result.success ? (result.data || []) : [];

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">资金调拨</h1>
                    <p className="text-muted-foreground text-sm">管理账户间资金调拨</p>
                </div>
                <CreateTransferDialog
                    trigger={
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            新建调拨
                        </Button>
                    }
                />
            </div>
            <div className="flex-1 p-6">
                <TransfersList data={transfers} />
            </div>
        </div>
    );
}
