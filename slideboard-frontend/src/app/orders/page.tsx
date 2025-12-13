import Link from 'next/link';
import { Suspense } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { SpotlightCard, SpotlightCardHeader, SpotlightCardTitle, SpotlightCardContent } from '@/components/ui/spotlight-card';
import { OrderListClient } from '@/features/orders/components/OrderListClient';
import { getSalesOrders } from '@/services/salesOrders.server';

export const dynamic = 'force-dynamic';

const statusLinks = [
  // 销售单状态流程
  { href: '/orders/status/draft', title: '草稿' },
  { href: '/orders/status/confirmed', title: '已确认' },
  { href: '/orders/status/purchasing', title: '采购中' },
  { href: '/orders/status/shipping', title: '物流中' },
  { href: '/orders/status/installing', title: '安装中' },
  { href: '/orders/status/confirming', title: '待确认' },
  { href: '/orders/status/reconciliation', title: '待对账' },
  { href: '/orders/status/completed', title: '已完成' },
  { href: '/orders/status/cancelled', title: '已取消' },

  // 测量单状态流程
  { href: '/orders/status/measurement-pending', title: '测量-待分配' },
  { href: '/orders/status/measurement-assigning', title: '测量-分配中' },
  { href: '/orders/status/measurement-waiting', title: '测量-待上门' },
  { href: '/orders/status/measurement-confirming', title: '测量-待确认' },
  { href: '/orders/status/measurement-completed', title: '测量-已完成' },
  { href: '/orders/status/measurement-cancelled', title: '测量-已取消' },

  // 安装单状态流程
  { href: '/orders/status/installation-pending', title: '安装-待分配' },
  { href: '/orders/status/installation-assigning', title: '安装-分配中' },
  { href: '/orders/status/installation-waiting', title: '安装-待上门' },
  { href: '/orders/status/installation-confirming', title: '安装-待确认' },
  { href: '/orders/status/installation-completed', title: '安装-已完成' },
  { href: '/orders/status/installation-cancelled', title: '安装-已取消' },
];

interface OrdersOverviewPageProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function OrdersOverviewPage({ searchParams }: OrdersOverviewPageProps) {
  // Use await for searchParams as per Next.js 15
  // But wait, the prop type is synchronous, however accessing it might be async in future or if we were using `params`.
  // For `searchParams` in server components, it is currently synchronous props but it's good practice to treat data fetching as async.
  // Actually, Next.js 15 changed params/searchParams to be Promises.
  // Let's check environment. If Next.js 15, we should await it.
  // The user prompt says "Next.js 16". So we MUST await searchParams.
  
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;
  const pageSize = 10;
  
  // Prefetch data on server
  const { orders, total } = await getSalesOrders(page, pageSize);

  return (
      <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary p-6 font-sans">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-theme-text-primary tracking-tight">订单管理</h1>
              <p className="text-theme-text-secondary mt-1">按状态机管理销售全流程。</p>
            </div>
            <Link href="/orders/create">
              <PaperButton variant="primary">新建订单</PaperButton>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <SpotlightCard className="col-span-1 lg:col-span-2">
              <SpotlightCardHeader>
                <SpotlightCardTitle>订单概览</SpotlightCardTitle>
              </SpotlightCardHeader>
              <SpotlightCardContent>
                <div className="h-[200px] flex items-center justify-center text-theme-text-secondary">
                  图表区域
                </div>
              </SpotlightCardContent>
            </SpotlightCard>
          </div>

          <SpotlightCard className="bg-theme-bg-secondary border-theme-border">
            <SpotlightCardHeader>
              <SpotlightCardTitle>状态筛选</SpotlightCardTitle>
            </SpotlightCardHeader>
            <SpotlightCardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {statusLinks.map((s) => (
                  <Link key={s.href} href={s.href}>
                    <PaperButton variant="outline" className="w-full justify-start text-sm">
                      {s.title}
                    </PaperButton>
                  </Link>
                ))}
              </div>
            </SpotlightCardContent>
          </SpotlightCard>

          <Suspense fallback={<div>Loading orders...</div>}>
             <OrderListClient 
                initialOrders={orders} 
                initialTotal={total}
                initialPage={page}
                initialPageSize={pageSize}
             />
          </Suspense>
        </div>
      </div>
  );
}
