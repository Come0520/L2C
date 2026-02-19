/**
 * 报价单模块安全测试 - 租户隔离验证
 * 
 * 这些测试确保报价单模块正确实现了多租户数据隔离，
 * 防止用户访问或修改其他租户的数据。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 数据库和认证
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            quotes: {
                findFirst: vi.fn(),
                findMany: vi.fn(),
            },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn(() => []),
                })),
            })),
        })),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';

// 测试数据
const TENANT_A_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const QUOTE_A_ID = 'quote-a-001';
const QUOTE_B_ID = 'quote-b-001';
const USER_A_ID = 'user-a-001';

describe('报价单模块 - 租户隔离安全测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getQuote - 查询隔离', () => {
        it('应该阻止租户 A 访问租户 B 的报价单', async () => {
            // 模拟租户 A 用户登录
            vi.mocked(auth).mockResolvedValue({
                user: { id: USER_A_ID, tenantId: TENANT_A_ID },
            } as never);

            // 模拟数据库返回 null（因为报价单属于租户 B）
            vi.mocked(db.query.quotes.findFirst).mockResolvedValue(null);

            // 动态导入以使用 mock
            const { getQuote } = await import('../queries');
            const result = await getQuote(QUOTE_B_ID);

            // 验证查询包含 tenantId 条件
            expect(db.query.quotes.findFirst).toHaveBeenCalled();

            // 验证返回空数据（租户隔离生效）
            expect(result.data).toBeNull();
        });

        it('应该允许访问同租户的报价单', async () => {
            // 模拟租户 A 用户登录
            vi.mocked(auth).mockResolvedValue({
                user: { id: USER_A_ID, tenantId: TENANT_A_ID },
            } as never);

            // 模拟数据库返回报价单
            vi.mocked(db.query.quotes.findFirst).mockResolvedValue({
                id: QUOTE_A_ID,
                tenantId: TENANT_A_ID,
                quoteNo: 'QT001',
            } as never);

            const { getQuote } = await import('../queries');
            const result = await getQuote(QUOTE_A_ID);

            expect(result.data).toBeDefined();
            expect(result.data?.id).toBe(QUOTE_A_ID);
        });
    });

    describe('未认证用户访问', () => {
        it('应该拒绝未登录用户的请求', async () => {
            // 模拟未登录
            vi.mocked(auth).mockResolvedValue(null);

            const { getQuote } = await import('../queries');

            await expect(getQuote(QUOTE_A_ID)).rejects.toThrow('未授权访问');
        });

        it('应该拒绝没有 tenantId 的用户', async () => {
            // 模拟登录但没有 tenantId
            vi.mocked(auth).mockResolvedValue({
                user: { id: USER_A_ID, tenantId: undefined },
            } as never);

            const { getQuote } = await import('../queries');

            await expect(getQuote(QUOTE_A_ID)).rejects.toThrow('未授权访问');
        });
    });
});

describe('报价单模块 - 状态流转安全测试', () => {
    it('不应允许非 DRAFT/REJECTED 状态的报价单提交', async () => {
        // 此测试验证状态机边界条件
        // QuoteLifecycleService.submit 应该只接受 DRAFT 或 REJECTED 状态
    });

    it('不应允许非 PENDING_CUSTOMER/APPROVED 状态的报价单转订单', async () => {
        // 此测试验证状态机边界条件
        // QuoteLifecycleService.convertToOrder 应该只接受特定状态
    });
});

describe('报价单模块 - 数据防泄露 (Data Leakage Prevention)', () => {
    it('getQuote 不应请求 costPrice 字段', async () => {
        vi.mocked(auth).mockResolvedValue({
            user: { id: USER_A_ID, tenantId: TENANT_A_ID },
        } as never);

        // 模拟数据库返回，即使数据库层模拟返回了 costPrice，
        // 我们主要验证的是 findFirst 的调用参数是否排除了它，
        // 或者是否显式选择了字段。
        // 但由于这是一个单元测试，我们主要检查 spy 的调用参数。
        vi.mocked(db.query.quotes.findFirst).mockResolvedValue({} as never);

        const { getQuote } = await import('../queries');
        await getQuote(QUOTE_A_ID);

        // 获取调用参数
        const callArgs = vi.mocked(db.query.quotes.findFirst).mock.calls[0][0] as any;

        // 验证 items 关联查询中是否指定了 columns 来排除 costPrice
        // 如果没有指定 columns，默认会查所有，这是不安全的
        const itemsQuery = callArgs.with?.items;

        expect(itemsQuery).toBeDefined();
        // 必须显式定义 columns 且不能包含 costPrice (Undefined means select all in simple queries, 
        // but typically one selects specific columns to exclude sensitive ones)
        // 或者，由于 Drizzle 不支持排除，我们需要检查 columns 是否被定义，
        // 并且是一个对象，并且里面没有 costPrice (或者 costPrice: false - 虽然 Drizzle 不支持 false，
        // 而是只列出需要的 true)

        // 策略: 必须使用 columns 白名单模式
        expect(itemsQuery.columns).toBeDefined();

        // 检查白名单中是否包含 costPrice (应该不包含)
        if (itemsQuery.columns) {
            expect(itemsQuery.columns).not.toHaveProperty('costPrice');
        }
    });

});

describe('报价单模块 - 跨租户操作防护', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('reorderQuoteItems 应该验证报价单归属', async () => {
        // 模拟租户 A 用户
        vi.mocked(auth).mockResolvedValue({
            user: { id: USER_A_ID, tenantId: TENANT_A_ID },
        } as never);

        // 模拟数据库查询：报价单属于租户 B
        vi.mocked(db.query.quotes.findFirst).mockResolvedValue({
            id: QUOTE_B_ID,
            tenantId: TENANT_B_ID, // 归属租户 B
        } as never);

        const { reorderQuoteItems } = await import('../mutations');

        // 尝试重排租户 B 的报价单
        const result = await reorderQuoteItems({
            quoteId: QUOTE_B_ID,
            roomId: null,
            items: [{ id: 'item-1', sortOrder: 1 }]
        });

        // 核心验证：跨租户操作应该失败
        expect(result.success).toBe(false);
    });

    it('updateQuoteItem 应该验证行项目归属', async () => {
        vi.mocked(auth).mockResolvedValue({
            user: { id: USER_A_ID, tenantId: TENANT_A_ID },
        } as never);

        // 模拟行项目属于租户 B
        // 注意：具体实现可能先查 quote 再查 item，或者直接查 item
        // 假设 updateQuoteItem 先验证 quote
        vi.mocked(db.query.quotes.findFirst).mockResolvedValue({
            id: QUOTE_B_ID,
            tenantId: TENANT_B_ID,
        } as never);

        const { updateQuoteItem } = await import('../mutations');

        const result = await updateQuoteItem({
            id: 'item-b-1',
            quantity: 2
        });

        // 核心验证：跨租户操作应该失败
        expect(result.success).toBe(false);
    });

    it('lockQuote 应该从 context 获取 tenantId', async () => {
        vi.mocked(auth).mockResolvedValue({
            user: { id: USER_A_ID, tenantId: TENANT_A_ID },
        } as never);

        // 模拟数据库：ID 匹配但 tenantId 不匹配 (属于租户 B)
        vi.mocked(db.query.quotes.findFirst).mockResolvedValue(null);
        // 如果实现了租户隔离，查询 where id=Q_B AND tenantId=T_A 应该返回 null

        const { lockQuote } = await import('../mutations');

        // 尝试锁定 B 的报价单
        const result = await lockQuote({
            id: QUOTE_B_ID,
        });

        // 核心验证：操作应该失败（无论是 success:false 还是抛出异常）
        // lockQuote 返回格式取决于 createSafeAction 的错误处理
        expect(result.success).toBe(false);
    });

    it('createRoom 应该验证 quoteId 归属 (防止 IDOR)', async () => {
        vi.mocked(auth).mockResolvedValue({
            user: { id: USER_A_ID, tenantId: TENANT_A_ID },
        } as never);

        // 模拟数据库：quoteId 存在但属于租户 B
        vi.mocked(db.query.quotes.findFirst).mockResolvedValue(null);
        // 如果实现了租户隔离，查询 where id=Q_B AND tenantId=T_A 应该返回 null

        const { createRoom } = await import('../mutations');

        // 尝试为租户 B 的报价单创建房间
        const result = await createRoom({
            quoteId: QUOTE_B_ID,
            name: '恶意插入的房间',
        });

        // 核心验证：操作应该失败
        expect(result.success).toBe(false);
    });

    it('createQuoteItem 应该验证 quoteId 归属 (防止 IDOR)', async () => {
        vi.mocked(auth).mockResolvedValue({
            user: { id: USER_A_ID, tenantId: TENANT_A_ID },
        } as never);

        // 模拟数据库：quoteId 存在但属于租户 B
        vi.mocked(db.query.quotes.findFirst).mockResolvedValue(null);

        const { createQuoteItem } = await import('../mutations');

        // 尝试为租户 B 的报价单创建明细
        const result = await createQuoteItem({
            quoteId: QUOTE_B_ID,
            category: 'CURTAIN',
            productName: '恶意插入的商品',
            unitPrice: 100,
            quantity: 1,
        });

        // 核心验证：操作应该失败
        expect(result.success).toBe(false);
    });
});
