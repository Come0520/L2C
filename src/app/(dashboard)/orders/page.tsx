'use client';

import React from 'react';
import { OrderList } from '@/features/orders/components/order-list';
import { PageHeader } from '@/components/ui/page-header';

export default function OrdersPage() {
    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="订单管理"
                description="管理和追踪您的所有销售订单"
            />
            <OrderList />
        </div>
    );
}
