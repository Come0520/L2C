
import { config } from 'dotenv';
import path from 'path';

// Explicitly load .env from project root
config({ path: path.join(process.cwd(), '.env') });

import postgres from 'postgres';

async function main() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL not found');
        process.exit(1);
    }

    console.log('Connecting to:', dbUrl.replace(/:[^:]+@/, ':****@'));
    const sql = postgres(dbUrl);

    try {
        console.log('\n--- Cleaning up Test Data ---');

        // 1. Get Test Tenant ID
        const users = await sql`SELECT id, tenant_id FROM users WHERE email = 'test@example.com' LIMIT 1`;
        if (users.length === 0) {
            console.error('Test user not found');
            process.exit(1);
        }
        const tenantId = users[0].tenant_id;

        // 2. Delete Custom Role
        const result = await sql`DELETE FROM roles WHERE tenant_id = ${tenantId} AND code = 'CUSTOM_TEST_ROLE'`;
        console.log(`Deleted ${result.count} roles.`);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.end();
    }
}

main();
