import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkPaymentBeforeInstall } from '../logic/payment-check';

// ----------------------------------------------------------------------
// Mock 依赖
// ----------------------------------------------------------------------

const { mockSelect, mockFrom, mockLeftJoin, mockInnerJoin, mockWhere } = vi.hoisted(() => {
    const mSelect = vi.fn();
    const mFrom = vi.fn().mockReturnThis();
    const mLeftJoin = vi.fn().mockReturnThis();
    const mInnerJoin = vi.fn().mockReturnThis();
    const mWhere = vi.fn().mockResolvedValue([]);

    // mockSelect returned function
    mSelect.mockImplementation(() => ({
        from: mFrom,
        leftJoin: mLeftJoin,
        innerJoin: mInnerJoin,
        where: mWhere,
    }));

    return {
        mockSelect: mSelect,
        mockFrom: mFrom,
        mockLeftJoin: mLeftJoin,
        mockInnerJoin: mInnerJoin,
        mockWhere: mWhere,
    };
});

vi.mock('@/features/settings/actions/tenant-config', () => ({
    getTenantBusinessConfig: vi.fn().mockResolvedValue({
        arPayment: {
            allowDebtInstallCash: false,
            requireDebtInstallApproval: false,
        },
    }),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            orders: {
                findFirst: vi.fn(),
            },
            leads: {
                findFirst: vi.fn(),
            },
            channels: {
                findFirst: vi.fn(),
            },
        },
        select: mockSelect,
    },
}));

vi.mock('drizzle-orm', async (importOriginal) => {
    const actual = await importOriginal<typeof import('drizzle-orm')>();
    return {
        ...actual,
        eq: vi.fn(),
        and: vi.fn(),
        sum: vi.fn(),
        inArray: vi.fn(),
        notInArray: vi.fn(),
    };
});

describe('TDD: Payment Check Logic', () => {
    const tenantId = 'tenant-123';
    const orderId = 'order-123';
    const leadId = 'lead-123';
    const channelId = 'channel-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('1. 现结渠道全款已付，应该通过拦截', async () => {
        const { db } = await import('@/shared/api/db');

        // Mock get order -> OK
        (db.query.orders.findFirst as any).mockResolvedValue({
            id: orderId,
            tenantId,
            leadId,
            totalAmount: '1000.00'
        });

        // Mock receipts -> paid 1000
        mockWhere.mockResolvedValueOnce([{ total: '1000.00' }]);

        const result = await checkPaymentBeforeInstall(orderId, tenantId);

        expect(result.passed).toBe(true);
        expect(result.details?.remainingAmount).toBe(0);
    });

    it('2. 现结渠道未付款，应该被拒绝', async () => {
        const { db } = await import('@/shared/api/db');

        (db.query.orders.findFirst as any).mockResolvedValue({
            id: orderId,
            tenantId,
            leadId,
            totalAmount: '1000.00'
        });

        // Paid 0
        mockWhere.mockResolvedValueOnce([{ total: null }]);

        const result = await checkPaymentBeforeInstall(orderId, tenantId);

        expect(result.passed).toBe(false);
        expect(result.details?.channelType).toBe('PREPAY');
        expect(result.reason).toContain('现结客户需全款后安装');
    });

    it('3. 月结渠道 (MONTHLY) 未超额度，应该通过', async () => {
        const { db } = await import('@/shared/api/db');

        (db.query.orders.findFirst as any).mockResolvedValue({
            id: orderId,
            tenantId,
            leadId,
            totalAmount: '1000.00'
        });

        // Current Order receipts
        mockWhere.mockResolvedValueOnce([{ total: null }]);

        (db.query.leads.findFirst as any).mockResolvedValue({ channelId });
        (db.query.channels.findFirst as any).mockResolvedValue({
            settlementType: 'MONTHLY',
            creditLimit: '5000.00'
        });

        // otherOrders query -> empty array, means debt is 0
        mockWhere.mockResolvedValueOnce([]);

        const result = await checkPaymentBeforeInstall(orderId, tenantId);

        expect(result.passed).toBe(true);
        expect(result.details?.channelType).toBe('MONTHLY');
        expect(result.details?.creditLimit).toBe(5000);
    });

    it('4. 月结渠道 (MONTHLY) 当前已有历史真实欠款，且总和超过额度应该被驳回', async () => {
        const { db } = await import('@/shared/api/db');

        (db.query.orders.findFirst as any).mockResolvedValue({
            id: orderId,
            tenantId,
            leadId,
            totalAmount: '1000.00'
        });

        // Current Order receipts
        mockWhere.mockResolvedValueOnce([{ total: null }]);

        (db.query.leads.findFirst as any).mockResolvedValue({ channelId });
        (db.query.channels.findFirst as any).mockResolvedValue({
            settlementType: 'MONTHLY',
            creditLimit: '5000.00'
        });

        // otherOrders query -> 1 order with 4500 unpaid
        mockWhere.mockResolvedValueOnce([{ id: 'order-999', totalAmount: '4500.00' }]);
        // otherReceipts query -> 0 paid
        mockWhere.mockResolvedValueOnce([{ total: null }]);

        const result = await checkPaymentBeforeInstall(orderId, tenantId);

        expect(result.passed).toBe(false);
        expect(result.details?.channelType).toBe('MONTHLY');
        expect(result.reason).toContain('超出授信额度');
    });

});
