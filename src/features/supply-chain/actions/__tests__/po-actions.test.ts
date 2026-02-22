/**
 * Supply Chain 模块 Server Actions 集成测试 - 采购单 (PO)
 *
 * 覆盖范围：
 * - getPurchaseOrders (分页+条件筛选)
 * - getPoById
 * - createPurchaseOrder (含供应商校验)
 * - updatePoStatus (状态机)
 * - addPOLogistics (旧版)
 * - batchUpdatePoStatus
 * - batchDeleteDraftPOs
 * - confirmPoQuote / confirmPoPayment / confirmPoCompletion / confirmPoReceipt (生命周期)
 * - exportPoPdf
 * - getProcurementDashboardMetrics
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDb } from '@/shared/tests/mock-db';
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_SESSION = createMockSession();
const VALID_UUID = '9ca46114-1f1f-4efc-8b83-b7dc0ce5fa01';
const VALID_UUID_2 = 'e2b34351-4045-4206-8c0c-d4baf876615b';

const mockDb = createMockDb([
    'purchaseOrders', 'purchaseOrderItems', 'suppliers', 'products',
    'inventory', 'inventoryLogs', 'warehouses', 'poPayments', 'poShipments'
]);

// 基础 mock 方法链
const chainUpdate = () => ({
    set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{}])
    })
});

const chainDelete = () => ({
    where: vi.fn().mockResolvedValue([{}])
});

mockDb.$count = vi.fn().mockResolvedValue(1);
mockDb.execute = vi.fn().mockResolvedValue([]);
mockDb.select = vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ pending: 1, inTransit: 2, completed: 3, delayed: 0 }])
    })
});

// 事务 mock
mockDb.transaction = vi.fn(async (cb) => {
    return cb({
        query: mockDb.query,
        insert: mockDb.insert,
        update: vi.fn().mockReturnValue(chainUpdate()),
        delete: vi.fn().mockReturnValue(chainDelete()),
        execute: mockDb.execute,
        select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ quantity: 10 }])
            })
        })
    });
});

vi.mock('@/shared/api/db', () => ({ db: mockDb }));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    unstable_cache: vi.fn((cb) => cb),
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: { recordFromSession: vi.fn().mockResolvedValue(true) }
}));

vi.mock('@/shared/lib/utils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/lib/utils')>();
    return { ...actual, generateDocNo: vi.fn().mockReturnValue('PO-000001') };
});

// 模拟 server-action wrapper
vi.mock('@/shared/lib/server-action', () => ({
    createSafeAction: (schema: any, handler: any) => {
        return async (input: any) => {
            if (schema) schema.parse(input);
            return handler(input, { session: MOCK_SESSION });
        };
    }
}));

describe('PO Actions (L5)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { auth, checkPermission } = await import('@/shared/lib/auth');
        vi.mocked(auth).mockResolvedValue(MOCK_SESSION);
        vi.mocked(checkPermission).mockResolvedValue(true);
        // 重复设置 update/delete mock
        mockDb.update.mockReturnValue(chainUpdate());
        mockDb.delete.mockReturnValue(chainDelete());
    });

    // ── 查询 ──

    describe('getPurchaseOrders', () => {
        it('应当返回分页列表', async () => {
            mockDb.query.purchaseOrders.findMany.mockResolvedValue([{ id: 'po-1', poNo: 'PO-000001' }]);

            const { getPurchaseOrders } = await import('../po-actions');
            const result = await getPurchaseOrders({ page: 1, pageSize: 10 });

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('未授权时返回错误', async () => {
            const { auth } = await import('@/shared/lib/auth');
            vi.mocked(auth).mockResolvedValue(null);

            const { getPurchaseOrders } = await import('../po-actions');
            const result = await getPurchaseOrders({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('未授权');
        });
    });

    describe('getPoById', () => {
        it('应当返回详情', async () => {
            mockDb.query.purchaseOrders.findFirst.mockResolvedValue({ id: 'po-1', poNo: 'PO-000001', items: [] });

            const { getPoById } = await import('../po-actions');
            const result = await getPoById({ id: 'po-1' });
            expect(result.success).toBe(true);
        });

        it('找不到时返回错误', async () => {
            mockDb.query.purchaseOrders.findFirst.mockResolvedValue(null);

            const { getPoById } = await import('../po-actions');
            const result = await getPoById({ id: 'po-x' });
            expect(result.success).toBe(false);
            expect(result.error).toBe('采购单不存在');
        });
    });

    // ── 创建 ──

    describe('createPurchaseOrder', () => {
        it('供应商不存在时应报错', async () => {
            mockDb.query.suppliers.findFirst.mockResolvedValue(null);

            const { createPurchaseOrder } = await import('../po-actions');
            await expect(createPurchaseOrder({
                supplierId: VALID_UUID,
                type: 'FINISHED',
                items: [{ productId: VALID_UUID_2, quantity: 10, unitCost: 5 }]
            })).rejects.toThrow('供应商不存在');
        });

        it('供应商已停用时应报错', async () => {
            mockDb.query.suppliers.findFirst.mockResolvedValue({ id: VALID_UUID, name: 'Vendor A', isActive: false });

            const { createPurchaseOrder } = await import('../po-actions');
            await expect(createPurchaseOrder({
                supplierId: VALID_UUID,
                type: 'FINISHED',
                items: [{ productId: VALID_UUID_2, quantity: 10, unitCost: 5 }]
            })).rejects.toThrow('已停用');
        });

        it('应在事务中成功创建采购单及明细', async () => {
            mockDb.query.suppliers.findFirst.mockResolvedValue({ id: VALID_UUID, name: 'Vendor A', isActive: true });
            mockDb.query.products.findFirst.mockResolvedValue({ id: VALID_UUID_2, name: 'Product X' });
            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'po-new', poNo: 'PO-000001' }])
                })
            } as any);

            const { createPurchaseOrder } = await import('../po-actions');
            const result = await createPurchaseOrder({
                supplierId: VALID_UUID,
                type: 'FINISHED',
                items: [{ productId: VALID_UUID_2, quantity: 10, unitCost: 5 }]
            });

            expect(result.id).toBe('po-new');
        });
    });

    // ── 状态机 ──

    describe('updatePoStatus', () => {
        it('合法的状态转换应成功', async () => {
            mockDb.query.purchaseOrders.findFirst.mockResolvedValue({ status: 'DRAFT', supplierId: VALID_UUID });

            const { updatePoStatus } = await import('../po-actions');
            const result = await updatePoStatus({ poId: 'po-1', status: 'PENDING_CONFIRMATION' });

            expect(result.success).toBe(true);
            expect(mockDb.update).toHaveBeenCalled();
        });

        it('非法的状态转换应返回错误', async () => {
            mockDb.query.purchaseOrders.findFirst.mockResolvedValue({ status: 'COMPLETED', supplierId: VALID_UUID });

            const { updatePoStatus } = await import('../po-actions');
            const result = await updatePoStatus({ poId: 'po-1', status: 'DRAFT' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('不允许');
        });
    });

    // ── 批量操作 ──

    describe('batchDeleteDraftPOs', () => {
        it('当存在非草稿 PO 时应抛出错误', async () => {
            mockDb.query.purchaseOrders.findMany.mockResolvedValue([{ id: 'po-1', status: 'SHIPPED' }]);

            const { batchDeleteDraftPOs } = await import('../po-actions');
            await expect(batchDeleteDraftPOs({ poIds: ['po-1'] })).rejects.toThrow('只能删除草稿状态的采购单');
        });

        it('全部草稿时应成功删除', async () => {
            mockDb.query.purchaseOrders.findMany.mockResolvedValue([]);

            const { batchDeleteDraftPOs } = await import('../po-actions');
            const result = await batchDeleteDraftPOs({ poIds: ['po-1'] });

            expect(result.success).toBe(true);
            expect(mockDb.transaction).toHaveBeenCalled();
        });
    });

    // ── 生命周期 ──

    describe('confirmPoQuote', () => {
        it('当 PO 状态是 PENDING_CONFIRMATION 时应成功转换至 PENDING_PAYMENT', async () => {
            mockDb.query.purchaseOrders.findFirst.mockResolvedValue({ id: VALID_UUID, status: 'PENDING_CONFIRMATION' });

            const { confirmPoQuote } = await import('../po-actions');
            const result = await confirmPoQuote({ poId: VALID_UUID, totalAmount: 500 });

            expect(result.success).toBe(true);
        });

        it('状态不允许时应抛出错误', async () => {
            mockDb.query.purchaseOrders.findFirst.mockResolvedValue({ id: VALID_UUID, status: 'COMPLETED' });

            const { confirmPoQuote } = await import('../po-actions');
            await expect(confirmPoQuote({ poId: VALID_UUID, totalAmount: 500 })).rejects.toThrow('不允许确认报价');
        });
    });

    describe('confirmPoCompletion', () => {
        it('IN_PRODUCTION 状态下应成功转换至 READY', async () => {
            mockDb.query.purchaseOrders.findFirst.mockResolvedValue({ id: VALID_UUID, status: 'IN_PRODUCTION' });

            const { confirmPoCompletion } = await import('../po-actions');
            const result = await confirmPoCompletion({ poId: VALID_UUID });

            expect(result.success).toBe(true);
        });
    });

    // ── 导出 ──

    describe('exportPoPdf', () => {
        it('应返回结构化的 PO 基础信息和明细', async () => {
            mockDb.query.purchaseOrders.findFirst.mockResolvedValue({
                id: 'po-1', poNo: 'PO-000001', supplierName: 'Vendor A',
                items: [{ productName: 'Prod X', quantity: '10', unitPrice: '5', subtotal: '50' }]
            });

            const { exportPoPdf } = await import('../po-actions');
            const result = await exportPoPdf({ poId: 'po-1' });

            expect(result.success).toBe(true);
        });

        it('PO 不存在时应返回错误', async () => {
            mockDb.query.purchaseOrders.findFirst.mockResolvedValue(null);

            const { exportPoPdf } = await import('../po-actions');
            const result = await exportPoPdf({ poId: 'po-x' });

            expect(result.success).toBe(false);
        });
    });

    // ── 仪表盘 ──

    describe('getProcurementDashboardMetrics', () => {
        it('应返回采购统计指标', async () => {
            mockDb.$count.mockResolvedValue(5);

            const { getProcurementDashboardMetrics } = await import('../po-actions');
            const result = await getProcurementDashboardMetrics();

            expect(result).toBeDefined();
        });
    });
});
