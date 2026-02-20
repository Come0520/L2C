/**
 * 产品模块 Server Actions 集成测试 (Mutations)
 *
 * 覆盖范围：
 * - createProduct (基本 CRUD, createSafeAction 封装)
 * - updateProduct
 * - deleteProduct
 * - activateProduct
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock 定义 (vi.hoisted 确保提升) ──
const {
    MOCK_TENANT_ID, MOCK_USER_ID, MOCK_PRODUCT_ID, MOCK_SUPPLIER_ID,
    mockDbInsert, mockDbUpdate, mockDbDelete, mockDbQuery, mockAuth, mockCheckPermission
} = vi.hoisted(() => {
    const TNT_ID = '880e8400-e29b-41d4-a716-446655440000';
    const USR_ID = '990e8400-e29b-41d4-a716-446655440000';
    const PROD_ID = '110e8400-e29b-41d4-a716-446655440000';
    const SUPP_ID = '220e8400-e29b-41d4-a716-446655440000';

    const mockUpdateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: PROD_ID }]),
    };
    const mockDeleteChain = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: PROD_ID }]),
    };
    const insertFn = vi.fn(() => ({
        values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([{ id: PROD_ID }]),
        })),
    }));
    const updateFn = vi.fn(() => mockUpdateChain);
    const deleteFn = vi.fn(() => mockDeleteChain);
    const queryObj = {
        products: { findFirst: vi.fn(), findMany: vi.fn() },
    };

    return {
        MOCK_TENANT_ID: TNT_ID, MOCK_USER_ID: USR_ID, MOCK_PRODUCT_ID: PROD_ID, MOCK_SUPPLIER_ID: SUPP_ID,
        mockDbInsert: insertFn, mockDbUpdate: updateFn, mockDbDelete: deleteFn, mockDbQuery: queryObj,
        mockAuth: vi.fn().mockResolvedValue({
            user: { id: USR_ID, tenantId: TNT_ID, roles: ['ADMIN'] },
        }),
        mockCheckPermission: vi.fn().mockResolvedValue(true)
    };
});

// Mock Server Action Middleware
vi.mock('@/shared/lib/server-action', () => ({
    createSafeAction: (schema: any, handler: any) => {
        return async (input: any) => {
            // Simplified execution path for testing
            const session = await mockAuth();
            return handler(input, { session });
        };
    }
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: mockDbQuery,
        insert: mockDbInsert,
        update: mockDbUpdate,
        delete: mockDbDelete,
    },
}));

vi.mock('@/shared/api/schema', () => ({
    products: { id: 'products.id', tenantId: 'products.tenantId', sku: 'products.sku' },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: mockAuth,
    checkPermission: mockCheckPermission,
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        PRODUCTS: { MANAGE: 'PRODUCTS.MANAGE' },
    },
}));

// ── 测试套件 ──
describe('Products Mutations (L5)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDbQuery.products.findFirst.mockResolvedValue(undefined); // 默认没有重复的 SKU
    });

    it('createProduct 应检查 SKU 唯一性并创建新产品', async () => {
        const { createProduct } = await import('../mutations');
        // @ts-expect-error - testing partial valid payload
        const result = await createProduct({
            sku: 'SKU-001',
            name: '测试产品',
            category: 'CURTAIN',
            unit: '件',
            purchasePrice: 0,
            logisticsCost: 0,
            processingCost: 0,
            lossRate: 0,
            retailPrice: 0,
            floorPrice: 0,
            supplierId: MOCK_SUPPLIER_ID,
        });
        expect(result).toEqual({ id: MOCK_PRODUCT_ID });
        expect(mockDbInsert).toHaveBeenCalled();
    });

    it('createProduct 当 SKU 重复时应抛出错误', async () => {
        mockDbQuery.products.findFirst.mockResolvedValue({ id: 'existing-id' }); // 模拟 SKU 已存在
        const { createProduct } = await import('../mutations');
        // @ts-expect-error - testing partial valid payload
        await expect(createProduct({
            sku: 'SKU-001',
            name: '测试产品',
            category: 'CURTAIN',
            unit: '件',
            purchasePrice: 0,
            logisticsCost: 0,
            processingCost: 0,
            lossRate: 0,
            retailPrice: 0,
            floorPrice: 0,
            supplierId: MOCK_SUPPLIER_ID,
        })).rejects.toThrow('SKU 已存在');
    });

    it('updateProduct 应更新现有产品', async () => {
        const { updateProduct } = await import('../mutations');
        // @ts-expect-error - testing valid payload segment
        const result = await updateProduct({
            id: MOCK_PRODUCT_ID,
            name: '已更新的测试产品',
        });
        expect(result).toEqual({ id: MOCK_PRODUCT_ID });
        expect(mockDbUpdate).toHaveBeenCalled();
    });

    it('deleteProduct 应能删除属于当前租户的产品', async () => {
        const { deleteProduct } = await import('../mutations');
        const result = await deleteProduct({ id: MOCK_PRODUCT_ID });
        expect(result).toEqual({ success: true });
        expect(mockDbDelete).toHaveBeenCalled();
    });

    it('activateProduct 应当通过切换 isActive 状态实现上/下架', async () => {
        const { activateProduct } = await import('../mutations');
        const result = await activateProduct({ id: MOCK_PRODUCT_ID, isActive: true });
        expect(result).toEqual({ success: true });
        expect(mockDbUpdate).toHaveBeenCalled();
    });
});
