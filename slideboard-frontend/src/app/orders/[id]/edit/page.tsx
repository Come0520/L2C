import Link from 'next/link'
import React from 'react'

import { OrderCreateView } from '@/features/orders/components/OrderCreateView'
import { RoleGuard } from '@/features/orders/components/permissions/RoleGuard'
import { getSalesOrderById } from '@/services/salesOrders.server'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function OrderEditPage({ params }: PageProps) {
    const { id } = await params

    // Fetch data on server
    const orderData = await getSalesOrderById(id)

    if (!orderData) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4">
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
        <RoleGuard
            roles={['admin', 'APPROVER_BUSINESS', 'LEAD_SALES', 'SERVICE_DISPATCH']}
            fallback={
                <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                    <div className="rounded-full bg-red-100 p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">访问被拒绝</h2>
                    <p className="text-gray-500">您没有权限编辑此订单。</p>
                    <Link
                        href={`/orders/${id}`}
                        className="text-primary hover:underline font-medium"
                    >
                        返回订单详情
                    </Link>
                </div>
            }
        >
            <OrderCreateView
                mode="edit"
                initialOrderData={orderData}
                orderId={id}
                initialLeadId={orderData.leadId}
            />
        </RoleGuard>
    )
}
