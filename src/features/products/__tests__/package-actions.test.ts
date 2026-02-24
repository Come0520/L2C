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
    productPackages: {
        id: 'productPackages.id',
        tenantId: 'productPackages.tenantId',
        createdAt: 'productPackages.createdAt',
        packagePrice: 'productPackages.packagePrice',
    },
    packageProducts: {
        id: 'packageProducts.id',
        packageId: 'packageProducts.packageId',
        productId: 'packageProducts.productId',
        isRequired: 'packageProducts.isRequired',
        minQuantity: 'packageProducts.minQuantity',
        maxQuantity: 'packageProducts.maxQuantity',
    }
}));

vi.mock('@/shared/api/schema/catalogs', () => ({
    products: {
        id: 'products.id',
        sku: 'products.sku',
        name: 'products.name',
        retailPrice: 'products.retailPrice',
        category: 'products.category',
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn()
}));

import {
    getPackages,
    getPackageById,
    createPackage,
    updatePackage,
    deletePackage,
    togglePackageStatus,
    getPackageProducts,
    addPackageProduct,
    removePackageProduct,
    calculatePackagePrice
} from '../actions/package-actions';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------
// 测试常量
// ---------------------------------------------------------
const mockTenantId = '880e8400-e29b-41d4-a716-446655440000';
const mockPackageId = '550e8400-e29b-41d4-a716-446655440001';

const mockSession = {
    user: {
        id: 'u-001',
        tenantId: mockTenantId,
    }
};

describe('Package Server Actions', () => {
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

    describe('getPackages', () => {
        it('成功获取套餐列表', async () => {
            const mockData = [{ id: mockPackageId, packageName: '测试套餐' }];
            mockSelectChain(mockData);

            const result = await getPackages();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockData);
        });

        it('未授权时报错', async () => {
            vi.mocked(auth).mockResolvedValue(null);
            const result = await getPackages();
            expect(result.success).toBe(false);
            expect(result.error).toContain('获取套餐列表失败'); // 实际上这里代码也是捕获未授权 Error 然后转义的
        });
    });

    describe('getPackageById', () => {
        it('成功获取详情和明细', async () => {
            // 第一次 select 查 package
            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ id: mockPackageId, packageName: '测试套餐' }])
                })
            } as any);

            // 第二次 select 查 packageProducts
            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    leftJoin: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([{ id: 'i1', productId: 'p1' }])
                    })
                })
            } as any);

            const result = await getPackageById(mockPackageId);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                id: mockPackageId,
                packageName: '测试套餐',
                products: [{ id: 'i1', productId: 'p1' }]
            });
        });

        it('套餐不存在时报错', async () => {
            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([])
                })
            } as any);

            const result = await getPackageById(mockPackageId);

            expect(result.success).toBe(false);
            expect(result.error).toContain('不存在');
        });
    });

    describe('createPackage', () => {
        const input = {
            packageNo: 'PKG-001',
            packageName: '测试套餐',
            packageType: 'COMBO' as const,
            packagePrice: 99.9,
            overflowMode: 'FIXED_PRICE' as const,
            overflowPrice: 10,
        };

        it('成功创建', async () => {
            mockInsert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: mockPackageId, ...input }])
                })
            } as any);

            const result = await createPackage(input);

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe(mockPackageId);
            expect(revalidatePath).toHaveBeenCalledWith('/products/packages');
        });
    });

    describe('updatePackage', () => {
        const input = { packageName: '更新的套餐' };

        it('成功更新', async () => {
            mockUpdate.mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: mockPackageId, packageName: input.packageName }])
                    })
                })
            } as any);

            const result = await updatePackage(mockPackageId, input);

            expect(result.success).toBe(true);
            expect(result.data?.packageName).toBe('更新的套餐');
        });
    });

    describe('deletePackage', () => {
        it('成功级联删除', async () => {
            mockDelete.mockReturnValue({
                where: vi.fn().mockResolvedValue(undefined)
            } as any);

            const result = await deletePackage(mockPackageId);

            expect(result.success).toBe(true);
            expect(mockDelete).toHaveBeenCalledTimes(2); // 一次明细，一次主表
        });
    });

    describe('togglePackageStatus', () => {
        it('成功切换状态', async () => {
            mockUpdate.mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: mockPackageId, isActive: false }])
                    })
                })
            } as any);

            const result = await togglePackageStatus(mockPackageId, false);

            expect(result.success).toBe(true);
            expect(result.data?.isActive).toBe(false);
        });
    });

    // --- 套餐商品关联管理 ---

    describe('getPackageProducts', () => {
        it('成功获取套餐商品', async () => {
            mockSelectChain([{ id: 'rel1', productId: 'p1' }]);
            const result = await getPackageProducts(mockPackageId);
            expect(result.success).toBe(true);
            expect(result.data?.length).toBe(1);
        });
    });

    describe('addPackageProduct', () => {
        const input = { productId: '550e8400-e29b-41d4-a716-446655440002', maxQuantity: 5 };

        it('成功添加商品到套餐', async () => {
            mockInsert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'rel1', ...input }])
                })
            } as any);

            const result = await addPackageProduct(mockPackageId, input);

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('rel1');
        });
    });

    describe('removePackageProduct', () => {
        it('成功移除套餐商品', async () => {
            mockDelete.mockReturnValue({
                where: vi.fn().mockResolvedValue(undefined)
            } as any);

            const result = await removePackageProduct(mockPackageId, '550e8400-e29b-41d4-a716-446655440002');

            expect(result.success).toBe(true);
        });
    });

    // --- 价格计算 ---

    describe('calculatePackagePrice', () => {
        it('成功计算套餐价格和超出价格', async () => {
            const items = [{ productId: 'p1', quantity: 10 }];

            // 第一次 select 查 package
            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{
                        id: mockPackageId,
                        packagePrice: '500.00',
                        overflowMode: 'FIXED_PRICE',
                        overflowPrice: '15.00' // 超出部分每件 15
                    }])
                })
            } as any);

            // 第二次 select 查 pkgProducts
            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ productId: 'p1', maxQuantity: '5' }])
                })
            } as any);

            // 第三次 select 查 products
            mockSelect.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ id: 'p1', retailPrice: '20' }])
                })
            } as any);

            const result = await calculatePackagePrice(mockPackageId, items);

            expect(result.success).toBe(true);
            // 套餐总价 = 500
            // 超出 = 10 - 5 = 5件。5件 * fixed price(15) = 75。
            // 最终总价 = 575
            expect(result.data).toEqual({
                packagePrice: 500,
                overflowPrice: 75,
                totalPrice: 575,
            });
        });
    });
});
