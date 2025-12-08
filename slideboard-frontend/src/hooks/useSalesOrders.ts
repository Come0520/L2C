import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { QUERY_CONFIG } from '@/config/query-config'
import { salesOrderService } from '@/services/salesOrders.client'
import { OrderFormData, OrderResponse, BaseOrder } from '@/shared/types/order'
import { throttle } from '@/utils/debounce-throttle'

import { useRealtimeOrder } from './useRealtimeOrders'
import { useRealtimeSubscription } from './useRealtimeSubscription'

// function convertToBaseOrder(serverOrder: any): BaseOrder { ... } // Removed

export function useSalesOrders(
    page: number = 1,
    pageSize: number = 10,
    status?: string,
    customerName?: string
) {
    const queryClient = useQueryClient()
    const queryKey = ['salesOrders', page, pageSize, status, customerName]

    // Fetch Sales Orders
    const query = useQuery<any>({
        queryKey,
        queryFn: async () => {
            const response = await salesOrderService.getSalesOrders(page, pageSize, status, customerName)
            if (response.code !== 0 || !response.data) {
                throw new Error(response.message || 'Failed to fetch orders')
            }
            return response
        },
        staleTime: 1000 * 60 * 5 // 5 minutes
    })

    const patchCache = throttle((payload: any) => {
        queryClient.setQueryData<OrderResponse<BaseOrder> | undefined>(queryKey, (old: OrderResponse<BaseOrder> | undefined) => {
            if (!old?.data) return old
            const pageSizeActual = old.data.pageSize || pageSize
            const matchFilter = (o: BaseOrder) => {
                if (status && o.status !== status) return false
                if (customerName && !o.customerName?.toLowerCase().includes(customerName.toLowerCase())) return false
                return true
            }
            let orders = old.data.orders.slice()
            const newItem = payload.new as BaseOrder | null
            const oldItem = payload.old as { id?: string } | null
            switch (payload.eventType) {
                case 'INSERT':
                    if (newItem && matchFilter(newItem)) {
                        orders = [newItem, ...orders]
                        if (orders.length > pageSizeActual) orders = orders.slice(0, pageSizeActual)
                    }
                    break
                case 'UPDATE':
                    if (newItem) {
                        const idx = orders.findIndex((o: BaseOrder) => o.id === newItem.id)
                        if (idx !== -1) {
                            orders[idx] = newItem
                        } else if (matchFilter(newItem)) {
                            orders = [newItem, ...orders]
                            if (orders.length > pageSizeActual) orders = orders.slice(0, pageSizeActual)
                        }
                    }
                    break
                case 'DELETE':
                    if (oldItem?.id) {
                        orders = orders.filter((o: BaseOrder) => o.id !== oldItem.id)
                    }
                    break
                default:
                    break
            }
            return { ...old, data: { ...old.data, orders } }
        })
    }, 100)

    useRealtimeSubscription({
        table: 'sales_orders',
        event: '*',
        channelName: 'sales_orders:list',
        handler: patchCache as any,
    })

    // Create Sales Order
    const createMutation = useMutation({
        mutationFn: (data: OrderFormData) => salesOrderService.createSalesOrder(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['salesOrders'] })
        },
    })

    // Update Sales Order
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<OrderFormData> }) =>
            salesOrderService.updateSalesOrder(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['salesOrders'] })
        },
    })

    // Delete Sales Order
    const deleteMutation = useMutation({
        mutationFn: (id: string) => salesOrderService.deleteSalesOrder(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['salesOrders'] })
        },
    })

    // Batch Update Status
    const batchUpdateStatusMutation = useMutation({
        mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
            salesOrderService.batchUpdateSalesOrderStatus(ids, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['salesOrders'] })
        },
    })

    return {
        ...query,
        data: query.data,
        createSalesOrder: createMutation.mutateAsync,
        updateSalesOrder: updateMutation.mutateAsync,
        deleteSalesOrder: deleteMutation.mutateAsync,
        batchUpdateStatus: batchUpdateStatusMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isBatchUpdating: batchUpdateStatusMutation.isPending,
    }
}

// 单个订单响应类型
interface SingleOrderResponse<T> {
    code: number
    message: string
    data: T | null
}

export function useSalesOrder(id: string) {
    const queryKey = ['salesOrder', id]

    const query = useQuery<SingleOrderResponse<BaseOrder>>({
        queryKey,
        queryFn: () => salesOrderService.getSalesOrderById(id) as Promise<SingleOrderResponse<BaseOrder>>,
        enabled: !!id,
        staleTime: QUERY_CONFIG.detail.staleTime,
        gcTime: QUERY_CONFIG.detail.gcTime,
    })

    // Get realtime order details
    const { order: realtimeOrder } = useRealtimeOrder<BaseOrder>(id, query.data?.code === 0 ? query.data.data : null)

    return {
        ...query,
        salesOrder: realtimeOrder || (query.data?.code === 0 ? query.data.data : null),
    }
}
