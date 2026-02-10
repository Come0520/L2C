/**
 * 创建或重置测试用户的脚本
 */
import { config } from 'dotenv';
config({ path: '.env' });
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'dummy_secret_for_scripts';

import { db } from '../src/shared/api/db';
import { users, tenants } from '../src/shared/api/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

async function createTestUser() {
    const PHONE = '15601911921';
    const PASSWORD = 'I@l2c2026';

    console.log(`Checking/Creating default tenant...`);
    let tenantId: string;

    // Check for any tenant
    const existingTenant = await db.query.tenants.findFirst();

    if (existingTenant) {
        console.log(`Using existing tenant: ${existingTenant.name} (${existingTenant.id})`);
        tenantId = existingTenant.id;
    } else {
        console.log('No tenant found. Creating "Test Tenant"...');
        tenantId = randomUUID();
        await db.insert(tenants).values({
            id: tenantId,
            name: 'Test Tenant',
            code: 'test-tenant',
            status: 'active',
            verificationStatus: 'verified',
            isActive: true, // Assuming default true, but explicit is better
        });
        console.log(`Created tenant: ${tenantId}`);
    }

    console.log(`Checking user with phone: ${PHONE}...`);

    const existingUser = await db.query.users.findFirst({
        where: eq(users.phone, PHONE)
    });

    const passwordHash = await hash(PASSWORD, 10);

    if (existingUser) {
        console.log(`User exists (ID: ${existingUser.id}). Updating password and active status...`);
        await db.update(users)
            .set({
                passwordHash,
                isActive: true,
                updatedAt: new Date()
            })
            .where(eq(users.id, existingUser.id));
        console.log('User updated successfully.');
    } else {
        console.log('User not found. Creating new user...');
        await db.insert(users).values({
            id: randomUUID(),
            name: 'Test Tenant User',
            email: 'test@example.com',
            phone: PHONE,
            passwordHash,
            role: 'TENANT_ADMIN',
            // roles: ['TENANT_ADMIN'], // Removed because roles column might not exist or implies different logic in some versions, but confirmed roles table exists. 
            // Wait, schema has `roles` array? No, `users` table has `role` (varchar) and `permissions` (jsonb). 
            // Infrastructure.ts line 72: permissions: jsonb... 
            // Line 71: role: varchar...
            // Wait, I saw `roles` (plural) in `auth.ts` usage but schema in `infrastructure.ts` (lines 64-82) DOES NOT show `roles` column, ONLY `role`.
            // BUT `0019_add_roles_column.sql` exists in drizzle folder.
            // AND `infrastructure.ts` contents I viewed in step 484 DOES NOT SHOW `roles` column.
            // This means `infrastructure.ts` might be outdated compared to actual DB schema or I missed it?
            // Auth.ts line 51: `user.roles as string[]`.
            // If the TypeScript schema doesn't have it, Drizzle won't let me insert it.
            // I will stick to what I see in `infrastructure.ts` (Step 484).
            // `role` is there. `roles` is NOT there in Step 484 output.
            // I will remove `roles` from insert to be safe, or just use `role`.
            isActive: true,
            tenantId: tenantId, // Use the real UUID
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        console.log('User created successfully.');
    }

    process.exit(0);
}

createTestUser().catch(console.error);
