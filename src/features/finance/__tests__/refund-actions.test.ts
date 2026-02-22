import { vi, describe, it, expect, beforeEach } from 'vitest';
import { submitRefundRequest } from '../actions/refund';
import { createPaymentBill } from '../actions/ap';
import { auth, checkPermission } from '@/shared/lib/auth';

// 模拟外部依赖
vi.mock('../actions/ap', () => ({
    createPaymentBill: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

describe('Finance Refund Actions', () => {
    const mockTenantId = 'tenant-123';
    const mockUserId = 'user-456';
    const mockSession = { user: { tenantId: mockTenantId, id: mockUserId } };

    const validRefundData = {
        orderId: 'f47ac10b-58cc-4372-a567-0e02b2c3d401',
        customerId: 'customer-789',
        customerName: '张三',
        amount: '150.50',
        remark: '质量问题退款',
        proofUrl: 'https://example.com/proof.jpg',
        paymentMethod: 'WECHAT' as const,
        accountId: 'account-101'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession);
        vi.mocked(checkPermission).mockResolvedValue(true);
        vi.mocked(createPaymentBill).mockResolvedValue({
            success: true,
            data: { id: 'bill-completed' }
        } as any);
    });

    it('should successfully submit refund request with valid data', async () => {
        const result = await submitRefundRequest(validRefundData);

        expect(result.success).toBe(true);
        expect(createPaymentBill).toHaveBeenCalledTimes(1);
    });

    it('should throw error when session is null', async () => {
        vi.mocked(auth).mockResolvedValue(null);

        await expect(submitRefundRequest(validRefundData))
            .rejects.toThrow('未授权');
        expect(createPaymentBill).not.toHaveBeenCalled();
    });

    it('should throw error when tenantId is missing in session', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: mockUserId } } as any);

        await expect(submitRefundRequest(validRefundData))
            .rejects.toThrow('未授权');
        expect(createPaymentBill).not.toHaveBeenCalled();
    });

    it('should throw error when checkPermission fails', async () => {
        vi.mocked(checkPermission).mockResolvedValue(false);

        await expect(submitRefundRequest(validRefundData))
            .rejects.toThrow('权限不足：需要财务创建权限');
        expect(createPaymentBill).not.toHaveBeenCalled();
    });

    it('should pass correctly mapped payload to createPaymentBill', async () => {
        await submitRefundRequest(validRefundData);

        expect(createPaymentBill).toHaveBeenCalledWith({
            type: 'REFUND',
            payeeType: 'CUSTOMER',
            payeeId: validRefundData.customerId,
            orderId: validRefundData.orderId,
            payeeName: validRefundData.customerName,
            amount: 150.5, // string '150.50' should become number 150.5
            remark: validRefundData.remark,
            proofUrl: validRefundData.proofUrl,
            paymentMethod: validRefundData.paymentMethod,
            accountId: validRefundData.accountId,
        });
    });

    it('should handle optional fields correctly with default fallback (remark)', async () => {
        const dataWithoutOptional = {
            ...validRefundData,
            remark: undefined,
            orderId: undefined,
            accountId: undefined
        };

        await submitRefundRequest(dataWithoutOptional);

        expect(createPaymentBill).toHaveBeenCalledWith(expect.objectContaining({
            remark: 'Client Refund', // default fallback
            orderId: undefined,
            accountId: undefined,
        }));
    });


    it('should propagate errors thrown from createPaymentBill', async () => {
        vi.mocked(createPaymentBill).mockRejectedValue(new Error('Internal AP Error'));

        await expect(submitRefundRequest(validRefundData))
            .rejects.toThrow('Internal AP Error');
    });
});
