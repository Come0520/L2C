import { describe, it, expect, vi, beforeEach } from 'vitest';
import { haltOrderAction, resumeOrderAction, getHaltedOrders } from '../halt';
import { db } from '@/shared/api/db';
import { OrderService } from '@/services/order.service';
import { auth, checkPermission } from '@/shared/lib/auth';

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
        haltOrder: vi.fn(),
        resumeOrder: vi.fn(),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

describe('Halt Actions', () => {
    const mockSession = {
        user: { id: 'u1', tenantId: 't1' }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
        (checkPermission as any).mockResolvedValue(undefined);
    });

    describe('haltOrderAction', () => {
        const input = { orderId: '22222222-2222-4222-8222-222222222222', reason: 'MATERIAL_SHORTAGE' as const, remark: 'Wait for panel' };

        it('应成功叫停订单', async () => {
            (OrderService.haltOrder as any).mockResolvedValue({ orderNo: 'ORD-001', snapshotData: '{"previousStatus":"IN_PRODUCTION"}' });

            const result = await haltOrderAction(input);

            expect(result.success).toBe(true);
            expect(OrderService.haltOrder).toHaveBeenCalledWith(
                input.orderId,
                mockSession.user.tenantId,
                mockSession.user.id,
                expect.stringContaining('MATERIAL_SHORTAGE')
            );
        });

        it('权限不足时应拒绝', async () => {
            (checkPermission as any).mockRejectedValue(new Error('Forbidden'));
            const result = await haltOrderAction(input);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Forbidden');
        });
    });

    describe('getHaltedOrders', () => {
        it('应返回带叫停天数信息的列表', async () => {
            const mockOrders = [
                {
                    id: 'o1',
                    orderNo: 'ORD-01',
                    pausedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
                    pauseReason: '{"reason":"SHORTAGE"}',
                    customer: { name: 'Alice', phone: '123' }
                }
            ];
            (db.query.orders.findMany as any).mockResolvedValue(mockOrders);

            const result = await getHaltedOrders();

            expect(result.success).toBe(true);
            expect((result.data as any)[0].daysHalted).toBe(10);
            expect((result.data as any)[0].alertLevel).toBe('WARNING'); // > 7 days
        });
    });

    describe('resumeOrderAction', () => {
        it('应成功恢复叫停的订单', async () => {
            (OrderService.resumeOrder as any).mockResolvedValue({ success: true });

            const result = await resumeOrderAction({ orderId: '22222222-2222-4222-8222-222222222222' });

            expect(result.success).toBe(true);
            expect(OrderService.resumeOrder).toHaveBeenCalledWith(
                '22222222-2222-4222-8222-222222222222',
                mockSession.user.tenantId,
                mockSession.user.id
            );
        });
    });
});
