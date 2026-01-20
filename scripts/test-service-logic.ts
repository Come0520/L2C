import 'dotenv/config';
import { db } from '@/shared/api/db';
import { generateInstallTasksFromOrder } from '@/features/service/installation/actions/create-task';
import { orders, orderItems } from '@/shared/api/schema/orders';
import { tenants, users } from '@/shared/api/schema/infrastructure';
import { customers } from '@/shared/api/schema/customers';
import { leads } from '@/shared/api/schema/leads';
import { quotes, quoteItems } from '@/shared/api/schema/quotes';
import { installTasks, installItems } from '@/shared/api/schema/service';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('--- Start Service Logic Verification ---');

    // 1. Setup Data
    const tenant = await db.query.tenants.findFirst();
    if (!tenant) throw new Error("No Tenant");
    const tenantId = tenant.id;

    const user = await db.query.users.findFirst();
    const userId = user?.id;

    const lead = await db.query.leads.findFirst();
    const customer = await db.query.customers.findFirst();
    if (!customer) throw new Error("No Customer");

    // 1.5 Fetch Product
    const product = await db.query.products.findFirst();
    if (!product) throw new Error("No Product found (Seed DB first)");

    // 1.6 Create Quote
    const [quote] = await db.insert(quotes).values({
        tenantId,
        quoteNo: `TEST-QT-${Date.now()}`,
        customerId: customer.id,
        version: 1,
        totalAmount: '360',
        createdBy: userId,
        status: 'ACCEPTED'
    }).returning();

    // 2. Create Order with Mixed Items
    console.log('Creating Order with Mixed Items...');
    const [order] = await db.insert(orders).values({
        tenantId,
        orderNo: `TEST-ORD-${Date.now()}`,
        quoteId: quote.id,
        quoteVersionId: quote.id,
        customerId: customer.id,
        salesId: userId,
        status: 'PENDING_INSTALL',
        settlementType: 'PREPAID',
        createdBy: userId
    }).returning();

    // 1.8 Create Quote Items
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

    // 2. Insert Order Items linking to Quote Items
    await db.insert(orderItems).values([
        {
            tenantId,
            orderId: order.id,
            quoteItemId: qItemCurtain.id,
            productId: product.id,
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
            productId: product.id,
            productName: 'Test Wallpaper',
            roomName: 'Bedroom',
            category: 'WALLPAPER', // Matches productCategoryEnum
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
            productId: product.id,
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

    // 3. Trigger Split
    console.log('Executing Split Logic...');
    const result = await generateInstallTasksFromOrder({
        orderId: order.id,
        tenantId,
        userId: userId
    });

    if (!result.success) {
        console.error('Split Failed:', result.error);
        process.exit(1);
    }

    console.log('Split Success. Task IDs:', result.data.createdTaskIds);

    // 4. Verify Tasks
    const tasks = await db.query.installTasks.findMany({
        where: eq(installTasks.orderId, order.id),
        with: {
            // @ts-ignore
            items: true // Relation name might be different? 'install_items' table.
        }
    });

    // Manual fetch items since relation might not be 'items' in query builder schema yet if not defined in relations.ts
    // Let's use direct query
    for (const task of tasks) {
        const taskItems = await db.query.installItems.findMany({
            where: eq(installItems.installTaskId, task.id)
        });
        console.log(`Task [${task.taskNo}] Category: ${task.category}`);
        console.log(` - Items: ${taskItems.map(i => i.productName + ' (' + i.quantity + ')').join(', ')}`);

        if (task.category === 'CURTAIN') {
            if (!taskItems.find(i => i.productName === 'Test Curtain')) console.error("Create Curtain Task Failed logic");
        } else if (task.category === 'WALLPAPER') {
            if (!taskItems.find(i => i.productName === 'Test Wallpaper')) console.error("Create Wallpaper Task Failed logic");
        }
    }

    console.log('--- Verification Complete ---');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
