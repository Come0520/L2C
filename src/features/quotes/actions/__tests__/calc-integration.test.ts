
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recalculateQuote } from '../calc-actions';

const mocks = vi.hoisted(() => {
    return {
        db: {
            query: {
                quotes: {
                    findFirst: vi.fn()
                }
            },
            update: vi.fn(() => ({
                set: vi.fn(() => ({
                    where: vi.fn(() => Promise.resolve())
                }))
            }))
        }
    };
});

vi.mock('@/shared/api/db', () => ({
    db: mocks.db
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

describe('Calculation Engine Integration (recalculateQuote)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should calculate Curtain quantity and update DB', async () => {
        // Setup: Quote with 1 Curtain Item
        const mockItem = {
            id: 'item-1',
            width: '300', // 300 cm
            height: '270', // 270 cm
            unitPrice: '100',
            category: 'CURTAIN',
            attributes: {
                foldRatio: 2.0,
                fabricWidth: 2.8, // meters
                fabricType: 'FIXED_HEIGHT'
            }
        };

        const mockQuote = {
            id: 'quote-1',
            discountRate: '0.9', // 90% discount
            items: [mockItem]
        };

        // Mock DB Response
        mocks.db.query.quotes.findFirst.mockResolvedValue(mockQuote);

        // Mock Update Chain capture
        const updateSetSpy = vi.fn().mockReturnValue({ where: vi.fn() });
        mocks.db.update.mockReturnValue({ set: updateSetSpy });

        // Execute
        const result = await recalculateQuote('quote-1');

        // Assert
        expect(result.success).toBe(true);
        expect(mocks.db.query.quotes.findFirst).toHaveBeenCalled();

        // Check Item Update
        const itemUpdateCalls = updateSetSpy.mock.calls;

        const itemUpdate = itemUpdateCalls.find(call => call[0].quantity);
        expect(itemUpdate).toBeDefined();
        if (itemUpdate) {
            expect(itemUpdate[0].quantity).toBe('6.1');
            expect(itemUpdate[0].subtotal).toBe('610');
            expect(itemUpdate[0].attributes.calcResult.warning).toBeDefined();
        }

        // Check Quote Update
        const quoteUpdate = itemUpdateCalls.find(call => call[0].totalAmount);
        expect(quoteUpdate).toBeDefined();
        if (quoteUpdate) {
            expect(quoteUpdate[0].totalAmount).toBe('610'); // Sum of subtotals
            expect(quoteUpdate[0].finalAmount).toBe('549'); // 610 * 0.9 = 549
        }
    });

    it('should calculate Wallcloth usage (Perimeter) and update DB', async () => {
        const mockItem = {
            id: 'item-2',
            width: '400',  // 400 cm
            height: '260', // 260 cm
            unitPrice: '50',
            category: 'WALLCLOTH',
            attributes: {
                calcType: 'WALLCLOTH',
                fabricWidth: 2.8,
                widthLoss: 20,
                heightLoss: 10
            }
        };

        const mockQuote = {
            id: 'quote-2',
            discountRate: '1.0',
            items: [mockItem]
        };

        mocks.db.query.quotes.findFirst.mockResolvedValue(mockQuote);
        const updateSetSpy = vi.fn().mockReturnValue({ where: vi.fn() });
        mocks.db.update.mockReturnValue({ set: updateSetSpy });

        await recalculateQuote('quote-2');

        const itemUpdate = updateSetSpy.mock.calls.find(call => call[0].quantity);
        expect(itemUpdate).toBeDefined();
        if (itemUpdate) {
            expect(itemUpdate[0].quantity).toBe('4.2');
            expect(itemUpdate[0].subtotal).toBe('210');
        }
    });
});
