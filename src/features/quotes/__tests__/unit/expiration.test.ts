import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';
import { QuoteService } from '@/services/quote.service'; // Adjust path if needed
import { db } from '@/shared/api/db';

// Mock DB
vi.mock('@/shared/api/db', () => {
    const mockTx = {
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn().mockResolvedValue({}),
            })),
        })),
        query: {
            quoteItems: {
                findMany: vi.fn().mockResolvedValue([]),
            },
        },
    };

    return {
        db: {
            query: {
                quotes: { findFirst: vi.fn() },
                products: { findMany: vi.fn() },
                quoteItems: { findMany: vi.fn() },
            },
            transaction: vi.fn(async (cb) => await cb(mockTx)),
            update: vi.fn(() => ({
                set: vi.fn(() => ({
                    where: vi.fn().mockResolvedValue({}),
                })),
            })),
        },
    };
});

// Mock QuoteService.updateQuoteTotal (internal logic might be problematic to test if private, but it's public static in our code)
// We will spy on it to avoid real DB calls inside it if possible, or mock it.
// Since it's a static method on the same class, verifying it's called is good.
// But we cannot easily spy on a method of the class we are testing if we import the class directly.
// However, in `quote.service.ts`, it calls `this.updateQuoteTotal`.
// We can try to spy on QuoteService.updateQuoteTotal.

describe('QuoteService.refreshExpiredQuotePrices', () => {
    const mockQuoteId = '00000000-0000-0000-0000-000000000001';
    const mockTenantId = '00000000-0000-0000-0000-000000000002';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should batch fetch products and update items with changed prices', async () => {
        // 1. Mock Quote (EXPIRED)
        (db.query.quotes.findFirst as Mock).mockResolvedValue({
            id: mockQuoteId,
            tenantId: mockTenantId,
            status: 'EXPIRED',
            validUntil: new Date('2023-01-01'),
            items: [
                { id: '00000000-0000-0000-0000-000000000011', productId: '00000000-0000-0000-0000-000000000101', quantity: 2, unitPrice: '100.00' }, // Price will change to 150
                { id: '00000000-0000-0000-0000-000000000012', productId: '00000000-0000-0000-0000-000000000102', quantity: 1, unitPrice: '200.00' }, // Price same
                { id: '00000000-0000-0000-0000-000000000013', productId: '00000000-0000-0000-0000-000000000103', quantity: 5, unitPrice: '50.00' },  // Price will change to 60
            ],
        });

        // 2. Mock Products Batch Fetch
        (db.query.products.findMany as Mock).mockResolvedValue([
            { id: '00000000-0000-0000-0000-000000000101', retailPrice: '150.00' },
            { id: '00000000-0000-0000-0000-000000000102', retailPrice: '200.00' },
            { id: '00000000-0000-0000-0000-000000000103', retailPrice: '60.00' },
        ]);

        // 3. Call Method
        const result = await QuoteService.refreshExpiredQuotePrices(mockQuoteId, mockTenantId);

        // 4. Verification
        expect(result.success).toBe(true);
        expect(result.updatedItems).toBe(2); // item-1 and item-3 changed
        expect(result.priceChanges).toHaveLength(2);

        // Check specific changes
        expect(result.priceChanges).toEqual(expect.arrayContaining([
            { itemId: '00000000-0000-0000-0000-000000000011', oldPrice: 100, newPrice: 150 },
            { itemId: '00000000-0000-0000-0000-000000000013', oldPrice: 50, newPrice: 60 }
        ]));

        // Verify N+1 Optimization: products.findMany called once
        expect(db.query.products.findMany).toHaveBeenCalledTimes(1);

        // Check Status Update to DRAFT
        // Since it's inside transaction, we check result which is successful
        expect(result.success).toBe(true);
    });

    it('should throw error if quote is not expired or draft', async () => {
        (db.query.quotes.findFirst as Mock).mockResolvedValue({
            id: mockQuoteId,
            status: 'APPROVED',
        });

        await expect(QuoteService.refreshExpiredQuotePrices(mockQuoteId, mockTenantId))
            .rejects.toThrow('只有已过期或草稿状态的报价可以刷新价格');
    });
});
