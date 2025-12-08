import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

import NotificationList from '@/app/notifications/components/notification-list'

// Mock dependencies
jest.mock('@/components/ui/virtual-list', () => {
    return {
        VirtualList: ({ items, renderItem }: any) => (
            <div data-testid="virtual-list">
                {items.map((item: any) => renderItem(item))}
            </div>
        )
    }
})

// Extend expect
expect.extend(toHaveNoViolations)

describe('NotificationList', () => {
    const mockNotifications = [
        {
            id: '1',
            title: 'Test Notification',
            content: 'This is a test notification',
            type: 'info',
            priority: 'medium',
            sender: 'System',
            recipient: 'User',
            createdAt: '2024-01-01',
            status: 'unread',
        },
    ] as any[]

    const mockOnNotificationClick = jest.fn()
    const mockOnMarkAsRead = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders notification list correctly', () => {
        render(
            <NotificationList
                notifications={mockNotifications}
                onNotificationClick={mockOnNotificationClick}
                onMarkAsRead={mockOnMarkAsRead}
            />
        )

        expect(screen.getByText('Test Notification')).toBeInTheDocument()
        expect(screen.getByText('This is a test notification')).toBeInTheDocument()
    })

    it('passes accessibility check', async () => {
        const { container } = render(
            <NotificationList
                notifications={mockNotifications}
                onNotificationClick={mockOnNotificationClick}
                onMarkAsRead={mockOnMarkAsRead}
            />
        )

        const results = await axe(container)
        expect(results).toHaveNoViolations()
    })
})
