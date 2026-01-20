/**
 * 简化版 E2E 测试用户创建脚本
 * 解决 schema 与数据库不一致的问题
 */
import 'dotenv/config';
import postgres from 'postgres';
import { hashSync } from 'bcryptjs';

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('❌ DATABASE_URL not set');
        process.exit(1);
    }

    const sql = postgres(databaseUrl);
    const passwordHash = hashSync('123456', 10);

    try {
        console.log('🔧 Creating E2E test user...');

        // 1. 获取或创建租户
        let tenant = await sql`SELECT id FROM tenants WHERE code = 'E2E_TEST' LIMIT 1`;
        if (tenant.length === 0) {
            tenant = await sql`INSERT INTO tenants (name, code) VALUES ('E2E测试租户', 'E2E_TEST') RETURNING id`;
        }
        const tenantId = tenant[0].id;
        console.log('✅ Tenant ID:', tenantId);

        // 2. 创建测试用户 (只插入必需列)
        await sql`
            INSERT INTO users (tenant_id, name, email, phone, password_hash, role)
            VALUES (${tenantId}, '店长-测试', '13800000001@test.com', '13800000001', ${passwordHash}, 'MANAGER')
            ON CONFLICT (phone) DO UPDATE SET password_hash = ${passwordHash}, name = '店长-测试'
        `;
        console.log('✅ Test user created: 13800000001 / 123456');

        await sql.end();
        console.log('🎉 Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        await sql.end();
        process.exit(1);
    }
}

main();
