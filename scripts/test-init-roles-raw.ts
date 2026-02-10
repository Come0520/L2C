
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
        console.log('\n--- Simulating Role Init (Raw SQL) ---');

        // 1. Get Test Tenant ID
        const users = await sql`SELECT id, tenant_id FROM users WHERE email = 'test@example.com' LIMIT 1`;
        if (users.length === 0) {
            console.error('Test user not found');
            process.exit(1);
        }
        const tenantId = users[0].tenant_id;
        console.log(`Tenant ID: ${tenantId}`);

        // 2. Check Roles
        const existingRoles = await sql`SELECT id FROM roles WHERE tenant_id = ${tenantId}`;
        console.log(`Existing roles: ${existingRoles.length}`);

        if (existingRoles.length === 0) {
            console.log('--- Initializing Defaults ---');

            const DEFAULT_ROLES = [
                { name: '管理员', code: 'ADMIN', description: '系统全权管理', isSystem: true },
                { name: '经理', code: 'MANAGER', description: '门店/区域管理 (店长)', isSystem: true },
                { name: '销售', code: 'SALES', description: '业务执行', isSystem: true },
                { name: '财务', code: 'FINANCE', description: '财务管理', isSystem: true },
                { name: '供应链', code: 'SUPPLY', description: '采购与库存', isSystem: true },
                { name: '派单员', code: 'DISPATCHER', description: '服务调度', isSystem: true },
                { name: '工人', code: 'WORKER', description: '服务执行 (测量/安装)', isSystem: true },
            ];

            for (const role of DEFAULT_ROLES) {
                await sql`
                    INSERT INTO roles (id, tenant_id, name, code, description, is_system, created_at, updated_at)
                    VALUES (${uuidv4()}, ${tenantId}, ${role.name}, ${role.code}, ${role.description}, ${role.isSystem}, NOW(), NOW())
                `;
                console.log(`Inserted: ${role.code}`);
            }
        } else {
            console.log('Roles already exist.');
        }

        // 3. Verify
        const finalRoles = await sql`SELECT name, code FROM roles WHERE tenant_id = ${tenantId} ORDER BY code ASC`;
        console.table(finalRoles);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.end();
    }
}

main();
