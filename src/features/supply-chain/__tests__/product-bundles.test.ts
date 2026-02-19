/**
 * 产品套件 (Product Bundles) 单元测试
 *
 * 覆盖场景：
 *   1. 成功创建套件（含子项）
 *   2. 重复 SKU 时应返回错误（createSafeAction 包装为 error 消息）
 *   3. 成功更新套件
 *   4. 更新不存在的套件应返回错误
 *   5. 成功删除套件（含子表清理）
 *
 * 注：createProductBundleSchema 要求 items 至少 1 项（.min(1)），
 * 因此所有创建测试都必须包含 items 数组。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============ 模拟依赖 ============

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue({
        user: { id: 'user-1', tenantId: 'tenant-1' },
    }),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        recordFromSession: vi.fn(),
    },
}));

// 使用 vi.hoisted 避免 mock 工厂提升问题
const { mockTx } = vi.hoisted(() => {
    const tx = {
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'bundle-1', bundleSku: 'BDL-001' }]),
            }),
        }),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'bundle-1', bundleSku: 'BDL-001' }]),
                }),
            }),
        }),
        delete: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
        }),
    };
    return { mockTx: tx };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        transaction: vi.fn(async (cb: CallableFunction) => cb(mockTx)),
        query: {
            productBundles: { findFirst: vi.fn() },
        },
    },
}));

import { createProductBundle, updateProductBundle, deleteProductBundle } from '../actions/product-bundles';
import { db } from '@/shared/api/db';

// ============ 测试用例 ============

describe('产品套件 (Product Bundles)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // 恢复默认的 transaction mock
        (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
            async (cb: CallableFunction) => cb(mockTx)
        );
        // 恢复 mockTx 的默认返回值
        mockTx.insert.mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'bundle-1', bundleSku: 'BDL-001' }]),
            }),
        });
        mockTx.update.mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'bundle-1', bundleSku: 'BDL-001' }]),
                }),
            }),
        });
        mockTx.delete.mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
        });
    });

    describe('createProductBundle - 创建套件', () => {
        it('成功创建包含子项的套件', async () => {
            // 模拟 SKU 不重复
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (db.query as any).productBundles.findFirst.mockResolvedValue(null);

            const input = {
                bundleSku: 'BDL-001',
                name: '测试套件',
                category: 'CURTAIN',
                retailPrice: 199.99,
                channelPrice: 149.99,
                items: [
                    { productId: 'prod-1', quantity: 2, unit: '个' },
                    { productId: 'prod-2', quantity: 1, unit: '米' },
                ],
            };

            const result = await createProductBundle(input);

            expect(result.success).toBe(true);
            // insert 应调用两次：一次创建 bundle，一次创建 bundle items
            expect(mockTx.insert).toHaveBeenCalledTimes(2);
        });

        it('SKU 已存在时应返回错误', async () => {
            // 模拟 SKU 重复
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (db.query as any).productBundles.findFirst.mockResolvedValue({
                id: 'existing-bundle',
                bundleSku: 'BDL-001',
            });

            const input = {
                bundleSku: 'BDL-001',
                name: '重复套件',
                category: 'CURTAIN',
                retailPrice: 100,
                channelPrice: 80,
                items: [
                    { productId: 'prod-1', quantity: 1, unit: '个' },
                ],
            };

            const result = await createProductBundle(input);

            expect(result.success).toBe(false);
            // createSafeAction 会将 throw Error 包装为 { error: message }
            expect(result.error).toContain('SKU 已存在');
        });
    });

    describe('updateProductBundle - 更新套件', () => {
        it('成功更新套件及其子项', async () => {
            const input = {
                id: 'bundle-1',
                name: '更新后的套件名',
                items: [
                    { productId: 'prod-3', quantity: 3, unit: '块' },
                ],
            };

            const result = await updateProductBundle(input);

            expect(result.success).toBe(true);
            // 应先删除旧 items 再插入新 items
            expect(mockTx.delete).toHaveBeenCalled();
            expect(mockTx.insert).toHaveBeenCalled();
        });

        it('套件不存在时应返回错误', async () => {
            // 模拟 update 返回空数组（套件不存在）
            mockTx.update.mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const input = {
                id: 'non-existent',
                name: '不存在的套件',
            };

            const result = await updateProductBundle(input);

            expect(result.success).toBe(false);
            expect(result.error).toContain('套件不存在');
        });
    });

    describe('deleteProductBundle - 删除套件', () => {
        it('成功删除套件及其子项', async () => {
            const result = await deleteProductBundle({ id: 'bundle-1' });

            expect(result.success).toBe(true);
            // 应调用两次 delete：一次子表，一次主表
            expect(mockTx.delete).toHaveBeenCalledTimes(2);
        });
    });
});
