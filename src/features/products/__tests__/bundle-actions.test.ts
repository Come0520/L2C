'use strict';

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------
// Mock 闭包：数据库与鉴权
// ---------------------------------------------------------
const { mockInsert, mockUpdate, mockDelete, mockSelect } = vi.hoisted(() => {
    const fnUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([])
            })
        })
    });
    const fnInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([])
        })
    });
    const fnDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
    });
    return {
        mockInsert: fnInsert,
        mockUpdate: fnUpdate,
        mockDelete: fnDelete,
        mockSelect: vi.fn(),
    };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
    }
}));

vi.mock('@/shared/api/schema/supply-chain', () => ({
    productBundles: {
        id: 'productBundles.id',
        tenantId: 'productBundles.tenantId',
        createdAt: 'productBundles.createdAt',
    },
    productBundleItems: {
        id: 'productBundleItems.id',
        tenantId: 'productBundleItems.tenantId',
        bundleId: 'productBundleItems.bundleId',
        productId: 'productBundleItems.productId',
        quantity: 'productBundleItems.quantity',
        unit: 'productBundleItems.unit',
    }
}));

vi.mock('@/shared/api/schema/catalogs', () => ({
    products: {
        id: 'products.id',
        sku: 'products.sku',
        name: 'products.name',
        retailPrice: 'products.retailPrice',
        channelPrice: 'products.channelPrice',
        purchasePrice: 'products.purchasePrice',
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    unstable_cache: vi.fn((fn: Function) => fn),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn().mockResolvedValue(undefined) }
}));

vi.mock('drizzle-orm', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, eq: vi.fn(), and: vi.fn() };
});

import {
    getBundles,
    getBundleById,
    createBundle,
    updateBundle,
    deleteBundle,
    updateBundleItems,
    calculateBundleCost
} from '../actions/bundle-actions';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------
// 测试常量
// ---------------------------------------------------------
const mockTenantId = '880e8400-e29b-41d4-a716-446655440000';
const mockBundleId = '550e8400-e29b-41d4-a716-446655440001';

const mockSession = {
    user: {
        id: 'u-001',
        tenantId: mockTenantId,
    }
};

describe('Bundle Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession as any);
    });

    const mockSelectChain = (mockData: any[]) => {
        mockSelect.mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockResolvedValue(mockData)
                }),
                leftJoin: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(mockData)
                })
            })
        } as any);
    };

    describe('getBundles', () => {
        it('成功获取组合商品列表', async () => {
            const mockData = [{ id: mockBundleId, name: '测试组合' }];
            mockSelectChain(mockData);

            const result = await getBundles();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockData);
        });

        it('未授权时报错', async () => {
            vi.mocked(auth).mockResolvedValue(null);
            const result = await getBundles();
            expect(result.success).toBe(false);
            expect(result.error).toContain('获取组合商品列表失败');
        });
    });

    describe('getBundleById', () => {
        it('成功获取详情和明细', async () => {
            // 第一次 select 查 bundle
            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ id: mockBundleId, name: '测试组合' }])
                })
            } as any);

            // 第二次 select 查 items
            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    leftJoin: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([{ id: 'i1', productId: 'p1' }])
                    })
                })
            } as any);

            const result = await getBundleById(mockBundleId);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                id: mockBundleId,
                name: '测试组合',
                items: [{ id: 'i1', productId: 'p1' }]
            });
        });

        it('组合不存在时报错', async () => {
            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([])
                })
            } as any);

            const result = await getBundleById(mockBundleId);

            expect(result.success).toBe(false);
            expect(result.error).toContain('不存在');
        });
    });

    describe('createBundle', () => {
        const input = {
            bundleSku: 'B-001',
            name: '新春大礼包',
            retailPrice: 99.9,
        };

        it('成功创建', async () => {
            mockInsert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: mockBundleId, ...input }])
                })
            } as any);

            const result = await createBundle(input);

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe(mockBundleId);
            expect(revalidatePath).toHaveBeenCalledWith('/products/bundles');
        });
    });

    describe('updateBundle', () => {
        const input = { name: '更新的新春大礼包' };

        it('成功更新', async () => {
            mockUpdate.mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: mockBundleId, name: input.name }])
                    })
                })
            } as any);

            const result = await updateBundle(mockBundleId, input);

            expect(result.success).toBe(true);
            expect(result.data?.name).toBe('更新的新春大礼包');
        });
    });

    describe('deleteBundle', () => {
        it('成功级联删除', async () => {
            mockDelete.mockReturnValue({
                where: vi.fn().mockResolvedValue(undefined)
            } as any);

            const result = await deleteBundle(mockBundleId);

            expect(result.success).toBe(true);
            expect(mockDelete).toHaveBeenCalledTimes(2); // 一次明细，一次主表
        });
    });

    describe('updateBundleItems', () => {
        const items = [{ productId: '110e8400-e29b-41d4-a716-446655440004', quantity: 2 }];

        it('成功批量更新明细', async () => {
            mockDelete.mockReturnValue({
                where: vi.fn().mockResolvedValue(undefined)
            } as any);

            mockInsert.mockReturnValue({
                values: vi.fn().mockResolvedValue(undefined)
            } as any);

            const result = await updateBundleItems(mockBundleId, items);

            expect(result.success).toBe(true);
        });
    });

    describe('calculateBundleCost', () => {
        it('成功计算组合成本与建议售价', async () => {
            const mockItems = [
                { quantity: '2', purchasePrice: '10', retailPrice: '20', channelPrice: '15' },
                { quantity: '1', purchasePrice: '5', retailPrice: '10', channelPrice: '8' },
            ];

            mockSelect.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    leftJoin: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue(mockItems)
                    })
                })
            } as any);

            const result = await calculateBundleCost(mockBundleId);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                totalCost: 25, // 2*10 + 1*5
                suggestedRetailPrice: 50, // 2*20 + 1*10
                suggestedChannelPrice: 38, // 2*15 + 1*8
            });
        });
    });
});
