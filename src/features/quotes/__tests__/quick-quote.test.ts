
/**
 * Quick Quote Server Actions Test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted for mocks referenced in factory
const { mockDbQuery, mockDbInsert, mockDbUpdate, mockSession } = vi.hoisted(() => {
    const mockDbQuery = {
        leads: { findFirst: vi.fn() },
        customers: { findFirst: vi.fn() },
        quotes: { findFirst: vi.fn() },
    };

    // Mock insert().values().returning()
    const mockDbInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
            onConflictDoUpdate: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'new-customer-id', success: true }]) // Default success
            }),
            returning: vi.fn().mockResolvedValue([{ id: 'new-quote-id', quoteNo: 'QQ-TEST' }])
        })
    });

    const mockDbUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(true)
        })
    });

    const mockSession = {
        user: {
            id: 'test-user-id',
            tenantId: 'test-tenant-id', // Match db calls
        }
    };

    return { mockDbQuery, mockDbInsert, mockDbUpdate, mockSession };
});

// Mock modules
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue(mockSession),
    checkPermission: vi.fn() // Add this
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: mockDbQuery,
        insert: mockDbInsert,
        update: mockDbUpdate,
        // Mock transaction to just execute the callback
        transaction: vi.fn(async (cb) => await cb({
            query: mockDbQuery,
            insert: mockDbInsert,
            update: mockDbUpdate,
            // Nested transaction support if needed
            transaction: vi.fn(async (nestedCb) => await nestedCb(null))
        }))
    }
}));

// Mock schema imports (return strings/objects as needed by logic)
vi.mock('@/shared/api/schema', () => ({
    quotes: { id: 'quotes.id', quoteNo: 'quotes.quoteNo', tenantId: 'quotes.tenantId' },
    quoteItems: { id: 'quoteItems.id', quoteId: 'quoteItems.quoteId', sortOrder: 'quoteItems.sortOrder' },
    rooms: { id: 'rooms.id', quoteId: 'rooms.quoteId', sortOrder: 'rooms.sortOrder' },
    leads: { id: 'leads.id', customerId: 'leads.customerId', tenantId: 'leads.tenantId' },
    customers: { id: 'customers.id', phone: 'customers.phone', tenantId: 'customers.tenantId' },
    users: { id: 'users.id' },
}));

// Mock preset plans library to avoid imports
vi.mock('../quick-quote/lib/preset-plans', () => ({
    PlanType: { COMFORT: 'COMFORT' },
    QUOTE_PLANS: {
        COMFORT: {
            id: 'COMFORT',
            products: {
                fabric: { unitPrice: 100 },
                sheer: { unitPrice: 50 },
                track: { unitPrice: 50 },
                valance: { unitPrice: 30 }
            }
        }
    }
}));

// Mock Plan Loader
vi.mock('../lib/plan-loader', () => ({
    fetchQuotePlans: vi.fn().mockResolvedValue({
        COMFORT: {
            id: 'COMFORT',
            name: 'Comfort',
            products: {
                fabric: { category: 'CURTAIN_FABRIC', name: 'Fabric', unitPrice: 100, width: 2.8 },
                sheer: { category: 'CURTAIN_SHEER', name: 'Sheer', unitPrice: 50, width: 2.8 },
                track: { category: 'CURTAIN_TRACK', name: 'Track', unitPrice: 50 },
                valance: { category: 'CURTAIN_ACCESSORY', name: 'Valance', unitPrice: 30 },
            }
        }
    }),
    fetchQuoteGlobals: vi.fn().mockResolvedValue({
        defaultFoldRatioFabric: 2.0,
        defaultFoldRatioSheer: 2.0,
        defaultInstallationFeePerMeter: 10
    })
}));

// Mock OpenAI
vi.mock('openai', () => {
    return {
        default: vi.fn(),
    };
});

// Import what we are testing
// Mock server-only to prevent error in jsdom
vi.mock('server-only', () => ({}));

import { createQuickQuote } from '../actions';


describe('createQuickQuote', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create customer if not exists and generate quote', async () => {
        // Setup Mocks
        // 1. getLeadById -> finds lead
        // We need to mock the import of getLeadById inside the action OR mock the module if it's external.
        // The action uses `await import('@/features/leads/actions')`.
        // Vitest might not capture dynamic imports easily unless we mock the module globally.
        // Let's rely on global module mocking for features/leads/actions
    });
});

// We need to mock the Dynamic Imports for 'leads/actions' and 'customers/actions'
vi.mock('@/features/leads/actions', () => ({
    getLeadById: vi.fn().mockResolvedValue({
        id: 'lead-1',
        leadNo: 'L001',
        customerName: 'Test Customer',
        customerPhone: '13800000000',
        customerWechat: 'wx_123'
    })
}));

vi.mock('@/features/customers/actions', () => ({
    createCustomer: vi.fn().mockResolvedValue({
        success: true,
        id: 'created-customer-id'
    })
}));

describe('verify createQuickQuote logic', () => {

    it('should create quick quote successfully', async () => {

        // Mock findFirst for lead check
        mockDbQuery.leads.findFirst.mockResolvedValue({
            id: 'lead-1',
            leadNo: 'L001',
            customerName: 'Test Customer',
            customerPhone: '13800000000'
        });

        const result = await createQuickQuote({
            leadId: 'lead-1',
            planType: 'COMFORT',
            rooms: [
                {
                    name: 'Room1',
                    width: 3.0,
                    height: 2.8,
                    hasSheer: true,
                    hasBox: false,
                    windowType: 'STRAIGHT',
                    hasFabric: true
                },
            ]
        });

        expect(result.success).toBe(true);
        expect(result.data?.id).toBe('new-quote-id');
        expect(mockDbUpdate).toHaveBeenCalled();
    });
});
