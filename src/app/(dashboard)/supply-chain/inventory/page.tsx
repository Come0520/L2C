export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { getInventoryLevels } from '@/features/supply-chain/actions/inventory-actions';
import { InventoryList } from '@/features/supply-chain/components/inventory-list';

import { Button } from '@/shared/ui/button';
import { PlusIcon, ArrowRightLeftIcon } from 'lucide-react';
import { AdjustInventoryDialog } from '@/features/supply-chain/components/adjust-inventory-dialog';
import { TableSkeleton } from '@/shared/ui/skeleton-variants';

export const metadata = {
  title: '库存查询',
};

async function InventoryData() {
  // Initial fetch: all warehouses (or filter by default)
  const result = await getInventoryLevels({});
  const items = result.data ?? [];

  return <InventoryList initialItems={items} />;
}

export default function InventoryPage() {
  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="glass-liquid-ultra flex-1 rounded-2xl border border-white/10 p-6">
        <div className="mb-4 flex items-center justify-end gap-2">
          {/* 调拨 Dialog (Future) */}
          <Button variant="outline" size="sm">
            <ArrowRightLeftIcon className="mr-2 h-4 w-4" />
            调拨
          </Button>

          {/* 盘点 Dialog */}
          <AdjustInventoryDialog
            trigger={
              <Button size="sm">
                <PlusIcon className="mr-2 h-4 w-4" />
                调整/盘点
              </Button>
            }
          />
        </div>

        <Suspense fallback={<TableSkeleton />}>
          <InventoryData />
        </Suspense>
      </div>
    </div>
  );
}
