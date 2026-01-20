import { Suspense } from 'react';
import { getInventoryLevels } from '@/features/supply-chain/actions/inventory-actions';
import { InventoryList } from '@/features/supply-chain/components/inventory-list';
import { Separator } from '@/shared/ui/separator';
import { Button } from '@/shared/ui/button';
import { PlusIcon, ArrowRightLeftIcon } from 'lucide-react';
import { AdjustInventoryDialog } from '@/features/supply-chain/components/adjust-inventory-dialog';

export const metadata = {
    title: '库存查询',
};

async function InventoryData() {
    // Initial fetch: all warehouses (or filter by default)
    const result = await getInventoryLevels({});
    const items = result.data ?? [];

    return (
        <InventoryList
            initialItems={items}
        />
    );
}

export default function InventoryPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">库存查询</h2>
                    <p className="text-muted-foreground">
                        查看和管理各仓库的实时库存水平。
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* 调拨 Dialog (Future) */}
                    <Button variant="outline">
                        <ArrowRightLeftIcon className="mr-2 h-4 w-4" />
                        调拨
                    </Button>

                    {/* 盘点 Dialog */}
                    <AdjustInventoryDialog trigger={
                        <Button>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            调整/盘点
                        </Button>
                    } />
                </div>
            </div>
            <Separator />

            <Suspense fallback={<div>Loading inventory...</div>}>
                <InventoryData />
            </Suspense>
        </div>
    );
}
