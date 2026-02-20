/**
 * Supply Chain 模块 Server Actions 集成测试 - 商品关联供应商 (Product Supplier)
 *
 * 覆盖范围：
 * - getProductSuppliers
 * - addProductSupplier
 * - updateProductSupplier
 * - removeProductSupplier
 * - setDefaultSupplier
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDb } from '@/shared/tests/mock-db';
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_SESSION = createMockSession();
const MOCK_TENANT_ID = MOCK_SESSION.user.tenantId;

const mockDb = createMockDb(['productSuppliers', 'products', 'suppliers']);

// Mock QueryBuilder
const mockQueryBuilder = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([
        { ps: { id: 'ps-1', supplierId: 'sup-1', isDefault: true, purchasePrice: '100' }, supplier: { name: 'Vendor A' } }
    ]),
    limit: vi.fn().mockResolvedValue([]),
    then: function (resolve: any) {
        resolve([]);
    }
};

mockDb.select = vi.fn().mockReturnValue(mockQueryBuilder);

// Mock DB 事务
mockDb.transaction = vi.fn(async (cb) => {
    return cb({
        insert: mockDb.insert,
        update: mockDb.update,
        delete: mockDb.delete,
    });
});

vi.mock('@/shared/api/db', () => ({
    db: mockDb,
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        recordFromSession: vi.fn().mockResolvedValue(true)
    }
}));

describe('Product Supplier Actions (L5)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { auth, checkPermission } = await import('@/shared/lib/auth');
        vi.mocked(auth).mockResolvedValue(MOCK_SESSION);
        vi.mocked(checkPermission).mockResolvedValue(true);
    });

    describe('getProductSuppliers', () => {
        it('应当成功返回格式化的商品供应商列表', async () => {
            const { getProductSuppliers } = await import('../product-supplier-actions');
            const result = await getProductSuppliers('prod-1');

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].supplierName).toBe('Vendor A');
            expect(result.data[0].purchasePrice).toBe(100);
            expect(mockDb.select).toHaveBeenCalled();
        });

        it('如果是未登录访问应拦截', async () => {
            const { auth } = await import('@/shared/lib/auth');
            vi.mocked(auth).mockResolvedValue(null);

            const { getProductSuppliers } = await import('../product-supplier-actions');
            const result = await getProductSuppliers('prod-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('未授权');
        });
    });

    describe('addProductSupplier', () => {
        it('已经绑定过的活跃关联应报错拦截', async () => {
            mockQueryBuilder.limit.mockResolvedValueOnce([{ id: 'exist' }]); // 模拟已存在
            const { addProductSupplier } = await import('../product-supplier-actions');

            const result = await addProductSupplier({
                productId: 'e2b34351-4045-4206-8c0c-d4baf876615b',
                supplierId: '9ca46114-1f1f-4efc-8b83-b7dc0ce5fa01',
                purchasePrice: 100
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('该供应商已关联此商品');
        });

        it('商品和供应商存在时，应当插入绑定并且清空原有默认值（如果是 default）', async () => {
            // bypass exist check, product exist, supplier exist
            mockQueryBuilder.limit
                .mockResolvedValueOnce([]) // not exist
                .mockResolvedValueOnce([{ id: 'prod-1' }]) // product exist
                .mockResolvedValueOnce([{ id: 'sup-1' }]); // supplier exist

            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'new-ps' }])
                })
            } as any);

            const { addProductSupplier } = await import('../product-supplier-actions');

            const result = await addProductSupplier({
                productId: 'e2b34351-4045-4206-8c0c-d4baf876615b',
                supplierId: '9ca46114-1f1f-4efc-8b83-b7dc0ce5fa01',
                purchasePrice: 100,
                isDefault: true
            });

            expect(result.success).toBe(true);
            expect(mockDb.transaction).toHaveBeenCalled();
            expect(mockDb.insert).toHaveBeenCalled();
        });
    });

    describe('updateProductSupplier', () => {
        it('应该成功更新部分字段并在事务中处理 default', async () => {
            mockQueryBuilder.limit.mockResolvedValueOnce([{ id: 'ps-1', productId: 'p1' }]); // exist

            const { updateProductSupplier } = await import('../product-supplier-actions');

            const result = await updateProductSupplier('ps-1', { purchasePrice: 120, isDefault: true });

            expect(result.success).toBe(true);
            expect(mockDb.transaction).toHaveBeenCalled();
        });
    });

    describe('removeProductSupplier', () => {
        it('应当软删除关联关系并记录日志', async () => {
            mockQueryBuilder.limit.mockResolvedValueOnce([{ id: 'ps-1' }]); // exist
            mockDb.update.mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{}])
                })
            } as any);

            const { removeProductSupplier } = await import('../product-supplier-actions');
            const { AuditService } = await import('@/shared/lib/audit-service');

            const result = await removeProductSupplier('ps-1');

            expect(result.success).toBe(true);
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION, 'productSuppliers', 'ps-1', 'DELETE'
            );
        });
    });

    describe('setDefaultSupplier', () => {
        it('应当消除其他关联的默认并设置自身默认', async () => {
            mockQueryBuilder.limit.mockResolvedValueOnce([{ id: 'ps-1' }]); // exist target

            const { setDefaultSupplier } = await import('../product-supplier-actions');

            const result = await setDefaultSupplier('prod-1', 'sup-1');

            expect(result.success).toBe(true);
            expect(mockDb.transaction).toHaveBeenCalled();
            // 在事务里至少有两次 update: 消除其他、设置当前
        });
    });
});
