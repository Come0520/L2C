
/**
 * @vitest-environment node
 */
import dotenv from 'dotenv';
const dotenvResult = dotenv.config({ path: '.env' });
if (dotenvResult.error) {
    console.error('Dotenv Error:', dotenvResult.error);
}

import { vi, describe, it, expect, beforeAll } from 'vitest';

describe('Quote Bundle Flow', () => {
    let customerId: string;
    let leadId: string;

    // Dynamic imports
    let createQuoteBundle: typeof import('../actions').createQuoteBundle;
    let getQuoteBundleById: typeof import('../actions').getQuoteBundleById;
    let createQuote: typeof import('../actions').createQuote;
    let db: typeof import('@/shared/api/db').db;

    beforeAll(async () => {
        console.log('Starting beforeAll...');
        try {
            // 1. Initialize DB first
            console.log('Importing DB...');
            const dbModule = await import('@/shared/api/db');
            db = dbModule.db;

            // 2. Fetch a valid User to mock session
            console.log('Querying valid user...');
            const validUser = await db.query.users.findFirst();
            if (!validUser) {
                throw new Error('No users found in DB. Cannot mock session.');
            }
            console.log('Using valid user:', validUser.id, validUser.tenantId);

            // 3. Mock auth with real user
            vi.doMock('@/shared/lib/auth', () => ({
                checkPermission: vi.fn().mockResolvedValue(true),
                auth: vi.fn().mockResolvedValue({
                    user: {
                        id: validUser.id,
                        tenantId: validUser.tenantId
                    }
                }),
            }));

            // 4. Mock next/cache
            vi.doMock('next/cache', () => ({
                revalidatePath: vi.fn(),
                revalidateTag: vi.fn(),
            }));

            // 5. Load actions (they will use the mocked auth)
            console.log('Importing actions...');
            const actions = await import('../actions');
            createQuoteBundle = actions.createQuoteBundle;
            getQuoteBundleById = actions.getQuoteBundleById;
            createQuote = actions.createQuote;

            // 6. Get Customer and Lead
            const customer = await db.query.customers.findFirst({
                where: (c: typeof import('@/shared/api/schema').customers, { eq }: { eq: typeof import('drizzle-orm').eq }) => eq(c.tenantId, validUser.tenantId)
            });
            if (customer) {
                customerId = customer.id;
            } else {
                // Try any customer if tenant match fails (for loose testing)
                const anyCustomer = await db.query.customers.findFirst();
                customerId = anyCustomer?.id;
            }
            console.log('Customer found:', customerId);

            const lead = await db.query.leads.findFirst({
                where: (l: typeof import('@/shared/api/schema').leads, { eq }: { eq: typeof import('drizzle-orm').eq }) => eq(l.tenantId, validUser.tenantId)
            });
            if (lead) leadId = lead.id;
            console.log('Lead found:', leadId);

        } catch (e) {
            console.error('beforeAll FAILED:', e);
            throw e;
        }
    });

    it('should create a quote bundle', async () => {
        if (!customerId) throw new Error('No customer found');

        const result = await createQuoteBundle({
            customerId,
            leadId,
            summaryMode: 'BY_CATEGORY',
            remark: 'Test Bundle Real User',
        });

        if (!result.success) {
            console.error('!!! ERROR DETAIL:', JSON.stringify(result, null, 2));
        }
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        const bundleId = result.data?.id;

        // Verify bundle exists
        const bundleRes = await getQuoteBundleById({ id: bundleId! });
        expect(bundleRes.success).toBe(true);
        expect(bundleRes.data?.bundleNo).toBeDefined();

        // Create a Linked Quote (Curtain)
        const quoteRes = await createQuote({
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
            remark: 'Curtain Quote in Bundle'
        });

        if (!quoteRes.success) {
            console.error('!!! QUOTE ERROR DETAIL:', JSON.stringify(quoteRes, null, 2));
        }
        expect(quoteRes.success).toBe(true);

        // Verify linkage
        const bundleCheck = await getQuoteBundleById({ id: bundleId! });
        expect(bundleCheck.data?.quotes).toHaveLength(1);
        expect(bundleCheck.data?.quotes[0].category).toBe('CURTAIN');
        console.log('Verification Success!');
    });
});
