/**
 * 报价优先模式测试
 * 验证从报价单创建测量任务的流程 (createMeasureFromQuote)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks
const mockDbInsert = vi.fn();
const mockDbQueryStrings = {
    findFirst: vi.fn(),
};

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            quotes: mockDbQueryStrings,
        },
        insert: mockDbInsert,
        transaction: vi.fn(async (cb) => cb({
            insert: mockDbInsert,
            query: { quotes: mockDbQueryStrings }
        })),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    checkPermission: vi.fn().mockResolvedValue(true),
    auth: vi.fn().mockResolvedValue({ user: { id: 'test-user', tenantId: 'test-tenant' } }),
}));

vi.mock('@/shared/utils/doc-no', () => ({
    generateDocNo: vi.fn().mockResolvedValue('MS-001'),
}));

import { createMeasureFromQuote } from '../actions/measure-integration';

describe('createMeasureFromQuote - 验证报价转量尺', () => {
    const VALID_QUOTE_ID = 'quote-123';
    const VALID_LEAD_ID = 'lead-123';
    const VALID_CUSTOMER_ID = 'cust-123';

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
        expect(result.message).toContain('不存在');
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
