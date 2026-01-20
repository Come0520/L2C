
import 'dotenv/config';
import { db } from './src/shared/api/db';
import * as schema from './src/shared/api/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
    console.log('🔍 Verifying E2E Data...');

    // 1. Get Tenant
    const tenant = await db.query.tenants.findFirst({
        where: eq(schema.tenants.code, 'E2E_TEST')
    });

    if (!tenant) {
        console.error('❌ Tenant E2E_TEST not found!');
        return;
    }
    console.log(`✅ Tenant Found: ${tenant.name} (${tenant.id})`);

    // 2. Check Flows
    const flows = await db.query.approvalFlows.findMany({
        where: eq(schema.approvalFlows.tenantId, tenant.id)
    });
    console.log(`\n📋 Approval Flows (${flows.length}):`);
    flows.forEach(f => console.log(`  - ${f.code}: ${f.name} (Active: ${f.isActive})`));

    // Check ORDER_CHANGE specifically
    const orderChange = flows.find(f => f.code === 'ORDER_CHANGE');
    if (!orderChange) {
        console.error('❌ ORDER_CHANGE flow MISSING!');
    } else {
        console.log('✅ ORDER_CHANGE flow exists.');
    }

    // 3. Check Role Permissions
    const managerRole = await db.query.roles.findFirst({
        where: and(
            eq(schema.roles.tenantId, tenant.id),
            eq(schema.roles.code, 'MANAGER')
        )
    });

    if (!managerRole) {
        console.error('❌ MANAGER Role not found!');
    } else {
        console.log(`\n👮 Role MANAGER Permissions:`);
        console.log(JSON.stringify(managerRole.permissions, null, 2));

        // Check for admin:settings
        // permissions is jsonb, likely string[]
        const perms = managerRole.permissions as string[];
        if (perms.includes('admin:settings')) {
            console.log('✅ Has admin:settings permission');
        } else {
            console.error('❌ MISSING admin:settings permission');
        }
    }

    process.exit(0);
}

main().catch(console.error);
