import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createChangeRequestAction, approveChangeRequestAction } from '../change-order';
import { auth, checkPermission } from '@/shared/lib/auth';
import { ChangeOrderService } from '@/services/change-order.service';
import { submitApproval } from '@/features/approval/actions/submission';

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/services/change-order.service', () => ({
    ChangeOrderService: {
        createRequest: vi.fn(),
        approveRequest: vi.fn(),
    },
}));

vi.mock('@/features/approval/actions/submission', () => ({
    submitApproval: vi.fn(),
}));

describe('Change Order Actions', () => {
    const mockSession = {
        user: { id: 'u1', tenantId: 't1' }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
        (checkPermission as any).mockResolvedValue(undefined);
    });

    describe('createChangeRequestAction', () => {
        const input = {
            orderId: '11111111-1111-4111-8111-111111111111',
            type: 'FIELD_CHANGE' as const,
            reason: 'Change address',
            diffAmount: '100.50',
        };

        it('应成功创建变更请求并提交审批', async () => {
            (ChangeOrderService.createRequest as any).mockResolvedValue({ id: 'req1', diffAmount: 100.50 });

            const result = await createChangeRequestAction(input);

            expect(result.success).toBe(true);
            expect(ChangeOrderService.createRequest).toHaveBeenCalledWith(
                input.orderId,
                mockSession.user.tenantId,
                expect.objectContaining({ reason: input.reason })
            );
            expect(submitApproval).toHaveBeenCalledWith(expect.objectContaining({
                flowCode: 'ORDER_CHANGE',
                entityId: 'req1',
                amount: 100.50,
            }));
        });
    });

    describe('approveChangeRequestAction', () => {
        it('应成功审批通过变更请求', async () => {
            const result = await approveChangeRequestAction('req1');
            expect(result.success).toBe(true);
            expect(ChangeOrderService.approveRequest).toHaveBeenCalledWith(
                'req1',
                mockSession.user.tenantId,
                mockSession.user.id
            );
        });

        it('权限不足时应拒绝审批', async () => {
            (checkPermission as any).mockRejectedValue(new Error('No permission'));
            await expect(approveChangeRequestAction('req1')).rejects.toThrow('No permission');
        });
    });
});
