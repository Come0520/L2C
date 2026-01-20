
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/shared/api/db';
import { orders, installTasks, quotes, users, customers, quoteItems, tenants, products } from '@/shared/api/schema';
import { shipOrder } from '@/features/orders/actions';
import { dispatchInstallTask, submitInstallCompletion, confirmInstallation } from '@/features/service/installation/actions';
import { eq, sql } from 'drizzle-orm';

// Mocks
vi.mock('@/shared/lib/auth', () => ({
    checkPermission: vi.fn(),
    auth: vi.fn().mockResolvedValue({
        user: { id: 'test-user-id', tenantId: 'test-tenant-id', name: 'Test User' }
    })
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

describe('Installation Flow Integration', () => {
    const tenantId = 'test-tenant-id';
    const userId = 'test-user-id';
    let orderId: string;
    let quoteId: string;
    let customerId: string;

    beforeEach(async () => {
        try {
            console.log('DEBUG: db:', db);
            console.log('DEBUG: installTasks:', installTasks);
            console.log('DEBUG: db.delete defined?', typeof db.delete);
            // Cleanup
            await db.execute(sql`DELETE FROM ${installTasks} WHERE ${installTasks.tenantId} = ${tenantId}`);
            await db.execute(sql`DELETE FROM ${orders} WHERE ${orders.tenantId} = ${tenantId}`);
            // Note: quoteItems has no tenantId. We rely on unique SKU/Nos.

            // 1. Create Tenant & User & Customer & Quote (Fixtures)
            await db.insert(tenants).values({ id: tenantId, name: 'Test Tenant', code: 'TEST' }).onConflictDoNothing();
            await db.insert(users).values({ id: userId, tenantId, name: 'Test User', phone: '1234567890', email: 'test@example.com' }).onConflictDoNothing();

            const [customer] = await db.insert(customers).values({
                tenantId,
                name: 'Test Customer',
                phone: '13800138000',
                customerNo: `CUST-${Date.now()}`,
                createdBy: userId
            }).returning();
            customerId = customer.id;

            const [quote] = await db.insert(quotes).values({
                tenantId,
                customerId,
                leadId: null,
                quoteNo: `Q-${Date.now()}`,
                status: 'LOCKED',
                createdBy: userId,
                totalAmount: '1000',
            }).returning();
            quoteId = quote.id;

            const [product] = await db.insert(products).values({
                tenantId,
                name: 'Test Curtain Product',
                sku: `SKU-${Date.now()}`,
                category: 'CURTAIN_FABRIC',
                basePrice: '100',
                unit: 'meter',
            }).returning();

            await db.insert(quoteItems).values({
                quoteId,
                productId: product.id,
                productName: 'Test Curtain',
                quantity: '1',
                unitPrice: '100',
                subtotal: '100',
                roomId: null
            });

            const [order] = await db.insert(orders).values({
                tenantId,
                orderNo: `ORD-${Date.now()}`,
                quoteId,
                quoteVersionId: quoteId,
                customerId,
                salesId: userId,
                customerName: 'Test Customer',
                customerPhone: '13800138000',
                deliveryAddress: 'Test Address',
                status: 'IN_PRODUCTION',
                totalAmount: '1000',
                paidAmount: '1000',
                createdBy: userId
            }).returning();
            orderId = order.id;
        } catch (error) {
            console.error('Setup Failed:', error);
            throw error;
        }
    });

    it('should auto-create install task when order is shipped', async () => {
        const shipResult = await shipOrder({
            orderId,
            logisticsCompany: 'Test Express',
            logisticsNo: '123456'
        });

        expect(shipResult.success).toBe(true);

        const tasks = await db.query.installTasks.findMany({
            where: eq(installTasks.orderId, orderId)
        });

        expect(tasks.length).toBeGreaterThan(0);
        const task = tasks[0];
        expect(task.status).toBe('PENDING_DISPATCH');
        expect(task.category).toBe('CURTAIN_FABRIC');

        const dispatchResult = await dispatchInstallTask({
            taskId: task.id,
            workerId: userId,
            scheduledDate: '2026-02-01',
            laborFee: 50
        });
        expect(dispatchResult.success).toBe(true);

        const dispatchedTask = await db.query.installTasks.findFirst({ where: eq(installTasks.id, task.id) });
        expect(dispatchedTask?.status).toBe('PENDING_VISIT');

        const submitResult = await submitInstallCompletion({
            taskId: task.id,
            images: ['http://example.com/checkin.jpg'],
            checkInLocation: { lat: 0, lng: 0 }
        });
        expect(submitResult.success).toBe(true);

        const confirmResult = await confirmInstallation({
            taskId: task.id,
            rating: 5,
            ratingComment: 'Good job'
        });
        expect(confirmResult.success).toBe(true);
        expect(confirmResult.data?.orderStatusUpdated).toBe(true);

        const finalOrder = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
        expect(finalOrder?.status).toBe('COMPLETED');
    });
});
