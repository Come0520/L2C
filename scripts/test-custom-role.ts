
import { config } from 'dotenv';
import path from 'path';

// Explicitly load .env from project root
config({ path: path.join(process.cwd(), '.env') });

import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';

async function main() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL not found');
        process.exit(1);
    }

    console.log('Connecting to:', dbUrl.replace(/:[^:]+@/, ':****@'));
    const sql = postgres(dbUrl);

    try {
        console.log('\n--- Testing Custom Role Reflection ---');

        // 1. Get Test Tenant ID
        const users = await sql`SELECT id, tenant_id FROM users WHERE email = 'test@example.com' LIMIT 1`;
        if (users.length === 0) {
            console.error('Test user not found');
            process.exit(1);
        }
        const tenantId = users[0].tenant_id;
        console.log(`Tenant ID: ${tenantId}`);


        // 2. Check and Insert Custom Role
        const existingCustom = await sql`SELECT id FROM roles WHERE tenant_id = ${tenantId} AND code = 'CUSTOM_TEST_ROLE'`;

        if (existingCustom.length === 0) {
            console.log(`Inserting custom role: CUSTOM_TEST_ROLE`);
            await sql`
                INSERT INTO roles (id, tenant_id, name, code, description, is_system, created_at, updated_at)
                VALUES (${uuidv4()}, ${tenantId}, '自定义测试角色', 'CUSTOM_TEST_ROLE', '用于验证自定义角色是否联动', false, NOW(), NOW())
            `;
        } else {
            console.log('Custom role already exists, skipping insert.');
        }

        // 3. Verify Reflection
        console.log('--- Fetching All Roles (Simulating UI fetch) ---');
        const finalRoles = await sql`SELECT name, code, is_system FROM roles WHERE tenant_id = ${tenantId} ORDER BY code ASC`;
        console.table(finalRoles);

        const found = finalRoles.find((r: any) => r.code === 'CUSTOM_TEST_ROLE');
        if (found) {
            console.log('✅ Custom role found in the list!');
        } else {
            console.error('❌ Custom role NOT found!');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await sql.end();
    }
}

main();
