'use strict';

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------
// Mock 闭环：模拟 Drizzle ORM 数据库接口
// ---------------------------------------------------------

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            products: { findFirst: vi.fn(), findMany: vi.fn() }
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn()
            }))
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn()
                }))
            }))
        })),
        delete: vi.fn(() => ({
            where: vi.fn()
        })),
    }
}));

vi.mock('@/shared/api/schema', () => ({
    products: {
        id: 'products.id',
        tenantId: 'products.tenantId',
        sku: 'products.sku',
        name: 'products.name',
        category: 'products.category',
        isActive: 'products.isActive',
        createdAt: 'products.createdAt',
        defaultSupplierId: 'products.defaultSupplierId',
    },
    suppliers: {
        id: 'suppliers.id',
        tenantId: 'suppliers.tenantId',
        name: 'suppliers.name',
    },
    auditLogs: {
        tableName: 'auditLogs.tableName',
        recordId: 'auditLogs.recordId',
        createdAt: 'auditLogs.createdAt',
    },
}));

vi.mock('@/shared/api/schema/enums', () => ({
    productCategoryEnum: {
        enumValues: [
            'CURTAIN', 'WALLPAPER', 'WALLCLOTH', 'MATTRESS', 'OTHER',
            'CURTAIN_FABRIC', 'CURTAIN_SHEER', 'CURTAIN_TRACK', 'MOTOR', 'CURTAIN_ACCESSORY'
        ]
    },
    productTypeEnum: {
        enumValues: ['FINISHED', 'RAW_MATERIAL']
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        PRODUCTS: {
            VIEW: 'products:view',
            MANAGE: 'products:manage',
        }
    }
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn()
}));

import { createProduct, updateProduct, deleteProduct, activateProduct } from '../actions/mutations';
import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------
// 测试常量
// ---------------------------------------------------------
const mockProductId = '550e8400-e29b-41d4-a716-446655440001';
const mockTenantId = '880e8400-e29b-41d4-a716-446655440000';
const mockUserId = 'u-001';
const mockSupplierId = '660e8400-e29b-41d4-a716-446655440002';

const mockSession = {
    user: {
        id: mockUserId,
        tenantId: mockTenantId,
        roles: ['ADMIN'],
        role: 'MANAGER',
    }
};

const validProductInput = {
    sku: 'CUR-001',
    name: '测试窗帘面料',
    category: 'CURTAIN' as const,
    productType: 'FINISHED' as const,
    unit: '米',
    purchasePrice: 35.5,
    logisticsCost: 5,
    processingCost: 10,
    lossRate: 0.05,
    retailPrice: 120,
    floorPrice: 80,
    isToBEnabled: true,
    isToCEnabled: true,
    defaultSupplierId: mockSupplierId,
    isStockable: false,
    description: '这是一款测试窗帘面料',
    attributes: { fabricWidth: 2.8 },
};

// ---------------------------------------------------------
// 测试套件：产品 Mutations
// createSafeAction 统一返回 { data, success, error } 格式
// ---------------------------------------------------------
describe('Products Mutations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession as any);
        vi.mocked(checkPermission).mockResolvedValue(undefined as any);
    });

    // ==================== 创建产品 ====================
    describe('createProduct', () => {
        it('成功创建产品并返回 ID', async () => {
            vi.mocked(db.query.products.findFirst).mockResolvedValue(null as any);
            vi.mocked(db.insert).mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{
                        id: mockProductId,
                        ...validProductInput,
                        tenantId: mockTenantId,
                    }])
                })
            } as any);

            const result = await createProduct(validProductInput);

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe(mockProductId);
            expect(checkPermission).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/supply-chain/products');
        });

        it('当 SKU 已存在时返回错误', async () => {
            vi.mocked(db.query.products.findFirst).mockResolvedValue({
                id: 'existing-id',
                sku: 'CUR-001',
            } as any);

            const result = await createProduct(validProductInput);

            expect(result.success).toBe(false);
            expect(result.error).toContain('SKU');
        });

        it('当缺少必填字段时返回校验失败', async () => {
            const invalidInput = { name: '测试' } as any;

            const result = await createProduct(invalidInput);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('未登录时返回未授权', async () => {
            vi.mocked(auth).mockResolvedValue(null as any);

            const result = await createProduct(validProductInput);

            expect(result.success).toBe(false);
            expect(result.error).toContain('未授权');
        });
    });

    // ==================== 更新产品 ====================
    describe('updateProduct', () => {
        it('成功更新产品并返回 ID', async () => {
            const updatedProduct = {
                id: mockProductId,
                name: '更新后的窗帘面料',
                tenantId: mockTenantId,
            };

            vi.mocked(db.update).mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([updatedProduct])
                    })
                })
            } as any);

            const result = await updateProduct({
                id: mockProductId,
                name: '更新后的窗帘面料',
            });

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe(mockProductId);
            expect(revalidatePath).toHaveBeenCalledWith('/supply-chain/products');
        });

        it('当产品不存在时返回错误', async () => {
            vi.mocked(db.update).mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([])
                    })
                })
            } as any);

            const result = await updateProduct({
                id: mockProductId,
                name: '不存在',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('产品未找到');
        });
    });

    // ==================== 删除产品 ====================
    describe('deleteProduct', () => {
        it('成功删除产品', async () => {
            vi.mocked(db.delete).mockReturnValue({
                where: vi.fn().mockResolvedValue(undefined)
            } as any);

            const result = await deleteProduct({ id: mockProductId });

            expect(result.success).toBe(true);
            expect(result.data?.success).toBe(true);
            expect(revalidatePath).toHaveBeenCalledWith('/supply-chain/products');
        });
    });

    // ==================== 上架/下架产品 ====================
    describe('activateProduct', () => {
        it('成功上架产品', async () => {
            vi.mocked(db.update).mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(undefined)
                })
            } as any);

            const result = await activateProduct({
                id: mockProductId,
                isActive: true,
            });

            expect(result.success).toBe(true);
            expect(result.data?.success).toBe(true);
            expect(revalidatePath).toHaveBeenCalledWith('/supply-chain/products');
        });

        it('成功下架产品', async () => {
            vi.mocked(db.update).mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(undefined)
                })
            } as any);

            const result = await activateProduct({
                id: mockProductId,
                isActive: false,
            });

            expect(result.success).toBe(true);
        });
    });
});
