// 修复所有用户密码
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

try {
    console.log('🔧 修复所有用户密码...\n');

    // 生成正确的 bcrypt 哈希
    const correctHash = await bcrypt.hash('123456', 10);
    console.log(`新哈希: ${correctHash}\n`);

    // 更新所有用户的密码
    const result = await sql`
        UPDATE users 
        SET password_hash = ${correctHash}
        RETURNING phone, name
    `;

    console.log(`✅ 已更新 ${result.length} 个用户的密码:\n`);
    result.forEach(u => console.log(`   ${u.phone} - ${u.name}`));

    console.log('\n🔑 所有账号密码统一为: 123456');

    // 验证一个用户
    console.log('\n🔍 验证密码...');
    const testUser = await sql`SELECT password_hash FROM users WHERE phone = '13800000000'`;
    if (testUser.length > 0) {
        const isValid = await bcrypt.compare('123456', testUser[0].password_hash);
        console.log(`   密码验证: ${isValid ? '✓ 通过' : '✗ 失败'}`);
    }

} catch (e) {
    console.error('错误:', e);
} finally {
    await sql.end();
}
