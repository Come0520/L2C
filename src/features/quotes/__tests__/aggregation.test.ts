
/**
 * @vitest-environment node
 */
import dotenv from 'dotenv';
const dotenvResult = dotenv.config({ path: '.env' });
if (dotenvResult.error) {
    console.error('Dotenv Error:', dotenvResult.error);
}

import { vi, describe, it, expect, beforeAll } from 'vitest';

describe('Quote Bundle Aggregation', () => {
    let customerId: string;
    let leadId: string;

    // Dynamic imports
    let createQuoteBundle: (data: unknown) => Promise<{ success: boolean; data: { id: string } }>;
    let getQuoteBundleById: (id: string) => Promise<{ success: boolean; data: unknown }>;
    let createQuote: (data: unknown) => Promise<{ success: boolean; data: any }>;
    let createQuoteItem: (data: unknown) => Promise<{ success: boolean; data: any }>;
    let db: unknown;

    beforeAll(async () => {
        try {
            const dbModule = await import('@/shared/api/db');
            db = dbModule.db;

            const validUser = await db.query.users.findFirst();
            if (!validUser) throw new Error('No users found');

            // Mock auth
            vi.doMock('@/shared/lib/auth', () => ({
                checkPermission: vi.fn().mockResolvedValue(true),
                auth: vi.fn().mockResolvedValue({
                    user: { id: validUser.id, tenantId: validUser.tenantId }
                }),
            }));

            // Mock next/cache
            vi.doMock('next/cache', () => ({
                revalidatePath: vi.fn(),
                revalidateTag: vi.fn(),
            }));

            const actions = await import('../actions');
            createQuoteBundle = actions.createQuoteBundle;
            getQuoteBundleById = actions.getQuoteBundleById;
            createQuote = actions.createQuote;
            createQuoteItem = actions.createQuoteItem;

            // Get Customer
            const customer = await db.query.customers.findFirst({
                where: (c: { tenantId: string }, { eq }: { eq: (a: unknown, b: unknown) => unknown }) => eq(c.tenantId, validUser.tenantId)
            });
            if (customer) customerId = customer.id;

            // Get Lead
            const lead = await db.query.leads.findFirst({
                where: (l: { tenantId: string }, { eq }: { eq: (a: unknown, b: unknown) => unknown }) => eq(l.tenantId, validUser.tenantId)
            });
            if (lead) leadId = lead.id;

        } catch (e) {
            console.error('Setup failed', e);
            throw e;
        }
    }, 30000);

    it('should aggregate totals when adding quotes', async () => {
        if (!customerId) return;

        // 1. Create Bundle
        const bundle = await createQuoteBundle({
            customerId,
            leadId,
            summaryMode: 'BY_CATEGORY',
            remark: 'Agg Test',
        });
        const bundleId = bundle.data.id;

        // 2. Add Quote 1 (Curtain: 1000)
        const quote1 = await createQuote({
            customerId,
            leadId,
            bundleId,
            title: 'Quote 1',
        });

        if (!quote1.success || !quote1.data) {
            console.error('Create Quote 1 Failed:', quote1);
            throw new Error(`Create Quote 1 Failed: ${quote1.error}`);
        }

        const item1 = await createQuoteItem({
            quoteId: quote1.data.id,
            category: 'CURTAIN',
            productName: 'Test Curtain',
            unitPrice: 1000,
            quantity: 1,
            width: 0,
            height: 0
        });

        if (!item1.success) {
            console.error('Create Item 1 Failed:', item1);
            throw new Error(`Create Item 1 Failed: ${item1.error}`);
        }

        // Verify Bundle Total = 1000
        let b = await getQuoteBundleById({ id: bundleId });
        console.log('Bundle Check 1:', b);
        expect(Number(b.data.totalAmount)).toBe(1000);
        expect(Number(b.data.finalAmount)).toBe(1000);

        // 3. Add Quote 2 (Wallcloth: 500)
        const quote2 = await createQuote({
            customerId,
            leadId,
            bundleId,
            title: 'Quote 2',
        });

        if (!quote2.success || !quote2.data) {
            console.error('Create Quote 2 Failed:', quote2);
            throw new Error(`Create Quote 2 Failed: ${quote2.error}`);
        }

        await createQuoteItem({
            quoteId: quote2.data.id,
            category: 'WALLCLOTH',
            productName: 'Test Wallcloth',
            unitPrice: 500,
            quantity: 1,
            width: 0,
            height: 0
        });

        // Verify Bundle Total = 1500
        b = await getQuoteBundleById({ id: bundleId });
        expect(Number(b.data.totalAmount)).toBe(1500);
        expect(Number(b.data.finalAmount)).toBe(1500);
    });
});
