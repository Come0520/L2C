import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, ERROR_CODES } from '@/shared/lib/errors';
import { mergeCustomersAction } from '../mutations';

// ====== Mocks ======
const mockTenantId = '880e8400-e29b-41d4-a716-446655440000';
const mockUserId = '990e8400-e29b-41d4-a716-446655440000';
const mockPrimaryId = 'primary-123';
const mockSourceId = 'source-123';

const MOCK_SESSION = {
    user: { id: mockUserId, tenantId: mockTenantId, roles: ['ADMIN'] }
};

vi.mock('@/shared/api/db', () => ({
    db: {}
}));

vi.mock('@/shared/api/schema', () => ({
    customers: {},
    customerAddresses: {},
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

const submitApprovalMock = vi.fn();
vi.mock('@/features/approval/actions/submission', () => ({
    submitApproval: submitApprovalMock
}));

describe('mergeCustomersAction (合并客户测试 - 审批流重构版)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { auth, checkPermission } = await import('@/shared/lib/auth');
        vi.mocked(auth).mockResolvedValue(MOCK_SESSION);
        // 默认拥有 MERGE 权限
        vi.mocked(checkPermission).mockResolvedValue(true);

        submitApprovalMock.mockResolvedValue({
            success: true,
            approvalId: 'approval-123'
        });
    });

    it('1. 成功提交合并审批申请', async () => {
        const input = {
            targetCustomerId: mockPrimaryId,
            targetCustomerVersion: 1,
            sourceCustomerIds: [mockSourceId],
            fieldPriority: 'PRIMARY' as const,
        };

        const result = await mergeCustomersAction(input, mockUserId);

        expect(submitApprovalMock).toHaveBeenCalledWith({
            flowCode: 'CUSTOMER_MERGE',
            entityType: 'CUSTOMER_MERGE',
            entityId: mockPrimaryId,
            comment: JSON.stringify({
                sourceCustomerIds: [mockSourceId],
                fieldPriority: 'PRIMARY',
                targetCustomerVersion: 1
            }),
            tenantId: mockTenantId,
            requesterId: mockUserId
        });

        expect(result).toEqual({
            success: true,
            approvalId: 'approval-123',
            message: '合并申请已提交，等待店长审批'
        });
    });

    it('2. 无 MERGE 权限时应抛出 403 错误', async () => {
        const { checkPermission } = await import('@/shared/lib/auth');
        vi.mocked(checkPermission).mockResolvedValueOnce(false); // 撤销权限

        const input = {
            targetCustomerId: mockPrimaryId,
            sourceCustomerIds: [mockSourceId]
        };

        await expect(mergeCustomersAction(input as any, mockUserId)).rejects.toThrow(
            new AppError('Permission denied', ERROR_CODES.PERMISSION_DENIED, 403)
        );

        expect(submitApprovalMock).not.toHaveBeenCalled();
    });

    it('3. 提交审批失败时应抛出对应的错误', async () => {
        // 模拟审批提交系统报错，例如参数校验失败等
        submitApprovalMock.mockResolvedValueOnce({
            success: false,
            error: '审批流程未定义'
        });

        const input = {
            targetCustomerId: mockPrimaryId,
            sourceCustomerIds: [mockSourceId]
        };

        await expect(mergeCustomersAction(input as any, mockUserId)).rejects.toThrow(
            new AppError('审批流程未定义', ERROR_CODES.INVALID_OPERATION, 400)
        );
    });
});
