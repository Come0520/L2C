import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getAfterSalesHealth } from '../after-sales-health';
import { checkPermission, auth } from '@/shared/lib/auth';

let mockResults: any[] = [];

/**
 * 工厂函数：每次 db.select() 调用时创建一个新的 promise-based query builder。
 * 这样 .catch() 能正确透传 resolve 值（而不是截断为空数组），
 * 与源码中 db.select(...).from(...).where(...).catch(fallback) 的模式一致。
 */
function createQueryPromise(data: any) {
    const p = Promise.resolve(data);
    const builder: any = {};
    builder.from = vi.fn(() => builder);
    builder.where = vi.fn(() => builder);
    builder.leftJoin = vi.fn(() => builder);
    builder.innerJoin = vi.fn(() => builder);
    builder.groupBy = vi.fn(() => builder);
    builder.orderBy = vi.fn(() => builder);
    builder.limit = vi.fn(() => builder);
    // 实现真正的 Promise 接口：.catch() 在 resolve 时不会触发 onRejected
    builder.then = (onFulfilled: any, onRejected?: any) => p.then(onFulfilled, onRejected);
    builder.catch = (onRejected: any) => p.catch(onRejected);
    builder.finally = (onFinally: any) => p.finally(onFinally);
    return builder;
}

vi.mock('@/shared/api/db', () => ({
    db: {
        // 每次 select 调用消耗 mockResults 队列的下一项
        select: vi.fn(() => createQueryPromise(mockResults.shift() || [])),
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((cb) => cb),
    revalidateTag: vi.fn(),
}));

describe('After Sales Health Action', () => {
    const VALID_TENANT_ID = 'tenant-1';
    const VALID_USER_ID = 'user-1';

    beforeEach(async () => {
        vi.clearAllMocks();
        mockResults = [];
        // vi.clearAllMocks 后需要重新设置 db.select 的实现
        const { db } = await import('@/shared/api/db');
        (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => createQueryPromise(mockResults.shift() || []));
    });

    it('should return error when not logged in (auth fails)', async () => {
        (auth as any).mockResolvedValue(null);
        const result = await getAfterSalesHealth({});
        expect(result.success).toBe(false);
    });

    it('should return after-sales health metrics correctly', async () => {
        (auth as any).mockResolvedValue({
            user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID, role: 'MANAGER' }
        });
        (checkPermission as any).mockResolvedValue(true);

        // Mock 1: totalRevenue and totalOrders
        // Mock 2: afterSales tickets count and refundTotal
        // Mock 3: liabilityDistribution
        mockResults = [
            [{ totalRevenue: '100000', totalOrders: 100 }],
            [{ count: 2, refundTotal: '5000' }],
            [
                { partyType: 'SUPPLIER', count: 1, totalAmount: '3000' },
                { partyType: 'SALES', count: 1, totalAmount: '2000' }
            ]
        ];

        const result = await getAfterSalesHealth({});

        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.totalRevenue).toBe('100000.00');
            expect(result.data.totalOrders).toBe(100);
            expect(result.data.afterSalesCount).toBe(2);
            expect(result.data.refundAmount).toBe('5000.00');
            expect(result.data.refundRate).toBe('5.00'); // 5000 / 100000 * 100
            expect(result.data.complaintRate).toBe('2.00'); // 2 / 100 * 100
            expect(result.data.healthLevel).toBe('WARNING'); // refundRate > 3

            expect(result.data.liabilityDistribution).toHaveLength(2);
            expect(result.data.liabilityDistribution[0].party).toBe('SUPPLIER');
            expect(result.data.liabilityDistribution[0].amount).toBe(3000);
        }
    });

    it('should avoid division by zero when revenue/orders are zero', async () => {
        (auth as any).mockResolvedValue({ user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID } });
        (checkPermission as any).mockResolvedValue(true);

        mockResults = [
            [{ totalRevenue: '0', totalOrders: 0 }],
            [{ count: 0, refundTotal: '0' }],
            []
        ];

        const result = await getAfterSalesHealth({});
        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.refundRate).toBe('0.00');
            expect(result.data.complaintRate).toBe('0.00');
            expect(result.data.healthLevel).toBe('GOOD');
        }
    });
});
