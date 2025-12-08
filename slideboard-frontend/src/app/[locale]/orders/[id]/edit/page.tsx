'use client'

import { Loader2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { toast } from '@/components/ui/toast'
import { OrderCreateView } from '@/features/orders/components/order-create-view'
import { salesOrderService } from '@/services/salesOrders.client'
import { OrderFormData, CurtainItem, WallcoveringItem, BackgroundWallItem, WindowCushionItem, StandardProductItem } from '@/shared/types/order'
import { TRACK_PAGE_VIEW } from '@/utils/analytics'
import { logger } from '@/utils/logger'

export default function OrderEditPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    useEffect(() => {
        TRACK_PAGE_VIEW('Order Detail Edit', { orderId: id })
    }, [id])

    const [loading, setLoading] = useState(true)
    const [orderData, setOrderData] = useState<OrderFormData | null>(null)

    useEffect(() => {
        async function fetchOrder() {
            if (!id) return

            try {
                const { code, data, message } = await salesOrderService.getSalesOrderById(id)

                if (code !== 0 || !data) {
                    toast.error('获取订单详情失败', { description: message })
                    return
                }

                // Transform DB data to OrderFormData
                // Use a more loose type for data.items access as OrderFormData doesn't have it directly
                // Transform DB data to OrderFormData
                const items = Array.isArray((data as any).items)
                    ? ((data as any).items as Array<{ category?: string } & Record<string, unknown>>)
                    : []

                const formData: OrderFormData = {
                    leadId: '',
                    leadNumber: '',
                    // customerName not in OrderFormData? Let's check types/order.ts
                    // Assuming OrderFormData follows standard structure, let's cast or adjust
                    // If OrderFormData is strictly defined without these fields, we need to verify its definition.
                    // For now, let's assume we need to extend it or it's missing fields in type definition.
                    // But wait, the error says 'customer_name' does not exist on OrderFormData.
                    // Ah, the code was accessing `data.customer_name`. `data` comes from `getSalesOrderById` which returns `SalesOrderResponse` -> `ServiceResponse<OrderFormData>`.
                    // So `data` IS `OrderFormData`.
                    // But `mapDbToSalesOrder` maps DB fields (snake_case) to CamelCase!
                    // So `data` should have `customerName`, NOT `customer_name`.
                    customerName: data.customerName || '',
                    customerPhone: data.customerPhone || '',
                    projectAddress: data.projectAddress || '',

                    designer: data.designer || '',
                    salesPerson: data.salesPerson || '',
                    createTime: (data.createTime || new Date().toISOString().split('T')[0]) as string,
                    expectedDeliveryTime: data.expectedDeliveryTime || '',

                    spacePackages: {},

                    // Default or parsed values
                    packageUsage: { cloth: 0, gauze: 0, track: 0 },

                    // Split items by category
                    curtains: items.filter((i) => i.category === 'curtain') as unknown as CurtainItem[],
                    wallcoverings: items.filter((i) => i.category === 'wallcovering') as unknown as WallcoveringItem[],
                    backgroundWalls: items.filter((i) => i.category === 'background-wall') as unknown as BackgroundWallItem[],
                    windowCushions: items.filter((i) => i.category === 'window-cushion') as unknown as WindowCushionItem[],
                    standardProducts: items.filter((i) => i.category === 'standard-product') as unknown as StandardProductItem[],

                    subtotals: {
                        curtain: 0,
                        wallcovering: 0,
                        'background-wall': 0,
                        'window-cushion': 0,
                        'standard-product': 0
                    },
                    packageAmount: 0,
                    packageExcessAmount: 0,
                    upgradeAmount: 0,
                    totalAmount: data.totalAmount || 0
                }

                setOrderData(formData)
            } catch (e) {
                logger.error('获取订单详情失败', { resourceType: 'order', resourceId: id, details: { error: e } })
                toast.error('加载失败', { description: '无法加载订单数据' })
            } finally {
                setLoading(false)
            }
        }

        fetchOrder()
    }, [id])

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-gray-500">正在加载订单数据...</span>
                </div>
            </DashboardLayout>
        )
    }

    if (!orderData) {
        return (
            <DashboardLayout>
                <div className="flex h-full flex-col items-center justify-center gap-4">
                    <p className="text-lg text-gray-500">未找到订单信息</p>
                    <button
                        onClick={() => router.back()}
                        className="text-primary hover:underline"
                    >
                        返回上一页
                    </button>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <OrderCreateView
                mode="edit"
                initialOrderData={orderData}
                orderId={id}
                initialLeadId={orderData.leadId}
            />
        </DashboardLayout>
    )
}
