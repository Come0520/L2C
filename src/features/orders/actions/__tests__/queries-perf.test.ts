import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getOrders } from '../queries';

/**
 * getOrders 性能行为测试
 *
 * 关注点：
 * 1. 列表查询不应携带 items JOIN（避免无效数据传输）
 * 2. 列表结果应正确包含 customer 和 sales 关联字段
 * 3. 分页参数（limit/offset）正确传递给 findMany
 * 4. 状态筛选时携带 where 条件
 */

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            orders: {
                findMany: vi.fn(),
            },
        },
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve([{ count: 2 }])),
            })),
        })),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: { ORDER: { VIEW: 'order:view' } },
}));

// 测试环境直接执行函数，绕过 Next.js 缓存层
vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn: () => unknown) => fn),
}));

vi.mock('react', async (importActual) => {
    const actual = await importActual<typeof import('react')>();
    return { ...actual, cache: (fn: unknown) => fn };
});

describe('getOrders - 列表查询性能行为', () => {
    const TENANT_ID = '550e8400-e29b-41d4-a716-446655440001';

    const mockOrderRow = {
        id: '550e8400-e29b-41d4-a716-446655440010',
        orderNo: 'ORD-2024-001',
        tenantId: TENANT_ID,
        status: 'PENDING_PURCHASE',
        totalAmount: '5000.00',
        paidAmount: '2000.00',
        customerName: '张三',
        createdAt: new Date('2024-01-01'),
        customer: { id: 'cust-1', name: '张三' },
        sales: { id: 'sales-1', name: '李四' },
    };

    beforeEach(async () => {
        vi.clearAllMocks();

        const { auth } = await import('@/shared/lib/auth');
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: { id: 'user-1', tenantId: TENANT_ID },
        });

        const { db } = await import('@/shared/api/db');
        (db.query.orders.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockOrderRow]);
    });

    /**
     * ⬅️ RED 阶段核心测试
     * 当前 queries.ts 中 findMany 的 with 包含 items: true，
     * 所以此断言（不含 items）应该 FAIL（红色），
     * 待修复后（移除 items）变为 PASS（绿色）
     */
    it('调用 findMany 时，with 参数不应包含 items（避免无效 JOIN）', async () => {
        const { db } = await import('@/shared/api/db');

        await getOrders({ page: 1, pageSize: 20 });

        expect(db.query.orders.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                with: expect.not.objectContaining({ items: expect.anything() }),
            })
        );
    });

    it('调用 findMany 时，with 参数应包含 customer 关联', async () => {
        const { db } = await import('@/shared/api/db');

        await getOrders({ page: 1, pageSize: 20 });

        expect(db.query.orders.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                with: expect.objectContaining({ customer: expect.anything() }),
            })
        );
    });

    it('调用 findMany 时，with 参数应包含 sales 关联', async () => {
        const { db } = await import('@/shared/api/db');

        await getOrders({ page: 1, pageSize: 20 });

        expect(db.query.orders.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                with: expect.objectContaining({ sales: expect.anything() }),
            })
        );
    });

    it('查询应传递正确的 pageSize 和 offset 给 findMany', async () => {
        const { db } = await import('@/shared/api/db');

        await getOrders({ page: 2, pageSize: 20 });

        expect(db.query.orders.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                limit: 20,
                offset: 20, // (page=2 - 1) * pageSize=20
            })
        );
    });

    it('传入 status 过滤时，findMany 调用应包含对应 where 条件', async () => {
        const { db } = await import('@/shared/api/db');

        await getOrders({ page: 1, pageSize: 20, status: 'PENDING_PURCHASE' });

        expect(db.query.orders.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.anything(),
                limit: 20,
                offset: 0,
            })
        );
    });
});
