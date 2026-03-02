/**
 * 紧急迁移脚本：向 verification_code_type 枚举添加 MAGIC_LOGIN 值
 * 执行方式：npx tsx scripts/add-magic-login-enum.ts
 */
import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
    console.error('❌ DATABASE_URL 未设置');
    process.exit(1);
}

console.log('📦 正在连接数据库...');
const sql = postgres(url, { max: 1, connect_timeout: 10 });

async function migrate() {
    // 测试连接
    await sql`SELECT 1 as ok`;
    console.log('✅ 数据库连接成功\n');

    // 检查当前枚举值
    const before = await sql`
        SELECT enumlabel FROM pg_enum 
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
        WHERE pg_type.typname = 'verification_code_type'
        ORDER BY enumsortorder
    `;
    console.log('📋 当前枚举值:', before.map(r => r.enumlabel));

    // 检查是否已存在
    const hasIt = before.some(r => r.enumlabel === 'MAGIC_LOGIN');
    if (hasIt) {
        console.log('✅ MAGIC_LOGIN 已存在于枚举中，无需迁移');
        await sql.end();
        return;
    }

    // 添加枚举值
    console.log('\n🔧 正在添加 MAGIC_LOGIN 到 verification_code_type...');
    await sql.unsafe(`ALTER TYPE "verification_code_type" ADD VALUE 'MAGIC_LOGIN'`);
    console.log('   ✓ MAGIC_LOGIN 已添加');

    // 验证
    const after = await sql`
        SELECT enumlabel FROM pg_enum 
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
        WHERE pg_type.typname = 'verification_code_type'
        ORDER BY enumsortorder
    `;
    console.log('\n✅ 迁移完成！当前枚举值:', after.map(r => r.enumlabel));

    await sql.end();
}

migrate().catch(async (e) => {
    console.error('❌ 迁移失败:', e.message);
    await sql.end();
    process.exit(1);
});
