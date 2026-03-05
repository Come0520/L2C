import { Suspense } from 'react';
import { ProcessorsClient } from './processors-client';
import { getSuppliers } from '@/features/supply-chain/actions/supplier-actions';
import { TableSkeleton } from '@/shared/ui/skeleton-variants';

export default function ProcessorsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ProcessorsDataWrapper />
    </Suspense>
  );
}

async function ProcessorsDataWrapper() {
  const result = await getSuppliers({ page: 1, pageSize: 100, type: 'PROCESSOR' });
  const initialData = result.data?.data || [];
  const initialTotal = result.data?.total || 0;

  return <ProcessorsClient initialData={initialData} initialTotal={initialTotal} />;
}
