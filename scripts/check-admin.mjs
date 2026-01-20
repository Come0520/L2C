// 查询测试管理员账号
import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

try {
    // 查询 13800000000
    const user = await sql`SELECT phone, name, password_hash, role FROM users WHERE phone = '13800000000'`;

    if (user.length > 0) {
        console.log('找到测试管理员:', user[0]);
    } else {
        console.log('❌ 未找到手机号 13800000000 的用户');
        console.log('\n正在创建测试管理员账号...');

        // 获取一个租户
        const tenants = await sql`SELECT id, name FROM tenants LIMIT 1`;
        if (tenants.length === 0) {
            console.log('❌ 没有租户，无法创建用户');
        } else {
            const tenantId = tenants[0].id;
            const correctHash = '$2b$10$nIgNyH7hqSPi0IYtG.RFXeM0IfyQk8JQJSzMVV4eAX8rf.0M4sz.RK';

            await sql`
                INSERT INTO users (tenant_id, name, phone, email, password_hash, role, is_active)
                VALUES (${tenantId}, '测试管理员', '13800000000', 'admin@test.com', ${correctHash}, 'ADMIN', true)
                ON CONFLICT (phone) DO UPDATE SET password_hash = ${correctHash}
            `;
            console.log('✅ 测试管理员账号已创建/更新');
            console.log('   手机号: 13800000000');
            console.log('   密码: 123456');
        }
    }
} catch (e) {
    console.error('错误:', e);
} finally {
    await sql.end();
}
