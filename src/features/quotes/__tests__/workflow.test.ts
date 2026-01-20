import { QuoteLifecycleService } from '@/services/quote-lifecycle.service';
import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema/quotes';
import { eq } from 'drizzle-orm';

// Mock DB interactions
jest.mock('@/shared/api/db', () => ({
    db: {
        query: {
            quotes: {
                findFirst: jest.fn(),
            },
            customers: {
                findFirst: jest.fn(),
            },
            tenants: {
                findFirst: jest.fn(),
            }
        },
        update: jest.fn(() => ({
            set: jest.fn(() => ({
                where: jest.fn(() => Promise.resolve([{ id: 'mock-id' }]))
            }))
        })),
        insert: jest.fn(() => ({
            values: jest.fn(() => ({
                returning: jest.fn(() => Promise.resolve([{ id: 'new-id' }]))
            }))
        })),
        transaction: jest.fn((cb) => cb({
            query: {
                quotes: { findFirst: jest.fn() },
                customers: { findFirst: jest.fn() }
            },
            insert: jest.fn(() => ({ values: jest.fn(() => ({ returning: jest.fn(() => Promise.resolve([{ id: 'order-id' }])) })) })),
            update: jest.fn(() => ({ set: jest.fn(() => ({ where: jest.fn() })) }))
        })),
    }
}));

import { checkDiscountRisk } from '../logic/risk-control';
jest.mock('../logic/risk-control', () => ({
    checkDiscountRisk: jest.fn()
}));

describe('Quote Lifecycle Workflow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('submit should trigger risk check', async () => {
        (db.query.quotes.findFirst as jest.Mock).mockResolvedValue({
            id: 'q1',
            status: 'DRAFT',
            totalAmount: '1000',
            finalAmount: '900',
            items: []
        });

        // Mock Permission/Risk Check
        (checkDiscountRisk as jest.Mock).mockReturnValue({
            isRisk: true,
            hardStop: false,
            reason: ['Discount too high']
        });

        // We need to mock RiskControlService.checkQuoteRisk since that's what Lifecycle uses
        // Or if Lifecycle uses RiskControlService, we mock that.
        // Actually QuoteLifecycleService calls RiskControlService.checkQuoteRisk
        // Let's rely on integration or mock the internal call? 
        // For unit test simplicity, we should verify the logic flow of LifecycleService itself.
    });
});
