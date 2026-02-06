
import 'dotenv/config';
import { db } from '@/shared/api/db';
import * as schema from '@/shared/api/schema';
import { eq } from 'drizzle-orm';

async function testInsert() {
    console.log('Testing Fabric Inventory Log Insertion...');

    // 1. Get Tenant
    const tenant = await db.query.tenants.findFirst();
    if (!tenant) throw new Error('No tenant found');
    console.log('Tenant:', tenant.id);

    // 2. Get Fabric Inventory Record (create if needed)
    let fabricInv = await db.query.fabricInventory.findFirst({
        where: (t, { eq }) => eq(t.tenantId, tenant.id)
    });

    if (!fabricInv) {
        console.log('Creating dummy fabric inventory...');
        // Need a product first
        const product = await db.query.products.findFirst({
            where: (t, { eq }) => eq(t.tenantId, tenant.id)
        });
        if (!product) throw new Error('No product found');

        const [newInv] = await db.insert(schema.fabricInventory).values({
            tenantId: tenant.id,
            fabricProductId: product.id,
            fabricSku: product.sku || 'TEST-SKU',
            fabricName: product.name || 'Test Fabric',
            availableQuantity: '10',
            totalQuantity: '10',
        }).returning();
        fabricInv = newInv;
    }
    console.log('Fabric Inventory:', fabricInv.id);

    // 3. Try Insert Log
    console.log('Inserting with logType: PURCHASE_IN');
    try {
        const [log] = await db.insert(schema.fabricInventoryLogs).values({
            tenantId: tenant.id,
            fabricInventoryId: fabricInv.id,
            logType: 'PURCHASE_IN',
            quantity: '10',
            beforeQuantity: '0',
            afterQuantity: '10',
            reason: 'Test Insert',
        }).returning();
        console.log('✅ Success! Inserted log:', log.id);
    } catch (e) {
        console.error('❌ Failed:', e);
    }

    process.exit(0);
}

testInsert().catch(console.error);
