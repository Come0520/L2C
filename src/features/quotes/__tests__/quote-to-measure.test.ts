/**
 * 报价优先模式测试
 * 验证从报价单创建测量任务的流程 (createMeasureFromQuote)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 使用 vi.hoisted 确保变量在 vi.mock 工厂提升后仍可访问
const { mockDbInsert, mockDbQueryStrings } = vi.hoisted(() => ({
    mockDbInsert: vi.fn(),
    mockDbQueryStrings: {
        findFirst: vi.fn(),
    },
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            quotes: mockDbQueryStrings,
        },
        insert: mockDbInsert,
        transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb({
            insert: mockDbInsert,
            query: { quotes: mockDbQueryStrings }
        })),
    },
}));

vi.mock('@/shared/api/schema/quotes', () => ({
    quotes: { id: 'id', tenantId: 'tenantId' },
}));

vi.mock('@/shared/api/schema/service', () => ({
    measureTasks: { id: 'id' },
}));

vi.mock('drizzle-orm', () => ({
    eq: vi.fn((a, b) => ({ field: a, value: b })),
    and: vi.fn((...args: unknown[]) => args),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
    checkPermission: vi.fn().mockResolvedValue(true),
    auth: vi.fn().mockResolvedValue({
        user: {
            id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00099',
            tenantId: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00098',
        },
    }),
}));

vi.mock('@/shared/utils/doc-no', () => ({
    generateDocNo: vi.fn().mockResolvedValue('MS-001'),
}));

import { createMeasureFromQuote } from '../actions/measure-integration';

describe('createMeasureFromQuote - 验证报价转量尺', () => {
    const VALID_QUOTE_ID = 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001';
    const VALID_LEAD_ID = 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00002';
    const VALID_CUSTOMER_ID = 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00003';

    beforeEach(() => {
        vi.clearAllMocks();
        mockDbInsert.mockImplementation(() => ({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'task-123' }])
            })
        }));
    });

    it('应验证报价单是否存在', async () => {
        mockDbQueryStrings.findFirst.mockResolvedValue(null);
        const result = await createMeasureFromQuote({
            quoteId: VALID_QUOTE_ID,
            customerId: VALID_CUSTOMER_ID,
            leadId: VALID_LEAD_ID
        });
        expect(result.success).toBe(false);
        // createSafeAction 返回的错误字段名为 error，而非 message
        expect(result.error).toContain('不存在');
    });

    it('应正确创建测量任务', async () => {
        mockDbQueryStrings.findFirst.mockResolvedValue({
            id: VALID_QUOTE_ID,
            leadId: VALID_LEAD_ID,
            customerId: VALID_CUSTOMER_ID,
        });
        const result = await createMeasureFromQuote({
            quoteId: VALID_QUOTE_ID,
            customerId: VALID_CUSTOMER_ID,
            leadId: VALID_LEAD_ID
        });

        expect(result.success).toBe(true);
        expect(mockDbInsert).toHaveBeenCalled();
    });
});
