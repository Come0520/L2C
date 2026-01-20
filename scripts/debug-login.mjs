// 验证登录问题
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

const testPhone = '13800000000';
const testPassword = '123456';

try {
    console.log('🔍 检查用户 13800000000...\n');

    // 查询用户完整信息
    const users = await sql`
        SELECT id, tenant_id, phone, name, email, password_hash, role, is_active 
        FROM users 
        WHERE phone = ${testPhone}
    `;

    if (users.length === 0) {
        console.log('❌ 用户不存在!');
    } else {
        const user = users[0];
        console.log('用户信息:');
        console.log(`  ID: ${user.id}`);
        console.log(`  租户ID: ${user.tenant_id}`);
        console.log(`  手机: ${user.phone}`);
        console.log(`  姓名: ${user.name}`);
        console.log(`  邮箱: ${user.email}`);
        console.log(`  角色: ${user.role}`);
        console.log(`  is_active: ${user.is_active}`);
        console.log(`  密码哈希: ${user.password_hash?.substring(0, 30)}...`);

        // 验证密码
        if (user.password_hash) {
            const isValid = await bcrypt.compare(testPassword, user.password_hash);
            console.log(`\n🔐 密码验证 (123456): ${isValid ? '✓ 通过' : '✗ 失败'}`);

            if (!isValid) {
                // 生成新的正确哈希
                const newHash = await bcrypt.hash('123456', 10);
                console.log(`\n生成新哈希: ${newHash}`);

                // 更新密码
                await sql`UPDATE users SET password_hash = ${newHash} WHERE phone = ${testPhone}`;
                console.log('✅ 已更新密码哈希');
            }
        } else {
            console.log('\n❌ 没有密码哈希!');
        }

        // 检查 is_active
        if (user.is_active === false) {
            console.log('\n⚠️ 用户已被禁用! 正在激活...');
            await sql`UPDATE users SET is_active = true WHERE phone = ${testPhone}`;
            console.log('✅ 用户已激活');
        }
    }

    // 也检查其他常用账号
    console.log('\n\n📋 检查其他测试账号...');
    const otherUsers = await sql`
        SELECT phone, name, is_active, 
               CASE WHEN password_hash IS NOT NULL THEN true ELSE false END as has_password
        FROM users 
        WHERE phone IN ('13800000001', '13901001001', '13902002001')
    `;

    for (const u of otherUsers) {
        console.log(`  ${u.phone} - ${u.name} - active: ${u.is_active} - has_password: ${u.has_password}`);
    }

} catch (e) {
    console.error('错误:', e);
} finally {
    await sql.end();
}
