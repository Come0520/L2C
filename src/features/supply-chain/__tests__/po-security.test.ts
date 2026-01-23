/**
 * PO Actions 权限检查和输入验证测试
 * 测试覆盖安全审计修复后的权限和验证逻辑
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth, checkPermission } from '@/shared/lib/auth';

// Mock Modules
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            purchaseOrders: {
                findFirst: vi.fn(),
                findMany: vi.fn().mockResolvedValue([]),
            },
            suppliers: {
                findFirst: vi.fn(),
            },
            products: {
                findMany: vi.fn().mockResolvedValue([]),
            }
        },
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'new-po-id', poNo: 'PO-123', status: 'DRAFT' }])
            })
        }),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ id: 'updated-po-id' }])
            })
        }),
        transaction: vi.fn().mockImplementation(async (callback) => {
            const transactionContext = {
                query: {
                    purchaseOrders: {
                        findFirst: vi.fn(),
                        findMany: vi.fn().mockResolvedValue([])
                    },
                    suppliers: { findFirst: vi.fn() },
                    products: { findMany: vi.fn().mockResolvedValue([]) }
                },
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'new-po-id', poNo: 'PO-123', status: 'DRAFT' }])
                    })
                }),
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([{ id: 'updated-po-id' }])
                    })
                }),
            };
            return await callback(transactionContext);
        })
    },
}));

vi.mock('@/shared/api/schema', () => ({
    purchaseOrders: { id: 'purchaseOrders.id', tenantId: 'purchaseOrders.tenantId', status: 'purchaseOrders.status' },
    purchaseOrderItems: { id: 'purchaseOrderItems.id', poId: 'purchaseOrderItems.poId' },
    suppliers: { id: 'suppliers.id', tenantId: 'suppliers.tenantId' },
    orders: { id: 'orders.id' },
    orderItems: { id: 'orderItems.id' },
}));

vi.mock('@/features/finance/actions/ap', () => ({
    createApFromPoInternal: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/services/po-status-aggregator.service', () => ({
    POStatusAggregator: {
        updateOrderStatusByPOs: vi.fn().mockResolvedValue(undefined),
    },
}));

import { createPO, updatePoStatus, batchUpdatePoStatus, batchDeleteDraftPOs } from '../actions/po-actions';

describe('PO Actions 权限检查测试', () => {
    const mockSession = {
        user: { id: 'test-user-id', tenantId: 'test-tenant-id', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createPO', () => {
        it('未登录用户应返回未授权错误', async () => {
            (auth as unknown as import('vitest').Mock).mockResolvedValue(null);

            const result = await createPO({
                supplierId: '123e4567-e89b-12d3-a456-426614174001',
                items: [{ productId: '123e4567-e89b-12d3-a456-426614174002', quantity: 10, unitCost: 100 }]
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('未授权');
        });

        it('无权限用户应返回权限错误', async () => {
            (auth as unknown as import('vitest').Mock).mockResolvedValue(mockSession);
            (checkPermission as unknown as import('vitest').Mock).mockRejectedValue(new Error('无权限'));

            const result = await createPO({
                supplierId: '123e4567-e89b-12d3-a456-426614174001',
                items: [{ productId: '123e4567-e89b-12d3-a456-426614174002', quantity: 10, unitCost: 100 }]
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('无采购单管理权限');
        });

        it('无效的 supplierId 应返回验证错误', async () => {
            (auth as unknown as import('vitest').Mock).mockResolvedValue(mockSession);
            (checkPermission as unknown as import('vitest').Mock).mockResolvedValue(undefined);

            const result = await createPO({
                supplierId: 'invalid-uuid',
                items: [{ productId: '123e4567-e89b-12d3-a456-426614174002', quantity: 10, unitCost: 100 }]
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('无效的供应商 ID');
        });

        it('空的采购项列表应返回验证错误', async () => {
            (auth as unknown as import('vitest').Mock).mockResolvedValue(mockSession);
            (checkPermission as unknown as import('vitest').Mock).mockResolvedValue(undefined);

            const result = await createPO({
                supplierId: '123e4567-e89b-12d3-a456-426614174001',
                items: []
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('至少需要一个采购项');
        });

        it('负数数量应返回验证错误', async () => {
            (auth as unknown as import('vitest').Mock).mockResolvedValue(mockSession);
            (checkPermission as unknown as import('vitest').Mock).mockResolvedValue(undefined);

            const result = await createPO({
                supplierId: '123e4567-e89b-12d3-a456-426614174001',
                items: [{ productId: '123e4567-e89b-12d3-a456-426614174002', quantity: -5, unitCost: 100 }]
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('数量必须为正整数');
        });
    });

    describe('updatePoStatus', () => {
        it('无效的采购单 ID 应返回验证错误', async () => {
            (auth as unknown as import('vitest').Mock).mockResolvedValue(mockSession);
            (checkPermission as unknown as import('vitest').Mock).mockResolvedValue(undefined);

            const result = await updatePoStatus({
                poId: 'invalid-uuid',
                status: 'SHIPPED'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('无效的采购单 ID');
        });

        it('权限检查应被调用', async () => {
            (auth as unknown as import('vitest').Mock).mockResolvedValue(mockSession);
            (checkPermission as unknown as import('vitest').Mock).mockResolvedValue(undefined);

            await updatePoStatus({
                poId: '123e4567-e89b-12d3-a456-426614174001',
                status: 'SHIPPED'
            });

            expect(checkPermission).toHaveBeenCalled();
        });
    });

    describe('batchUpdatePoStatus', () => {
        it('空的采购单列表应返回验证错误', async () => {
            (auth as unknown as import('vitest').Mock).mockResolvedValue(mockSession);
            (checkPermission as unknown as import('vitest').Mock).mockResolvedValue(undefined);

            const result = await batchUpdatePoStatus({
                poIds: [],
                status: 'SHIPPED'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('至少选择一个采购单');
        });

        it('无权限用户应返回权限错误', async () => {
            (auth as unknown as import('vitest').Mock).mockResolvedValue(mockSession);
            (checkPermission as unknown as import('vitest').Mock).mockRejectedValue(new Error('无权限'));

            const result = await batchUpdatePoStatus({
                poIds: ['123e4567-e89b-12d3-a456-426614174001'],
                status: 'SHIPPED'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('无采购单管理权限');
        });
    });

    describe('batchDeleteDraftPOs', () => {
        it('空的采购单列表应返回验证错误', async () => {
            (auth as unknown as import('vitest').Mock).mockResolvedValue(mockSession);
            (checkPermission as unknown as import('vitest').Mock).mockResolvedValue(undefined);

            const result = await batchDeleteDraftPOs({
                poIds: []
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('至少选择一个采购单');
        });

        it('无权限用户应返回权限错误', async () => {
            (auth as unknown as import('vitest').Mock).mockResolvedValue(mockSession);
            (checkPermission as unknown as import('vitest').Mock).mockRejectedValue(new Error('无权限'));

            const result = await batchDeleteDraftPOs({
                poIds: ['123e4567-e89b-12d3-a456-426614174001']
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('无采购单管理权限');
        });
    });
});
