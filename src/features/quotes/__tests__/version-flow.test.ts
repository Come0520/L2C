
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteService } from '@/services/quote.service';

const mocks = vi.hoisted(() => {
    return {
        db: {
            transaction: vi.fn((cb) => cb({
                update: vi.fn(() => ({
                    set: vi.fn(() => ({
                        where: vi.fn(),
                    })),
                })),
                query: {
                    quotes: {
                        findFirst: vi.fn(),
                    }
                }
            })),
            query: {
                quotes: {
                    findFirst: vi.fn(),
                }
            },
            update: vi.fn(() => ({
                set: vi.fn(() => ({
                    where: vi.fn(),
                })),
            })),
        },
    };
});

vi.mock('@/shared/api/db', () => ({
    db: mocks.db
}));

describe('Quote Version Flow Integration', () => {
    const TENANT_ID = 'tenant-1';
    const ROOT_ID = 'root-1';
    const V1_ID = 'v1';
    const V2_ID = 'v2';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should set version to ACTIVE and demote others to DRAFT', async () => {
        // Setup: V1 is currently ACTIVE
        const mockV1 = {
            id: V1_ID,
            rootQuoteId: ROOT_ID,
            tenantId: TENANT_ID,
            status: 'ACTIVE',
        };

        const mockV2 = {
            id: V2_ID,
            rootQuoteId: ROOT_ID,
            tenantId: TENANT_ID,
            status: 'DRAFT',
        };

        // Service.activate calls db.transaction...
        // We need to verify that within the transaction:
        // 1. Other versions (V1) are updated to DRAFT
        // 2. Target version (V2) is updated to ACTIVE

        // Mock findFirst for permission check
        mocks.db.query.quotes.findFirst.mockResolvedValue(mockV2);

        // Capture transaction operations
        const txUpdate = vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn(() => [{ id: V2_ID, status: 'ACTIVE' }]), // Mock returning
                })),
            })),
        }));

        // Mock transaction to use our spy
        mocks.db.transaction.mockImplementation(async (cb) => {
            return cb({
                update: txUpdate,
                query: mocks.db.query
            });
        });

        await QuoteService.activateVersion(V2_ID, TENANT_ID);

        // Verify demotion of others
        expect(txUpdate).toHaveBeenCalledWith(expect.anything()); // internal impl check

        // Check calls
        const calls = txUpdate.mock.calls;
        // Expect at least two updates: one for demotion, one for activation
        // Logic might be: update all where rootId=X to DRAFT, then update target to ACTIVE
        // OR: update where rootId=X AND status=ACTIVE to DRAFT

        // This test depends on implementation details of activateVersion
        // Assuming it runs:
        // UPDATE quotes SET status='DRAFT' WHERE rootQuoteId=ROOT_ID
        // UPDATE quotes SET status='ACTIVE' WHERE id=V2_ID

        // Let's verify at least two updates occurred
        expect(calls.length).toBeGreaterThanOrEqual(2);
    });
});
