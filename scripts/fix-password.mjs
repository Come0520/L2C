// 修复密码哈希脚本
import postgres from 'postgres';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || 'postgresql://l2c_user:l2c_dev_password@localhost:5433/l2c_dev';
console.log('连接数据库:', connectionString.replace(/:[^:@]+@/, ':***@'));

const sql = postgres(connectionString);

// 密码: 123456 的正确 bcrypt 哈希
const correctHash = '$2b$10$nIgNyH7hqSPi0IYtG.RFXeM0IfyQk8JQJSzMVV4eAX8rf.0M4sz.RK';

try {
    // 更新所有用户的密码哈希
    const result = await sql`
        UPDATE users 
        SET password_hash = ${correctHash}
        WHERE password_hash IS NULL 
           OR password_hash NOT LIKE '$2a%' 
           AND password_hash NOT LIKE '$2b%'
        RETURNING phone, name
    `;

    console.log(`✅ 更新了 ${result.length} 个用户的密码`);
    if (result.length > 0) {
        result.forEach(u => console.log(`   - ${u.name} (${u.phone})`));
    }

    // 也更新那些有无效哈希的用户
    const result2 = await sql`
        UPDATE users 
        SET password_hash = ${correctHash}
        WHERE password_hash = '$2a$10$demoPasswordHash'
        RETURNING phone, name
    `;

    if (result2.length > 0) {
        console.log(`✅ 额外更新了 ${result2.length} 个用户的密码`);
        result2.forEach(u => console.log(`   - ${u.name} (${u.phone})`));
    }

    // 显示当前所有用户
    const users = await sql`SELECT phone, name, password_hash FROM users ORDER BY phone LIMIT 20`;
    console.log('\n📋 当前用户列表:');
    users.forEach(u => {
        const hashValid = u.password_hash?.startsWith('$2b$') || u.password_hash?.startsWith('$2a$');
        console.log(`   ${u.phone} - ${u.name} - 密码哈希: ${hashValid ? '✓ 有效' : '✗ 无效'}`);
    });

    console.log('\n🔑 测试账号密码统一为: 123456');

} catch (e) {
    console.error('❌ 错误:', e);
} finally {
    await sql.end();
    process.exit(0);
}
