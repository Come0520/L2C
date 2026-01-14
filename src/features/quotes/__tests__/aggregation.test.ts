
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
    let createQuote: (data: unknown) => Promise<{ success: boolean; data: unknown }>;
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
    });

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
        await createQuote({
            customerId,
            leadId,
            bundleId,
            category: 'CURTAIN',
            totalAmount: 1000,
            discountAmount: 0,
            finalAmount: 1000,
            measurementFee: 0,
            installationFee: 0,
            freightFee: 0,
        });

        // Verify Bundle Total = 1000
        let b = await getQuoteBundleById({ id: bundleId });
        expect(Number(b.data.totalAmount)).toBe(1000);
        expect(Number(b.data.finalAmount)).toBe(1000);

        // 3. Add Quote 2 (Wallcloth: 500)
        await createQuote({
            customerId,
            leadId,
            bundleId,
            category: 'WALLCLOTH',
            totalAmount: 500,
            discountAmount: 0,
            finalAmount: 500,
            measurementFee: 0,
            installationFee: 0,
            freightFee: 0,
        });

        // Verify Bundle Total = 1500
        b = await getQuoteBundleById({ id: bundleId });
        expect(Number(b.data.totalAmount)).toBe(1500);
        expect(Number(b.data.finalAmount)).toBe(1500);
    });
});
