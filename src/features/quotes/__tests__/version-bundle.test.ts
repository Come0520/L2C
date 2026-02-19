/**
 * @vitest-environment node
 */
import dotenv from 'dotenv';
const dotenvResult = dotenv.config({ path: '.env' });
if (dotenvResult.error) {
    console.error('Dotenv Error:', dotenvResult.error);
}

import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

describe('Version Management with Bundles', () => {
    let db: typeof import('@/shared/api/db').db;
    let quotes: typeof import('@/shared/api/schema/quotes').quotes;
    let QuoteService: typeof import('@/services/quote.service').QuoteService;
    let eq: typeof import('drizzle-orm').eq;

    let bundleId: string;
    let subQuoteId: string;
    let mockUser: { id: string; tenantId: string; role: string };
    let customerId: string;

    beforeAll(async () => {
        const dbModule = await import('@/shared/api/db');
        db = dbModule.db;
        const quotesModule = await import('@/shared/api/schema/quotes');
        quotes = quotesModule.quotes;
        const serviceModule = await import('@/services/quote.service');
        QuoteService = serviceModule.QuoteService;
        const ormModule = await import('drizzle-orm');
        eq = ormModule.eq;

        // Fetch a valid User/Tenant
        const validUser = await db.query.users.findFirst();
        if (!validUser) {
            throw new Error('No users found in DB. Seed DB first.');
        }
        mockUser = {
            id: validUser.id,
            tenantId: validUser.tenantId,
            role: 'SALES',
        };

        // Fetch a valid Customer
        const customer = await db.query.customers.findFirst({
            where: (c, { eq }) => eq(c.tenantId, validUser.tenantId)
        });
        if (!customer) {
            throw new Error('No customers found in DB for this tenant.');
        }
        customerId = customer.id;
    });

    beforeEach(async () => {
        // 1. Create a Bundle
        const [bundle] = await db.insert(quotes).values({
            tenantId: mockUser.tenantId,
            quoteNo: `B-${Date.now().toString().slice(-6)}`,
            version: 1,
            totalAmount: '200',
            finalAmount: '200',
            discountAmount: '0',
            status: 'DRAFT',
            isActive: true,
            isBundle: true,
            createdBy: mockUser.id,
            customerId: customerId,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();
        bundleId = bundle.id;

        // 2. Create a Sub-Quote linked to Bundle
        const [subQuote] = await db.insert(quotes).values({
            tenantId: mockUser.tenantId,
            quoteNo: `S-${Date.now().toString().slice(-6)}`,
            version: 1,
            totalAmount: '100',
            finalAmount: '100',
            discountAmount: '0',
            status: 'DRAFT',
            isActive: true,
            isBundle: false,
            bundleId: bundleId, // Link to bundle
            customerId: customerId,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: mockUser.id,
            rootQuoteId: null
        }).returning();

        // Manually update rootQuoteId to itself (simulating creating first version)
        await db.update(quotes).set({ rootQuoteId: subQuote.id }).where(eq(quotes.id, subQuote.id));

        subQuoteId = subQuote.id;
    });

    it('should maintain bundleId when creating a new version', async () => {
        // Create next version of sub-quote
        const newVersion = await QuoteService.createNextVersion(subQuoteId, mockUser.id, mockUser.tenantId);

        expect(newVersion).toBeDefined();
        expect(newVersion.version).toBe(2);

        // This expectation should now pass
        expect(newVersion.bundleId).toBe(bundleId);

        // Verify old version is inactive
        const oldQuote = await db.query.quotes.findFirst({
            where: eq(quotes.id, subQuoteId)
        });
        expect(oldQuote?.isActive).toBe(false);
    });
});
