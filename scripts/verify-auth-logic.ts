
import * as dotenv from 'dotenv';
// 1. 优先加载环境变量
dotenv.config();

console.log('🚀 开始验证 Auth 核心逻辑 (修复版)...\n');

if (!process.env.AUTH_SECRET) {
    console.warn('⚠️  注意: AUTH_SECRET 未在 .env 中找到，尝试使用默认值或检查路径');
}

async function main() {
    // 2. 动态导入依赖，确保 env 已加载
    const { SignJWT, jwtVerify } = await import('jose');
    const { db } = await import('@/shared/api/db');
    const { users } = await import('@/shared/api/schema');
    const { eq } = await import('drizzle-orm');

    // 检查环境变量
    const secretKey = process.env.AUTH_SECRET;
    if (!secretKey) {
        console.error('❌ 缺少 AUTH_SECRET 环境变量 (即便加载了 .env)');
        process.exit(1);
    }
    console.log(`✅ 环境变量 AUTH_SECRET 已加载 (${secretKey.slice(0, 4)}***)`);

    // 模拟 JWT 生成与解析
    console.log('\n🔐 验证 JWT 逻辑...');
    const payload = {
        userId: 'test-user-id',
        tenantId: 'test-tenant-id',
        role: 'engineer',
        email: 'test@example.com'
    };

    try {
        const secret = new TextEncoder().encode(secretKey);
        // 生成
        const token = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('2h')
            .sign(secret);
        console.log('   ✅ JWT 生成成功');
        console.log(`   ℹ️  Token: ${token.slice(0, 20)}...`);

        // 解析
        const { payload: decoded } = await jwtVerify(token, secret);

        if (decoded.userId === payload.userId && decoded.tenantId === payload.tenantId) {
            console.log('   ✅ JWT 解析成功，载荷匹配');
        } else {
            console.error('   ❌ JWT 解析载荷不匹配:', decoded);
        }
    } catch (error) {
        console.error('   ❌ JWT 逻辑失败:', error);
    }

    // 验证数据库连接
    console.log('\n💾 验证数据库连接...');
    try {
        // 尝试简单的 raw SQL 或 select 1，避免依赖特定表数据
        // 但为了验证 drizzle schema，最好查表
        // 假设 users 表存在
        const userList = await db.select().from(users).limit(1);
        console.log('   ✅ 数据库连接成功');
        console.log(`   ℹ️  查询到 ${userList.length} 个用户`);
    } catch (error) {
        console.error('   ❌ 数据库连接失败:', error);
        console.error('   (可能是网络问题或 DATABASE_URL 配置错误)');
    }

    console.log('\n✨ 验证完成');
    process.exit(0);
}

main().catch(console.error);
