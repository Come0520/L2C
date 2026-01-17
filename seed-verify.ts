
import 'dotenv/config';
import { db } from './src/shared/api/db';
import * as schema from './src/shared/api/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('🌱 Starting minimal verification seed...');

    // 1. Tenant
    const [tenant] = await db.insert(schema.tenants).values({
        name: 'L2C Minimal Tenant',
        code: 'MINIMAL',
        isActive: true,
    }).onConflictDoUpdate({
        target: schema.tenants.code,
        set: { name: 'L2C Minimal Tenant', updatedAt: new Date() }
    }).returning();
    console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

    // 2. User
    const [user] = await db.insert(schema.users).values({
        tenantId: tenant.id,
        name: 'Admin User',
        phone: '13800008888',
        email: 'admin@l2c.com',
        passwordHash: '$2a$10$demoPasswordHash',
        role: 'ADMIN',
        isActive: true,
    }).onConflictDoUpdate({
        target: schema.users.email,
        set: { name: 'Admin User', updatedAt: new Date() }
    }).returning();
    console.log(`✅ User: ${user.name} (${user.id})`);

    // 3. Products
    const productsData = [
        { name: 'Test Curtain Fabric', sku: 'TEST-001', category: 'CURTAIN_FABRIC', unitPrice: '50.00', purchasePrice: '20.00' },
        { name: 'Test Motor', sku: 'TEST-002', category: 'MOTOR', unitPrice: '500.00', purchasePrice: '200.00' },
    ];

    for (const p of productsData) {
        await db.insert(schema.products).values({
            tenantId: tenant.id,
            name: p.name,
            sku: p.sku,
            category: p.category as any, // Cast to enum
            unitPrice: p.unitPrice,
            purchasePrice: p.purchasePrice,
            unit: 'item',
            createdBy: user.id,
        }).onConflictDoUpdate({
            target: schema.products.sku,
            set: { unitPrice: p.unitPrice }
        });
    }
    console.log(`✅ Products seeded: ${productsData.length}`);

    // 4. Customer
    const [customer] = await db.insert(schema.customers).values({
        tenantId: tenant.id,
        customerNo: 'CUST-' + Date.now(),
        name: 'Test Customer',
        phone: '13900009999',
        createdBy: user.id,
    }).returning();
    console.log(`✅ Customer: ${customer.name}`);

    console.log('🎉 Verification seed complete!');
    process.exit(0);
}

main().catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
});
