import { notFound } from 'next/navigation';
import { getOrderDetail } from '@/features/orders/actions/order-actions';
import { OrderDashboardView } from '@/features/orders/components/order-dashboard-view';

export const revalidate = 0;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data: order, success } = await getOrderDetail(id);

    if (!success || !order) {
        notFound();
    }

    return <OrderDashboardView order={order} />;
}
