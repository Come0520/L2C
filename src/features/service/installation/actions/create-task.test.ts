
import 'dotenv/config';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { generateInstallTasksFromOrder } from './create-task';
import { checkInMeasureTask } from '../../measurement/actions/check-in';
import { rejectMeasureTask } from '../../measurement/actions/reject';
import { db } from '../../../../shared/api/db';
import { orders, orderItems } from '../../../../shared/api/schema';
import { quotes, quoteItems } from '../../../../shared/api/schema';
import { customers } from '../../../../shared/api/schema';
import { installTasks, installItems, measureTasks, measureSheets } from '../../../../shared/api/schema';
import { leads } from '../../../../shared/api/schema';
import { tenants, users } from '../../../../shared/api/schema';
import { eq } from 'drizzle-orm';
import { uuid } from 'drizzle-orm/pg-core';
import { createMeasureTask } from '../../measurement/actions/create-task';

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(async () => ({ user: { id: 'mock-user-id' } })),
}));

// Mock createSafeAction if needed? 
// No, createSafeAction just validates schema. It should run fine in node if zod is presents.

describe.skip('Installation Tasks Logic', () => {
    let tenantId: string;
    let userId: string;
    let customerId: string;
    let productId: string;

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

        const product = await db.query.products.findFirst();
        if (!product) throw new Error("No Product");
        productId = product.id;
    });

    it('should split order into install tasks correctly', async () => {
        // 1. Create Quote
        const [quote] = await db.insert(quotes).values({
            tenantId,
            quoteNo: `TEST-QT-${Date.now()}`,
            customerId,
            version: 1,
            totalAmount: '360',
            createdBy: userId,
            status: 'ACCEPTED'
        }).returning();

        // 2. Create Quote Items
        const [qItemCurtain] = await db.insert(quoteItems).values({
            tenantId,
            quoteId: quote.id,
            category: 'CURTAIN',
            productName: 'Test Curtain',
            quantity: '1',
            unitPrice: '100',
            subtotal: '100',
        }).returning();

        const [qItemWallpaper] = await db.insert(quoteItems).values({
            tenantId,
            quoteId: quote.id,
            category: 'WALLPAPER',
            productName: 'Test Wallpaper',
            quantity: '5',
            unitPrice: '50',
            subtotal: '250',
        }).returning();

        const [qItemOther] = await db.insert(quoteItems).values({
            tenantId,
            quoteId: quote.id,
            category: 'OTHER',
            productName: 'Test Other',
            quantity: '1',
            unitPrice: '10',
            subtotal: '10',
        }).returning();

        // 3. Create Order
        const [order] = await db.insert(orders).values({
            tenantId,
            orderNo: `TEST-ORD-${Date.now()}`,
            quoteId: quote.id,
            quoteVersionId: quote.id,
            customerId,
            salesId: userId,
            status: 'PENDING_INSTALL',
            settlementType: 'PREPAID',
            createdBy: userId
        }).returning();

        // 4. Create Order Items
        await db.insert(orderItems).values([
            {
                tenantId,
                orderId: order.id,
                quoteItemId: qItemCurtain.id,
                productId,
                productName: 'Test Curtain',
                roomName: 'Living Room',
                category: 'CURTAIN',
                quantity: 1,
                unitPrice: '100',
                subtotal: '100',
                width: 100,
                height: 200,
            },
            {
                tenantId,
                orderId: order.id,
                quoteItemId: qItemWallpaper.id,
                productId,
                productName: 'Test Wallpaper',
                roomName: 'Bedroom',
                category: 'WALLPAPER',
                quantity: 5,
                unitPrice: '50',
                subtotal: '250',
                width: 0,
                height: 0,
            },
            {
                tenantId,
                orderId: order.id,
                quoteItemId: qItemOther.id,
                productId,
                productName: 'Test Other',
                roomName: 'Other',
                category: 'OTHER',
                quantity: 1,
                unitPrice: '10',
                subtotal: '10',
                width: 0,
                height: 0,
            }
        ]);

        // 5. Execute Action
        const result = await generateInstallTasksFromOrder({
            orderId: order.id,
            tenantId,
            userId,
        });

        // Result is double wrapped: { success: true, data: { success: true, data: { ... } } }
        // or if handler failed logic: { success: true, data: { success: false, error: ... } }

        expect(result.success).toBe(true); // Wrapper success

        const logicResult = result.data as { success: boolean, data?: { createdTaskIds: string[] }, error?: string };
        expect(logicResult.success, `Logic failed: ${logicResult?.error}`).toBe(true);
        expect(logicResult.success).toBe(true); // Business logic success
        expect(logicResult.data?.createdTaskIds).toBeDefined();

        // 6. Verify Tasks
        const tasks = await db.query.installTasks.findMany({
            where: eq(installTasks.orderId, order.id),
        });

        // Expect 3 tasks: Curtain, Wallpaper, Other
        expect(tasks.length).toBe(3);

        const categories = tasks.map((t: { category: string | null }) => t.category);
        expect(categories).toContain('CURTAIN');
        expect(categories).toContain('WALLPAPER');
        expect(categories).toContain('OTHER');

        // Verify Items in one task
        const wallpaperTask = tasks.find((t: { category: string | null }) => t.category === 'WALLPAPER');
        const items = await db.query.installItems.findMany({
            where: eq(installItems.installTaskId, wallpaperTask!.id)
        });
        expect(items.length).toBe(1);
        expect(items[0].productName).toBe('Test Wallpaper');
    });
    it('should create measure task correctly', async () => {
        // Reuse variables from describe scope
        const testTenantId = tenantId;
        const testUserId = userId;
        const testCustomerId = customerId;

        // 1. Create a Lead
        // Ensure leads schema has all fields
        const [lead] = await db.insert(leads).values({
            tenantId: testTenantId,
            leadNo: `L-${Date.now()}`, // LeadNo is unique not null
            customerName: 'Test Customer',
            customerPhone: '19999999999',
            status: 'PENDING_ASSIGNMENT',
            createdBy: testUserId,
            // title: 'Test Lead Measure', // title does not exist in leads schema
            // source: 'WALK_IN', // source might be sourceChannelId or something. 
            // leads schema: sourceChannelId etc. sourceDetail.
        }).returning();

        // 2. Execute Action
        const result = await createMeasureTask({
            leadId: lead.id,
            customerId: testCustomerId, // existing customer
            type: 'BLIND',
            scheduledAt: new Date(Date.now() + 86400000), // Future Date
            remark: 'Test Remark'
        });

        expect(result.success, `Measure Action Wrapper Error: ${result.error}`).toBe(true);

        const logicResult = result.data as { success: boolean, data: { taskId: string }, error?: string, message?: string }; // safe action wrapper unwrapping

        expect(logicResult.success, `Measure Action Logic Error: ${logicResult?.error}`).toBe(true);
        expect(logicResult.data.taskId).toBeDefined();

        // 3. Verify Task in DB
        const task = await db.query.measureTasks.findFirst({
            where: eq(measureTasks.id, logicResult.data.taskId)
        });
        expect(task).toBeDefined();
        expect(task?.measureNo).toContain('MEA-');
        expect(task?.status).toBe('PENDING');

        // 4. Verify Sheet
        const sheet = await db.query.measureSheets.findFirst({
            where: eq(measureSheets.taskId, task!.id)
        });
        expect(sheet).toBeDefined();
        expect(sheet?.status).toBe('DRAFT');
    });
    it('should set fee status to PENDING when requiresFee is true', async () => {
        const testTenantId = tenantId;
        const testUserId = userId;

        // 1. Create Non-VIP Customer explicitly
        const [nonVipCustomer] = await db.insert(customers).values({
            tenantId: testTenantId,
            name: 'Non VIP',
            phone: `188${Date.now()}`,
            createdBy: testUserId,
            customerNo: `C-NV-${Date.now()}`,
            level: 'D'
        }).returning();

        // 2. Create a Lead
        const [lead] = await db.insert(leads).values({
            tenantId: testTenantId,
            leadNo: `L-FEE-${Date.now()}`,
            customerName: 'Test Fee Customer',
            customerPhone: nonVipCustomer.phone,
            status: 'PENDING_ASSIGNMENT',
            createdBy: testUserId,
        }).returning();

        // 3. Execute Action with requiresFee=true
        const result = await createMeasureTask({
            leadId: lead.id,
            customerId: nonVipCustomer.id,
            type: 'BLIND',
            scheduledAt: new Date(Date.now() + 86400000),
            requiresFee: true
        });

        expect(result.success, `Fee Test Error: ${result.error}`).toBe(true);
        const logicResult = result.data as { success: boolean, data: { taskId: string }, error?: string, message?: string };
        expect(logicResult.success).toBe(true);

        // 4. Verify Task Logic
        const task = await db.query.measureTasks.findFirst({
            where: eq(measureTasks.id, logicResult.data.taskId)
        });
        expect(task?.isFeeExempt).toBe(false);
        expect(task?.feeCheckStatus).toBe('PENDING');
    });

    it('should set fee status to NONE for VIP customer', async () => {
        const testTenantId = tenantId;
        const testUserId = userId;

        // Create VIP Customer
        const [vipCustomer] = await db.insert(customers).values({
            tenantId: testTenantId,
            name: 'VIP Customer',
            phone: `177${Date.now()}`,
            createdBy: testUserId,
            customerNo: `C-VIP-${Date.now()}`,
            level: 'A' // VIP
        }).returning();

        // Create Lead
        const [lead] = await db.insert(leads).values({
            tenantId: testTenantId,
            leadNo: `L-VIP-${Date.now()}`,
            customerName: 'VIP Customer',
            customerPhone: vipCustomer.phone,
            status: 'PENDING_ASSIGNMENT',
            createdBy: testUserId,
        }).returning();

        // Execute Action with requiresFee=true (should be overridden by VIP)
        const result = await createMeasureTask({
            leadId: lead.id,
            customerId: vipCustomer.id,
            type: 'BLIND',
            scheduledAt: new Date(Date.now() + 86400000),
            requiresFee: true
        });

        expect(result.success).toBe(true);
        const logicResult = result.data as any;

        const task = await db.query.measureTasks.findFirst({
            where: eq(measureTasks.id, logicResult.data.taskId)
        });

        expect(task?.isFeeExempt).toBe(true);
        expect(task?.feeCheckStatus).toBe('NONE');
    });

    it('should check in measure task successfully with GPS validation', async () => {
        const testTenantId = tenantId;
        const testUserId = userId;
        const testCustomerId = customerId;

        // 1. Create Lead & Task
        const [lead] = await db.insert(leads).values({
            tenantId: testTenantId,
            leadNo: `L-GPS-${Date.now()}`,
            customerName: 'GPS Customer',
            customerPhone: `144${Date.now()}`,
            status: 'PENDING_ASSIGNMENT',
            createdBy: testUserId,
        }).returning();

        const [task] = await db.insert(measureTasks).values({
            tenantId: testTenantId,
            measureNo: `MEA-GPS-${Date.now()}`,
            leadId: lead.id,
            customerId: testCustomerId,
            status: 'PENDING_VISIT',
            scheduledAt: new Date(Date.now() + 3600000), // Future 1h
        }).returning();

        // 2. Execute Check-in Within Range
        // Distance 0m (Same coords)
        const result = await checkInMeasureTask({
            taskId: task.id,
            latitude: 31.2304,
            longitude: 121.4737,
            address: 'Shanghai People Square',
            targetLatitude: 31.2304,
            targetLongitude: 121.4737
        });

        expect(result.success).toBe(true);
        const logicResult = result.data as { success: boolean, data: { gpsResult: { isWithinRange: boolean }, lateMinutes: number }, error?: string, message?: string };
        expect(logicResult.success).toBe(true);
        expect(logicResult.data.gpsResult).toBeDefined();
        expect(logicResult.data.gpsResult.isWithinRange).toBe(true);
        expect(logicResult.data.lateMinutes).toBe(0);

        // 3. Verify DB
        const updated = await db.query.measureTasks.findFirst({
            where: eq(measureTasks.id, task.id)
        });
        expect(updated?.checkInAt).toBeDefined();
        const loc = updated?.checkInLocation as { gpsResult: { isWithinRange: boolean } };
        expect(loc.gpsResult.isWithinRange).toBe(true);
    });

    it('should detect late check-in', async () => {
        const testTenantId = tenantId;
        const testUserId = userId;
        const testCustomerId = customerId;

        // 1. Create Task Scheduled in Past
        const [lead] = await db.insert(leads).values({
            tenantId: testTenantId,
            leadNo: `L-LATE-${Date.now()}`,
            customerName: 'Late Customer',
            customerPhone: `133${Date.now()}`,
            status: 'PENDING_ASSIGNMENT',
            createdBy: testUserId,
        }).returning();

        const [task] = await db.insert(measureTasks).values({
            tenantId: testTenantId,
            measureNo: `MEA-LATE-${Date.now()}`,
            leadId: lead.id,
            customerId: testCustomerId,
            status: 'PENDING_VISIT',
            scheduledAt: new Date(Date.now() - 3600000), // 1 hour ago
        }).returning();

        // 2. Execute Check-in
        const result = await checkInMeasureTask({
            taskId: task.id,
            latitude: 31.2304,
            longitude: 121.4737,
            address: 'Shanghai',
        });

        expect(result.success).toBe(true);
        const logicResult = result.data as { success: boolean, data: { lateMinutes: number }, error?: string, message?: string };
        expect(logicResult.success).toBe(true);
        expect(logicResult.data.lateMinutes).toBeGreaterThan(0);

        // 3. Verify DB
        const updated = await db.query.measureTasks.findFirst({
            where: eq(measureTasks.id, task.id)
        });
        const loc = updated?.checkInLocation as { lateMinutes: number };
        expect(loc.lateMinutes).toBeGreaterThan(30); // 60 mins - 15 grace = 45 mins. >30 is safe.
    });

    it('should reject task and increment count', async () => {
        const testTenantId = tenantId;
        const testUserId = userId;
        const testCustomerId = customerId;

        // 0. Ensure Lead exists
        const [lead] = await db.insert(leads).values({
            tenantId: testTenantId,
            leadNo: `L-REJ-${Date.now()}`,
            customerName: 'Rej Customer',
            customerPhone: `166${Date.now()}`,
            status: 'PENDING_ASSIGNMENT',
            createdBy: testUserId,
        }).returning();

        // 1. Create Task
        const [task] = await db.insert(measureTasks).values({
            tenantId: testTenantId,
            measureNo: `MEA-REJ-${Date.now()}`,
            leadId: lead.id,
            customerId: testCustomerId,
            status: 'PENDING_CONFIRM',
            rejectCount: 0
        }).returning();

        // 2. Reject Task
        const result = await rejectMeasureTask({
            taskId: task.id,
            reason: 'Quality Issue'
        });

        expect(result.success, `Reject Test Error: ${result.error}`).toBe(true);

        // Unwrap logic result
        const logicResult = result.data as { success: boolean, data: { rejectCount: number, status: string }, error?: string, message?: string };
        expect(logicResult.success).toBe(true);

        // Unwrap data result
        const data = logicResult.data;
        expect(data.rejectCount).toBe(1);
        expect(data.status).toBe('PENDING');

        // 3. Verify DB
        const updated = await db.query.measureTasks.findFirst({
            where: eq(measureTasks.id, task.id)
        });
        expect(updated?.rejectCount).toBe(1);
        expect(updated?.rejectReason).toBe('Quality Issue');
        expect(updated?.status).toBe('PENDING');
    });

    it('should trigger warning on 3rd rejection', async () => {
        const testTenantId = tenantId;
        const testUserId = userId;
        const testCustomerId = customerId;

        const [lead] = await db.insert(leads).values({
            tenantId: testTenantId,
            leadNo: `L-WARN-${Date.now()}`,
            customerName: 'Warn Customer',
            customerPhone: `155${Date.now()}`,
            status: 'PENDING_ASSIGNMENT',
            createdBy: testUserId,
        }).returning();

        // 1. Create Task with 2 rejects
        const [task] = await db.insert(measureTasks).values({
            tenantId: testTenantId,
            measureNo: `MEA-WARN-${Date.now()}`,
            leadId: lead.id,
            customerId: testCustomerId,
            status: 'PENDING_CONFIRM',
            rejectCount: 2
        }).returning();

        // 2. Reject 3rd time
        const result = await rejectMeasureTask({
            taskId: task.id,
            reason: 'Quality Issue 3'
        });

        expect(result.success, `Warning Test Error: ${result.error}`).toBe(true);

        const logicResult = result.data as { success: boolean, data: { rejectCount: number, status: string }, error?: string, message?: string };
        expect(logicResult.success).toBe(true);
        expect(logicResult.message).toContain('已通知店长'); // Expect warning message

        const data = logicResult.data;
        expect(data.rejectCount).toBe(3);
    });
});
