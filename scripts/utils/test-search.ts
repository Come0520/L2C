
import 'dotenv/config';
import { db } from './src/shared/api/db';
import * as schema from './src/shared/api/schema';
import { eq, and, ilike, or } from 'drizzle-orm';

async function main() {
    console.log('🔍 Testing Product Search...\n');

    // 1. Get DEMO Tenant
    const tenant = await db.query.tenants.findFirst({
        where: eq(schema.tenants.code, 'DEMO')
    });
    
    if (!tenant) {
        console.error('❌ DEMO Tenant not found');
        return;
    }
    console.log(`🏢 Tenant: ${tenant.name} (${tenant.id})`);

    // 2. Simulate Search
    const searchQuery = '窗帘'; // Common keyword
    const search = `%${searchQuery}%`;
    
    const conditions = [
        eq(schema.products.tenantId, tenant.id),
        eq(schema.products.isActive, true),
        or(
            ilike(schema.products.name, search),
            ilike(schema.products.sku, search)
        )
    ];

    const results = await db.query.products.findMany({
        where: and(...conditions),
        limit: 5
    });

    console.log(`\n🔎 Searching for "${searchQuery}"...`);
    console.log(`   Found ${results.length} results:`);
    results.forEach(p => {
        console.log(`   - ${p.name} (${p.sku})`);
    });

    process.exit(0);
}

main().catch(console.error);
