import React, { Suspense } from 'react';
import { AfterSalesList } from '@/features/after-sales/components/after-sales-list';
import { TableSkeleton } from '@/shared/ui/skeleton-variants';

export default function AfterSalesPage() {
  return (
    <div className="flex h-full flex-col">
      <Suspense fallback={<TableSkeleton />}>
        <AfterSalesList />
      </Suspense>
    </div>
  );
}
