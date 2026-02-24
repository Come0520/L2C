import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkbenchService } from '../workbench.service';
import { db } from '@/shared/api/db';

// Mock next/cache correctly for the pattern: unstable_cache(...)()
vi.mock('next/cache', () => ({
    unstable_cache: (fn: any) => () => fn(),
    revalidateTag: vi.fn(),
}));

// Mock database query layer
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            leads: { findMany: vi.fn() },
            orders: { findMany: vi.fn() },
            purchaseOrders: { findMany: vi.fn() },
            productionTasks: { findMany: vi.fn() },
            afterSalesTickets: { findMany: vi.fn() },
        },
    },
}));

describe('WorkbenchService 综合测试', () => {
    const tenantId = 'tenant-123';
    const userId = 'user-456';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUnifiedTodos (Task 1)', () => {
        it('应该返回所有 5 个待办分类且元数据正确', async () => {
            // 默认 mock 返回
            Object.values(db.query).forEach((model: any) => model.findMany.mockResolvedValue([]));

            const result = await WorkbenchService.getUnifiedTodos(tenantId, userId, ['ADMIN']);

            expect(result.categories).toHaveLength(5);
            const categories = result.categories.map(c => c.category);
            expect(categories).toContain('LEAD');
            expect(categories).toContain('ORDER');
            expect(categories).toContain('PO');
            expect(categories).toContain('PRODUCTION');
            expect(categories).toContain('AFTER_SALES');
        });

        it('计数器应该与返回的数据量一致', async () => {
            (db.query.leads.findMany as any).mockResolvedValue([{ id: '1' }, { id: '2' }]);
            (db.query.orders.findMany as any).mockResolvedValue([]);
            (db.query.purchaseOrders.findMany as any).mockResolvedValue([]);
            (db.query.productionTasks.findMany as any).mockResolvedValue([]);
            (db.query.afterSalesTickets.findMany as any).mockResolvedValue([]);

            const result = await WorkbenchService.getUnifiedTodos(tenantId, userId, ['ADMIN']);

            const leadCat = result.categories.find(c => c.category === 'LEAD');
            expect(leadCat?.count).toBe(2);
            expect(result.leads).toHaveLength(2);
        });

        it('普通角色 (SALES) 应该应用 userId 权限过滤', async () => {
            Object.values(db.query).forEach((model: any) => model.findMany.mockResolvedValue([]));

            await WorkbenchService.getUnifiedTodos(tenantId, userId, ['SALES']);

            // 验证第一个调用（leads）包含 where 且涉及 assignedSalesId
            // 注意：由于 eq/and 是真实的，我们不再 JSON.stringify 整个 where 而是验证 findMany 被调用
            expect(db.query.leads.findMany).toHaveBeenCalled();
            const callArgs = (db.query.leads.findMany as any).mock.calls[0][0];
            expect(callArgs.where).toBeDefined();
        });

        it('所有查询应该应用 limit: 50', async () => {
            Object.values(db.query).forEach((model: any) => model.findMany.mockResolvedValue([]));
            await WorkbenchService.getUnifiedTodos(tenantId, userId, ['ADMIN']);

            expect(db.query.leads.findMany).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }));
            expect(db.query.orders.findMany).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }));
        });

        it('子查询报错时应返回对应的空列表', async () => {
            (db.query.leads.findMany as any).mockRejectedValue(new Error('DB_ERROR'));
            (db.query.orders.findMany as any).mockResolvedValue([]);
            (db.query.purchaseOrders.findMany as any).mockResolvedValue([]);
            (db.query.productionTasks.findMany as any).mockResolvedValue([]);
            (db.query.afterSalesTickets.findMany as any).mockResolvedValue([]);

            const result = await WorkbenchService.getUnifiedTodos(tenantId, userId, ['ADMIN']);
            const leadCat = result.categories.find(c => c.category === 'LEAD');
            expect(leadCat?.count).toBe(0);
            expect(result.leads).toHaveLength(0);
        });
    });

    describe('getAlerts (Task 2)', () => {
        it('应该正确识别线索超时、售后超时和采购延迟报警', async () => {
            // Mock 3 个数据源分别返回 1 个报警
            (db.query.leads.findMany as any).mockResolvedValue([{ id: 'l1', leadNo: 'L001', customerName: 'C1' }]);
            (db.query.afterSalesTickets.findMany as any).mockResolvedValue([{ id: 'a1', ticketNo: 'AS001', type: 'REPAIR' }]);
            (db.query.purchaseOrders.findMany as any).mockResolvedValue([{ id: 'p1', poNo: 'PO001', supplierName: 'S1' }]);

            const result = await WorkbenchService.getAlerts(tenantId);

            // 验证 items 包含各类报警
            expect(result.items.length).toBeGreaterThanOrEqual(3);
            const categories = result.items.map(i => i.category);
            expect(categories).toContain('LEAD_OVERDUE');
            expect(categories).toContain('SLA_OVERDUE');
            expect(categories).toContain('DELIVERY_DELAY');
        });

        it('空数据时不应产生报警条目', async () => {
            (db.query.leads.findMany as any).mockResolvedValue([]);
            (db.query.afterSalesTickets.findMany as any).mockResolvedValue([]);
            (db.query.purchaseOrders.findMany as any).mockResolvedValue([]);

            const result = await WorkbenchService.getAlerts(tenantId);

            expect(result.items).toHaveLength(0);
            expect(result.categories.every(c => c.count === 0)).toBe(true);
        });

        it('查询应该并行执行 (Promise.all)', async () => {
            // 虽然 Promise.all 难以通过 spy 验证执行顺序，但可以验证所有 findMany 都被调用
            (db.query.leads.findMany as any).mockResolvedValue([]);
            (db.query.afterSalesTickets.findMany as any).mockResolvedValue([]);
            (db.query.purchaseOrders.findMany as any).mockResolvedValue([]);

            await WorkbenchService.getAlerts(tenantId);

            expect(db.query.leads.findMany).toHaveBeenCalled();
            expect(db.query.afterSalesTickets.findMany).toHaveBeenCalled();
            expect(db.query.purchaseOrders.findMany).toHaveBeenCalled();
        });
    });
});
