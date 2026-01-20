
import 'dotenv/config';
import { db } from './src/shared/api/db';

async function main() {
    console.log('🔍 Checking database state...\n');

    // 1. Check Tenants
    const tenants = await db.query.tenants.findMany();
    console.log('🏢 Tenants:');
    tenants.forEach(t => console.log(`   - ${t.name} (${t.code}) ID: ${t.id}`));

    // 2. Check Users
    const users = await db.query.users.findMany();
    console.log('\n👤 Users:');
    users.forEach(u => console.log(`   - ${u.name} (${u.email}) TenantID: ${u.tenantId}`));

    // 3. Check Products count per tenant
    const products = await db.query.products.findMany();
    console.log('\n📦 Products:');
    const productCounts: Record<string, number> = {};
    products.forEach(p => {
        productCounts[p.tenantId] = (productCounts[p.tenantId] || 0) + 1;
    });
    
    Object.entries(productCounts).forEach(([tenantId, count]) => {
        console.log(`   - Tenant ${tenantId}: ${count} products`);
    });

    // 4. List first 5 products
    console.log('\n📦 First 5 Products:');
    products.slice(0, 5).forEach(p => {
        console.log(`   - ${p.name} (${p.sku}) TenantID: ${p.tenantId}`);
    });

    process.exit(0);
}

main().catch(console.error);
