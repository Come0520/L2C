import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { salesOrderService } from '@/services/salesOrders.client'

import { useSalesOrders, useSalesOrder } from '../useSalesOrders'

// Mock services
vi.mock('@/services/salesOrders.client', () => ({
    salesOrderService: {
        getSalesOrders: vi.fn(),
        getSalesOrderById: vi.fn(),
        createSalesOrder: vi.fn(),
        updateSalesOrder: vi.fn(),
        deleteSalesOrder: vi.fn(),
        batchUpdateSalesOrderStatus: vi.fn(),
    },
}))

// Mock realtime subscription
vi.mock('../useRealtimeSubscription', () => ({
    useRealtimeSubscription: vi.fn(),
}))

vi.mock('../useRealtimeOrders', () => ({
    useRealtimeOrder: vi.fn().mockReturnValue({ order: null }),
}))

// Mock query config
vi.mock('@/config/query-config', () => ({
    QUERY_CONFIG: {
        list: { staleTime: 0, gcTime: 0 },
        detail: { staleTime: 0, gcTime: 0 },
    },
}))

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })
    const Wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    Wrapper.displayName = 'QueryClientWrapper'
    return Wrapper
}

describe('useSalesOrders Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('fetches sales orders successfully', async () => {
        const mockData = {
            code: 0,
            message: 'success',
            data: {
                orders: [{ id: '1', customerName: 'Test' }],
                total: 1,
                page: 1,
                pageSize: 10,
            },
        }

        // @ts-expect-error Mocking for test
        salesOrderService.getSalesOrders.mockResolvedValue(mockData)

        const { result } = renderHook(() => useSalesOrders(1, 10), {
            wrapper: createWrapper(),
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(result.current.data?.data.orders).toHaveLength(1)
        expect(result.current.data?.data.orders[0].customerName).toBe('Test')
    })

    it('handles fetch error', async () => {
        // @ts-expect-error Mocking for test
        salesOrderService.getSalesOrders.mockResolvedValue({
            code: 1,
            message: 'Error fetching',
            data: null
        })

        const { result } = renderHook(() => useSalesOrders(1, 10), {
            wrapper: createWrapper(),
        })

        await waitFor(() => expect(result.current.isError).toBe(true))
        expect(result.current.error).toBeDefined()
    })
})

describe('useSalesOrder Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('fetches single sales order successfully', async () => {
        const mockData = {
            code: 0,
            message: 'success',
            data: { id: '1', customerName: 'Test' },
        }

        // @ts-expect-error Mocking for test
        salesOrderService.getSalesOrderById.mockResolvedValue(mockData)

        const { result } = renderHook(() => useSalesOrder('1'), {
            wrapper: createWrapper(),
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.salesOrder).toEqual(mockData.data)
    })
})
