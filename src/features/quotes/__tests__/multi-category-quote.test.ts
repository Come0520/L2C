
/**
 * @vitest-environment node
 */
import dotenv from 'dotenv';
const dotenvResult = dotenv.config({ path: '.env' });
import { logger } from '@/shared/lib/logger';

if (dotenvResult.error) {
    logger.error('Dotenv Error:', { error: dotenvResult.error });
}

import { vi, describe, it, expect, beforeAll } from 'vitest';

describe.skip('Multi-Category Quoting', () => {
    let customerId: string;
    let leadId: string;

    // Dynamic imports
    let createQuote: typeof import('../actions').createQuote;
    let createQuoteItem: typeof import('../actions').createQuoteItem;
    let getQuote: typeof import('../actions').getQuote;
    let db: typeof import('@/shared/api/db').db;

    beforeAll(async () => {
        logger.info('Starting beforeAll for Multi-Category Test...');
        try {
            // 1. Initialize DB
            const dbModule = await import('@/shared/api/db');
            db = dbModule.db;

            // 2. Fetch a valid User
            const validUser = await db.query.users.findFirst();
            if (!validUser) {
                throw new Error('No users found in DB.');
            }

            // 3. Mock auth
            vi.doMock('@/shared/lib/auth', () => ({
                checkPermission: vi.fn().mockResolvedValue(true),
                auth: vi.fn().mockResolvedValue({
                    user: {
                        id: validUser.id,
                        tenantId: validUser.tenantId
                    }
                }),
            }));

            // 4. Mock revalidatePath
            vi.doMock('next/cache', () => ({
                revalidatePath: vi.fn(),
                revalidateTag: vi.fn(),
            }));

            // 5. Load actions
            const actions = await import('../actions');
            createQuote = actions.createQuote;
            createQuoteItem = actions.createQuoteItem;
            getQuote = actions.getQuote;

            // 6. Get Customer and Lead
            const customer = await db.query.customers.findFirst({
                where: (c, { eq }) => eq(c.tenantId, validUser.tenantId)
            });
            customerId = customer?.id || '';

            const lead = await db.query.leads.findFirst({
                where: (l, { eq }) => eq(l.tenantId, validUser.tenantId)
            });
            leadId = lead?.id || '';

            if (!customerId) throw new Error('Test requires a customer');

        } catch (e) {
            logger.error('beforeAll FAILED:', { error: e });
            throw e;
        }
    });

    it('should allow adding items of different categories to the same quote', async () => {
        // 1. Create Quote
        const quoteRes = await createQuote({
            customerId,
            leadId,
            title: 'Mixed Category Quote',
            notes: 'Testing mixed items'
        });
        expect(quoteRes.success).toBe(true);
        const quoteId = quoteRes.data!.id;

        // 2. Add Curtain Item
        const curtainRes = await createQuoteItem({
            quoteId,
            category: 'CURTAIN',
            productName: 'Test Curtain',
            unitPrice: 100,
            quantity: 1,
            width: 300,
            height: 250,
            attributes: {
                formula: 'FIXED_HEIGHT',
                fabricWidth: 280
            }
        });
        expect(curtainRes.success).toBe(true);

        // 3. Add Wallpaper Item
        const wallpaperRes = await createQuoteItem({
            quoteId,
            category: 'WALLPAPER',
            productName: 'Test Wallpaper',
            unitPrice: 50,
            quantity: 2, // 2 rolls
            width: 300,
            height: 250, // Wall dimensions
            attributes: {
                formula: 'WALLPAPER',
                rollLength: 1000,
                fabricWidth: 53 // 53cm width
            }
        });
        // Note: Calculations might adjust quantity based on dimensions.
        expect(wallpaperRes.success).toBe(true);

        // 4. Add Generic Accessory (Other Category)
        const accessoryRes = await createQuoteItem({
            quoteId,
            category: 'ACCESSORY',
            productName: 'Generic Hook',
            unitPrice: 10,
            quantity: 5
        });
        expect(accessoryRes.success).toBe(true);

        // 5. Verify Quote Contents
        const quoteCheck = await getQuote(quoteId);
        expect(quoteCheck.data).toBeDefined();

        const items = quoteCheck.data?.items; // Assuming items are flattened or need to check rooms?
        // getQuote returns items that are NOT in a room in `items` array.
        // Also checks `rooms.items`.
        // We added items without roomId, so they should be in `items`.

        expect(items).toBeDefined();
        expect(items?.length).toBeGreaterThanOrEqual(3);

        const hasCurtain = items?.some(i => i.category === 'CURTAIN');
        const hasWallpaper = items?.some(i => i.category === 'WALLPAPER');
        const hasAccessory = items?.some(i => i.category === 'ACCESSORY');

        expect(hasCurtain).toBe(true);
        expect(hasWallpaper).toBe(true);
        expect(hasAccessory).toBe(true);

        logger.info('Mixed Category Quote Items verified.');
    }, 20000);
});
