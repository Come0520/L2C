/**
 * Pricing 模块安全测试
 * 覆盖 Auth 保护、Zod 校验
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPricingHints } from '../actions/pricing-hints';
import { auth, checkPermission } from '@/shared/lib/auth';

// ===== Mock 依赖 =====

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('next/cache', () => ({
    unstable_cache: (fn: any) => fn,
    revalidateTag: vi.fn(),
}));

/**
 * 模拟 Drizzle 查询链接口
 */
interface MockQueryChain {
    from: (table: any) => MockQueryChain;
    innerJoin: (table: any, condition: any) => MockQueryChain;
    where: (condition: any) => MockQueryChain;
    groupBy: (columns: any) => MockQueryChain;
    orderBy: (columns: any) => MockQueryChain;
    then: (resolve: (data: Record<string, unknown>[]) => void) => void;
}

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            products: {
                findFirst: vi.fn().mockResolvedValue({
                    id: 'product-1',
                    name: '测试产品',
                    sku: 'SKU001',
                    purchasePrice: '100',
                    floorPrice: '150',
                    retailPrice: '200',
                    unitPrice: '200',
                }),
            },
        },
        select: vi.fn(() => {
            const chain: MockQueryChain = {
                from: vi.fn(() => chain),
                innerJoin: vi.fn(() => chain),
                where: vi.fn(() => chain),
                groupBy: vi.fn(() => chain),
                orderBy: vi.fn(() => chain),
                then: (resolve) => resolve([{
                    minPrice: '150', maxPrice: '250', avgPrice: '200',
                    totalSold: 10, lastPrice: '210', count: 5,
                    avgQuotePrice: '190', quoteCount: 3,
                    minRetailPrice: '150', maxRetailPrice: '250', avgRetailPrice: '200',
                }]),
            };
            return chain;
        }),
    },
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('react', () => ({
    cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

// ===== 常量 =====

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const USER_ID = '33333333-3333-3333-3333-333333333333';

const makeSession = (tenantId = TENANT_A) => ({
    user: { id: USER_ID, role: 'SALES', tenantId, name: '测试用户' },
});

const mockAuth = vi.mocked(auth);

// ===== 测试套件 =====

describe('Pricing 模块安全测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Auth 保护', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await getPricingHints({ productId: 'p-1' });
            expect(result.success).toBe(false);
        });
    });

    describe('正常访问', () => {
        it('有权限时应返回定价建议', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await getPricingHints({ productId: 'p-1' });
            expect(result.success).toBe(true);
        });
    });

    describe('Zod 校验', () => {
        it('无 productId 和 sku 时应按业务逻辑返回错误', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await getPricingHints({});
            expect(result.success).toBe(true);
            // 内部会返回 success: false 的 data
            const data = result.data as Record<string, unknown>;
            expect(data?.success).toBe(false);
        });
    });
});
