
import { config } from 'dotenv';
import path from 'path';

// Explicitly load .env from project root
config({ path: path.join(process.cwd(), '.env') });

import { db } from '../src/shared/api/db';
import { roles, users } from '../src/shared/api/schema';
import { eq, asc } from 'drizzle-orm';
import { DEFAULT_ROLES } from '../src/features/settings/constants/roles';

async function main() {
    console.log('--- Simulating getAvailableRoles Logic (Direct DB) ---');

    // 1. Get a test tenant ID (using the one from check-all-roles output: 'e772e5f7...')
    // Or fetch the test user
    const testUser = await db.query.users.findFirst({
        where: eq(users.email, 'test@example.com')
    });

    if (!testUser) {
        console.error('Test user not found!');
        process.exit(1);
    }

    const tenantId = testUser.tenantId;
    console.log(`Using Tenant ID: ${tenantId}`);

    // 2. Check existing roles
    let dbRoles = await db.query.roles.findMany({
        where: eq(roles.tenantId, tenantId),
        orderBy: [asc(roles.code)],
    });

    console.log(`Existing roles count: ${dbRoles.length}`);

    if (dbRoles.length === 0) {
        console.log('--- Roles empty, initializing defaults ---');

        const newRoles = DEFAULT_ROLES.map(role => ({
            tenantId: tenantId,
            name: role.name,
            code: role.code,
            description: role.description,
            isSystem: role.isSystem,
        }));

        console.log('Inserting roles:', newRoles.map(r => r.code).join(', '));

        await db.insert(roles).values(newRoles);
        console.log('--- Initialization complete ---');
    } else {
        console.log('Roles already exist, skipping initialization.');
    }

    // 3. Verify
    const finalRoles = await db.query.roles.findMany({
        where: eq(roles.tenantId, tenantId),
        orderBy: [asc(roles.code)],
    });

    console.log('\n--- Final Roles in DB ---');
    console.table(finalRoles.map(r => ({
        name: r.name,
        code: r.code,
        tenantId: r.tenantId.slice(0, 8) + '...'
    })));
}

main().catch(console.error).finally(() => process.exit(0));
