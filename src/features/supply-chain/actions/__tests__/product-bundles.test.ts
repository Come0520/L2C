/**
 * Supply Chain 模块 Server Actions 集成测试 - 套件管理 (Product Bundles)
 *
 * 覆盖范围：
 * - createProductBundle
 * - updateProductBundle
 * - deleteProductBundle
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDb } from '@/shared/tests/mock-db';
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_SESSION = createMockSession();

const mockDb = createMockDb(['productBundles', 'productBundleItems']);

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

// 模拟 server-action wrapper
vi.mock('@/shared/lib/server-action', () => ({
    createSafeAction: (schema: any, handler: any) => {
        return async (input: any) => {
            if (schema) schema.parse(input);
            return handler(input, { session: MOCK_SESSION });
        };
    }
}));

describe('Product Bundle Actions (L5)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { auth, checkPermission } = await import('@/shared/lib/auth');
        vi.mocked(auth).mockResolvedValue(MOCK_SESSION);
        vi.mocked(checkPermission).mockResolvedValue(true);

        mockDb.transaction = vi.fn(async (cb) => {
            return cb({
                insert: mockDb.insert,
                update: mockDb.update,
                delete: mockDb.delete,
            });
        });
    });

    describe('createProductBundle', () => {
        it('当套件 SKU 已存在时应抛出错误', async () => {
            mockDb.query.productBundles.findFirst.mockResolvedValue({ id: 'existing-bundle' });

            const { createProductBundle } = await import('../product-bundles');

            await expect(createProductBundle({
                bundleSku: 'BUN-001',
                name: 'Gift Box',
                category: 'GIFT',
                retailPrice: 200,
                channelPrice: 150,
                items: [{ productId: 'prod-99', quantity: 1, unit: 'pcs' }]
            })).rejects.toThrow('套件 SKU 已存在');
        });

        it('应成功在事务中创建套件并插入子表项目', async () => {
            mockDb.query.productBundles.findFirst.mockResolvedValue(null);
            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'bun-1' }])
                })
            } as any);

            const { createProductBundle } = await import('../product-bundles');
            const { AuditService } = await import('@/shared/lib/audit-service');

            const result = await createProductBundle({
                bundleSku: 'BUN-001',
                name: 'Gift Box',
                category: 'GIFT',
                retailPrice: 200,
                channelPrice: 150,
                items: [
                    { productId: 'prod-1', quantity: 2, unit: 'pcs' },
                    { productId: 'prod-2', quantity: 1, unit: 'box' }
                ]
            });

            expect(result.id).toBe('bun-1');
            expect(mockDb.transaction).toHaveBeenCalled();
            expect(mockDb.insert).toHaveBeenCalledTimes(2); // One for bundle, one for items
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION, 'productBundles', 'bun-1', 'CREATE', expect.anything(), expect.anything()
            );
        });
    });

    describe('updateProductBundle', () => {
        it('找不到时应报错', async () => {
            mockDb.update.mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([])
                    })
                })
            } as any);

            const { updateProductBundle } = await import('../product-bundles');

            await expect(updateProductBundle({
                id: 'bun-x',
                name: 'Updated Bundle'
            })).rejects.toThrow('套件不存在');
        });

        it('应成功更新套件并先删后增子表（如果有 items ）', async () => {
            mockDb.update.mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'bun-1' }])
                    })
                })
            } as any);

            const { updateProductBundle } = await import('../product-bundles');

            const result = await updateProductBundle({
                id: 'bun-1',
                name: 'Updated Bundle',
                items: [{ productId: 'prod-3', quantity: 5, unit: 'pcs' }]
            });

            expect(result.id).toBe('bun-1');
            expect(mockDb.delete).toHaveBeenCalled(); // 删旧的 item
            expect(mockDb.insert).toHaveBeenCalled(); // 增新的 item
        });
    });

    describe('deleteProductBundle', () => {
        it('应级联删除子表与主表并记录审计', async () => {
            const { deleteProductBundle } = await import('../product-bundles');
            const { AuditService } = await import('@/shared/lib/audit-service');

            const result = await deleteProductBundle({ id: 'bun-1' });

            expect(result.success).toBe(true);
            expect(mockDb.transaction).toHaveBeenCalled();
            expect(mockDb.delete).toHaveBeenCalledTimes(2); // 删除 items 和 自身
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION, 'productBundles', 'bun-1', 'DELETE', undefined, expect.anything()
            );
        });
    });
});
