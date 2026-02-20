/**
 * Supply Chain 模块 Server Actions 集成测试 - 供应商实体 (Supplier)
 *
 * 覆盖范围：
 * - createSupplier
 * - getSuppliers
 * - getSupplierById
 * - updateSupplier
 * - deleteSupplier
 * - getSupplierRating
 * - getSupplierRankings
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDb } from '@/shared/tests/mock-db';
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_SESSION = createMockSession();
const MOCK_TENANT_ID = MOCK_SESSION.user.tenantId;
const MOCK_USER_ID = MOCK_SESSION.user.id;

// ── Mock 外部依赖 ──
const mockDb = createMockDb(['suppliers', 'purchaseOrders', 'liabilityNotices', 'afterSalesTickets']);

// Mock QueryBuilder for complex queries like count()
const mockQueryBuilder = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    then: function (resolve: any) {
        resolve([{ count: 1 }]);
    }
};

mockDb.select = vi.fn().mockReturnValue(mockQueryBuilder);

vi.mock('@/shared/api/db', () => ({
    db: mockDb,
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    unstable_cache: vi.fn((cb) => cb), // 穿透 cache
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        recordFromSession: vi.fn().mockResolvedValue(true)
    }
}));

vi.mock('@/shared/lib/utils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/lib/utils')>();
    return {
        ...actual,
        generateDocNo: vi.fn().mockReturnValue('SUP-000001'),
    };
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

describe('Supplier Actions (L5)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { auth, checkPermission } = await import('@/shared/lib/auth');
        vi.mocked(auth).mockResolvedValue(MOCK_SESSION);
        vi.mocked(checkPermission).mockResolvedValue(true);
    });

    describe('createSupplier', () => {
        it('应当成功创建供应商并返回 ID', async () => {
            mockDb.query.suppliers.findFirst.mockResolvedValue(null);
            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'sup-1', supplierNo: 'SUP-000001', name: 'Vendor A', supplierType: 'SUPPLIER' }])
                })
            } as any);

            const { createSupplier } = await import('../supplier-actions');
            const { AuditService } = await import('@/shared/lib/audit-service');

            const result = await createSupplier({
                name: 'Vendor A',
                supplierType: 'SUPPLIER',
                paymentPeriod: 'MONTHLY',
                contactPerson: 'Alice',
                phone: '13800138000',
            });

            expect(result.id).toBe('sup-1');
            expect(mockDb.insert).toHaveBeenCalled();
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION, 'suppliers', 'sup-1', 'CREATE', expect.anything()
            );
        });

        it('当供应商名称已存在时应当抛出错误', async () => {
            mockDb.query.suppliers.findFirst.mockResolvedValue({ id: 'existing-sup' });

            const { createSupplier } = await import('../supplier-actions');

            await expect(createSupplier({
                name: 'Vendor A',
                supplierType: 'SUPPLIER',
                paymentPeriod: 'MONTHLY',
                contactPerson: 'Alice',
                phone: '13800138000',
            })).rejects.toThrow('供应商名称已存在');

            expect(mockDb.insert).not.toHaveBeenCalled();
        });
    });

    describe('getSuppliers', () => {
        it('应当返回分页的供应商列表', async () => {
            mockDb.query.suppliers.findMany.mockResolvedValue([
                { id: 'sup-1', name: 'Vendor A', supplierType: 'SUPPLIER' }
            ]);

            const { getSuppliers } = await import('../supplier-actions');
            const result = await getSuppliers({ page: 1, pageSize: 10, type: 'SUPPLIER' });

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
            expect(mockDb.query.suppliers.findMany).toHaveBeenCalled();
        });
    });

    describe('getSupplierById', () => {
        it('应当返回指定的供应商', async () => {
            mockDb.query.suppliers.findFirst.mockResolvedValue({ id: 'sup-1', name: 'Vendor A' });

            const { getSupplierById } = await import('../supplier-actions');
            const result = await getSupplierById({ id: 'sup-1' });

            expect(result.id).toBe('sup-1');
            expect(result.name).toBe('Vendor A');
        });

        it('找不到时应当抛出错误', async () => {
            mockDb.query.suppliers.findFirst.mockResolvedValue(null);

            const { getSupplierById } = await import('../supplier-actions');
            await expect(getSupplierById({ id: 'non-exist' })).rejects.toThrow('找不到该供应商');
        });
    });

    describe('updateSupplier', () => {
        it('应当成功更新并通知 Audit', async () => {
            mockDb.update.mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'sup-1', name: 'Vendor B' }])
                    })
                })
            } as any);

            const { updateSupplier } = await import('../supplier-actions');
            const { AuditService } = await import('@/shared/lib/audit-service');

            const result = await updateSupplier({ id: 'sup-1', name: 'Vendor B' });

            expect(result.id).toBe('sup-1');
            expect(mockDb.update).toHaveBeenCalled();
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION, 'suppliers', 'sup-1', 'UPDATE', expect.anything()
            );
        });

        it('未找到该供应商时应当抛出错误', async () => {
            mockDb.update.mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([])
                    })
                })
            } as any);

            const { updateSupplier } = await import('../supplier-actions');

            await expect(updateSupplier({ id: 'sup-not', name: 'Vendor B' })).rejects.toThrow('更新失败，未找到供应商');
        });
    });

    describe('deleteSupplier', () => {
        it('应当成功删除没有采购关联的供应商', async () => {
            mockDb.query.purchaseOrders.findFirst.mockResolvedValue(null);

            const { deleteSupplier } = await import('../supplier-actions');
            const { AuditService } = await import('@/shared/lib/audit-service');

            const result = await deleteSupplier({ id: 'sup-1' });

            expect(result.success).toBe(true);
            expect(mockDb.delete).toHaveBeenCalled();
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION, 'suppliers', 'sup-1', 'DELETE'
            );
        });

        it('当有采购数据时应当阻止删除', async () => {
            mockDb.query.purchaseOrders.findFirst.mockResolvedValue({ id: 'po-1' });

            const { deleteSupplier } = await import('../supplier-actions');

            await expect(deleteSupplier({ id: 'sup-1' })).rejects.toThrow('该供应商已有采购数据，无法删除');
            expect(mockDb.delete).not.toHaveBeenCalled();
        });
    });

    describe('getSupplierRating', () => {
        it('应当返回供应商多维度评分（含交期和质量指标）', async () => {
            const validUuid = '9ca46114-1f1f-4efc-8b83-b7dc0ce5fa01';
            mockDb.query.suppliers.findFirst.mockResolvedValue({ id: validUuid, name: 'Vendor A' });
            mockDb.query.purchaseOrders.findMany.mockResolvedValue([
                { id: 'po-1', createdAt: new Date(), shippedAt: new Date(Date.now() - 100000), expectedDate: new Date() }
            ]);
            mockQueryBuilder.then = function (resolve: any) { resolve([{ count: 0 }]); }; // 0 quality issues

            const { getSupplierRating } = await import('../supplier-actions');
            const result = await getSupplierRating({ supplierId: validUuid });

            expect(result.supplierName).toBe('Vendor A');
            expect(result.metrics.onTimeRate).toBe(100);
            expect(result.metrics.qualityRate).toBe(100);
            expect(result.metrics.overallScore).toBe(100);
            expect(result.metrics.starRating).toBe(5);
        });
    });

    describe('getSupplierRankings', () => {
        it('应当按交付采购单数进行排名', async () => {
            mockDb.query.suppliers.findMany.mockResolvedValue([
                { id: 'sup-1', name: 'A', supplierNo: 'A1' },
                { id: 'sup-2', name: 'B', supplierNo: 'B1' },
            ]);
            mockQueryBuilder.then = function (resolve: any) {
                resolve([
                    { supplierId: 'sup-2', totalCount: 5 },
                    { supplierId: 'sup-1', totalCount: 2 }
                ]);
            };

            const { getSupplierRankings } = await import('../supplier-actions');
            const result = await getSupplierRankings();

            expect(result.total).toBe(2);
            expect(result.rankings[0].id).toBe('sup-2'); // 5 > 2
            expect(result.rankings[1].id).toBe('sup-1');
        });
    });
});
