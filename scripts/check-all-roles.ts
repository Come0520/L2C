
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
        console.log('\n--- Tenants ---');
        const tenants = await sql`SELECT id, name, code FROM tenants`;
        console.table(tenants);

        console.log('\n--- Users ---');
        const users = await sql`SELECT id, name, phone, email, tenant_id, role, roles FROM users`;
        console.table(users.map(u => ({
            ...u,
            id: u.id.slice(0, 8) + '...',
            tenant_id: u.tenant_id.slice(0, 8) + '...'
        })));

        console.log('\n--- Roles ---');
        const roles = await sql`SELECT id, name, code, tenant_id, is_system FROM roles`;
        console.table(roles.map(r => ({
            ...r,
            id: r.id.slice(0, 8) + '...',
            tenant_id: r.tenant_id.slice(0, 8) + '...'
        })));

    } catch (err) {
        console.error(err);
    } finally {
        await sql.end();
    }
}

main();
