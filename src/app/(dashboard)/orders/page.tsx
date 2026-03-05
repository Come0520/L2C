import { Suspense } from 'react';
import { OrderList } from '@/features/orders/components/order-list';
import { TableSkeleton } from '@/shared/ui/skeleton-variants';

export default function OrdersPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <OrderList />
    </Suspense>
  );
}
