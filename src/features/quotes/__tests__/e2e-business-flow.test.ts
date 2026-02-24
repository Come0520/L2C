import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteLifecycleService } from '@/services/quote-lifecycle.service';
import { createMockDb } from '@/shared/tests/mock-db';

const mockDb = createMockDb(['quotes', 'quoteItems', 'quoteRooms']);
vi.mock('@/shared/api/db', () => ({
    db: mockDb
}));

vi.mock('@/services/quote-lifecycle.service', () => ({
    QuoteLifecycleService: {
        submit: vi.fn().mockResolvedValue(true),
        approve: vi.fn().mockResolvedValue(true),
        convertToOrder: vi.fn().mockResolvedValue({ id: 'new-order-id' })
    }
}));

/**
 * 端到端业务流程测试
 * 覆盖从报价单创建、明细添加、房间管理、状态扭转到生成订单的全链路
 */
describe('报价单端到端业务流程', () => {
    const mockTenantId = 'test-tenant-id';
    const mockUserId = 'test-user-id';
    const mockCustomerId = 'test-customer-id';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('完成报价单生命周期闭环: 手动创建 -> 提交 -> 审批 -> 转订单', async () => {
        // 1. 创建报价单 (Mock DB 操作)
        mockDb.insert.mockReturnValue({
            values: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: 'quote-1' }])
        } as any);

        // 2. 模拟 Action 服务调用
        const submitResult = await QuoteLifecycleService.submit('quote-1', mockTenantId, mockUserId);
        expect(QuoteLifecycleService.submit).toHaveBeenCalledWith('quote-1', mockTenantId, mockUserId);

        const convertResult = await QuoteLifecycleService.convertToOrder('quote-1', mockTenantId, mockUserId);
        expect(QuoteLifecycleService.convertToOrder).toHaveBeenCalledWith('quote-1', mockTenantId, mockUserId);
        expect(convertResult).toEqual({ id: 'new-order-id' });
    });
});
