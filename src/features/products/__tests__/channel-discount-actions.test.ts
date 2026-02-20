'use strict';

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------
// Mock 闭包：数据库与鉴权
// ---------------------------------------------------------
const { mockInsert, mockUpdate, mockDelete, mockSelect, mockQueryFindFirst } = vi.hoisted(() => {
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
        mockQueryFindFirst: vi.fn(),
    };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
        query: {
            tenants: {
                findFirst: mockQueryFindFirst,
            },
            channelDiscountOverrides: {
                findFirst: mockQueryFindFirst,
            }
        }
    }
}));

vi.mock('@/shared/api/schema/supply-chain', () => ({
    channelDiscountOverrides: {
        id: 'channelDiscountOverrides.id',
        tenantId: 'channelDiscountOverrides.tenantId',
        scope: 'channelDiscountOverrides.scope',
        targetId: 'channelDiscountOverrides.targetId',
        isActive: 'channelDiscountOverrides.isActive',
        createdAt: 'channelDiscountOverrides.createdAt',
    }
}));

vi.mock('@/shared/api/schema/infrastructure', () => ({
    tenants: {
        id: 'tenants.id',
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

import {
    getGlobalDiscountConfig,
    updateGlobalDiscountConfig,
    getDiscountOverrides,
    createDiscountOverride,
    updateDiscountOverride,
    deleteDiscountOverride,
    getProductDiscountRate
} from '../actions/channel-discount-actions';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------
// 测试常量
// ---------------------------------------------------------
const mockTenantId = '880e8400-e29b-41d4-a716-446655440000';
const mockId = '880e8400-e29b-41d4-a716-446655440001';

const mockSession = {
    user: {
        id: 'u-001',
        tenantId: mockTenantId,
    }
};

describe('Channel Discount Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession as any);
    });

    describe('getGlobalDiscountConfig', () => {
        it('成功获取全局配置', async () => {
            mockQueryFindFirst.mockResolvedValueOnce({
                id: mockTenantId,
                settings: {
                    channelDiscounts: {
                        sLevel: 90,
                        aLevel: 95,
                    }
                }
            });

            const result = await getGlobalDiscountConfig();

            expect(result.error).toBeUndefined();
            expect(result.data?.sLevel).toBe(90);
            expect(result.data?.aLevel).toBe(95);
        });

        it('未找到租户时报错', async () => {
            mockQueryFindFirst.mockResolvedValueOnce(null);

            const result = await getGlobalDiscountConfig();

            expect(result.error).toBe('租户不存在');
            expect(result.data).toBeUndefined();
        });
    });

    describe('updateGlobalDiscountConfig', () => {
        const input = {
            sLevel: 90,
            aLevel: 95,
            bLevel: 100,
            cLevel: 100,
            packageNoDiscount: true,
            bundleSeparateDiscount: false,
        };

        it('成功更新全局配置', async () => {
            mockQueryFindFirst.mockResolvedValueOnce({
                id: mockTenantId,
                settings: {}
            });

            const result = await updateGlobalDiscountConfig(input);

            expect(result.error).toBeUndefined();
            expect(result.success).toBe(true);
            expect(mockUpdate).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/settings/products');
        });
    });

    describe('getDiscountOverrides', () => {
        it('成功获取覆盖规则', async () => {
            const mockData = [{ id: mockId, scope: 'PRODUCT' }];
            mockSelect.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockResolvedValue(mockData)
                    })
                })
            } as any);

            const result = await getDiscountOverrides();

            expect(result.error).toBeUndefined();
            expect(result.data).toEqual(mockData);
        });
    });

    describe('createDiscountOverride', () => {
        const input = {
            scope: 'PRODUCT' as const,
            targetId: 'p1',
            sLevelDiscount: 85,
        };

        it('成功创建', async () => {
            mockQueryFindFirst.mockResolvedValueOnce(null); // 已存在检查

            mockInsert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: mockId, ...input }])
                })
            } as any);

            const result = await createDiscountOverride(input);

            expect(result.error).toBeUndefined();
            expect(result.data?.id).toBe(mockId);
            expect(result.data?.sLevelDiscount).toBe(85);
        });

        it('规则已存在时报错', async () => {
            mockQueryFindFirst.mockResolvedValueOnce({ id: mockId }); // 已存在

            const result = await createDiscountOverride(input);

            expect(result.error).toBe('该覆盖规则已存在');
            expect(result.data).toBeUndefined();
        });
    });

    describe('updateDiscountOverride', () => {
        it('成功更新', async () => {
            mockQueryFindFirst.mockResolvedValueOnce({ id: mockId }); // 校验存在

            mockUpdate.mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: mockId, sLevelDiscount: '88' }])
                    })
                })
            } as any);

            const result = await updateDiscountOverride(mockId, { sLevelDiscount: 88 });

            expect(result.error).toBeUndefined();
            expect(result.data?.sLevelDiscount).toBe('88');
        });
    });

    describe('deleteDiscountOverride', () => {
        it('成功删除', async () => {
            mockQueryFindFirst.mockResolvedValueOnce({ id: mockId }); // 校验存在

            const result = await deleteDiscountOverride(mockId);

            expect(result.error).toBeUndefined();
            expect(result.success).toBe(true);
            expect(mockDelete).toHaveBeenCalled();
        });
    });

    describe('getProductDiscountRate', () => {
        it('优先使用商品级覆盖折扣', async () => {
            // mock getGlobalDiscountConfig
            mockQueryFindFirst.mockResolvedValueOnce({
                id: mockTenantId,
                settings: { channelDiscounts: { sLevel: 95 } } // 全局 S: 95
            });

            // mock product override find
            mockQueryFindFirst.mockResolvedValueOnce({
                scope: 'PRODUCT',
                sLevelDiscount: '80' // 商品覆盖 S: 80
            });

            const result = await getProductDiscountRate('p1', 'c1', 'S');

            expect(result.error).toBeUndefined();
            expect(result.data).toBe(80);
        });

        it('无商品级但有品类级覆盖折扣', async () => {
            // mock getGlobalDiscountConfig (全局配置)
            mockQueryFindFirst.mockResolvedValueOnce({
                id: mockTenantId,
                settings: { channelDiscounts: { sLevel: 95 } }
            });

            // mock product override find -> null
            mockQueryFindFirst.mockResolvedValueOnce(null);

            // mock category override find
            mockQueryFindFirst.mockResolvedValueOnce({
                scope: 'CATEGORY',
                sLevelDiscount: '85' // 品类覆盖 S: 85
            });

            const result = await getProductDiscountRate('p1', 'c1', 'S');

            expect(result.error).toBeUndefined();
            expect(result.data).toBe(85);
        });

        it('无任何覆盖时使用全局默认折扣', async () => {
            // mock getGlobalDiscountConfig (全局配置)
            mockQueryFindFirst.mockResolvedValueOnce({
                id: mockTenantId,
                settings: { channelDiscounts: { sLevel: 95 } }
            });

            // mock product override find -> null
            mockQueryFindFirst.mockResolvedValueOnce(null);

            // mock category override find -> null
            mockQueryFindFirst.mockResolvedValueOnce(null);

            const result = await getProductDiscountRate('p1', 'c1', 'S');

            expect(result.error).toBeUndefined();
            expect(result.data).toBe(95);
        });
    });
});
