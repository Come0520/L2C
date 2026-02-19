
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createOrderFromQuote } from '../actions/creation';
import { confirmOrderProduction, splitOrder } from '../actions/production';
import { requestDelivery, updateLogistics } from '../actions/logistics';
import {
    confirmInstallationAction,
    customerAcceptAction,
    closeOrderAction
} from '../actions/orders';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { OrderService } from '@/services/order.service';
import { AuditService } from '@/shared/lib/audit-service';

// Mock Modules
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            orders: { findFirst: vi.fn(), findMany: vi.fn() },
            quotes: { findFirst: vi.fn() },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve({}))
            }))
        })),
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(true)
}));

vi.mock('@/services/order.service', () => ({
    OrderService: {
        convertFromQuote: vi.fn(),
        confirmInstallation: vi.fn(),
        customerAccept: vi.fn(),
        completeOrder: vi.fn(),
        requestCustomerConfirmation: vi.fn(),
        customerReject: vi.fn(),
    }
}));

vi.mock('@/services/logistics.service', () => ({
    LogisticsService: {
        updateLogisticsInfo: vi.fn(),
    }
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        record: vi.fn(),
    }
}));

vi.mock('@/features/channels/logic/commission.service', () => ({
    checkAndGenerateCommission: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/features/supply-chain/actions/split-engine', () => ({
    executeSplitRouting: vi.fn().mockResolvedValue({
        createdPOIds: ['po-1'],
        createdTaskIds: ['task-1'],
        pendingPoolItemIds: [],
        summary: 'Mock Summary',
    }),
}));

vi.mock('@/features/approval/actions/submission', () => ({
    submitApproval: vi.fn(),
}));

describe('Order Actions (Final Polish)', () => {
    // 使用标准的 v4 UUID 格式
    const VALID_ORDER_ID = '550e8400-e29b-41d4-a716-446655440000';
    const VALID_QUOTE_ID = '550e8400-e29b-41d4-a716-446655440001';
    const VALID_SUPPLIER_ID = '550e8400-e29b-41d4-a716-446655440002';
    const VALID_ITEM_ID = '550e8400-e29b-41d4-a716-446655440003';
    const VALID_USER_ID = '550e8400-e29b-41d4-a716-446655440004';
    const VALID_TENANT_ID = '550e8400-e29b-41d4-a716-446655440005';

    const mockSession = {
        user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
    });

    describe('createOrderFromQuote', () => {
        it('should create order directly when fully paid', async () => {
            const mockQuote = { id: VALID_QUOTE_ID, tenantId: VALID_TENANT_ID, totalAmount: '1000.00' };
            const mockOrder = { id: VALID_ORDER_ID, totalAmount: '1000.00', paidAmount: '1000.00' };
            (db.query.quotes.findFirst as any).mockResolvedValue(mockQuote);
            (OrderService.convertFromQuote as any).mockResolvedValue(mockOrder);

            const result = await createOrderFromQuote({
                quoteId: VALID_QUOTE_ID,
                paymentAmount: '1000.00'
            });

            expect(result).toEqual(mockOrder);
            expect(AuditService.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'ORDER_CREATED' }));
        });
    });

    describe('confirmOrderProduction', () => {
        it('should successfully confirm production', async () => {
            (db.query.orders.findFirst as any).mockResolvedValue({
                id: VALID_ORDER_ID,
                status: 'PAID',
                tenantId: VALID_TENANT_ID
            });

            const result = await confirmOrderProduction({ orderId: VALID_ORDER_ID });

            expect(result.success).toBe(true);
            expect(AuditService.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'ORDER_PRODUCTION_STARTED' }));
        });
    });

    describe('splitOrder', () => {
        it('should successfully split order', async () => {
            const result = await splitOrder({
                orderId: VALID_ORDER_ID,
                items: [{ itemId: VALID_ITEM_ID, quantity: '1', supplierId: VALID_SUPPLIER_ID }]
            });

            expect(result.success).toBe(true);
            expect(AuditService.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'ORDER_SPLIT_MANUAL' }));
        });
    });

    describe('requestDelivery', () => {
        it('should update status', async () => {
            const result = await requestDelivery({
                orderId: VALID_ORDER_ID,
                company: 'SF'
            });

            expect(result.success).toBe(true);
            expect(AuditService.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'ORDER_DELIVERY_REQUESTED' }));
        });
    });

    describe('updateLogistics', () => {
        it('should update logistics info', async () => {
            const result = await updateLogistics({
                orderId: VALID_ORDER_ID,
                company: 'JD',
                trackingNo: 'JD123456789'
            });

            expect(result.success).toBe(true);
            expect(AuditService.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'ORDER_LOGISTICS_UPDATED' }));
        });
    });

    describe('confirmInstallationAction', () => {
        it('should call OrderService', async () => {
            const result = await confirmInstallationAction(VALID_ORDER_ID);

            expect(result.success).toBe(true);
            expect(OrderService.confirmInstallation).toHaveBeenCalled();
            expect(AuditService.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'ORDER_INSTALLED' }));
        });
    });

    describe('customerAcceptAction', () => {
        it('should call customerAccept', async () => {
            const result = await customerAcceptAction(VALID_ORDER_ID);

            expect(result.success).toBe(true);
            expect(OrderService.customerAccept).toHaveBeenCalled();
            expect(AuditService.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'ORDER_CUSTOMER_ACCEPTED' }));
        });
    });

    describe('closeOrderAction', () => {
        it('should close order', async () => {
            const result = await closeOrderAction(VALID_ORDER_ID);

            expect(result.success).toBe(true);
            expect(AuditService.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'ORDER_CLOSED' }));
        });
    });
});
