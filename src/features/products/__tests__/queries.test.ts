'use strict';

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------
// Mock 闭包：数据库与鉴权
// 注意：vi.mock 会被提升到文件顶部，不能引用外部变量
// ---------------------------------------------------------

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            products: { findFirst: vi.fn(), findMany: vi.fn() },
            suppliers: { findFirst: vi.fn() },
        },
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => [{ count: 5 }]),
                leftJoin: vi.fn(() => ({
                    where: vi.fn(() => ({
                        orderBy: vi.fn(() => [])
                    }))
                }))
            }))
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
    revalidatePath: vi.fn()
}));

import { getProducts, getProductById } from '../actions/queries';
import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';

// ---------------------------------------------------------
// 测试常量
// ---------------------------------------------------------
const mockProductId = '550e8400-e29b-41d4-a716-446655440001';
const mockTenantId = '880e8400-e29b-41d4-a716-446655440000';

const mockSession = {
    user: {
        id: 'u-001',
        tenantId: mockTenantId,
        roles: ['ADMIN'],
        role: 'MANAGER',
    }
};

const mockProduct = {
    id: mockProductId,
    tenantId: mockTenantId,
    sku: 'CUR-001',
    name: '测试窗帘面料',
    category: 'CURTAIN',
    unit: '米',
    purchasePrice: '35.50',
    retailPrice: '120.00',
    floorPrice: '80.00',
    isActive: true,
    defaultSupplierId: null,
    createdAt: new Date('2026-01-01'),
};

// ---------------------------------------------------------
// 测试套件：产品 Queries (列表/详情)
// createSafeAction 统一返回 { data, success, error } 格式
// ---------------------------------------------------------
describe('Products Queries', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession as any);
        vi.mocked(checkPermission).mockResolvedValue(undefined as any);
    });

    // ==================== 产品列表 ====================
    describe('getProducts', () => {
        it('成功获取产品列表（默认分页）', async () => {
            vi.mocked(db.query.products.findMany).mockResolvedValue([mockProduct] as any);
            vi.mocked(db.select).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ count: 1 }])
                })
            } as any);

            const result = await getProducts({ page: 1, pageSize: 10 });

            expect(result.success).toBe(true);
            expect(result.data?.data).toHaveLength(1);
            expect(result.data?.total).toBe(1);
            expect(result.data?.page).toBe(1);
            expect(result.data?.pageSize).toBe(10);
            expect(checkPermission).toHaveBeenCalled();
        });

        it('支持按品类筛选', async () => {
            vi.mocked(db.query.products.findMany).mockResolvedValue([] as any);
            vi.mocked(db.select).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ count: 0 }])
                })
            } as any);

            const result = await getProducts({
                page: 1,
                pageSize: 10,
                category: 'CURTAIN',
            });

            expect(result.success).toBe(true);
            expect(result.data?.data).toHaveLength(0);
            expect(result.data?.total).toBe(0);
        });

        it('支持搜索关键词', async () => {
            vi.mocked(db.query.products.findMany).mockResolvedValue([mockProduct] as any);
            vi.mocked(db.select).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ count: 1 }])
                })
            } as any);

            const result = await getProducts({
                page: 1,
                pageSize: 10,
                search: '窗帘',
            });

            expect(result.success).toBe(true);
            expect(result.data?.data).toHaveLength(1);
        });

        it('未登录时返回未授权', async () => {
            vi.mocked(auth).mockResolvedValue(null as any);

            const result = await getProducts({ page: 1, pageSize: 10 });

            expect(result.success).toBe(false);
            expect(result.error).toContain('未授权');
        });
    });

    // ==================== 产品详情 ====================
    describe('getProductById', () => {
        it('成功获取产品详情', async () => {
            vi.mocked(db.query.products.findFirst).mockResolvedValue(mockProduct as any);
            // 审计日志查询 mock
            vi.mocked(db.select).mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockResolvedValue([])
                    })
                })
            } as any);

            const result = await getProductById({ id: mockProductId });

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe(mockProductId);
            expect(result.data?.sku).toBe('CUR-001');
        });

        it('当产品不存在时返回错误', async () => {
            vi.mocked(db.query.products.findFirst).mockResolvedValue(null as any);

            const result = await getProductById({ id: mockProductId });

            expect(result.success).toBe(false);
            expect(result.error).toContain('产品不存在');
        });

        it('当传入非法 UUID 时返回校验失败', async () => {
            const result = await getProductById({ id: 'not-a-uuid' });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
});
