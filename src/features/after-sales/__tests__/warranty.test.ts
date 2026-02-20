
import { vi, describe, it, expect, beforeEach } from 'vitest';

// --- vi.hoisted：确保 Mock 闭包在模块作用域最早被初始化 ---
const {
    mockOrdersFindFirst,
    mockTenantsFindFirst,
    mockAuth,
} = vi.hoisted(() => ({
    mockOrdersFindFirst: vi.fn(),
    mockTenantsFindFirst: vi.fn(),
    mockAuth: vi.fn(),
}));

// --- Mock 模块 ---
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            orders: { findFirst: mockOrdersFindFirst },
            tenants: { findFirst: mockTenantsFindFirst },
        },
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: mockAuth,
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

// --- 导入被测模块 ---
import { checkWarrantyStatus } from '../actions/warranty';

describe('Warranty Actions', () => {
    const VALID_USER_ID = '550e8400-e29b-41d4-a716-446655440010';
    const VALID_TENANT_ID = '550e8400-e29b-41d4-a716-446655440011';
    const VALID_ORDER_ID = '550e8400-e29b-41d4-a716-446655440012';

    const mockSession = {
        user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue(mockSession);
    });

    describe('checkWarrantyStatus', () => {
        it('应正确判定在保修期内（使用租户配置的 24 个月保修期）', async () => {
            // 设置一个 6 个月前完成的订单
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            mockOrdersFindFirst.mockResolvedValue({
                id: VALID_ORDER_ID,
                orderNo: 'ORD-001',
                status: 'COMPLETED',
                completedAt: sixMonthsAgo,
                createdAt: new Date('2023-01-01'),
            });

            mockTenantsFindFirst.mockResolvedValue({
                settings: { afterSales: { warrantyMonths: 24 } },
            });

            const result = await checkWarrantyStatus({ orderId: VALID_ORDER_ID });

            expect(result.success).toBe(true);
            expect(result.data?.isInWarranty).toBe(true);
            expect(result.data?.warrantyMonths).toBe(24);
            expect(result.data?.daysRemaining).toBeGreaterThan(0);
            expect(result.data?.daysExpired).toBeNull();
            expect(result.data?.statusLabel).toBe('保修期内');
        });

        it('应正确判定已过保（默认 12 个月保修期）', async () => {
            // 设置一个 18 个月前完成的订单
            const eighteenMonthsAgo = new Date();
            eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);

            mockOrdersFindFirst.mockResolvedValue({
                id: VALID_ORDER_ID,
                orderNo: 'ORD-002',
                status: 'COMPLETED',
                completedAt: eighteenMonthsAgo,
                createdAt: new Date('2023-01-01'),
            });

            // 没有明确的保修月设置，使用默认值 12
            mockTenantsFindFirst.mockResolvedValue({
                settings: {},
            });

            const result = await checkWarrantyStatus({ orderId: VALID_ORDER_ID });

            expect(result.success).toBe(true);
            expect(result.data?.isInWarranty).toBe(false);
            expect(result.data?.warrantyMonths).toBe(12);
            expect(result.data?.daysRemaining).toBeNull();
            expect(result.data?.daysExpired).toBeGreaterThan(0);
            expect(result.data?.statusLabel).toContain('已过保');
        });

        it('当订单不存在时应返回错误', async () => {
            mockOrdersFindFirst.mockResolvedValue(null);

            const result = await checkWarrantyStatus({ orderId: VALID_ORDER_ID });

            expect(result.success).toBe(true);
            expect(result.data?.error).toBe('订单不存在');
        });
    });
});
