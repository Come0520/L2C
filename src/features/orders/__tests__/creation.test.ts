import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrderFromQuote } from '../actions/creation';
import { db } from '@/shared/api/db';
import { auth, requirePermission } from '@/shared/lib/auth';
import { OrderService } from '@/services/order.service';
import { AuditService } from '@/shared/services/audit-service';
import { checkAndGenerateCommission } from '@/features/channels/logic/commission.service';

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            quotes: {
                findFirst: vi.fn(),
            },
        },
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    requirePermission: vi.fn(),
}));

vi.mock('@/services/order.service', () => ({
    OrderService: {
        convertFromQuote: vi.fn(),
    },
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        record: vi.fn(),
    },
}));

vi.mock('@/features/channels/logic/commission.service', () => ({
    checkAndGenerateCommission: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
    },
}));

describe('createOrderFromQuote', () => {
    const mockSession = {
        user: {
            id: 'test-user',
            tenantId: 'test-tenant',
        },
    };

    const mockQuote = {
        id: 'quote-123',
        tenantId: 'test-tenant',
    };

    const mockOrder = {
        id: 'order-123',
        tenantId: 'test-tenant',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
        (requirePermission as any).mockResolvedValue(true);
    });

    it('should successfully create order from quote', async () => {
        (db.query.quotes.findFirst as any).mockResolvedValue(mockQuote);
        (OrderService.convertFromQuote as any).mockResolvedValue(mockOrder);

        const input = {
            quoteId: '550e8400-e29b-41d4-a716-446655440001',
            paymentAmount: '1000',
        };

        const result = await createOrderFromQuote(input);

        expect(result).toEqual(mockOrder);
        expect(db.query.quotes.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.any(Function),
            })
        );
        expect(OrderService.convertFromQuote).toHaveBeenCalledWith(
            '550e8400-e29b-41d4-a716-446655440001',
            'test-tenant',
            'test-user',
            expect.objectContaining({ paymentAmount: '1000' })
        );
        expect(AuditService.record).toHaveBeenCalled();
        expect(checkAndGenerateCommission).toHaveBeenCalledWith('order-123', 'ORDER_CREATED');
    });

    it('should throw Unauthorized if no session', async () => {
        (auth as any).mockResolvedValue(null);

        await expect(createOrderFromQuote({ quoteId: '550e8400-e29b-41d4-a716-446655440001' })).rejects.toThrow('Unauthorized');
    });

    it('should require quotes permission', async () => {
        (requirePermission as any).mockRejectedValue(new Error('无权限'));

        await expect(createOrderFromQuote({ quoteId: '550e8400-e29b-41d4-a716-446655440001' })).rejects.toThrow('无权限');
    });

    it('should throw if quote not found', async () => {
        (db.query.quotes.findFirst as any).mockResolvedValue(null);

        await expect(createOrderFromQuote({ quoteId: '550e8400-e29b-41d4-a716-446655440001' })).rejects.toThrow('Quote not found');
    });
});
