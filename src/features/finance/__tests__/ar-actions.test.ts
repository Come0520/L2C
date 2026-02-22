import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPaymentOrder } from '../actions/ar';
import { FinanceService } from '@/services/finance.service';
import { auth, checkPermission } from '@/shared/lib/auth';

// 模拟依赖
vi.mock('@/services/finance.service', () => ({
    FinanceService: {
        createPaymentOrder: vi.fn(),
        verifyPaymentOrder: vi.fn(),
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    unstable_cache: vi.fn().mockImplementation((fn: any) => fn),
}));

// 模拟 DB 防止导入时连接数据库
vi.mock('@/shared/api/db', () => ({
    db: {},
}));

// 模拟 PERMISSIONS 常量
vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        FINANCE: {
            VIEW: 'finance:view',
            CREATE: 'finance:create',
            APPROVE: 'finance:approve',
        }
    }
}));

// 模拟其他被 ar.ts 间接导入的模块
vi.mock('@/features/channels/logic/commission.service', () => ({
    handleCommissionClawback: vi.fn(),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn() },
}));

vi.mock('@/shared/lib/generate-no', () => ({
    generateBusinessNo: vi.fn().mockReturnValue('AR-TEST-001'),
}));

// 符合 RFC 4122 标准的 UUID v4（version=4, variant=8/9/a/b）
const MOCK_TENANT_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const MOCK_USER_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
const MOCK_CUSTOMER_ID = 'c3d4e5f6-a7b8-4c9d-ae1f-2a3b4c5d6e7f';
const MOCK_ACCOUNT_ID = 'd4e5f6a7-b8c9-4d0e-8f2a-3b4c5d6e7f8a';
const MOCK_ORDER_ID = 'e5f6a7b8-c9d0-4e1f-9a3b-4c5d6e7f8a9b';

describe('Finance AR Actions', () => {
    const mockAuth = auth as ReturnType<typeof vi.fn>;
    const mockCheckPermission = checkPermission as ReturnType<typeof vi.fn>;
    const mockCreatePaymentOrder = FinanceService.createPaymentOrder as ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('createPaymentOrder 正确传参给 FinanceService.createPaymentOrder', async () => {
        // 准备：设置 session 和权限检查通过
        const mockSession = { user: { tenantId: MOCK_TENANT_ID, id: MOCK_USER_ID } };
        mockAuth.mockResolvedValue(mockSession);
        mockCheckPermission.mockResolvedValue(true);
        mockCreatePaymentOrder.mockResolvedValue({ success: true, id: 'po-001' });

        const inputData = {
            customerId: MOCK_CUSTOMER_ID,
            customerName: '测试客户',
            customerPhone: '13800000000',
            totalAmount: 1000,
            type: 'PREPAID' as const,
            paymentMethod: 'WECHAT',
            accountId: MOCK_ACCOUNT_ID,
            receivedAt: new Date('2023-01-01'),
            proofUrl: 'http://example.com/proof.jpg',
            remark: '测试备注',
            items: [
                { orderId: MOCK_ORDER_ID, amount: 1000 }
            ]
        };

        // 执行
        const result = await createPaymentOrder(inputData);

        // 断言：auth 被调用
        expect(mockAuth).toHaveBeenCalled();
        // 断言：权限检查被调用
        expect(mockCheckPermission).toHaveBeenCalled();
        // 断言：FinanceService 被正确调用（注意 totalAmount 会被转成 String）
        expect(mockCreatePaymentOrder).toHaveBeenCalledWith(
            expect.objectContaining({
                customerId: MOCK_CUSTOMER_ID,
                customerName: '测试客户',
                customerPhone: '13800000000',
                totalAmount: '1000',
                type: 'PREPAID',
                paymentMethod: 'WECHAT',
                accountId: MOCK_ACCOUNT_ID,
                proofUrl: 'http://example.com/proof.jpg',
                remark: '测试备注',
                items: [{ orderId: MOCK_ORDER_ID, amount: 1000 }]
            }),
            MOCK_TENANT_ID,
            MOCK_USER_ID
        );
        expect(result).toEqual({ success: true, id: 'po-001' });
    });

    it('createPaymentOrder 未授权时应抛出错误', async () => {
        mockAuth.mockResolvedValue(null);

        await expect(createPaymentOrder({
            customerName: '测试',
            customerPhone: '13800000000',
            totalAmount: 100,
            type: 'NORMAL' as const,
            paymentMethod: 'CASH',
            proofUrl: 'http://example.com/proof.jpg',
            receivedAt: new Date(),
        })).rejects.toThrow('未授权');
    });

    it('createPaymentOrder 权限不足时应抛出错误', async () => {
        const mockSession = { user: { tenantId: MOCK_TENANT_ID, id: MOCK_USER_ID } };
        mockAuth.mockResolvedValue(mockSession);
        mockCheckPermission.mockResolvedValue(false);

        await expect(createPaymentOrder({
            customerName: '测试',
            customerPhone: '13800000000',
            totalAmount: 100,
            type: 'NORMAL' as const,
            paymentMethod: 'CASH',
            proofUrl: 'http://example.com/proof.jpg',
            receivedAt: new Date(),
        })).rejects.toThrow('权限不足');
    });
});
