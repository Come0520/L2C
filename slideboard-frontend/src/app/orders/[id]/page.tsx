import Link from 'next/link'
import React from 'react'

import { SalesOrderDetail } from '@/features/orders/components/sales-orders/sales-order-detail'
import { getSalesOrderById } from '@/services/salesOrders.server'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: PageProps) {
    const { id } = await params

    // Fetch data on server
    const orderData = await getSalesOrderById(id)

    if (!orderData) {
        return (
                <div className="flex h-full flex-col items-center justify-center gap-4 pt-20">
                    <p className="text-lg text-gray-500">未找到订单信息</p>
                    <Link
                        href="/orders"
                        className="text-primary hover:underline"
                    >
                        返回订单列表
                    </Link>
                </div>
        )
    }

    return (
            <SalesOrderDetail initialOrder={orderData} />
    )
}
