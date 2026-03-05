import { Suspense } from 'react';
import { ProductsClient } from './products-client';
import { getProducts } from '@/features/products/actions/queries';
import { Product } from '@/features/products/types';
import { TableSkeleton } from '@/shared/ui/skeleton-variants';

export default function ProductsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ProductsDataWrapper />
    </Suspense>
  );
}

async function ProductsDataWrapper() {
  const result = await getProducts({ page: 1, pageSize: 50 });
  const initialData = (result.data?.data || []) as unknown as Product[];

  return <ProductsClient initialData={initialData} />;
}
