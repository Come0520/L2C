import { Suspense } from 'react';
import { SuppliersClient } from './suppliers-client';
import { getSuppliers } from '@/features/supply-chain/actions/supplier-actions';
import { TableSkeleton } from '@/shared/ui/skeleton-variants';

export default function SuppliersPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <SuppliersDataWrapper />
    </Suspense>
  );
}

async function SuppliersDataWrapper() {
  const result = await getSuppliers({ page: 1, pageSize: 100 });
  const initialData = result.data?.data || [];

  return <SuppliersClient initialData={initialData} />;
}
