import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestCancelOrder } from '../actions/cancel';
import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';
import { submitApproval } from '@/features/approval/actions/submission';
import { AuditService } from '@/shared/lib/audit-service';

// Mock dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            orders: {
                findFirst: vi.fn(),
            },
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(),
            })),
        })),
        transaction: vi.fn((cb) => cb({
            update: vi.fn(() => ({
                set: vi.fn(() => ({
                    where: vi.fn(),
                })),
                where: vi.fn(),
            })),
        })),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/features/approval/actions/submission', () => ({
    submitApproval: vi.fn(),
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        record: vi.fn(),
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

describe('Order Cancellation', () => {
    const mockSession = {
        user: {
            id: 'test-user',
            tenantId: 'test-tenant',
        },
    };

    const mockOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: 'test-tenant',
        status: 'PENDING_PRODUCTION',
        totalAmount: '1000.00',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
        (checkPermission as any).mockResolvedValue(true);
    });

    it('should successfully submit cancellation request for valid order', async () => {
        // Setup mocks
        (db.query.orders.findFirst as any).mockResolvedValue(mockOrder);
        (db.insert as any).mockReturnValue({
            values: () => ({
                returning: () => Promise.resolve([{ id: 'change-record-id' }]),
            }),
        });
        (submitApproval as any).mockResolvedValue({ success: true, approvalId: 'approval-123' });

        const input = {
            orderId: '123e4567-e89b-12d3-a456-426614174000',
            reason: '客户主动取消', // Must be one of valid reasons
            remark: 'Customer changed mind',
        };

        const result = await requestCancelOrder(input);
        expect(result.success).toBe(true);
        expect(result.message).toContain('撤单申请已提交');
        expect(db.insert).toHaveBeenCalled(); // Checked change record creation
        expect(submitApproval).toHaveBeenCalled();
        expect(AuditService.record).toHaveBeenCalledWith(expect.objectContaining({
            action: 'UPDATE',
            recordId: '123e4567-e89b-12d3-a456-426614174000',
        }));
    });

    it('should reject cancellation for invalid order status', async () => {
        (db.query.orders.findFirst as any).mockResolvedValue({
            ...mockOrder,
            status: 'COMPLETED', // Not cancelable
        });

        const result = await requestCancelOrder({
            orderId: '123e4567-e89b-12d3-a456-426614174000',
            reason: '客户主动取消',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('不允许撤单');
        expect(submitApproval).not.toHaveBeenCalled();
    });

    it('should auto-execute cancellation if approval flow is disabled', async () => {
        (db.query.orders.findFirst as any).mockResolvedValue(mockOrder);
        (db.insert as any).mockReturnValue({
            values: () => ({
                returning: () => Promise.resolve([{ id: 'change-record-id' }]),
            }),
        });

        // Simulate approval disabled 
        (submitApproval as any).mockResolvedValue({
            success: false,
            error: '审批流程未定义或已禁用'
        });

        const result = await requestCancelOrder({
            orderId: '123e4567-e89b-12d3-a456-426614174000',
            reason: '客户主动取消',
        });

        expect(result.success).toBe(true);
        // Debug logging
        if (!result.success || !result.message?.includes('订单已成功取消')) {
            console.log('Failed result:', JSON.stringify(result, null, 2));
        }
        expect(result.message).toContain('订单已成功取消');
        // Should have called transaction to update order directly
        expect(db.transaction).toHaveBeenCalled();
    });

    it('should handle unauthorized access', async () => {
        (auth as any).mockResolvedValue(null);

        const result = await requestCancelOrder({
            orderId: '123e4567-e89b-12d3-a456-426614174000',
            reason: '客户主动取消',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('未授权');
    });
});
