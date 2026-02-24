
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { closeResolutionCostClosure } from '../actions/ticket';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { AuditService } from '@/shared/lib/audit-service';

// Pre-define mocks to maintain identity
const mockWhere = vi.fn().mockResolvedValue({ success: true });
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

// Mock Modules
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            afterSalesTickets: { findFirst: vi.fn() },
        },
        update: (...args: any[]) => mockUpdate(...args),
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        recordFromSession: vi.fn().mockResolvedValue({}),
    }
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    cache: vi.fn((fn) => fn),
}));

describe('After-Sales Cost Closure (成本结案验证)', () => {
    const VALID_TENANT_ID = '550e8400-e29b-41d4-a716-446655440001';
    const VALID_TICKET_ID = '550e8400-e29b-41d4-a716-446655440002';

    const mockSession = { user: { id: 'user-1', tenantId: VALID_TENANT_ID } };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
        mockWhere.mockResolvedValue({ success: true });
        mockSet.mockReturnValue({ where: mockWhere });
        mockUpdate.mockReturnValue({ set: mockSet });
    });

    it('场景1：正常结案，计算并记录内部损失', async () => {
        (db.query.afterSalesTickets.findFirst as any).mockResolvedValue({
            id: VALID_TICKET_ID,
            totalActualCost: '500.00',
            actualDeduction: '350.00',
            status: 'PROCESSING'
        });

        const result = await closeResolutionCostClosure(VALID_TICKET_ID);

        expect(result.success).toBe(true);
        expect(mockUpdate).toHaveBeenCalled();
        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
            internalLoss: "150",
            status: 'CLOSED'
        }));
        expect(AuditService.recordFromSession).toHaveBeenCalled();
    });

    it('场景2：工单不存在时返回错误', async () => {
        (db.query.afterSalesTickets.findFirst as any).mockResolvedValue(null);

        const result = await closeResolutionCostClosure(VALID_TICKET_ID);

        expect(result.success).toBe(false);
        expect(result.error).toBe('工单不存在或无权操作');
    });

    it('场景3：处理数据库异常', async () => {
        (db.query.afterSalesTickets.findFirst as any).mockResolvedValue({
            id: VALID_TICKET_ID,
            totalActualCost: '100',
            actualDeduction: '0'
        });
        mockUpdate.mockImplementation(() => { throw new Error('DB Crash'); });

        const result = await closeResolutionCostClosure(VALID_TICKET_ID);

        expect(result.success).toBe(false);
        expect(result.error).toContain('系统异常');
    });

    it('场景4：无费用时的结案处理', async () => {
        (db.query.afterSalesTickets.findFirst as any).mockResolvedValue({
            id: VALID_TICKET_ID,
            totalActualCost: null,
            actualDeduction: '0.00'
        });

        const result = await closeResolutionCostClosure(VALID_TICKET_ID);

        expect(result.success).toBe(true);
        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
            internalLoss: "0"
        }));
    });
});
