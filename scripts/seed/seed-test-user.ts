import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/shared/api/schema';
import 'dotenv/config'; // Make sure to install dotenv or run with --env-file

async function seed() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ DATABASE_URL is not defined in environment variables');
        process.exit(1);
    }

    console.log('🌱 Seeding test user to Docker Postgres...');

    // Disable prefetch for transaction mode compatibility if needed, though mostly relevant for pgbouncer
    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client, { schema });

    try {
        // 1. 创建测试租户
        const [tenant] = await db.insert(schema.tenants).values({
            name: '测试租户',
            code: 'TEST001',
        }).onConflictDoUpdate({
            target: schema.tenants.code,
            set: { name: '测试租户' }
        }).returning();

        console.log(`✅ Tenant created/verified: ${tenant.name} (${tenant.id})`);

        // 2. 创建角色 (Admin)
        await db.insert(schema.roles).values({
            tenantId: tenant.id,
            name: '管理员',
            code: 'ADMIN',
            isSystem: true,
        }).onConflictDoNothing().returning();

        console.log(`✅ Role checked: ADMIN`);

        // 3. 创建测试用户
        // 密码哈希逻辑需保持一致，此处假设为明文 '123456'
        const [user] = await db.insert(schema.users).values({
            tenantId: tenant.id,
            name: '测试管理员',
            phone: '13800000000',
            passwordHash: '123456',
            role: 'ADMIN',
        }).onConflictDoUpdate({
            target: schema.users.phone,
            set: {
                name: '测试管理员',
                tenantId: tenant.id,
                passwordHash: '123456',
                role: 'ADMIN',
            }
        }).returning();

        console.log(`✅ User created/verified: ${user.name} (${user.phone})`);
        console.log('✨ Seeding complete!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await client.end();
    }
}

seed();
