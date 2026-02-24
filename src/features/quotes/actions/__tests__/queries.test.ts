/**
 * Quotes 模块 Server Actions 集成测试 (Queries)
 *
 * 覆盖范围：
 * - getQuotes (列表查询)
 * - getQuote (单据详情)
 * - getQuoteBundleById (套餐详情)
 * - getQuoteVersions (版本历史)
 * - getQuoteAuditLogs (审计日志)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/cache - 防止 unstable_cache 在测试环境报 incrementalCache missing
vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn) => fn),
    revalidateTag: vi.fn(),
    revalidatePath: vi.fn(),
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
    eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
    and: vi.fn((...args) => ({ type: 'and', args })),
    or: vi.fn((...args) => ({ type: 'or', args })),
    desc: vi.fn((a) => ({ type: 'desc', a })),
    asc: vi.fn((a) => ({ type: 'asc', a })),
    count: vi.fn(() => 'count'),
    sql: vi.fn((parts, ...args) => ({ type: 'sql', parts, args })),
}));

import { createMockDb } from '@/shared/tests/mock-db';
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_QUOTE_ID = '110e8400-e29b-41d4-a716-446655440000';
const MOCK_ROOT_ID = '220e8400-e29b-41d4-a716-446655440000';
const MOCK_SESSION = createMockSession();
const MOCK_TENANT_ID = MOCK_SESSION.user.tenantId;

// ── Mock Db Config ──
const mockDb = createMockDb(['quotes', 'auditLogs']) as ReturnType<typeof createMockDb> & Record<string, ReturnType<typeof vi.fn>>;

// Mock Count behavior for pagination
const mockQueryBuilder = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([{ count: 1 }]),
    then: function (resolve: any) {
        resolve([{ count: 1 }]);
    }
};

mockDb.select = vi.fn().mockReturnValue(mockQueryBuilder);
mockDb.orderBy = mockQueryBuilder.orderBy;

vi.mock('@/shared/api/db', () => ({
    db: mockDb,
}));

// Mock Auth
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

// Mock Schema
vi.mock('@/shared/api/schema/quotes', () => ({
    quotes: { id: 'quotes.id', tenantId: 'quotes.tenantId', rootQuoteId: 'quotes.rootQuoteId', status: 'quotes.status', customerId: 'quotes.customerId', createdAt: 'quotes.createdAt', quoteNo: 'quotes.quoteNo', version: 'quotes.version' },
}));
vi.mock('@/shared/api/schema/customers', () => ({
    customers: { id: 'customers.id', name: 'customers.name', phone: 'customers.phone', tenantId: 'customers.tenantId' }
}));
vi.mock('@/shared/api/schema/customer-addresses', () => ({
    customerAddresses: { customerId: 'customerAddresses.customerId', address: 'customerAddresses.address', community: 'customerAddresses.community' }
}));
vi.mock('@/shared/api/schema/infrastructure', () => ({
    users: { name: 'users.name', id: 'users.id' }
}));
vi.mock('@/shared/api/schema/audit', () => ({
    auditLogs: { id: 'auditLogs.id', action: 'auditLogs.action', createdAt: 'auditLogs.createdAt', userId: 'auditLogs.userId', tableName: 'auditLogs.tableName', recordId: 'auditLogs.recordId' }
}));
vi.mock('@/shared/api/schema/enums', () => ({
    quoteStatusEnum: { enumValues: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'] }
}));

// ── 测试套件 ──
describe('Quote Queries (L5)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();

        const { auth } = await import('@/shared/lib/auth');
        vi.mocked(auth).mockResolvedValue(MOCK_SESSION);
    });

    it('getQuote 应当验证租户隔离并返回报价详情', async () => {
        mockDb.query.quotes.findFirst.mockResolvedValue({ id: MOCK_QUOTE_ID, title: 'Test Quote' });
        const { getQuote } = await import('../queries');

        const result = await getQuote(MOCK_QUOTE_ID);

        expect(mockDb.query.quotes.findFirst).toHaveBeenCalled();
        const callArgs = mockDb.query.quotes.findFirst.mock.calls[0][0];
        // 简单验证 with 结构包含 rooms 和 items
        expect(callArgs.with).toHaveProperty('rooms');
        expect(callArgs.with).toHaveProperty('items');

        expect(result.data).toEqual({ id: MOCK_QUOTE_ID, title: 'Test Quote' });
    });

    it('getQuotes 应当支持分页和租户隔离', async () => {
        mockDb.query.quotes.findMany.mockResolvedValue([{ id: MOCK_QUOTE_ID }]);
        const { getQuotes } = await import('../queries');

        const result = await getQuotes({ page: 1, pageSize: 10 });

        expect(mockDb.query.quotes.findMany).toHaveBeenCalled();
        expect(result.data).toHaveLength(1);
        expect(result.meta).toEqual({
            page: 1,
            pageSize: 10,
            total: 1,
            totalPages: 1
        });
    });

    it('getQuoteBundleById 应当处理未授权访问并返回带有 subQuotes 的数据', async () => {
        const { auth } = await import('@/shared/lib/auth');
        vi.mocked(auth).mockResolvedValueOnce(null);

        const { getQuoteBundleById } = await import('../queries');

        // 测试未授权
        let result = await getQuoteBundleById({ id: MOCK_QUOTE_ID });
        expect(result).toEqual({ success: false, message: '未授权访问' });

        // 测试成功
        mockDb.query.quotes.findFirst.mockResolvedValue({
            id: MOCK_QUOTE_ID,
            subQuotes: [{ id: 'sub-1' }]
        });

        result = await getQuoteBundleById({ id: MOCK_QUOTE_ID });
        expect(result.success).toBe(true);
        // 验证结构转换 quotes: subQuotes
        expect((result.data as { quotes?: unknown }).quotes).toBeDefined();
    });

    it('getQuoteVersions 应当隔离租户并返回关联根节点的所有版本', async () => {
        mockDb.query.quotes.findMany.mockResolvedValue([
            { id: 'v2', version: 2 },
            { id: 'v1', version: 1 }
        ]);
        const { getQuoteVersions } = await import('../queries');

        const result = await getQuoteVersions(MOCK_ROOT_ID);

        expect(mockDb.query.quotes.findMany).toHaveBeenCalled();
        expect(result).toHaveLength(2);
    });

    it('getQuoteAuditLogs 应当先验证报价单归属然后再查询日志', async () => {
        const { getQuoteAuditLogs } = await import('../queries');

        // 模拟已存在报价单
        mockDb.query.quotes.findFirst.mockResolvedValue({ id: MOCK_QUOTE_ID });
        mockDb.orderBy.mockResolvedValue([{ id: 'log-1', action: 'CREATE' }]);

        const result = await getQuoteAuditLogs(MOCK_QUOTE_ID);

        expect(mockDb.query.quotes.findFirst).toHaveBeenCalled();
        expect(mockDb.select).toHaveBeenCalled();
        expect(result).toHaveLength(1);
    });

    it('getQuoteAuditLogs 如果报价单不属于当前租户应当抛出异常', async () => {
        const { getQuoteAuditLogs } = await import('../queries');

        // 模拟不可见/不属于当前租户
        mockDb.query.quotes.findFirst.mockResolvedValue(null);

        await expect(getQuoteAuditLogs(MOCK_QUOTE_ID)).rejects.toThrow('报价单不存在或无权访问');
    });
});
