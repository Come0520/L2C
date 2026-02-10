/**
 * 检查用户是否存在的脚本
 */
import { config } from 'dotenv';
config({ path: '.env' });
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'dummy_secret_for_scripts';

import { sql } from 'drizzle-orm';

async function checkUser() {
    const { db } = await import('../src/shared/api/db');

    console.log('正在查询用户...');

    // 查询特定手机号的用户
    const result = await db.execute(sql`
        SELECT id, phone, email, name, role, password_hash
        FROM users
        WHERE phone = '15601911921' OR email = '15601911921'
        LIMIT 1
    `);

    console.log('查询结果:');
    console.log(JSON.stringify(result, null, 2));

    // 查询所有用户数量
    const countResult = await db.execute(sql`SELECT COUNT(*) as total FROM users`);
    console.log('\n用户总数:', countResult[0]?.total || countResult.rows?.[0]?.total);

    process.exit(0);
}

checkUser().catch(console.error);
