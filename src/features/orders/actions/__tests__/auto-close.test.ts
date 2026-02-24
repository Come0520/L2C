import { describe, it, expect, vi, beforeEach } from 'vitest';
import { autoCloseOrdersAction } from '../auto-close';
import { db } from '@/shared/api/db';
import { OrderService } from '@/services/order.service';
import { auth } from '@/shared/lib/auth';

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            orders: {
                findMany: vi.fn(),
            },
        },
    },
}));

vi.mock('@/services/order.service', () => ({
    OrderService: {
        updateOrderStatus: vi.fn(),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidateTag: vi.fn(),
    revalidateTag: vi.fn(),
}));

describe('Auto-close Action', () => {
    const mockSession = {
        user: { id: 'u1', tenantId: 't1' }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession);
    });

    it('如果没有待结案订单，应返回 0 计数', async () => {
        vi.mocked(db.query.orders.findMany).mockResolvedValue([]);

        const result = await autoCloseOrdersAction();

        expect(result.success).toBe(true);
        expect(result.count).toBe(0);
        expect(OrderService.updateOrderStatus).not.toHaveBeenCalled();
    });

    it('应成功处理待结案订单', async () => {
        const mockOrders = [
            { id: 'o1', orderNo: 'ORD-01', version: 0 } as any,
            { id: 'o2', orderNo: 'ORD-02', version: 0 } as any
        ];
        vi.mocked(db.query.orders.findMany).mockResolvedValue(mockOrders);
        vi.mocked(OrderService.updateOrderStatus).mockResolvedValue({ success: true } as any);

        const result = await autoCloseOrdersAction();

        expect(result.success).toBe(true);
        expect(result.count).toBe(2);
        expect(OrderService.updateOrderStatus).toHaveBeenCalledTimes(2);
        expect(OrderService.updateOrderStatus).toHaveBeenCalledWith(
            'o1', 'COMPLETED', 't1', 0, 'u1'
        );
    });

    it('当部分订单处理失败时，应记录错误信息但不中断整体流程', async () => {
        const mockOrders = [
            { id: 'o1', orderNo: 'ORD-01', version: 0 } as any,
            { id: 'o2', orderNo: 'ORD-02', version: 0 } as any
        ];
        vi.mocked(db.query.orders.findMany).mockResolvedValue(mockOrders);
        vi.mocked(OrderService.updateOrderStatus)
            .mockResolvedValueOnce({ success: true } as any)
            .mockRejectedValueOnce(new Error('Update failed'));

        const result = await autoCloseOrdersAction();

        expect(result.success).toBe(true);
        expect(result.details?.[1].success).toBe(false);
        expect(result.details?.[1].error).toBe('Update failed');
    });

    it('未授权时应禁止操作', async () => {
        vi.mocked(auth).mockResolvedValue(null);
        const result = await autoCloseOrdersAction();
        expect(result.success).toBe(false);
        expect(result.error).toBe('Unauthorized');
    });
});
