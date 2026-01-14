'use client';

import React from 'react';
import { OrderList } from '@/features/orders/components/order-list';

export default function OrdersPage() {
    return (
        <div className="flex h-full flex-col bg-slate-50/50">
            <div className="flex items-center justify-between px-8 py-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">订单管理</h1>
                    <p className="text-slate-500 mt-1">管理和追踪您的所有销售订单</p>
                </div>
            </div>
            <div className="flex-1 px-8 pb-8">
                <OrderList />
            </div>
        </div>
    );
}
