/**
 * 产品模块 Server Actions 集成测试 (Queries)
 *
 * 覆盖范围：
 * - getProducts (列表查询)
 * - getProductById (详情查询)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock 定义 (vi.hoisted 确保提升) ──
const {
    MOCK_TENANT_ID, MOCK_USER_ID, MOCK_PRODUCT_ID, MOCK_SUPPLIER_ID,
    mockDbQuery, mockSqlCount, mockAuth, mockCheckPermission, mockAuditSelect
} = vi.hoisted(() => {
    const TNT_ID = '880e8400-e29b-41d4-a716-446655440000';
    const USR_ID = '990e8400-e29b-41d4-a716-446655440000';
    const PROD_ID = '110e8400-e29b-41d4-a716-446655440000';
    const SUPP_ID = '220e8400-e29b-41d4-a716-446655440000';

    const queryObj = {
        products: { findFirst: vi.fn(), findMany: vi.fn() },
        suppliers: { findFirst: vi.fn(), findMany: vi.fn() },
    };

    const auditSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
    };

    return {
        MOCK_TENANT_ID: TNT_ID, MOCK_USER_ID: USR_ID, MOCK_PRODUCT_ID: PROD_ID, MOCK_SUPPLIER_ID: SUPP_ID,
        mockDbQuery: queryObj,
        mockSqlCount: vi.fn().mockReturnValue({ count: 2 }),
        mockAuth: vi.fn().mockResolvedValue({
            user: { id: USR_ID, tenantId: TNT_ID, roles: ['ADMIN'] },
        }),
        mockCheckPermission: vi.fn().mockResolvedValue(true),
        mockAuditSelect: vi.fn(() => auditSelectChain)
    };
});

// Mock Server Action Middleware
vi.mock('@/shared/lib/server-action', () => ({
    createSafeAction: (schema: any, handler: any) => {
        return async (input: any) => {
            const session = await mockAuth();
            return handler(input, { session });
        };
    }
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: mockDbQuery,
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn().mockResolvedValue([{ count: 2 }]),
            }))
        })),
    },
}));

vi.mock('@/shared/api/schema', () => ({
    products: { id: 'products.id', tenantId: 'products.tenantId', sku: 'products.sku', createdAt: 'products.createdAt' },
    suppliers: { id: 'suppliers.id', tenantId: 'suppliers.tenantId' },
    auditLogs: { id: 'auditLogs.id', tableName: 'auditLogs.tableName', recordId: 'auditLogs.recordId', createdAt: 'auditLogs.createdAt' }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: mockAuth,
    checkPermission: mockCheckPermission,
}));

vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        PRODUCTS: { VIEW: 'PRODUCTS.VIEW' },
    },
}));

// Drizzle-orm 模拟
vi.mock('drizzle-orm', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        sql: vi.fn(), // 替换 sql 操作防止语法错误
        and: vi.fn(),
        eq: vi.fn(),
        inArray: vi.fn(),
    };
});

// ── 测试套件 ──
describe('Products Queries (L5)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getProducts 应分页查询产品并补充供应商信息', async () => {
        const mockProducts = [
            { id: MOCK_PRODUCT_ID, name: '产品A', defaultSupplierId: MOCK_SUPPLIER_ID },
            { id: 'another-product', name: '产品B', defaultSupplierId: null },
        ];
        mockDbQuery.products.findMany.mockResolvedValue(mockProducts);
        // 模拟返回对应的供应商（重构后使用 findMany 而非 findFirst）
        mockDbQuery.suppliers.findMany.mockResolvedValue([{ id: MOCK_SUPPLIER_ID, name: '供应商A' }]);

        const { getProducts } = await import('../queries');
        const result = await getProducts({ page: 1, pageSize: 10 });

        expect(result.data).toHaveLength(2);
        // 断言是否正确关联了供应商
        expect(result.data[0].supplier).toEqual(expect.objectContaining({ name: '供应商A' }));
        expect(result.data[1].supplier).toBeNull();
        expect(result.total).toBe(2);
    });

    it('getProductById 应查找单个产品并在附带审计日志时返回', async () => {
        const mockProduct = { id: MOCK_PRODUCT_ID, name: '产品A' };
        mockDbQuery.products.findFirst.mockResolvedValue(mockProduct);

        // 为了测试覆盖 select().from().where().orderBy() 链式调用
        const { db } = await import('@/shared/api/db');
        const auditLogsResult = [{ id: 'log-1', action: 'CREATE' }];
        (db.select as any).mockImplementationOnce(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => ({
                    orderBy: vi.fn().mockResolvedValue(auditLogsResult)
                }))
            }))
        }));

        const { getProductById } = await import('../queries');
        const result = await getProductById({ id: MOCK_PRODUCT_ID });

        expect(result.id).toBe(MOCK_PRODUCT_ID);
        expect(result.logs).toEqual(auditLogsResult);
    });

    it('getProductById 如果产品不存在应抛出错误', async () => {
        mockDbQuery.products.findFirst.mockResolvedValue(undefined);

        const { getProductById } = await import('../queries');
        await expect(getProductById({ id: 'wrong-id' })).rejects.toThrow('产品不存在');
    });
});
