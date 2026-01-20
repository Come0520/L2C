import 'dotenv/config';
import { db } from './src/shared/api/db';
import * as schema from './src/shared/api/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('🔍 Checking TEST001 Data...\n');

    const tenant = await db.query.tenants.findFirst({
        where: eq(schema.tenants.code, 'TEST001'),
        with: {
            users: true
        }
    });

    if (!tenant) {
        console.error('❌ Tenant TEST001 not found');
        process.exit(0);
    }
    console.log(`🏢 Tenant: ${tenant.name} (${tenant.id})`);
    console.log(`👥 Users: ${tenant.users.length}`);
    tenant.users.forEach(u => console.log(`   - ${u.name} (${u.role}) ${u.phone}`));

    const customers = await db.query.customers.findMany({
        where: eq(schema.customers.tenantId, tenant.id),
        limit: 5
    });
    console.log(`\n👥 Customers (First 5 of ${customers.length}):`);
    customers.forEach(c => console.log(`   - ${c.name}`));

    const leads = await db.query.leads.findMany({
        where: eq(schema.leads.tenantId, tenant.id),
        limit: 5
    });
    console.log(`\n📋 Leads (First 5 of ${leads.length}):`);
    leads.forEach(l => console.log(`   - ${l.leadNo} (${l.status})`));

    const tasks = await db.query.measureTasks.findMany({
        where: eq(schema.measureTasks.tenantId, tenant.id),
        limit: 5
    });
    console.log(`\n📏 Measure Tasks (First 5 of ${tasks.length}):`);
    tasks.forEach(t => console.log(`   - ${t.measureNo} (${t.status})`));

    process.exit(0);
}

main().catch(console.error);
