import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import OrdersOverviewPage from '@/app/orders/page'

// Mock server service
vi.mock('@/services/salesOrders.server', () => ({
    getSalesOrders: vi.fn().mockResolvedValue({
        orders: [
            {
                id: 'order-1',
                salesNo: 'SO001',
                customerName: 'Test Customer',
                projectAddress: '123 Test St',
                sales: 'Sales Person',
                status: 'pending',
                totalAmount: 1000,
                updatedAt: new Date().toISOString(),
                statusUpdatedAt: new Date().toISOString(),
            },
        ],
        total: 1,
    }),
}))

// Mock next/link
vi.mock('next/link', () => {
    return {
        default: ({ children, href }: { children: React.ReactNode; href: string }) => (
            <a href={href}>{children}</a>
        ),
    }
})

// Mock OrderListClient to avoid complex client-side logic during server component test
// This makes the test focus on the page component's data passing
vi.mock('@/features/orders/components/OrderListClient', () => ({
    OrderListClient: ({ initialOrders }: any) => (
        <div data-testid="order-list">
            {initialOrders.map((order: any) => (
                <div key={order.id}>
                    <span>{order.salesNo}</span>
                    <span>{order.customerName}</span>
                </div>
            ))}
        </div>
    ),
}))

describe('OrdersOverviewPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders orders list correctly', async () => {
        const jsx = await OrdersOverviewPage({ searchParams: Promise.resolve({}) })
        render(jsx)

        expect(screen.getByText('订单管理')).toBeInTheDocument()
        expect(screen.getByText('新建订单')).toBeInTheDocument()
        
        // Verify data passed to child
        expect(screen.getByText('SO001')).toBeInTheDocument()
        expect(screen.getByText('Test Customer')).toBeInTheDocument()
    })
})
