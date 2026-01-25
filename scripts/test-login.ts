import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';


async function testLogin() {
    const { db } = await import('../src/shared/api/db');
    const { users, tenants } = await import('../src/shared/api/schema');

    console.log('--- Starting Login Test ---');

    // 1. Setup Test Data
    const testPhone = '13800000000';
    const testPassword = 'password123';
    const testEmail = 'test@example.com';

    // Delete existing if any
    await db.delete(users).where(eq(users.phone, testPhone));
    // We might need to handle foreign keys, but let's try to find existing tenant first or create one
    let tenant = await db.query.tenants.findFirst();
    if (!tenant) {
        [tenant] = await db.insert(tenants).values({
            name: 'Test Tenant',
            code: 'TEST001',
            status: 'active'
        }).returning();
    }

    const passwordHash = await hash(testPassword, 10);

    const [user] = await db.insert(users).values({
        name: 'Test User',
        phone: testPhone,
        email: testEmail,
        passwordHash: passwordHash,
        tenantId: tenant.id,
        role: 'staff',
        isActive: true
    }).returning();

    console.log('Created Test User:', user.id);

    // 2. Call API
    console.log('Calling Login API...');
    const response = await fetch('http://localhost:3000/api/miniprogram/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            account: testPhone,
            password: testPassword
        })
    });

    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));

    // 3. Verify
    if (result.success && result.data.token) {
        console.log('✅ Login Successful');
    } else {
        console.error('❌ Login Failed');
        process.exit(1);
    }

    // Cleanup
    await db.delete(users).where(eq(users.id, user.id));
    console.log('Test User Cleaned up');
}

testLogin().catch(console.error);
