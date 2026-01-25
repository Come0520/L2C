import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars BEFORE any other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const openId = process.argv[2];

if (!openId) {
    console.error('Usage: pnpm tsx scripts/seed-wechat-user.ts <OPENID>');
    process.exit(1);
}

async function main() {
    console.log(`Creating user for OpenID: ${openId}...`);

    // Dynamic imports to ensure env vars are loaded first
    const { db } = await import('../src/shared/api/db');
    const { sql } = await import('drizzle-orm');
    const { hash } = await import('bcryptjs');
    const { nanoid } = await import('nanoid');

    try {
        const tenantCode = `T${nanoid(8).toUpperCase()}`;
        const tenantId = crypto.randomUUID();
        const userId = crypto.randomUUID();
        const passwordHash = await hash('123456', 10);

        // Randomize contact info to avoid conflicts
        const randomSuffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
        const phone = `139${randomSuffix}`;
        const email = `admin_${randomSuffix}@test.com`;

        console.log('Creating tenant...');
        await db.execute(sql`
            INSERT INTO tenants (id, name, code, is_active, created_at, updated_at)
            VALUES (${tenantId}, 'Test Company', ${tenantCode}, true, NOW(), NOW())
        `);
        console.log('Tenant created:', tenantId);

        console.log('Creating user...');
        await db.execute(sql`
            INSERT INTO users (id, tenant_id, name, phone, email, password_hash, role, is_active, wechat_openid, permissions, created_at, updated_at)
            VALUES (${userId}, ${tenantId}, 'Test Admin', ${phone}, ${email}, ${passwordHash}, 'admin', true, ${openId}, '[]'::jsonb, NOW(), NOW())
        `);
        console.log('User created:', userId);

        console.log('Success! You can now login with OpenID:', openId);
    } catch (e: any) {
        console.error('Error:', e.message);
        if (e.cause) {
            console.error('Cause:', e.cause.message);
        }
    }
}

main().then(() => process.exit(0));
