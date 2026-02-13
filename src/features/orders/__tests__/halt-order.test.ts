
import 'dotenv/config';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { db } from '@/shared/api/db';
import { haltOrderAction, resumeOrderAction, getHaltedOrders } from '../actions/halt';
import { orders } from '@/shared/api/schema/orders';
import { quotes } from '@/shared/api/schema/quotes';
import { customers } from '@/shared/api/schema/customers';
import { eq } from 'drizzle-orm';

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(async () => {
        const tenant = await db.query.tenants.findFirst();
        return {
            user: {
                id: 'mock-user-id',
                tenantId: tenant?.id
            }
        };
    }),
}));

describe('Order Halt Logic', () => {
    let tenantId: string;
    let userId: string;
    let customerId: string;
    let quoteId: string;

    beforeAll(async () => {
        const tenant = await db.query.tenants.findFirst();
        if (!tenant) throw new Error("No Tenant");
        tenantId = tenant.id;

        const user = await db.query.users.findFirst();
        if (!user) throw new Error("No User");
        userId = user.id;

        const customer = await db.query.customers.findFirst();
        if (!customer) throw new Error("No Customer");
        customerId = customer.id;

        // Create Quote
        const [quote] = await db.insert(quotes).values({
            tenantId,
            quoteNo: `QT-HALT-${Date.now()}`,
            customerId,
            version: 1,
            totalAmount: '1000',
            createdBy: userId,
            status: 'ACCEPTED'
        }).returning();
        quoteId = quote.id;
    });

    it('should halt and resume order correctly', async () => {
        // 1. Create Order (SIGNED)
        const [order] = await db.insert(orders).values({
            tenantId,
            orderNo: `ORD-HALT-${Date.now()}`,
            quoteId,
            quoteVersionId: quoteId,
            customerId,
            salesId: userId,
            status: 'SIGNED',
            settlementType: 'PREPAID',
            createdBy: userId
        }).returning();

        // 2. Halt Order
        const haltResult = await haltOrderAction({
            orderId: order.id,
            reason: 'CUSTOMER_REQUEST',
            remark: 'Test Halt'
        });

        expect(haltResult.success).toBe(true);
        const haltedOrder = await db.query.orders.findFirst({
            where: eq(orders.id, order.id)
        });
        expect(haltedOrder?.status).toBe('HALTED');

        // 3. Verify in Halted List
        const listResult = await getHaltedOrders();
        expect(listResult.success).toBe(true);
        const inList = listResult.data.find(o => o.id === order.id);
        expect(inList).toBeDefined();
        expect(inList?.alertLevel).toBe('NONE'); // Just halted

        // 4. Resume Order
        const resumeResult = await resumeOrderAction({
            orderId: order.id,
            remark: 'Resuming'
        });
        expect(resumeResult.success).toBe(true);

        const resumedOrder = await db.query.orders.findFirst({
            where: eq(orders.id, order.id)
        });
        expect(resumedOrder?.status).toBe('SIGNED');
    });

    it('should trigger warning if halted for long time', async () => {
        // 1. Create Order (HALTED manually to simulate time)
        const eightDaysAgo = new Date();
        eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

        const [order] = await db.insert(orders).values({
            tenantId,
            orderNo: `ORD-WARN-${Date.now()}`,
            quoteId,
            quoteVersionId: quoteId,
            customerId,
            salesId: userId,
            status: 'HALTED', // Manual
            pausedAt: eightDaysAgo,
            settlementType: 'PREPAID',
            createdBy: userId
        }).returning();

        // 2. Check List
        const listResult = await getHaltedOrders();
        const inList = listResult.data.find(o => o.id === order.id);

        expect(inList).toBeDefined();
        expect(inList?.alertLevel).toBe('WARNING');
        expect(inList?.daysHalted).toBeGreaterThanOrEqual(8);
    });
});
