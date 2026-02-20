/**
 * 待采购池 (Pending Pool) Server Actions 集成测试
 *
 * 覆盖：getPendingPurchaseItems / assignToSupplier / submitForApproval / mergeToPurchaseOrder
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============ Mock 闭包 ============
const { mockDb, mockSession, mockAuth, mockCheckPermission } = vi.hoisted(() => {
    const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'new-po-1' }]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        query: {
            suppliers: { findFirst: vi.fn() },
        },
        transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
            // 简易事务 mock，将 mockDb 自身作为 tx 传入
            return cb(mockDb);
        }),
    };
    const mockSession = {
        user: { id: 'user-1', tenantId: 'tenant-1', name: 'Test' },
        expires: '2099-01-01',
    };
    return {
        mockDb,
        mockSession,
        mockAuth: vi.fn().mockResolvedValue(mockSession),
        mockCheckPermission: vi.fn(),
    };
});

vi.mock('@/shared/api/db', () => ({ db: mockDb }));
vi.mock('@/shared/api/schema/supply-chain', () => ({
    purchaseOrders: { id: 'id', tenantId: 'tenantId', status: 'status', supplierId: 'supplierId', orderId: 'orderId', poNo: 'poNo', supplierName: 'supplierName', type: 'type', totalAmount: 'totalAmount', createdAt: 'createdAt', createdBy: 'createdBy', updatedAt: 'updatedAt' },
    purchaseOrderItems: { poId: 'poId' },
    suppliers: { id: 'id', tenantId: 'tenantId', name: 'name' },
    productionTasks: { id: 'id', tenantId: 'tenantId', status: 'status', taskNo: 'taskNo', orderId: 'orderId', orderItemId: 'orderItemId', workshop: 'workshop', createdAt: 'createdAt' },
}));
vi.mock('@/shared/api/schema/orders', () => ({
    orderItems: { id: 'id', tenantId: 'tenantId', orderId: 'orderId', productId: 'productId', productName: 'productName', category: 'category', quantity: 'quantity', unitPrice: 'unitPrice', width: 'width', height: 'height', subtotal: 'subtotal', quoteItemId: 'quoteItemId', poId: 'poId', status: 'status', createdAt: 'createdAt' },
}));
vi.mock('@/shared/api/schema/catalogs', () => ({
    products: { id: 'id', productType: 'productType', defaultSupplierId: 'defaultSupplierId' },
}));
vi.mock('drizzle-orm', () => ({
    eq: vi.fn((...a: unknown[]) => a),
    and: vi.fn((...a: unknown[]) => a),
    inArray: vi.fn((...a: unknown[]) => a),
    isNull: vi.fn((a: unknown) => a),
    sql: vi.fn(),
    desc: vi.fn((a: unknown) => a),
}));
vi.mock('@/shared/lib/auth', () => ({
    auth: mockAuth,
    checkPermission: mockCheckPermission,
}));
vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: { ORDER: { VIEW: 'order.view', EDIT: 'order.edit' } },
}));
vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: { recordFromSession: vi.fn() },
}));
vi.mock('@/shared/lib/utils', () => ({
    generateDocNo: vi.fn((prefix: string) => `${prefix}-MOCK-001`),
}));

// ============ 测试开始 ============

describe('Pending Pool Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue(mockSession);

        // 恢复默认链式返回
        mockDb.select.mockReturnThis();
        mockDb.from.mockReturnThis();
        mockDb.where.mockReturnThis();
        mockDb.orderBy.mockReturnThis();
        mockDb.limit.mockReturnThis();
        mockDb.offset.mockReturnThis();
        mockDb.leftJoin.mockReturnThis();
        mockDb.insert.mockReturnThis();
        mockDb.values.mockReturnThis();
        mockDb.returning.mockResolvedValue([{ id: 'new-po-1' }]);
        mockDb.update.mockReturnThis();
        mockDb.set.mockReturnThis();
    });

    // ---------- getPendingPurchaseItems ----------
    describe('getPendingPurchaseItems', () => {
        it('未登录时应抛出 Unauthorized', async () => {
            mockAuth.mockResolvedValueOnce(null);

            const { getPendingPurchaseItems } = await import('../pending-pool-actions');
            await expect(getPendingPurchaseItems({ page: 1, pageSize: 20, itemType: 'ALL' }))
                .rejects.toThrow('Unauthorized');
        });

        it('应正常返回三类汇总结果', async () => {
            // 对于 DRAFT_PO 查询（select...from...where...orderBy...limit...offset）
            // limit 需要返回带 offset 方法的对象
            mockDb.limit.mockReturnValueOnce({
                offset: vi.fn().mockResolvedValue([
                    { id: 'po-1', poNo: 'PO-001', status: 'DRAFT', itemCount: 3 },
                ]),
            });
            // 对于 PENDING_WO 查询（select...from...where...orderBy...limit）
            mockDb.limit.mockResolvedValueOnce([
                { id: 'task-1', taskNo: 'WO-001', status: 'PENDING' },
            ]);
            // 对于 UNMATCHED 查询（select...from...leftJoin...where...orderBy...limit）
            mockDb.limit.mockResolvedValueOnce([
                { id: 'item-1', productName: '面料A', status: 'PENDING', productType: null },
            ]);

            const { getPendingPurchaseItems } = await import('../pending-pool-actions');
            const result = await getPendingPurchaseItems({ page: 1, pageSize: 20, itemType: 'ALL' });

            expect(result.draftPOs).toHaveLength(1);
            expect(result.pendingTasks).toHaveLength(1);
            expect(result.unmatchedItems).toHaveLength(1);
            expect(result.page).toBe(1);
        });
    });

    // ---------- submitForApproval ----------
    describe('submitForApproval', () => {
        it('未登录时应抛出 Unauthorized', async () => {
            mockAuth.mockResolvedValueOnce(null);

            const { submitForApproval } = await import('../pending-pool-actions');
            await expect(submitForApproval({
                poIds: ['a1b2c3d4-e5f6-1a2b-8c3d-4e5f6a7b8c9d'],
            })).rejects.toThrow('Unauthorized');
        });

        it('没有 DRAFT 状态的 PO 时应报错', async () => {
            // 事务中 tx.select...from...where 返回空
            mockDb.where.mockResolvedValueOnce([
                { id: 'po-1', status: 'CONFIRMED' }, // 非 DRAFT
            ]);

            const { submitForApproval } = await import('../pending-pool-actions');
            await expect(submitForApproval({
                poIds: ['a1b2c3d4-e5f6-1a2b-8c3d-4e5f6a7b8c9d'],
            })).rejects.toThrow('没有可提交的采购单');
        });

        it('应成功提交并记录审计日志', async () => {
            // 事务中 tx.select...from...where 返回 DRAFT PO
            mockDb.where
                .mockResolvedValueOnce([{ id: 'po-1', status: 'DRAFT' }]) // select
                .mockResolvedValueOnce(undefined); // update...set...where

            const { submitForApproval } = await import('../pending-pool-actions');
            const { AuditService } = await import('@/shared/lib/audit-service');

            const result = await submitForApproval({
                poIds: ['a1b2c3d4-e5f6-1a2b-8c3d-4e5f6a7b8c9d'],
            });

            expect(result.success).toBe(true);
            expect(result.submittedCount).toBe(1);
            expect(AuditService.recordFromSession).toHaveBeenCalled();
        });
    });

    // ---------- assignToSupplier ----------
    describe('assignToSupplier', () => {
        const validInput = {
            orderItemIds: ['b2c3d4e5-f6a7-1b2c-9d3e-4f5a6b7c8d9e'],
            supplierId: 'c3d4e5f6-a7b8-1c2d-9e3f-5a6b7c8d9e0f',
            poType: 'FINISHED' as const,
        };

        it('供应商不存在时应抛出错误', async () => {
            mockDb.query.suppliers.findFirst.mockResolvedValueOnce(null);

            const { assignToSupplier } = await import('../pending-pool-actions');
            await expect(assignToSupplier(validInput)).rejects.toThrow('供应商不存在或无权操作');
        });

        it('没有可分配项时应抛出错误', async () => {
            mockDb.query.suppliers.findFirst.mockResolvedValueOnce({ id: 's-1', name: '供应商A' });
            // select items -> empty
            mockDb.where.mockResolvedValueOnce([]);

            const { assignToSupplier } = await import('../pending-pool-actions');
            await expect(assignToSupplier(validInput)).rejects.toThrow('没有可分配的订单项');
        });

        it('应成功分配并创建 DRAFT PO', async () => {
            mockDb.query.suppliers.findFirst.mockResolvedValueOnce({ id: 's-1', name: '供应商A' });
            // select items
            mockDb.where.mockResolvedValueOnce([
                { id: 'item-1', orderId: 'order-1', productId: 'p-1', productName: '窗帘', category: 'CURTAIN', quantity: '10', unitPrice: '100', width: '1.5', height: '2.5', subtotal: '1000', quoteItemId: null, poId: null, status: 'PENDING' },
            ]);
            // 事务中 insert...returning
            mockDb.returning.mockResolvedValueOnce([{ id: 'po-new-1' }]);

            const { assignToSupplier } = await import('../pending-pool-actions');
            const { AuditService } = await import('@/shared/lib/audit-service');

            const result = await assignToSupplier(validInput);

            expect(result.success).toBe(true);
            expect(result.createdPOIds).toContain('po-new-1');
            expect(result.assignedCount).toBe(1);
            expect(AuditService.recordFromSession).toHaveBeenCalled();
        });
    });

    // ---------- mergeToPurchaseOrder ----------
    describe('mergeToPurchaseOrder', () => {
        it('没有可合并项时应抛出错误', async () => {
            mockDb.where.mockResolvedValueOnce([]);

            const { mergeToPurchaseOrder } = await import('../pending-pool-actions');
            await expect(mergeToPurchaseOrder({
                orderItemIds: ['d4e5f6a7-b8c9-1d2e-9f3a-6b7c8d9e0f1a'],
            })).rejects.toThrow('没有可合并的订单项');
        });

        it('成品和面料混合时应抛出错误', async () => {
            mockDb.where.mockResolvedValueOnce([
                { id: 'a', orderId: 'o1', productType: 'FINISHED', defaultSupplierId: 's1', poId: null },
                { id: 'b', orderId: 'o2', productType: 'CUSTOM', defaultSupplierId: 's1', poId: null },
            ]);

            const { mergeToPurchaseOrder } = await import('../pending-pool-actions');
            await expect(mergeToPurchaseOrder({
                orderItemIds: [
                    'd4e5f6a7-b8c9-1d2e-9f3a-6b7c8d9e0f1a',
                    'e5f6a7b8-c9d0-1e2f-9a3b-7c8d9e0f1a2b',
                ],
            })).rejects.toThrow('成品和面料不能混入同一采购单');
        });

        it('应成功合并并返回结果', async () => {
            // items 查询
            mockDb.where.mockResolvedValueOnce([
                { id: 'a', orderId: 'o1', productId: 'p1', productName: '窗帘A', category: 'CURTAIN', quantity: '5', unitPrice: '100', width: null, height: null, subtotal: '500', quoteItemId: null, poId: null, status: 'PENDING', productType: 'FINISHED', defaultSupplierId: 's1' },
                { id: 'b', orderId: 'o2', productId: 'p2', productName: '窗帘B', category: 'CURTAIN', quantity: '3', unitPrice: '200', width: null, height: null, subtotal: '600', quoteItemId: null, poId: null, status: 'PENDING', productType: 'FINISHED', defaultSupplierId: 's1' },
            ]);
            // 事务中 tx.query.suppliers.findFirst
            mockDb.query.suppliers.findFirst.mockResolvedValueOnce({ name: '供应商A' });
            // insert...returning
            mockDb.returning.mockResolvedValueOnce([{ id: 'merged-po-1' }]);

            const { mergeToPurchaseOrder } = await import('../pending-pool-actions');
            const result = await mergeToPurchaseOrder({
                orderItemIds: [
                    'd4e5f6a7-b8c9-1d2e-9f3a-6b7c8d9e0f1a',
                    'e5f6a7b8-c9d0-1e2f-9a3b-7c8d9e0f1a2b',
                ],
                supplierId: 'f6a7b8c9-d0e1-1f2a-9b3c-8d9e0f1a2b3c',
            });

            expect(result.success).toBe(true);
            expect(result.createdPOIds).toContain('merged-po-1');
            expect(result.poCount).toBe(1);
        });
    });
});
