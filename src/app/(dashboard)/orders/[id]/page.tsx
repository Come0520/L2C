import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getOrderDetail, getOrderItems, getOrderPaymentSchedules } from '@/features/orders/actions';
import {
  OrderDashboardView,
  type OrderData,
} from '@/features/orders/components/order-dashboard-view';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <OrderDetailDataWrapper params={params} />
    </Suspense>
  );
}

async function OrderDetailDataWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 性能优化：并行获取订单基础信息、明细和收款计划 (D8)
  const [baseResult, itemsResult, schedulesResult] = await Promise.all([
    getOrderDetail(id),
    getOrderItems(id),
    getOrderPaymentSchedules(id),
  ]);

  if (!baseResult.success || !baseResult.data) {
    notFound();
  }

  // 组装数据，保持与 OrderDashboardView 的原始接口兼容
  const order: OrderData = {
    ...baseResult.data,
    items: itemsResult.success
      ? itemsResult.data.map((item) => ({
          id: item.id,
          roomName: item.roomName,
          productName: item.productName,
          attributes: item.attributes,
          subtotal: item.subtotal,
          quantity: item.quantity,
        }))
      : [],
    paymentSchedules: schedulesResult.success
      ? schedulesResult.data.map((s) => ({
          id: s.id,
          name: s.name,
          amount: s.amount,
          actualAmount: s.actualAmount,
          status: s.status,
          expectedDate: s.expectedDate,
          proofImg: s.proofImg,
        }))
      : [],
  };

  return <OrderDashboardView order={order} />;
}
